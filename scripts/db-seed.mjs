import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { Pool } from "@neondatabase/serverless";

async function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const contents = await readFile(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

await loadEnvFile(resolve(process.cwd(), ".env.local"));
await loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed Neon.");
}

const seedPath = resolve(process.cwd(), "src/lib/db/seed.sql");
const seedSql = await readFile(seedPath, "utf8");

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required to seed the initial admin user.`);
  return value;
}

function hashPassword(password) {
  const iterations = 210_000;
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return [
    "pbkdf2-sha256",
    String(iterations),
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

async function ensureAdminUser(pool) {
  const email = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const password = requiredEnv("ADMIN_PASSWORD");
  const fullName = process.env.ADMIN_NAME?.trim() || "AuraLeve Admin";

  if (password === "change-me") {
    throw new Error("ADMIN_PASSWORD must be changed before seeding the initial admin user.");
  }

  const passwordHash = hashPassword(password);
  await pool.query(
    `
      insert into public.users (
        email,
        password_hash,
        full_name,
        role,
        email_verified_at,
        disabled_at
      ) values (
        $1,
        $2,
        $3,
        'admin'::public.app_role,
        now(),
        null
      )
      on conflict (email) do update set
        password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        role = 'admin'::public.app_role,
        disabled_at = null,
        updated_at = now()
    `,
    [email, passwordHash, fullName],
  );

  console.log(`Admin user ensured: ${email}`);
}

const pool = new Pool({ connectionString });
try {
  await pool.query(seedSql);
  console.log("Neon seed applied:", seedPath);
  await ensureAdminUser(pool);
} finally {
  await pool.end();
}
