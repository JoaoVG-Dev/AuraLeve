import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFile(path, "utf8");
  return text.then((contents) => {
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  });
}

await loadEnvFile(resolve(process.cwd(), ".env.local"));
await loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run Neon migrations.");
}

const migrationsDir = resolve(process.cwd(), "src/lib/db/migrations");
const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const pool = new Pool({ connectionString });
try {
  for (const file of migrationFiles) {
    const migrationPath = join(migrationsDir, file);
    const migrationSql = await readFile(migrationPath, "utf8");
    await pool.query(migrationSql);
    console.log("Neon migration applied:", basename(migrationPath));
  }
} finally {
  await pool.end();
}
