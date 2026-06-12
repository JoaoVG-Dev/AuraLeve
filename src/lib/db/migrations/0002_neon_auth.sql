create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email)),
  constraint users_email_shape check (position('@' in email) > 1)
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

insert into public.users (id, email, password_hash, full_name, phone, role, disabled_at)
select
  p.id,
  lower('legacy-' || p.id::text || '@auraleve.local'),
  'legacy-disabled',
  p.full_name,
  p.phone,
  coalesce((
    select ur.role
    from public.user_roles ur
    where ur.user_id = p.id
    order by case when ur.role = 'admin'::public.app_role then 0 else 1 end
    limit 1
  ), 'customer'::public.app_role),
  now()
from public.profiles p
on conflict (id) do nothing;

insert into public.users (id, email, password_hash, role, disabled_at)
select distinct
  o.user_id,
  lower('legacy-order-' || o.user_id::text || '@auraleve.local'),
  'legacy-disabled',
  'customer'::public.app_role,
  now()
from public.orders o
where not exists (
  select 1
  from public.users u
  where u.id = o.user_id
)
on conflict (id) do nothing;

create index if not exists users_role_idx on public.users(role);
create index if not exists user_sessions_user_id_idx on public.user_sessions(user_id);
create index if not exists user_sessions_expires_at_idx on public.user_sessions(expires_at);
create index if not exists password_reset_tokens_user_id_idx
  on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_expires_at_idx
  on public.password_reset_tokens(expires_at);

drop trigger if exists users_touch on public.users;
create trigger users_touch
before update on public.users
for each row execute function public.touch_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_user_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete restrict;
  end if;
end $$;
