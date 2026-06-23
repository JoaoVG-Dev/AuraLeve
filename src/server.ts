import "./lib/error-capture";

import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  handleMercadoPagoWebhook,
  mercadoPagoWebhookMethodNotAllowed,
  MP_WEBHOOK_PATH,
} from "./lib/mp-webhook.server";

function isMercadoPagoWebhookRequest(request: Request) {
  const url = new URL(request.url);
  return url.pathname.replace(/\/+$/, "") === MP_WEBHOOK_PATH;
}

function mercadoPagoWebhookOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: { allow: "POST" },
  });
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default createServerEntry({
  async fetch(request) {
    try {
      if (isMercadoPagoWebhookRequest(request)) {
        if (request.method === "OPTIONS") return mercadoPagoWebhookOptionsResponse();
        if (request.method !== "POST") return mercadoPagoWebhookMethodNotAllowed();
        return handleMercadoPagoWebhook(request);
      }

      const response = await handler.fetch(request);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
});
