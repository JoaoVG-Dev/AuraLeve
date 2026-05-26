-- Harden coupon and checkout rules used by the service-role order RPC.
-- The frontend may preview coupon state, but this function remains the source of truth.

update public.coupons
set min_order_total = 0
where min_order_total < 0;

update public.coupons
set uses_count = 0
where uses_count < 0;

update public.coupons
set max_uses = null
where max_uses is not null
  and max_uses <= 0;

update public.coupons
set value = 100
where type = 'percent'::public.coupon_type
  and value > 100;

update public.coupons
set expires_at = null
where starts_at is not null
  and expires_at is not null
  and expires_at <= starts_at;

alter table public.coupons
  add constraint coupons_min_order_total_nonnegative check (min_order_total >= 0);

alter table public.coupons
  add constraint coupons_uses_count_nonnegative check (uses_count >= 0);

alter table public.coupons
  add constraint coupons_max_uses_positive check (max_uses is null or max_uses > 0);

alter table public.coupons
  add constraint coupons_percent_value_max check (
    type <> 'percent'::public.coupon_type
    or value <= 100
  );

alter table public.coupons
  add constraint coupons_valid_window check (
    starts_at is null
    or expires_at is null
    or expires_at > starts_at
  );

create or replace function public.place_order_for_user(
  _user_id uuid,
  _items jsonb,
  _coupon_code text,
  _customer jsonb,
  _payment_method text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_total numeric(10,2);
  v_coupon public.coupons%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_unit numeric(10,2);
  v_line numeric(10,2);
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if _user_id is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  if _payment_method not in ('pix','credit','debit') then
    raise exception 'Invalid payment method';
  end if;

  if _items is null or jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 then
    raise exception 'Empty cart';
  end if;

  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if not found then
      raise exception 'Product not found';
    end if;

    if v_product.price <= 0 then
      raise exception 'Product not available';
    end if;

    if v_product.discount_percent < 0 or v_product.discount_percent > 100 then
      raise exception 'Invalid product discount';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit := case
      when v_product.discount_percent > 0
        then round(v_product.price * (1 - v_product.discount_percent / 100.0), 2)
      else v_product.price
    end;
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  if v_subtotal < 0 then
    raise exception 'Invalid order total';
  end if;

  if _coupon_code is not null and length(trim(_coupon_code)) > 0 then
    select * into v_coupon
    from public.coupons
    where code = upper(trim(_coupon_code))
    for update;

    if not found then
      raise exception 'Coupon not found';
    end if;
    if not v_coupon.active then
      raise exception 'Coupon inactive';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'Coupon is not valid yet';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at <= now() then
      raise exception 'Coupon expired';
    end if;
    if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then
      raise exception 'Coupon usage limit reached';
    end if;
    if v_coupon.one_per_customer and exists (
      select 1
      from public.orders
      where user_id = _user_id
        and coupon_id = v_coupon.id
    ) then
      raise exception 'Coupon already used by customer';
    end if;
    if v_subtotal < v_coupon.min_order_total then
      raise exception 'Coupon minimum order total not reached';
    end if;

    v_discount := case
      when v_coupon.type = 'percent'::public.coupon_type
        then round(v_subtotal * (v_coupon.value / 100.0), 2)
      else v_coupon.value
    end;
    v_discount := least(v_subtotal, greatest(0, v_discount));
  end if;

  v_total := v_subtotal - v_discount;
  if v_total < 0 then
    raise exception 'Invalid order total';
  end if;

  insert into public.orders (
    user_id, status, payment_status, payment_method, payment_provider,
    customer_name, customer_email, customer_phone,
    address_cep, address_line, address_number, address_complement, address_city, address_state,
    subtotal, discount, total, coupon_id, coupon_code
  ) values (
    _user_id, 'pending'::public.order_status, 'pending'::public.payment_status,
    _payment_method, 'mercado_pago',
    _customer->>'name', _customer->>'email', _customer->>'phone',
    _customer->>'cep', _customer->>'address', _customer->>'number',
    nullif(_customer->>'complement',''), _customer->>'city', _customer->>'state',
    v_subtotal, v_discount, v_total,
    case when v_coupon.id is not null then v_coupon.id else null end,
    case when v_coupon.id is not null then v_coupon.code else null end
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    v_unit := case
      when v_product.discount_percent > 0
        then round(v_product.price * (1 - v_product.discount_percent / 100.0), 2)
      else v_product.price
    end;
    v_line := v_unit * v_qty;

    insert into public.order_items (
      order_id, product_id, product_name, product_image, unit_price, quantity, subtotal
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.image, v_unit, v_qty, v_line
    );

    update public.products
    set stock = stock - v_qty
    where id = v_product.id;
  end loop;

  if v_coupon.id is not null then
    update public.coupons
    set uses_count = uses_count + 1
    where id = v_coupon.id;
  end if;

  return v_order_id;
end;
$$;

revoke all on function public.place_order_for_user(uuid, jsonb, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.place_order_for_user(uuid, jsonb, text, jsonb, text) to service_role;
