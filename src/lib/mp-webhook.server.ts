import {
  applyPaymentStatusToOrder,
  fetchPayment,
  validateMercadoPagoCredentials,
} from "@/lib/mercadopago.server";
import { logBackendEvent, messageFromError } from "@/lib/observability.server";

export const MP_WEBHOOK_PATH = "/api/public/mp-webhook";

type MpWebhookBody = {
  resource?: unknown;
  data?: { id?: unknown } | null;
  id?: unknown;
  type?: unknown;
  topic?: unknown;
} | null;

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function readSecretFromRequest(request: Request, url: URL) {
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  return (
    url.searchParams.get("secret") ||
    request.headers.get("x-mp-secret") ||
    request.headers.get("x-webhook-secret") ||
    bearer
  );
}

function parseMpSignature(header: string) {
  const parts = header.split(",");
  const parsed: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key && value) parsed[key.trim()] = value.trim();
  }
  return { ts: parsed.ts, v1: parsed.v1 };
}

async function hmacSha256Hex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hasValidMpSignature(request: Request, url: URL, secret: string) {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
  if (!xSignature || !xRequestId || !dataId) return false;

  const { ts, v1 } = parseMpSignature(xSignature);
  if (!ts || !v1) return false;

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 30 * 60 * 1000) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return safeEquals(expected, v1.toLowerCase());
}

async function hasValidWebhookAuthentication(request: Request, url: URL) {
  const expected =
    process.env.MP_WEBHOOK_SECRET?.trim() || process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!expected) {
    logBackendEvent("error", "mp-webhook.missing_secret");
    return false;
  }

  const provided = readSecretFromRequest(request, url);
  if (provided && safeEquals(provided, expected)) return true;
  return hasValidMpSignature(request, url, expected);
}

function extractPaymentId(body: MpWebhookBody, url: URL) {
  const resource = typeof body?.resource === "string" ? body.resource : "";
  return (
    body?.data?.id ??
    body?.id ??
    (resource ? resource.split("/").filter(Boolean).pop() : null) ??
    url.searchParams.get("id") ??
    url.searchParams.get("data.id")
  );
}

function extractEventType(body: MpWebhookBody, url: URL) {
  const type = typeof body?.type === "string" ? body.type : null;
  const topic = typeof body?.topic === "string" ? body.topic : null;
  return type ?? topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
}

function isPaymentNotFoundError(error: unknown) {
  const message = isObject(error) ? String(error.message ?? "").toLowerCase() : "";
  return message.includes("payment not found");
}

export function mercadoPagoWebhookMethodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "POST" },
  });
}

export async function handleMercadoPagoWebhook(request: Request) {
  const url = new URL(request.url);

  if (request.method !== "POST") {
    return mercadoPagoWebhookMethodNotAllowed();
  }

  if (!(await hasValidWebhookAuthentication(request, url))) {
    logBackendEvent("warn", "mp-webhook.unauthorized", {
      hasQuerySecret: url.searchParams.has("secret"),
      hasHeaderSecret:
        request.headers.has("x-mp-secret") || request.headers.has("x-webhook-secret"),
      hasSignature: request.headers.has("x-signature"),
      hasRequestId: request.headers.has("x-request-id"),
    });
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    validateMercadoPagoCredentials("Mercado Pago webhook");

    const raw = await request.text();
    let body: MpWebhookBody = null;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      body = isObject(parsed) ? parsed : null;
    } catch {
      body = null;
    }

    const eventType = extractEventType(body, url);
    const paymentId = extractPaymentId(body, url);
    logBackendEvent("info", "mp-webhook.received", {
      eventType: eventType ?? "unknown",
      hasPaymentId: !!paymentId,
      hasSignature: request.headers.has("x-signature"),
    });

    if (eventType !== "payment" && eventType !== "payments") {
      return new Response("ignored", { status: 200 });
    }
    if (!paymentId) {
      return new Response("missing payment id", { status: 400 });
    }

    const payment = await fetchPayment(String(paymentId));
    const orderId = payment?.external_reference;
    if (!orderId) {
      logBackendEvent("info", "mp-webhook.payment_without_external_reference", {
        paymentId: String(paymentId),
      });
      return new Response("no external_reference", { status: 200 });
    }

    await applyPaymentStatusToOrder(String(orderId), payment, { source: "webhook" });
    return new Response("ok", { status: 200 });
  } catch (error: unknown) {
    if (isPaymentNotFoundError(error)) {
      logBackendEvent("info", "mp-webhook.payment_not_found");
      return new Response("payment not found", { status: 200 });
    }

    logBackendEvent("error", "mp-webhook.failed", {
      message: messageFromError(error),
    });
    return new Response("webhook error", { status: 500 });
  }
}
