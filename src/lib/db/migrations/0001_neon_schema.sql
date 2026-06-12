create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'customer');
  end if;
  if not exists (select 1 from pg_type where typname = 'coupon_type') then
    create type public.coupon_type as enum ('percent', 'fixed');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum (
      'pending',
      'paid',
      'failed',
      'refunded',
      'expired'
    );
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.energies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  discount_percent numeric(5,2) not null default 0 check (
    discount_percent >= 0
    and discount_percent <= 100
  ),
  image text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  promo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_energies (
  product_id uuid not null references public.products(id) on delete cascade,
  energy_id uuid not null references public.energies(id) on delete cascade,
  primary key (product_id, energy_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.coupon_type not null,
  value numeric(10,2) not null check (value > 0),
  min_order_total numeric(10,2) not null default 0 check (min_order_total >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0 check (uses_count >= 0),
  one_per_customer boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_percent_value_max check (
    type <> 'percent'::public.coupon_type
    or value <= 100
  ),
  constraint coupons_valid_window check (
    starts_at is null
    or expires_at is null
    or expires_at > starts_at
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_method text not null check (payment_method in ('pix', 'credit', 'debit')),
  payment_provider text not null default 'mercado_pago',
  payment_id text,
  payment_expires_at timestamptz,
  payment_status_detail text,
  pix_qr_code text,
  pix_copy_paste text,
  paid_at timestamptz,
  canceled_at timestamptz,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_cep text not null,
  address_line text not null,
  address_number text not null,
  address_complement text,
  address_city text not null,
  address_state text not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  shipping numeric(10,2) not null default 0 check (shipping >= 0),
  total numeric(10,2) not null check (total >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_subcategory on public.products(subcategory_id);
create index if not exists product_energies_energy_id_idx on public.product_energies(energy_id);
create index if not exists subcategories_category_id_idx on public.subcategories(category_id);
create index if not exists idx_orders_user on public.orders(user_id, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists orders_coupon_id_idx on public.orders(coupon_id)
  where coupon_id is not null;
create unique index if not exists orders_payment_id_unique_idx on public.orders(payment_id)
  where payment_id is not null;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated
before update on public.categories
for each row execute function public.touch_updated_at();

drop trigger if exists trg_subcategories_updated on public.subcategories;
create trigger trg_subcategories_updated
before update on public.subcategories
for each row execute function public.touch_updated_at();

drop trigger if exists trg_energies_updated on public.energies;
create trigger trg_energies_updated
before update on public.energies
for each row execute function public.touch_updated_at();

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists trg_coupons_updated on public.coupons;
create trigger trg_coupons_updated
before update on public.coupons
for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch
before update on public.orders
for each row execute function public.touch_updated_at();

create or replace function public.place_order_for_user(
  _user_id uuid,
  _items jsonb,
  _coupon_code text,
  _customer jsonb,
  _payment_method text
) returns uuid
language plpgsql
set search_path = public
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
  if _user_id is null then
    raise exception 'Authenticated user required' using errcode = '28000';
  end if;

  if _payment_method not in ('pix', 'credit', 'debit') then
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
    user_id,
    status,
    payment_status,
    payment_method,
    payment_provider,
    customer_name,
    customer_email,
    customer_phone,
    address_cep,
    address_line,
    address_number,
    address_complement,
    address_city,
    address_state,
    subtotal,
    discount,
    total,
    coupon_id,
    coupon_code
  ) values (
    _user_id,
    'pending'::public.order_status,
    'pending'::public.payment_status,
    _payment_method,
    'mercado_pago',
    _customer->>'name',
    _customer->>'email',
    _customer->>'phone',
    _customer->>'cep',
    _customer->>'address',
    _customer->>'number',
    nullif(_customer->>'complement', ''),
    _customer->>'city',
    _customer->>'state',
    v_subtotal,
    v_discount,
    v_total,
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
      order_id,
      product_id,
      product_name,
      product_image,
      unit_price,
      quantity,
      subtotal
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.image,
      v_unit,
      v_qty,
      v_line
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
