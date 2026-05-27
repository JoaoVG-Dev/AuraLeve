// Server-only Mercado Pago helper. Imports are blocked from client bundles
// thanks to the `.server.ts` suffix.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logBackendEvent, messageFromError } from "./observability.server";

const MP_BASE = "https://api.mercadopago.com";

export const MP_CREDENTIALS_MISMATCH_MESSAGE =
  "Credenciais Mercado Pago inconsistentes: public key e access token pertencem a ambientes diferentes.";

type MpEnvironment = "sandbox" | "production";
type MpCredentialEnvironment = MpEnvironment | "unknown" | "missing";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "expired";
type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

interface MpCredentialStatus {
  exists: boolean;
  environment: MpCredentialEnvironment;
}

interface MpRuntimeConfig {
  accessToken: string;
  publicKey: string;
  environment: MpEnvironment;
}

interface ApplyPaymentOptions {
  allowPaymentReplacement?: boolean;
  source?: "card" | "polling" | "webhook";
}

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function classifyMpCredential(value: string): MpCredentialStatus {
  if (!value) return { exists: false, environment: "missing" };
  if (value.startsWith("TEST-")) return { exists: true, environment: "sandbox" };
  if (value.startsWith("APP_USR-")) return { exists: true, environment: "production" };
  return { exists: true, environment: "unknown" };
}

function logCredentialStatus(
  level: "info" | "error",
  context: string,
  publicKeyStatus: MpCredentialStatus,
  accessTokenStatus: MpCredentialStatus,
) {
  const detectedEnvironment =
    publicKeyStatus.environment === accessTokenStatus.environment
      ? publicKeyStatus.environment
      : "mismatch";

  console[level](
    `[${context}] MP_PUBLIC_KEY ${publicKeyStatus.exists ? "encontrada" : "ausente"}; ambiente ${detectedEnvironment} detectado`,
    {
      publicKey: publicKeyStatus.exists ? "present" : "missing",
      publicKeyEnvironment: publicKeyStatus.environment,
      accessToken: accessTokenStatus.exists ? "present" : "missing",
      accessTokenEnvironment: accessTokenStatus.environment,
    },
  );
}

export function getMercadoPagoCredentialStatus() {
  const publicKey = readEnv("MP_PUBLIC_KEY");
  const accessToken = readEnv("MP_ACCESS_TOKEN");
  return {
    publicKey: classifyMpCredential(publicKey),
    accessToken: classifyMpCredential(accessToken),
  };
}

export function validateMercadoPagoCredentials(context = "Mercado Pago"): MpRuntimeConfig {
  const publicKey = readEnv("MP_PUBLIC_KEY");
  const accessToken = readEnv("MP_ACCESS_TOKEN");
  const publicKeyStatus = classifyMpCredential(publicKey);
  const accessTokenStatus = classifyMpCredential(accessToken);

  if (!publicKeyStatus.exists) {
    logCredentialStatus("error", context, publicKeyStatus, accessTokenStatus);
    throw new Error("MP public key não configurado");
  }
  if (!accessTokenStatus.exists) {
    logCredentialStatus("error", context, publicKeyStatus, accessTokenStatus);
    throw new Error("MP_ACCESS_TOKEN não configurado");
  }
  if (publicKeyStatus.environment === "unknown" || accessTokenStatus.environment === "unknown") {
    logCredentialStatus("error", context, publicKeyStatus, accessTokenStatus);
    throw new Error("Credenciais Mercado Pago inválidas ou não reconhecidas.");
  }
  if (publicKeyStatus.environment !== accessTokenStatus.environment) {
    logCredentialStatus("error", context, publicKeyStatus, accessTokenStatus);
    throw new Error(MP_CREDENTIALS_MISMATCH_MESSAGE);
  }
  const environment = publicKeyStatus.environment;
  if (environment !== "sandbox" && environment !== "production") {
    logCredentialStatus("error", context, publicKeyStatus, accessTokenStatus);
    throw new Error("Credenciais Mercado Pago inválidas ou não reconhecidas.");
  }

  logCredentialStatus("info", context, publicKeyStatus, accessTokenStatus);
  return {
    accessToken,
    publicKey,
    environment,
  };
}

function token() {
  return validateMercadoPagoCredentials("Mercado Pago API").accessToken;
}

export function getPublicKey(): string {
  return validateMercadoPagoCredentials("Mercado Pago public key").publicKey;
}

async function mpFetch(path: string, init: RequestInit & { idempotencyKey?: string } = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;
  const res = await fetch(`${MP_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Mercado Pago may return an empty or plain-text body on some errors.
  }
  if (!res.ok) {
    const cause = Array.isArray(json?.cause)
      ? json.cause
          .map((item: any) => item?.description || item?.message || item?.code)
          .filter(Boolean)
          .join("; ")
      : "";
    const msg = [json?.message || json?.error || text || `MP error ${res.status}`, cause]
      .filter(Boolean)
      .join(": ");
    throw new Error(`Mercado Pago: ${msg}`);
  }
  return json;
}

export async function checkPixAvailability() {
  validateMercadoPagoCredentials("Mercado Pago Pix availability");

  try {
    const methods = await mpFetch("/v1/payment_methods", { method: "GET" });
    const pix = Array.isArray(methods) ? methods.find((method) => method?.id === "pix") : null;
    const available = !!pix && (!pix.status || pix.status === "active");

    logBackendEvent("info", "mp.pix.availability_checked", {
      available,
      status: pix?.status ?? null,
    });

    return {
      available,
      status: pix?.status ?? null,
    };
  } catch (error) {
    logBackendEvent("warn", "mp.pix.availability_check_failed", {
      message: messageFromError(error),
    });

    return {
      available: null,
      status: null,
    };
  }
}

interface OrderRow {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_id: string | null;
  payment_expires_at: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
}

export async function loadOrderForPayment(orderId: string, userId: string): Promise<OrderRow> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,user_id,total,status,payment_status,payment_method,payment_id,payment_expires_at,paid_at,canceled_at,customer_email,customer_name,customer_phone",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Pedido não encontrado");
  if (data.user_id !== userId) throw new Error("Pedido não pertence ao usuário");
  return data as OrderRow;
}

function assertOrderCanReceivePayment(order: OrderRow) {
  if (order.payment_status === "paid") {
    throw new Error("Pedido já está pago");
  }
  if (order.payment_status === "refunded") {
    throw new Error("Pedido reembolsado não pode receber novo pagamento");
  }
  if (
    order.status === "cancelled" &&
    order.payment_status !== "failed" &&
    order.payment_status !== "expired"
  ) {
    throw new Error("Pedido cancelado não pode receber novo pagamento");
  }
}

export async function createPixPayment(order: OrderRow, notificationUrl?: string) {
  validateMercadoPagoCredentials("Mercado Pago Pix");
  assertOrderCanReceivePayment(order);

  const [first, ...rest] = (order.customer_name || "Cliente").trim().split(/\s+/);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const body = {
    transaction_amount: Number(order.total),
    description: `Pedido AuraLeve #${order.id.slice(0, 8).toUpperCase()}`,
    payment_method_id: "pix",
    date_of_expiration: expiresAt,
    payer: {
      email: order.customer_email,
      first_name: first || "Cliente",
      last_name: rest.join(" ") || "AuraLeve",
    },
    external_reference: order.id,
    notification_url: notificationUrl || process.env.MP_WEBHOOK_URL || undefined,
  };
  let json: any;
  try {
    json = await mpFetch("/v1/payments", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: order.payment_id
        ? `order-${order.id}-pix-retry-${Date.now()}`
        : `order-${order.id}-pix`,
    });
  } catch (error) {
    logBackendEvent("warn", "mp.pix.create_failed", {
      orderId: order.id,
      message: messageFromError(error),
    });
    throw error;
  }

  const td = json?.point_of_interaction?.transaction_data;
  const paymentId = String(json.id);
  const paymentExpiresAt = json?.date_of_expiration ?? expiresAt;

  if (!td?.qr_code && !td?.qr_code_base64) {
    logBackendEvent("warn", "mp.pix.unavailable", {
      orderId: order.id,
      paymentId,
      providerStatus: json?.status ?? "unknown",
      providerStatusDetail: json?.status_detail ?? null,
    });
    throw new Error(
      "Pix indisponível no Mercado Pago para este pagamento. Tente novamente ou use cartão.",
    );
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "pending",
      payment_status: "pending",
      payment_id: String(json.id),
      payment_expires_at: paymentExpiresAt,
      payment_provider: "mercado_pago",
      payment_status_detail: json.status_detail ?? null,
      pix_qr_code: td?.qr_code_base64 ?? null,
      pix_copy_paste: td?.qr_code ?? null,
      canceled_at: null,
    } as never)
    .eq("id", order.id);

  if (error) throw new Error(error.message);

  logBackendEvent("info", "mp.pix.created", {
    orderId: order.id,
    paymentId,
    providerStatus: json?.status ?? "unknown",
    expiresAt: paymentExpiresAt,
    hasQrCode: !!td?.qr_code,
    hasQrCodeBase64: !!td?.qr_code_base64,
  });

  return {
    paymentId,
    status: json.status as string,
    statusDetail: json.status_detail as string | undefined,
    expiresAt: paymentExpiresAt as string,
    qrCodeBase64: td?.qr_code_base64 as string | undefined,
    qrCode: td?.qr_code as string | undefined,
    ticketUrl: td?.ticket_url as string | undefined,
  };
}

export async function processCardPayment(
  order: OrderRow,
  input: {
    token: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
    payerEmail: string;
    identification?: { type: string; number: string };
  },
  kind: "credit" | "debit",
  notificationUrl?: string,
) {
  validateMercadoPagoCredentials("Mercado Pago card");
  assertOrderCanReceivePayment(order);

  const body: any = {
    transaction_amount: Number(order.total),
    token: input.token,
    description: `Pedido AuraLeve #${order.id.slice(0, 8).toUpperCase()}`,
    installments: kind === "debit" ? 1 : Math.max(1, input.installments || 1),
    payment_method_id: input.paymentMethodId,
    issuer_id: input.issuerId,
    payer: {
      email: input.payerEmail || order.customer_email,
      identification: input.identification,
    },
    external_reference: order.id,
    notification_url: notificationUrl || process.env.MP_WEBHOOK_URL || undefined,
  };
  let json: any;
  try {
    json = await mpFetch("/v1/payments", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: `order-${order.id}-${kind}-${Date.now()}`,
    });
  } catch (error) {
    logBackendEvent("warn", "mp.card.create_failed", {
      orderId: order.id,
      kind,
      paymentMethodId: input.paymentMethodId,
      hasIssuerId: !!input.issuerId,
      installments: body.installments,
      message: messageFromError(error),
    });
    throw error;
  }

  const applied = await applyPaymentStatusToOrder(order.id, json, {
    allowPaymentReplacement: true,
    source: "card",
  });
  return {
    paymentId: String(json.id),
    status: json.status as string,
    statusDetail: json.status_detail as string,
    paymentStatus: applied.paymentStatus,
    orderStatus: applied.orderStatus,
  };
}

export async function fetchPayment(paymentId: string) {
  return mpFetch(`/v1/payments/${paymentId}`, { method: "GET" });
}

function mapMercadoPagoStatus(status: string): {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
} {
  if (status === "approved") return { paymentStatus: "paid", orderStatus: "paid" };
  if (status === "rejected" || status === "cancelled" || status === "canceled") {
    return { paymentStatus: "failed", orderStatus: "cancelled" };
  }
  if (status === "refunded" || status === "charged_back") {
    return { paymentStatus: "refunded", orderStatus: "cancelled" };
  }
  if (status === "expired") return { paymentStatus: "expired", orderStatus: "cancelled" };
  return { paymentStatus: "pending", orderStatus: "pending" };
}

function isStaleTransition(
  currentPaymentStatus: string,
  nextPaymentStatus: PaymentStatus,
  allowPaymentReplacement: boolean,
) {
  if (currentPaymentStatus === "refunded" && nextPaymentStatus !== "refunded") return true;
  if (
    currentPaymentStatus === "paid" &&
    nextPaymentStatus !== "paid" &&
    nextPaymentStatus !== "refunded"
  ) {
    return true;
  }
  if (
    !allowPaymentReplacement &&
    (currentPaymentStatus === "failed" || currentPaymentStatus === "expired") &&
    nextPaymentStatus === "pending"
  ) {
    return true;
  }
  return false;
}

// Map MP payment status -> our enums and write to the order idempotently.
export async function applyPaymentStatusToOrder(
  orderId: string,
  payment: any,
  options: ApplyPaymentOptions = {},
) {
  const status: string = payment?.status ?? "pending";
  const statusDetail: string | null = payment?.status_detail ?? null;
  const paymentId = payment?.id == null ? null : String(payment.id);
  const externalReference =
    payment?.external_reference == null ? null : String(payment.external_reference);
  const { paymentStatus, orderStatus } = mapMercadoPagoStatus(status);
  const allowPaymentReplacement = !!options.allowPaymentReplacement;

  if (externalReference && externalReference !== orderId) {
    logBackendEvent("warn", "mp.payment.external_reference_mismatch", {
      orderId,
      paymentId,
      externalReference,
      providerStatus: status,
      source: options.source ?? "unknown",
    });
    throw new Error("Mercado Pago payment does not belong to this order");
  }

  const { data: current, error: loadError } = await supabaseAdmin
    .from("orders")
    .select("id,status,payment_status,payment_id,paid_at,canceled_at,payment_expires_at")
    .eq("id", orderId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!current) throw new Error("Pedido não encontrado");

  if (
    current.payment_id &&
    paymentId &&
    current.payment_id !== paymentId &&
    !allowPaymentReplacement
  ) {
    logBackendEvent("warn", "mp.payment.ignored_mismatched_payment_id", {
      orderId,
      currentPaymentId: current.payment_id,
      incomingPaymentId: paymentId,
      providerStatus: status,
      source: options.source ?? "unknown",
    });
    return {
      ignored: true,
      paymentStatus: current.payment_status as PaymentStatus,
      orderStatus: current.status as OrderStatus,
      providerStatus: status,
    };
  }

  if (isStaleTransition(current.payment_status, paymentStatus, allowPaymentReplacement)) {
    logBackendEvent("info", "mp.payment.ignored_stale_status", {
      orderId,
      paymentId,
      currentPaymentStatus: current.payment_status,
      incomingPaymentStatus: paymentStatus,
      providerStatus: status,
      source: options.source ?? "unknown",
    });
    return {
      ignored: true,
      paymentStatus: current.payment_status as PaymentStatus,
      orderStatus: current.status as OrderStatus,
      providerStatus: status,
    };
  }

  const update: Record<string, any> = {
    payment_status: paymentStatus,
    status: orderStatus,
    payment_status_detail: statusDetail,
    payment_provider: "mercado_pago",
  };
  if (paymentId) update.payment_id = paymentId;
  if (payment?.date_of_expiration) update.payment_expires_at = payment.date_of_expiration;

  const now = new Date().toISOString();
  if (paymentStatus === "paid") {
    update.paid_at = current.paid_at ?? now;
    update.canceled_at = null;
  } else if (orderStatus === "cancelled") {
    update.canceled_at = current.canceled_at ?? now;
  } else if (allowPaymentReplacement) {
    update.canceled_at = null;
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update(update as never)
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  if (paymentStatus === "paid") {
    logBackendEvent("info", "mp.payment.approved", {
      orderId,
      paymentId,
      providerStatus: status,
      source: options.source ?? "unknown",
    });
  } else if (paymentStatus === "failed" || paymentStatus === "expired") {
    logBackendEvent("warn", "mp.payment.not_approved", {
      orderId,
      paymentId,
      providerStatus: status,
      providerStatusDetail: statusDetail,
      paymentStatus,
      source: options.source ?? "unknown",
    });
  }

  return { paymentStatus, orderStatus, providerStatus: status };
}
