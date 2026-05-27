export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface Energy {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPercent: number;
  image: string;
  categoryId: string | null;
  subcategoryId: string | null;
  energyIds: string[];
  stock: number;
  featured: boolean;
  promo: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderTotal: number;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  onePerCustomer: boolean;
  active: boolean;
}

export type CouponStatus = "active" | "inactive" | "expired" | "depleted" | "scheduled";

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  expired: "Expirado",
  depleted: "Esgotado",
  scheduled: "Agendado",
};

export function getCouponStatus(
  coupon: Pick<Coupon, "active" | "startsAt" | "expiresAt" | "maxUses" | "usesCount">,
  now = Date.now(),
): CouponStatus {
  if (!coupon.active) return "inactive";
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return "scheduled";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) return "expired";
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return "depleted";
  return "active";
}

export function couponDiscount(coupon: Pick<Coupon, "type" | "value">, subtotal: number) {
  const safeSubtotal = Math.max(0, subtotal);
  const raw =
    coupon.type === "percent" ? +(safeSubtotal * (coupon.value / 100)).toFixed(2) : coupon.value;

  return Math.min(Math.max(0, raw), safeSubtotal);
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  paymentMethod: "pix" | "credit" | "debit";
}

export const finalPrice = (p: Pick<Product, "price" | "discountPercent">) =>
  p.discountPercent > 0 ? +(p.price * (1 - p.discountPercent / 100)).toFixed(2) : p.price;

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
