import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createPixPayment,
  fetchPayment,
  loadOrderForPayment,
  processCardPayment,
  applyPaymentStatusToOrder,
  checkPixAvailability,
  validateMercadoPagoCredentials,
} from "./mercadopago.server";
import { logBackendEvent, messageFromError } from "./observability.server";

function resolveWebhookUrl() {
  const explicit = process.env.MP_WEBHOOK_URL;
  if (explicit) return explicit;

  const request = getRequest();
  const url = request ? new URL(request.url) : null;
  if (!url) return undefined;

  return `${url.origin}/api/public/mp-webhook`;
}

export const getMpPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const config = validateMercadoPagoCredentials("getMpPublicKey");
  return { publicKey: config.publicKey, environment: config.environment };
});

export const validateMpCheckoutConfig = createServerFn({ method: "GET" }).handler(async () => {
  const config = validateMercadoPagoCredentials("Mercado Pago checkout");
  const pix = await checkPixAvailability();
  return {
    environment: config.environment,
    pixAvailable: pix.available,
    pixStatus: pix.status,
  };
});

export const startPixPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const order = await loadOrderForPayment(data.orderId, context.userId);
    if (order.payment_method !== "pix") throw new Error("Pedido não é Pix");
    try {
      return await createPixPayment(order, resolveWebhookUrl());
    } catch (error) {
      logBackendEvent("warn", "payment.pix.start_failed", {
        orderId: data.orderId,
        userId: context.userId,
        message: messageFromError(error),
      });
      throw error;
    }
  });

const cardSchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(8),
  paymentMethodId: z.string().min(2),
  issuerId: z.string().optional(),
  installments: z.number().int().min(1).max(24),
  payerEmail: z.string().email(),
  identification: z
    .object({ type: z.string().min(1).max(20), number: z.string().min(3).max(40) })
    .optional(),
  kind: z.enum(["credit", "debit"]),
});

export const payWithCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => cardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const order = await loadOrderForPayment(data.orderId, context.userId);
    if (order.payment_method !== data.kind) throw new Error("Forma de pagamento divergente");
    try {
      return await processCardPayment(order, {
        token: data.token,
        paymentMethodId: data.paymentMethodId,
        issuerId: data.issuerId,
        installments: data.installments,
        payerEmail: data.payerEmail,
        identification: data.identification,
      }, data.kind, resolveWebhookUrl());
    } catch (error) {
      logBackendEvent("warn", "payment.card.failed", {
        orderId: data.orderId,
        userId: context.userId,
        kind: data.kind,
        message: messageFromError(error),
      });
      throw error;
    }
  });

export const refreshPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const order = await loadOrderForPayment(data.orderId, context.userId);
    if (!order.payment_id) {
      return {
        paymentStatus: order.payment_status,
        orderStatus: order.status,
        expiresAt: order.payment_expires_at,
      };
    }
    try {
      const payment = await fetchPayment(order.payment_id);
      return {
        ...(await applyPaymentStatusToOrder(order.id, payment, { source: "polling" })),
        expiresAt: payment?.date_of_expiration ?? order.payment_expires_at,
      };
    } catch (error) {
      logBackendEvent("warn", "payment.polling.failed", {
        orderId: data.orderId,
        userId: context.userId,
        hasPaymentId: !!order.payment_id,
        message: messageFromError(error),
      });
      throw error;
    }
  });
