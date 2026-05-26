create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists orders_coupon_id_idx
  on public.orders (coupon_id)
  where coupon_id is not null;

create index if not exists product_energies_energy_id_idx
  on public.product_energies (energy_id);

create index if not exists subcategories_category_id_idx
  on public.subcategories (category_id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_insert on public.categories
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy categories_admin_update on public.categories
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy categories_admin_delete on public.categories
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists subcategories_admin_all on public.subcategories;
create policy subcategories_admin_insert on public.subcategories
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy subcategories_admin_update on public.subcategories
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy subcategories_admin_delete on public.subcategories
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists energies_admin_all on public.energies;
create policy energies_admin_insert on public.energies
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy energies_admin_update on public.energies
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy energies_admin_delete on public.energies
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists products_admin_all on public.products;
create policy products_admin_insert on public.products
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy products_admin_update on public.products
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy products_admin_delete on public.products
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists product_energies_admin_all on public.product_energies;
create policy product_energies_admin_insert on public.product_energies
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy product_energies_admin_update on public.product_energies
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy product_energies_admin_delete on public.product_energies
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists coupons_admin_all on public.coupons;
drop policy if exists coupons_public_read_active on public.coupons;
create policy coupons_read on public.coupons
for select to public
using (
  active = true
  or (select app_private.has_role((select auth.uid()), 'admin'::public.app_role))
);
create policy coupons_admin_insert on public.coupons
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy coupons_admin_update on public.coupons
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy coupons_admin_delete on public.coupons
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_insert on public.order_items
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy order_items_admin_update on public.order_items
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy order_items_admin_delete on public.order_items
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists user_roles_admin_all on public.user_roles;
drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select on public.user_roles
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select app_private.has_role((select auth.uid()), 'admin'::public.app_role))
);
create policy user_roles_admin_insert on public.user_roles
for insert to authenticated
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy user_roles_admin_update on public.user_roles
for update to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)))
with check ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
create policy user_roles_admin_delete on public.user_roles
for delete to authenticated
using ((select app_private.has_role((select auth.uid()), 'admin'::public.app_role)));
