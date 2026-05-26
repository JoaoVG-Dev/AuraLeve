import {
  AURALEVE_SUPABASE_PROJECT_REF,
  readRuntimeEnvValue,
  readSupabasePublicConfig,
} from "./env";

export const SUPABASE_SERVICE_ROLE_KEY_ALIASES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

function formatMissingSupabaseAdminEnvError(missing: string[]) {
  return [
    `Missing Supabase server environment variable(s): ${missing.join(", ")}.`,
    `Set them as server-only runtime secrets for project ${AURALEVE_SUPABASE_PROJECT_REF}.`,
    "Never expose service role keys to VITE_* variables or client bundles.",
  ].join(" ");
}

export function readSupabaseAdminConfig(runtimeEnv?: unknown) {
  const publicConfig = readSupabasePublicConfig(runtimeEnv);
  const serviceRoleKey = readRuntimeEnvValue(SUPABASE_SERVICE_ROLE_KEY_ALIASES, runtimeEnv);

  if (!serviceRoleKey) {
    throw new Error(formatMissingSupabaseAdminEnvError(["SUPABASE_SERVICE_ROLE_KEY"]));
  }

  return {
    ...publicConfig,
    serviceRoleKey,
  };
}
