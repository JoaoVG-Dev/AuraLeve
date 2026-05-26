-- Keep security-definer helpers out of the exposed public API schema.
create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

revoke all on function app_private.has_role(uuid, public.app_role) from public, anon;
grant execute on function app_private.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy if exists "user_roles_admin_all" on public.user_roles;
create policy "user_roles_admin_all" on public.user_roles
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "subcategories_admin_all" on public.subcategories;
create policy "subcategories_admin_all" on public.subcategories
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "energies_admin_all" on public.energies;
create policy "energies_admin_all" on public.energies
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "product_energies_admin_all" on public.product_energies;
create policy "product_energies_admin_all" on public.product_energies
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select app_private.has_role((select auth.uid()), 'admin'::public.app_role))
);

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
for select to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (
        o.user_id = (select auth.uid())
        or (select app_private.has_role((select auth.uid()), 'admin'::public.app_role))
      )
  )
);

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
for all to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

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
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
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
      else least(v_coupon.value, v_subtotal)
    end;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

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

revoke all on function public.place_order(jsonb, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.update_order_status(uuid, public.order_status, public.payment_status) from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
