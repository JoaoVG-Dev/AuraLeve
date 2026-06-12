import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  deleteCategoryFn,
  deleteCouponFn,
  deleteEnergyFn,
  deleteProductFn,
  deleteSubcategoryFn,
  getAllOrders,
  getCategories,
  getCoupons,
  getEnergies,
  getMyOrders,
  getOrderDetailFn,
  getProducts,
  getSubcategories,
  saveCategoryFn,
  saveCouponFn,
  saveEnergyFn,
  saveProductFn,
  saveSubcategoryFn,
  validateCouponFn,
} from "./catalog.functions";
import type { Category, Coupon, Energy, Product, Subcategory } from "./types";

export const QK = {
  categories: ["categories"] as const,
  subcategories: ["subcategories"] as const,
  energies: ["energies"] as const,
  products: ["products"] as const,
  coupons: ["coupons"] as const,
};

export function useCategories() {
  const list = useServerFn(getCategories);
  return useQuery({ queryKey: QK.categories, queryFn: () => list() });
}

export function useSubcategories() {
  const list = useServerFn(getSubcategories);
  return useQuery({ queryKey: QK.subcategories, queryFn: () => list() });
}

export function useEnergies() {
  const list = useServerFn(getEnergies);
  return useQuery({ queryKey: QK.energies, queryFn: () => list() });
}

export function useProducts() {
  const list = useServerFn(getProducts);
  return useQuery({ queryKey: QK.products, queryFn: () => list() });
}

export function useCoupons() {
  const list = useServerFn(getCoupons);
  return useQuery({ queryKey: QK.coupons, queryFn: () => list() });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  const save = useServerFn(saveCategoryFn);
  return useMutation({
    mutationFn: async (c: Partial<Category> & { name: string; slug: string }) => {
      await save({ data: c });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteCategoryFn);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ data: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories }),
  });
}

export function useSaveSubcategory() {
  const qc = useQueryClient();
  const save = useServerFn(saveSubcategoryFn);
  return useMutation({
    mutationFn: async (
      s: Partial<Subcategory> & { name: string; slug: string; categoryId: string },
    ) => {
      await save({ data: s });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.subcategories }),
  });
}

export function useDeleteSubcategory() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteSubcategoryFn);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ data: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.subcategories }),
  });
}

export function useSaveEnergy() {
  const qc = useQueryClient();
  const save = useServerFn(saveEnergyFn);
  return useMutation({
    mutationFn: async (e: Partial<Energy> & { name: string; slug: string }) => {
      await save({ data: e });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.energies }),
  });
}

export function useDeleteEnergy() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteEnergyFn);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ data: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.energies }),
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  const save = useServerFn(saveProductFn);
  return useMutation({
    mutationFn: async (p: Product & { isNew?: boolean }) => {
      await save({ data: p });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteProductFn);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ data: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products }),
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  const save = useServerFn(saveCouponFn);
  return useMutation({
    mutationFn: async (
      c: Partial<Coupon> & { code: string; type: "percent" | "fixed"; value: number },
    ) => {
      await save({ data: c });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.coupons }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  const remove = useServerFn(deleteCouponFn);
  return useMutation({
    mutationFn: async (id: string) => {
      await remove({ data: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.coupons }),
  });
}

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
  const list = useServerFn(getMyOrders);
  return useQuery({
    enabled: !!userId,
    queryKey: ["orders", "mine", userId],
    queryFn: () => list() as Promise<OrderRow[]>,
  });
}

export function useOrderDetail(orderId: string | undefined) {
  const detail = useServerFn(getOrderDetailFn);
  return useQuery({
    enabled: !!orderId,
    queryKey: ["orders", "detail", orderId],
    queryFn: () =>
      detail({ data: { orderId: orderId! } }) as Promise<{
        order: OrderRow | null;
        items: OrderItemRow[];
      }>,
  });
}

export function useAllOrders() {
  const list = useServerFn(getAllOrders);
  return useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => list() as Promise<OrderRow[]>,
  });
}

export interface CouponValidation {
  ok: boolean;
  reason?: string;
  coupon?: Coupon;
  discount?: number;
}

export { validateCouponFn };
