export const AURALEVE_SUPABASE_PROJECT_REF = "aucmhhqwrpcplozlnoeq";

export const SUPABASE_URL_ALIASES = ["SUPABASE_URL", "VITE_SUPABASE_URL"] as const;
export const SUPABASE_PUBLISHABLE_KEY_ALIASES = [
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLIC_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_ANON_KEY",
] as const;
export const SUPABASE_PROJECT_ID_ALIASES = [
  "SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

type RuntimeEnv = Record<string, unknown>;

function readFromRecord(source: unknown, name: string) {
  if (!source || typeof source !== "object") return "";
  const value = (source as RuntimeEnv)[name];
  return typeof value === "string" ? value.trim() : "";
}

function processEnv() {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
}

export function readRuntimeEnvValue(names: readonly string[], runtimeEnv?: unknown) {
  const sources = [runtimeEnv, import.meta.env, processEnv()];
  for (const source of sources) {
    for (const name of names) {
      const value = readFromRecord(source, name);
      if (value) return value;
    }
  }
  return "";
}

function projectRefFromSupabaseUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    if (!hostname.endsWith(".supabase.co")) return "";
    return hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function formatMissingSupabaseEnvError(missing: string[]) {
  return [
    `Missing Supabase environment variable(s): ${missing.join(", ")}.`,
    `Configure them in the local/deployment runtime for project ${AURALEVE_SUPABASE_PROJECT_REF}.`,
  ].join(" ");
}

function assertAuraLeveProject(url: string, configuredProjectRef: string) {
  const detectedProjectRef = configuredProjectRef || projectRefFromSupabaseUrl(url);

  if (!detectedProjectRef) return;
  if (detectedProjectRef !== AURALEVE_SUPABASE_PROJECT_REF) {
    throw new Error(
      [
        `Supabase project mismatch: expected ${AURALEVE_SUPABASE_PROJECT_REF}, got ${detectedProjectRef}.`,
        "Update SUPABASE_URL/VITE_SUPABASE_URL and the publishable key to the AuraLeve Supabase project.",
      ].join(" "),
    );
  }
}

export function readSupabasePublicConfig(runtimeEnv?: unknown) {
  const url = readRuntimeEnvValue(SUPABASE_URL_ALIASES, runtimeEnv);
  const publishableKey = readRuntimeEnvValue(SUPABASE_PUBLISHABLE_KEY_ALIASES, runtimeEnv);
  const projectRef = readRuntimeEnvValue(SUPABASE_PROJECT_ID_ALIASES, runtimeEnv);

  const missing = [
    ...(!url ? ["SUPABASE_URL"] : []),
    ...(!publishableKey ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
  ];
  if (missing.length > 0) {
    throw new Error(formatMissingSupabaseEnvError(missing));
  }

  assertAuraLeveProject(url, projectRef);

  return {
    projectRef: projectRef || projectRefFromSupabaseUrl(url) || AURALEVE_SUPABASE_PROJECT_REF,
    publishableKey,
    url,
  };
}
