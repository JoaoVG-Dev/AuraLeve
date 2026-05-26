import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  handleMercadoPagoWebhook,
  mercadoPagoWebhookMethodNotAllowed,
  MP_WEBHOOK_PATH,
} from "./lib/mp-webhook.server";
import {
  SUPABASE_PROJECT_ID_ALIASES,
  SUPABASE_PUBLISHABLE_KEY_ALIASES,
  SUPABASE_URL_ALIASES,
  readRuntimeEnvValue,
} from "./integrations/supabase/env";
import { SUPABASE_SERVICE_ROLE_KEY_ALIASES } from "./integrations/supabase/env.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

const RUNTIME_ENV_ALIASES = {
  SUPABASE_URL: SUPABASE_URL_ALIASES,
  SUPABASE_PROJECT_ID: SUPABASE_PROJECT_ID_ALIASES,
  SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY_ALIASES,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY_ALIASES,
  VITE_SUPABASE_URL: SUPABASE_URL_ALIASES,
  VITE_SUPABASE_PROJECT_ID: SUPABASE_PROJECT_ID_ALIASES,
  VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY_ALIASES,
  MP_ACCESS_TOKEN: ["MP_ACCESS_TOKEN"],
  MP_PUBLIC_KEY: ["MP_PUBLIC_KEY"],
  MP_WEBHOOK_SECRET: ["MP_WEBHOOK_SECRET"],
  MP_WEBHOOK_URL: ["MP_WEBHOOK_URL"],
} as const satisfies Record<string, readonly string[]>;

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
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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
