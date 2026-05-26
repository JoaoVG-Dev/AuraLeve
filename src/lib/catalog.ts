import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Coupon, Energy, Product, Subcategory } from "./types";
import { couponDiscount, formatBRL, getCouponStatus } from "./types";

// ---------- Mappers ----------
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description ?? "",
  price: Number(row.price),
  discountPercent: Number(row.discount_percent ?? 0),
  image: row.image ?? "",
  categoryId: row.category_id,
  subcategoryId: row.subcategory_id,
  energyIds: (row.product_energies ?? []).map((pe: any) => pe.energy_id),
  stock: row.stock ?? 0,
  featured: !!row.featured,
  promo: !!row.promo,
  createdAt: row.created_at,
});

const mapCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
});

const mapSubcategory = (row: any): Subcategory => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  categoryId: row.category_id,
});

const mapEnergy = (row: any): Energy => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
});

const mapCoupon = (row: any): Coupon => ({
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
});

// ---------- Queries ----------
export const QK = {
  categories: ["categories"] as const,
  subcategories: ["subcategories"] as const,
  energies: ["energies"] as const,
  products: ["products"] as const,
  coupons: ["coupons"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: QK.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data.map(mapCategory);
    },
  });
}

export function useSubcategories() {
  return useQuery({
    queryKey: QK.subcategories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data.map(mapSubcategory);
    },
  });
}

export function useEnergies() {
  return useQuery({
    queryKey: QK.energies,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data.map(mapEnergy);
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: QK.products,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_energies(energy_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapProduct);
    },
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: QK.coupons,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(mapCoupon);
    },
  });
}

// ---------- Mutations: Category ----------
export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Category> & { name: string; slug: string }) => {
      const payload = { name: c.name, slug: c.slug, description: c.description ?? null };
      if (c.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  });
}

// ---------- Mutations: Subcategory ----------
export function useSaveSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<Subcategory> & { name: string; slug: string; categoryId: string }) => {
      const payload = { name: s.name, slug: s.slug, category_id: s.categoryId };
      if (s.id) {
        const { error } = await supabase.from("subcategories").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subcategories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.subcategories }),
  });
}
export function useDeleteSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.subcategories }),
  });
}

// ---------- Mutations: Energy ----------
export function useSaveEnergy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Partial<Energy> & { name: string; slug: string }) => {
      const payload = { name: e.name, slug: e.slug, description: e.description ?? null };
      if (e.id) {
        const { error } = await supabase.from("energies").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("energies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.energies }),
  });
}
export function useDeleteEnergy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("energies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.energies }),
  });
}

// ---------- Mutations: Product ----------
export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Product & { isNew?: boolean }) => {
      const payload = {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discount_percent: p.discountPercent,
        image: p.image,
        category_id: p.categoryId,
        subcategory_id: p.subcategoryId,
        stock: p.stock,
        featured: p.featured,
        promo: p.promo,
      };
      let productId = p.id;
      if (p.isNew || !p.id) {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      }
      // sync energies
      await supabase.from("product_energies").delete().eq("product_id", productId);
      if (p.energyIds.length > 0) {
        const { error } = await supabase
          .from("product_energies")
          .insert(p.energyIds.map((eid) => ({ product_id: productId, energy_id: eid })));
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products }),
  });
}

// ---------- Mutations: Coupons ----------
export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Coupon> & { code: string; type: "percent" | "fixed"; value: number }) => {
      const payload = {
        code: c.code.trim().toUpperCase(),
        type: c.type,
        value: c.value,
        min_order_total: c.minOrderTotal ?? 0,
        starts_at: c.startsAt || null,
        expires_at: c.expiresAt || null,
        max_uses: c.maxUses ?? null,
        one_per_customer: !!c.onePerCustomer,
        active: c.active ?? true,
      };
      if (c.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.coupons }),
  });
}
export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.coupons }),
  });
}

// ---------- Orders ----------
export interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_provider: string | null;
  payment_id: string | null;
  payment_expires_at: string | null;
  payment_status_detail: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_cep: string;
  address_line: string;
  address_number: string;
  address_complement: string | null;
  address_city: string;
  address_state: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon_code: string | null;
  created_at: string;
}
export interface OrderItemRow {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export function useMyOrders(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["orders", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });
}

export function useOrderDetail(orderId: string | undefined) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ["orders", "detail", orderId],
    queryFn: async () => {
      const [{ data: order, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId!).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", orderId!),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { order: order as unknown as OrderRow | null, items: (items ?? []) as unknown as OrderItemRow[] };
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });
}

// ---------- Coupon validation ----------
export interface CouponValidation {
  ok: boolean;
  reason?: string;
  coupon?: Coupon;
  discount?: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, reason: "Informe o código do cupom." };
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", trimmed)
    .maybeSingle();
  if (error) return { ok: false, reason: "Erro ao validar cupom" };
  if (!data) return { ok: false, reason: "Cupom inválido ou inativo." };
  const coupon = mapCoupon(data);

  const status = getCouponStatus(coupon);
  if (status === "inactive") return { ok: false, reason: "Cupom inválido ou inativo." };
  if (status === "scheduled") return { ok: false, reason: "Este cupom ainda não está disponível." };
  if (status === "expired") return { ok: false, reason: "Este cupom expirou." };
  if (status === "depleted") return { ok: false, reason: "Este cupom atingiu o limite de uso." };

  if (subtotal < coupon.minOrderTotal)
    return {
      ok: false,
      reason: `Este cupom está disponível para pedidos a partir de ${formatBRL(coupon.minOrderTotal)}.`,
    };
  const discount = couponDiscount(coupon, subtotal);
  return { ok: true, coupon, discount };
}
