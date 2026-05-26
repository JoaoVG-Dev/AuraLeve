alter table public.orders
  add column if not exists payment_expires_at timestamptz;

do $$
begin
  if exists (
    select 1
    from public.orders
    where payment_id is not null
    group by payment_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate payment_id values exist in public.orders; resolve them before enforcing uniqueness';
  end if;
end $$;

create unique index if not exists orders_payment_id_unique_idx
  on public.orders (payment_id)
  where payment_id is not null;
