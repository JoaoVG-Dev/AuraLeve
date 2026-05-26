import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

const orderStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
const adminPaymentStatuses = ["pending", "failed", "refunded", "expired"] as const;
const orderStatusRank: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 99,
};

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const customerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  cep: z.string().trim().min(8).max(10),
  address: z.string().trim().min(3).max(200),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(40),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(100),
  couponCode: z.string().trim().max(40).nullable().optional(),
  customer: customerSchema,
  paymentMethod: z.enum(["pix", "credit", "debit"]),
});

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(orderStatuses),
  paymentStatus: z.enum(adminPaymentStatuses).nullable().optional(),
});

function orderErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("coupon expired")) return "Este cupom expirou.";
  if (normalized.includes("coupon inactive")) return "Cupom inválido ou inativo.";
  if (normalized.includes("coupon is not valid yet")) return "Este cupom ainda não está disponível.";
  if (normalized.includes("coupon usage limit reached")) return "Este cupom atingiu o limite de uso.";
  if (normalized.includes("coupon already used by customer")) return "Este cupom não está mais disponível.";
  if (normalized.includes("coupon not found")) return "Cupom inválido ou inativo.";
  if (normalized.includes("coupon minimum order total")) return "O pedido não atingiu o valor mínimo deste cupom.";
  if (normalized.includes("insufficient stock")) return "Um dos produtos não tem estoque suficiente.";
  if (normalized.includes("product not found")) return "Um dos produtos não está mais disponível.";
  if (normalized.includes("product not available")) return "Um dos produtos não está disponível para compra.";
  if (normalized.includes("invalid product discount")) return "Um dos produtos tem uma regra de preço inválida.";
  if (normalized.includes("invalid quantity")) return "A quantidade de um item do carrinho é inválida.";
  if (normalized.includes("invalid order total")) return "O total do pedido é inválido.";
  if (normalized.includes("invalid payment method")) return "Forma de pagamento inválida.";
  if (normalized.includes("empty cart")) return "Seu carrinho está vazio.";

  return message;
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
}

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: orderId, error } = await supabaseAdmin.rpc("place_order_for_user", {
      _user_id: context.userId,
      _items: data.items,
      _coupon_code: data.couponCode ?? "",
      _customer: data.customer,
      _payment_method: data.paymentMethod,
    });

    if (error) throw new Error(orderErrorMessage(error.message));
    if (!orderId) throw new Error("Order was not created");

    return { orderId };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateOrderStatusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: current, error: currentError } = await supabaseAdmin
      .from("orders")
      .select("status,payment_status")
      .eq("id", data.orderId)
      .maybeSingle();

    if (currentError) throw new Error(currentError.message);
    if (!current) throw new Error("Pedido não encontrado");

    if (current.status === "cancelled" && data.status !== "cancelled") {
      throw new Error("Pedido cancelado não pode voltar para o fluxo operacional.");
    }

    if (
      current.status !== "cancelled" &&
      data.status !== "cancelled" &&
      orderStatusRank[data.status as OrderStatus] < orderStatusRank[current.status as OrderStatus]
    ) {
      throw new Error("Não é possível voltar um pedido para uma etapa anterior.");
    }

    if (
      current.payment_status === "paid" &&
      data.paymentStatus &&
      data.paymentStatus !== "refunded"
    ) {
      throw new Error("Pagamento aprovado não pode voltar para um status inferior.");
    }

    const update: Database["public"]["Tables"]["orders"]["Update"] = {
      status: data.status as OrderStatus,
    };

    if (data.paymentStatus) {
      update.payment_status = data.paymentStatus as PaymentStatus;
    }

    if (data.status === "cancelled") {
      update.canceled_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(update)
      .eq("id", data.orderId);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const updateOrderStatusServer = useServerFn(updateOrderStatus);

  return useMutation({
    mutationFn: async (args: { orderId: string; status: string; paymentStatus?: string }) => {
      await updateOrderStatusServer({
        data: {
          orderId: args.orderId,
          status: args.status as OrderStatus,
          paymentStatus: (args.paymentStatus && args.paymentStatus !== "paid"
            ? args.paymentStatus
            : null) as PaymentStatus | null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
