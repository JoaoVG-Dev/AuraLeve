import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  handleMercadoPagoWebhook,
  mercadoPagoWebhookMethodNotAllowed,
  MP_WEBHOOK_PATH,
} from "./lib/mp-webhook.server";
import { DATABASE_URL_ALIASES, DIRECT_DATABASE_URL_ALIASES } from "./lib/db/env";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

const RUNTIME_ENV_ALIASES = {
  DATABASE_URL: DATABASE_URL_ALIASES,
  DIRECT_DATABASE_URL: DIRECT_DATABASE_URL_ALIASES,
  AUTH_SECRET: ["AUTH_SECRET"],
  AUTH_COOKIE_NAME: ["AUTH_COOKIE_NAME"],
  MP_ACCESS_TOKEN: ["MP_ACCESS_TOKEN", "MERCADO_PAGO_ACCESS_TOKEN"],
  MERCADO_PAGO_ACCESS_TOKEN: ["MERCADO_PAGO_ACCESS_TOKEN", "MP_ACCESS_TOKEN"],
  MP_PUBLIC_KEY: ["MP_PUBLIC_KEY", "VITE_MP_PUBLIC_KEY"],
  VITE_MP_PUBLIC_KEY: ["VITE_MP_PUBLIC_KEY", "MP_PUBLIC_KEY"],
  MP_WEBHOOK_SECRET: ["MP_WEBHOOK_SECRET", "MERCADO_PAGO_WEBHOOK_SECRET"],
  MERCADO_PAGO_WEBHOOK_SECRET: ["MERCADO_PAGO_WEBHOOK_SECRET", "MP_WEBHOOK_SECRET"],
  MP_WEBHOOK_URL: ["MP_WEBHOOK_URL", "MERCADO_PAGO_WEBHOOK_URL"],
  MERCADO_PAGO_WEBHOOK_URL: ["MERCADO_PAGO_WEBHOOK_URL", "MP_WEBHOOK_URL"],
} as const satisfies Record<string, readonly string[]>;

function readRuntimeEnvValue(names: readonly string[], runtimeEnv: unknown) {
  if (!runtimeEnv || typeof runtimeEnv !== "object") return "";
  for (const name of names) {
    const value = (runtimeEnv as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function hydrateProcessEnv(env: unknown) {
  if (!env || typeof env !== "object") return;

  for (const [key, aliases] of Object.entries(RUNTIME_ENV_ALIASES)) {
    const value = readRuntimeEnvValue(aliases, env);
    if (value) {
      process.env[key] = value;
    }
  }
}

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

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    hydrateProcessEnv(env);

    try {
      if (isMercadoPagoWebhookRequest(request)) {
        if (request.method === "OPTIONS") return mercadoPagoWebhookOptionsResponse();
        if (request.method !== "POST") return mercadoPagoWebhookMethodNotAllowed();
        return handleMercadoPagoWebhook(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
