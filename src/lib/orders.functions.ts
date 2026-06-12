import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderStatuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
const adminPaymentStatuses = ["pending", "failed", "refunded", "expired"] as const;
type OrderStatus = (typeof orderStatuses)[number];
type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "expired";

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
  if (normalized.includes("coupon inactive")) return "Cupom invalido ou inativo.";
  if (normalized.includes("coupon is not valid yet"))
    return "Este cupom ainda nao esta disponivel.";
  if (normalized.includes("coupon usage limit reached"))
    return "Este cupom atingiu o limite de uso.";
  if (normalized.includes("coupon already used by customer"))
    return "Este cupom nao esta mais disponivel.";
  if (normalized.includes("coupon not found")) return "Cupom invalido ou inativo.";
  if (normalized.includes("coupon minimum order total"))
    return "O pedido nao atingiu o valor minimo deste cupom.";
  if (normalized.includes("insufficient stock"))
    return "Um dos produtos nao tem estoque suficiente.";
  if (normalized.includes("product not found")) return "Um dos produtos nao esta mais disponivel.";
  if (normalized.includes("product not available"))
    return "Um dos produtos nao esta disponivel para compra.";
  if (normalized.includes("invalid product discount"))
    return "Um dos produtos tem uma regra de preco invalida.";
  if (normalized.includes("invalid quantity"))
    return "A quantidade de um item do carrinho e invalida.";
  if (normalized.includes("invalid order total")) return "O total do pedido e invalido.";
  if (normalized.includes("invalid payment method")) return "Forma de pagamento invalida.";
  if (normalized.includes("empty cart")) return "Seu carrinho esta vazio.";

  return message;
}

async function requireCurrentUserId() {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Autenticacao necessaria");
  return user.id;
}

async function requireCurrentAdminUserId() {
  const userId = await requireCurrentUserId();
  const { assertAdmin } = await import("@/lib/repositories/admin.server");
  await assertAdmin(userId);
  return userId;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { placeOrderForUser } = await import("@/lib/repositories/orders.server");
    let orderId = "";
    try {
      orderId = await placeOrderForUser({
        userId,
        items: data.items,
        couponCode: data.couponCode ?? "",
        customer: data.customer,
        paymentMethod: data.paymentMethod,
      });
    } catch (error) {
      if (error instanceof Error) throw new Error(orderErrorMessage(error.message));
      throw error;
    }

    if (!orderId) throw new Error("Order was not created");
    return { orderId };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => updateOrderStatusSchema.parse(d))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { loadOrderStatus, updateOrderStatus: updateOrderStatusRow } =
      await import("@/lib/repositories/orders.server");

    const current = await loadOrderStatus(data.orderId);
    if (!current) throw new Error("Pedido nao encontrado");

    if (current.status === "cancelled" && data.status !== "cancelled") {
      throw new Error("Pedido cancelado nao pode voltar para o fluxo operacional.");
    }

    if (
      current.status !== "cancelled" &&
      data.status !== "cancelled" &&
      orderStatusRank[data.status as OrderStatus] < orderStatusRank[current.status]
    ) {
      throw new Error("Nao e possivel voltar um pedido para uma etapa anterior.");
    }

    if (
      current.payment_status === "paid" &&
      data.paymentStatus &&
      data.paymentStatus !== "refunded"
    ) {
      throw new Error("Pagamento aprovado nao pode voltar para um status inferior.");
    }

    await updateOrderStatusRow({
      orderId: data.orderId,
      status: data.status as OrderStatus,
      paymentStatus: data.paymentStatus as PaymentStatus | null | undefined,
    });

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
