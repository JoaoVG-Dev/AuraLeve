import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireCurrentUserId() {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Autenticacao necessaria");
  return user.id;
}

async function resolveWebhookUrl() {
  const explicit = process.env.MP_WEBHOOK_URL || process.env.MERCADO_PAGO_WEBHOOK_URL;
  if (explicit) return explicit;

  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const url = request ? new URL(request.url) : null;
  if (!url) return undefined;

  return `${url.origin}/api/public/mp-webhook`;
}

export const getMpPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { validateMercadoPagoCredentials } = await import("./mercadopago.server");
  const config = validateMercadoPagoCredentials("getMpPublicKey");
  return { publicKey: config.publicKey, environment: config.environment };
});

export const validateMpCheckoutConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { checkPixAvailability, validateMercadoPagoCredentials } =
    await import("./mercadopago.server");
  const config = validateMercadoPagoCredentials("Mercado Pago checkout");
  const pix = await checkPixAvailability();
  return {
    environment: config.environment,
    pixAvailable: pix.available,
    pixStatus: pix.status,
  };
});

export const startPixPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { createPixPayment, loadOrderForPayment } = await import("./mercadopago.server");
    const order = await loadOrderForPayment(data.orderId, userId);
    if (order.payment_method !== "pix") throw new Error("Pedido nao e Pix");
    try {
      return await createPixPayment(order, await resolveWebhookUrl());
    } catch (error) {
      const { logBackendEvent, messageFromError } = await import("./observability.server");
      logBackendEvent("warn", "payment.pix.start_failed", {
        orderId: data.orderId,
        userId,
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
  .inputValidator((d) => cardSchema.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { loadOrderForPayment, processCardPayment } = await import("./mercadopago.server");
    const order = await loadOrderForPayment(data.orderId, userId);
    if (order.payment_method !== data.kind) throw new Error("Forma de pagamento divergente");
    try {
      return await processCardPayment(
        order,
        {
          token: data.token,
          paymentMethodId: data.paymentMethodId,
          issuerId: data.issuerId,
          installments: data.installments,
          payerEmail: data.payerEmail,
          identification: data.identification,
        },
        data.kind,
        await resolveWebhookUrl(),
      );
    } catch (error) {
      const { logBackendEvent, messageFromError } = await import("./observability.server");
      logBackendEvent("warn", "payment.card.failed", {
        orderId: data.orderId,
        userId,
        kind: data.kind,
        message: messageFromError(error),
      });
      throw error;
    }
  });

export const refreshPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { applyPaymentStatusToOrder, fetchPayment, loadOrderForPayment } =
      await import("./mercadopago.server");
    const order = await loadOrderForPayment(data.orderId, userId);
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
      const { logBackendEvent, messageFromError } = await import("./observability.server");
      logBackendEvent("warn", "payment.polling.failed", {
        orderId: data.orderId,
        userId,
        hasPaymentId: !!order.payment_id,
        message: messageFromError(error),
      });
      throw error;
    }
  });
