import { getDb } from "@/lib/db/client.server";
import type { Category, Coupon, Energy, Product, Subcategory } from "@/lib/types";
import { couponDiscount, getCouponStatus } from "@/lib/types";

type ProductEnergyRow = { energy_id: string };
type NumericValue = string | number;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: NumericValue;
  discount_percent: NumericValue | null;
  image: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  product_energies: unknown;
  stock: number | null;
  featured: boolean | null;
  promo: boolean | null;
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
}

interface EnergyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface CouponRow {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: NumericValue;
  min_order_total: NumericValue | null;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number | null;
  one_per_customer: boolean | null;
  active: boolean | null;
}

function productEnergies(value: unknown): ProductEnergyRow[] {
  if (Array.isArray(value)) return value as ProductEnergyRow[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    price: Number(row.price),
    discountPercent: Number(row.discount_percent ?? 0),
    image: row.image ?? "",
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    energyIds: productEnergies(row.product_energies).map((pe) => pe.energy_id),
    stock: row.stock ?? 0,
    featured: !!row.featured,
    promo: !!row.promo,
    createdAt: row.created_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export function mapSubcategory(row: SubcategoryRow): Subcategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
  };
}

export function mapEnergy(row: EnergyRow): Energy {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

export function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minOrderTotal: Number(row.min_order_total ?? 0),
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    usesCount: row.uses_count ?? 0,
    onePerCustomer: !!row.one_per_customer,
    active: !!row.active,
  };
}

export async function listCategories() {
  const sql = getDb();
  const rows = await sql`
    select id, name, slug, description
    from public.categories
    order by name
  `;
  return rows.map((row) => mapCategory(row as CategoryRow));
}

export async function listSubcategories() {
  const sql = getDb();
  const rows = await sql`
    select id, category_id, name, slug
    from public.subcategories
    order by name
  `;
  return rows.map((row) => mapSubcategory(row as SubcategoryRow));
}

export async function listEnergies() {
  const sql = getDb();
  const rows = await sql`
    select id, name, slug, description
    from public.energies
    order by name
  `;
  return rows.map((row) => mapEnergy(row as EnergyRow));
}

export async function listProducts() {
  const sql = getDb();
  const rows = await sql`
    select
      p.*,
      coalesce(
        jsonb_agg(jsonb_build_object('energy_id', pe.energy_id))
          filter (where pe.energy_id is not null),
        '[]'::jsonb
      ) as product_energies
    from public.products p
    left join public.product_energies pe on pe.product_id = p.id
    group by p.id
    order by p.created_at desc
  `;
  return rows.map((row) => mapProduct(row as ProductRow));
}

export async function listCoupons() {
  const sql = getDb();
  const rows = await sql`
    select *
    from public.coupons
    order by created_at desc
  `;
  return rows.map((row) => mapCoupon(row as CouponRow));
}

export async function saveCategory(input: {
  id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      update public.categories
      set name = ${input.name},
          slug = ${input.slug},
          description = ${input.description ?? null}
      where id = ${input.id}::uuid
    `;
    return;
  }

  await sql`
    insert into public.categories (name, slug, description)
    values (${input.name}, ${input.slug}, ${input.description ?? null})
  `;
}

export async function deleteCategory(id: string) {
  const sql = getDb();
  await sql`delete from public.categories where id = ${id}::uuid`;
}

export async function saveSubcategory(input: {
  id?: string | null;
  name: string;
  slug: string;
  categoryId: string;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      update public.subcategories
      set name = ${input.name},
          slug = ${input.slug},
          category_id = ${input.categoryId}::uuid
      where id = ${input.id}::uuid
    `;
    return;
  }

  await sql`
    insert into public.subcategories (name, slug, category_id)
    values (${input.name}, ${input.slug}, ${input.categoryId}::uuid)
  `;
}

export async function deleteSubcategory(id: string) {
  const sql = getDb();
  await sql`delete from public.subcategories where id = ${id}::uuid`;
}

export async function saveEnergy(input: {
  id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      update public.energies
      set name = ${input.name},
          slug = ${input.slug},
          description = ${input.description ?? null}
      where id = ${input.id}::uuid
    `;
    return;
  }

  await sql`
    insert into public.energies (name, slug, description)
    values (${input.name}, ${input.slug}, ${input.description ?? null})
  `;
}

export async function deleteEnergy(id: string) {
  const sql = getDb();
  await sql`delete from public.energies where id = ${id}::uuid`;
}

export async function saveProduct(input: Product & { isNew?: boolean }) {
  const sql = getDb();
  let productId = input.id;

  if (input.isNew || !input.id) {
    const rows = await sql`
      insert into public.products (
        name,
        slug,
        description,
        price,
        discount_percent,
        image,
        category_id,
        subcategory_id,
        stock,
        featured,
        promo
      ) values (
        ${input.name},
        ${input.slug},
        ${input.description},
        ${input.price},
        ${input.discountPercent},
        ${input.image},
        ${input.categoryId}::uuid,
        ${input.subcategoryId}::uuid,
        ${input.stock},
        ${input.featured},
        ${input.promo}
      )
      returning id
    `;
    productId = String(rows[0].id);
  } else {
    await sql`
      update public.products
      set name = ${input.name},
          slug = ${input.slug},
          description = ${input.description},
          price = ${input.price},
          discount_percent = ${input.discountPercent},
          image = ${input.image},
          category_id = ${input.categoryId}::uuid,
          subcategory_id = ${input.subcategoryId}::uuid,
          stock = ${input.stock},
          featured = ${input.featured},
          promo = ${input.promo}
      where id = ${input.id}::uuid
    `;
  }

  await sql`delete from public.product_energies where product_id = ${productId}::uuid`;
  for (const energyId of input.energyIds) {
    await sql`
      insert into public.product_energies (product_id, energy_id)
      values (${productId}::uuid, ${energyId}::uuid)
      on conflict (product_id, energy_id) do nothing
    `;
  }
}

export async function deleteProduct(id: string) {
  const sql = getDb();
  await sql`delete from public.products where id = ${id}::uuid`;
}

export async function saveCoupon(input: {
  id?: string | null;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderTotal?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  onePerCustomer?: boolean;
  active?: boolean;
}) {
  const sql = getDb();
  const code = input.code.trim().toUpperCase();

  if (input.id) {
    await sql`
      update public.coupons
      set code = ${code},
          type = ${input.type}::public.coupon_type,
          value = ${input.value},
          min_order_total = ${input.minOrderTotal ?? 0},
          starts_at = ${input.startsAt || null},
          expires_at = ${input.expiresAt || null},
          max_uses = ${input.maxUses ?? null},
          one_per_customer = ${!!input.onePerCustomer},
          active = ${input.active ?? true}
      where id = ${input.id}::uuid
    `;
    return;
  }

  await sql`
    insert into public.coupons (
      code,
      type,
      value,
      min_order_total,
      starts_at,
      expires_at,
      max_uses,
      one_per_customer,
      active
    ) values (
      ${code},
      ${input.type}::public.coupon_type,
      ${input.value},
      ${input.minOrderTotal ?? 0},
      ${input.startsAt || null},
      ${input.expiresAt || null},
      ${input.maxUses ?? null},
      ${!!input.onePerCustomer},
      ${input.active ?? true}
    )
  `;
}

export async function deleteCoupon(id: string) {
  const sql = getDb();
  await sql`delete from public.coupons where id = ${id}::uuid`;
}

export interface CouponValidation {
  ok: boolean;
  reason?: string;
  coupon?: Coupon;
  discount?: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, reason: "Informe o codigo do cupom." };

  const sql = getDb();
  const rows = await sql`
    select *
    from public.coupons
    where code = ${trimmed}
    limit 1
  `;

  if (!rows[0]) return { ok: false, reason: "Cupom invalido ou inativo." };
  const coupon = mapCoupon(rows[0]);

  const status = getCouponStatus(coupon);
  if (status === "inactive") return { ok: false, reason: "Cupom invalido ou inativo." };
  if (status === "scheduled") return { ok: false, reason: "Este cupom ainda nao esta disponivel." };
  if (status === "expired") return { ok: false, reason: "Este cupom expirou." };
  if (status === "depleted") return { ok: false, reason: "Este cupom atingiu o limite de uso." };

  if (subtotal < coupon.minOrderTotal) {
    return {
      ok: false,
      reason: `Este cupom esta disponivel para pedidos a partir de R$ ${coupon.minOrderTotal.toFixed(2)}.`,
    };
  }

  const discount = couponDiscount(coupon, subtotal);
  return { ok: true, coupon, discount };
}
