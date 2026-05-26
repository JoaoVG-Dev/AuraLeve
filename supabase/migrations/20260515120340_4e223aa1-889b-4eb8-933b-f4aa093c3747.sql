-- Add expired to payment_status if missing
do $$ begin
  if not exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
    where t.typname='payment_status' and e.enumlabel='expired') then
    alter type public.payment_status add value 'expired';
  end if;
end $$;

-- Add MP/payment fields to orders
alter table public.orders
  add column if not exists payment_provider text not null default 'simulated',
  add column if not exists payment_id text,
  add column if not exists payment_status_detail text,
  add column if not exists pix_qr_code text,
  add column if not exists pix_copy_paste text,
  add column if not exists paid_at timestamptz,
  add column if not exists canceled_at timestamptz;

create index if not exists orders_payment_id_idx on public.orders(payment_id);

-- Replace place_order: ALWAYS pending; provider mercado_pago by default
create or replace function public.place_order(
  _items jsonb, _coupon_code text, _customer jsonb, _payment_method text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
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
  if v_user is null then raise exception 'Não autenticado' using errcode='28000'; end if;
  if _payment_method not in ('pix','credit','debit') then raise exception 'Forma de pagamento inválida'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Carrinho vazio'; end if;

  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then raise exception 'Quantidade inválida'; end if;
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'Produto não encontrado'; end if;
    if v_product.stock < v_qty then raise exception 'Estoque insuficiente para %', v_product.name; end if;
    v_unit := case when v_product.discount_percent > 0
      then round(v_product.price * (1 - v_product.discount_percent/100.0), 2)
      else v_product.price end;
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  if _coupon_code is not null and length(trim(_coupon_code)) > 0 then
    select * into v_coupon from public.coupons
      where code = upper(trim(_coupon_code)) for update;
    if not found then raise exception 'Cupom não encontrado'; end if;
    if not v_coupon.active then raise exception 'Cupom inativo'; end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then raise exception 'Cupom ainda não está válido'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'Cupom expirado'; end if;
    if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then raise exception 'Cupom esgotado'; end if;
    if v_subtotal < v_coupon.min_order_total then raise exception 'Valor mínimo do cupom não atingido'; end if;
    v_discount := case when v_coupon.type='percent'
      then round(v_subtotal * (v_coupon.value/100.0), 2)
      else least(v_coupon.value, v_subtotal) end;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  insert into public.orders (
    user_id, status, payment_status, payment_method, payment_provider,
    customer_name, customer_email, customer_phone,
    address_cep, address_line, address_number, address_complement, address_city, address_state,
    subtotal, discount, total, coupon_id, coupon_code
  ) values (
    v_user, 'pending'::order_status, 'pending'::payment_status, _payment_method, 'mercado_pago',
    _customer->>'name', _customer->>'email', _customer->>'phone',
    _customer->>'cep', _customer->>'address', _customer->>'number',
    nullif(_customer->>'complement',''), _customer->>'city', _customer->>'state',
    v_subtotal, v_discount, v_total,
    case when v_coupon.id is not null then v_coupon.id else null end,
    case when v_coupon.id is not null then v_coupon.code else null end
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_unit := case when v_product.discount_percent > 0
      then round(v_product.price * (1 - v_product.discount_percent/100.0), 2)
      else v_product.price end;
    v_line := v_unit * v_qty;
    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, subtotal)
    values (v_order_id, v_product.id, v_product.name, v_product.image, v_unit, v_qty, v_line);
    update public.products set stock = stock - v_qty where id = v_product.id;
  end loop;

  if v_coupon.id is not null then
    update public.coupons set uses_count = uses_count + 1 where id = v_coupon.id;
  end if;

  return v_order_id;
end;
$$;

-- Update update_order_status: admin cannot manually set payment_status to 'paid'
create or replace function public.update_order_status(
  _order_id uuid, _status order_status, _payment_status payment_status default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores' using errcode='42501';
  end if;
  if _payment_status = 'paid'::payment_status then
    raise exception 'Pagamento "pago" só pode ser confirmado pelo provedor (webhook)';
  end if;
  update public.orders
     set status = _status,
         payment_status = coalesce(_payment_status, payment_status),
         canceled_at = case when _status = 'cancelled' and canceled_at is null then now() else canceled_at end
   where id = _order_id;
end;
$$;