-- Enums
create type public.order_status as enum ('pending','paid','processing','shipped','delivered','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded');

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_method text not null check (payment_method in ('pix','credit','debit')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_cep text not null,
  address_line text not null,
  address_number text not null,
  address_complement text,
  address_city text not null,
  address_state text not null,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user on public.orders(user_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  subtotal numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index idx_order_items_order on public.order_items(order_id);

create trigger trg_orders_touch
before update on public.orders
for each row execute function public.touch_updated_at();

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy orders_select_own on public.orders
for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy orders_admin_update on public.orders
for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy orders_admin_delete on public.orders
for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- No INSERT policy: clients only insert via place_order() (security definer)

create policy order_items_select on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

create policy order_items_admin_all on public.order_items
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- place_order: atomic checkout
create or replace function public.place_order(
  _items jsonb,
  _coupon_code text,
  _customer jsonb,
  _payment_method text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
  v_payment_status public.payment_status;
begin
  if v_user is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;
  if _payment_method not in ('pix','credit','debit') then
    raise exception 'Forma de pagamento inválida';
  end if;
  if jsonb_array_length(_items) = 0 then
    raise exception 'Carrinho vazio';
  end if;

  -- Validate stock & compute subtotal (lock product rows)
  for v_item in select * from jsonb_array_elements(_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty <= 0 then raise exception 'Quantidade inválida'; end if;

    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'Produto não encontrado'; end if;
    if v_product.stock < v_qty then
      raise exception 'Estoque insuficiente para %', v_product.name;
    end if;

    v_unit := case when v_product.discount_percent > 0
      then round(v_product.price * (1 - v_product.discount_percent/100.0), 2)
      else v_product.price end;
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  -- Coupon
  if _coupon_code is not null and length(trim(_coupon_code)) > 0 then
    select * into v_coupon from public.coupons
      where code = upper(trim(_coupon_code)) for update;
    if not found then raise exception 'Cupom não encontrado'; end if;
    if not v_coupon.active then raise exception 'Cupom inativo'; end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'Cupom ainda não está válido'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Cupom expirado'; end if;
    if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then
      raise exception 'Cupom esgotado'; end if;
    if v_subtotal < v_coupon.min_order_total then
      raise exception 'Valor mínimo do cupom não atingido'; end if;
    v_discount := case when v_coupon.type = 'percent'
      then round(v_subtotal * (v_coupon.value/100.0), 2)
      else least(v_coupon.value, v_subtotal) end;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);
  v_payment_status := case when _payment_method = 'pix' then 'pending'::public.payment_status
                           else 'paid'::public.payment_status end;

  insert into public.orders (
    user_id, status, payment_status, payment_method,
    customer_name, customer_email, customer_phone,
    address_cep, address_line, address_number, address_complement, address_city, address_state,
    subtotal, discount, total,
    coupon_id, coupon_code
  ) values (
    v_user,
    case when _payment_method = 'pix' then 'pending'::public.order_status else 'paid'::public.order_status end,
    v_payment_status, _payment_method,
    _customer->>'name', _customer->>'email', _customer->>'phone',
    _customer->>'cep', _customer->>'address', _customer->>'number',
    nullif(_customer->>'complement',''), _customer->>'city', _customer->>'state',
    v_subtotal, v_discount, v_total,
    case when v_coupon.id is not null then v_coupon.id else null end,
    case when v_coupon.id is not null then v_coupon.code else null end
  ) returning id into v_order_id;

  -- Items + decrement stock
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

revoke all on function public.place_order(jsonb, text, jsonb, text) from public;
grant execute on function public.place_order(jsonb, text, jsonb, text) to authenticated;

-- Admin: update status
create or replace function public.update_order_status(
  _order_id uuid,
  _status public.order_status,
  _payment_status public.payment_status default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  update public.orders
     set status = _status,
         payment_status = coalesce(_payment_status, payment_status)
   where id = _order_id;
end;
$$;

revoke all on function public.update_order_status(uuid, public.order_status, public.payment_status) from public;
grant execute on function public.update_order_status(uuid, public.order_status, public.payment_status) to authenticated;