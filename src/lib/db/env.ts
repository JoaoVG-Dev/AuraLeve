export const DATABASE_URL_ALIASES = ["DATABASE_URL", "NEON_DATABASE_URL"] as const;
export const DIRECT_DATABASE_URL_ALIASES = [
  "DIRECT_DATABASE_URL",
  "NEON_DIRECT_DATABASE_URL",
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

export function readDatabaseEnvValue(names: readonly string[], runtimeEnv?: unknown) {
  const sources = [runtimeEnv, processEnv()];
  for (const source of sources) {
    for (const name of names) {
      const value = readFromRecord(source, name);
      if (value) return value;
    }
  }
  return "";
}

function formatMissingDatabaseEnvError(missing: string[]) {
  return [
    `Missing Neon database environment variable(s): ${missing.join(", ")}.`,
    "Set DATABASE_URL as a server-only secret. Never expose it through VITE_* variables.",
  ].join(" ");
}

export function readDatabaseConfig(runtimeEnv?: unknown) {
  const databaseUrl = readDatabaseEnvValue(DATABASE_URL_ALIASES, runtimeEnv);
  const directDatabaseUrl = readDatabaseEnvValue(DIRECT_DATABASE_URL_ALIASES, runtimeEnv);

  if (!databaseUrl) {
    throw new Error(formatMissingDatabaseEnvError(["DATABASE_URL"]));
  }

  return {
    databaseUrl,
    directDatabaseUrl: directDatabaseUrl || databaseUrl,
  };
}
