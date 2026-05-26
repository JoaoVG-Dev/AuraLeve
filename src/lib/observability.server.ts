type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY_PATTERN =
  /(authorization|token|secret|password|card|cvv|security|access[_-]?key|service[_-]?role)/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") return value.length > 180 ? `${value.slice(0, 177)}...` : value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1));

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeValue(nestedValue, depth + 1);
  }
  return sanitized;
}

export function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error || "unknown");
}

export function logBackendEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const payload = sanitizeValue(context);
  console[level](`[${event}]`, payload);
}
