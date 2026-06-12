import { neon } from "@neondatabase/serverless";
import { readDatabaseConfig } from "./env";

type NeonSql = ReturnType<typeof neon>;

let sql: NeonSql | undefined;

export function getDb() {
  if (!sql) {
    const { databaseUrl } = readDatabaseConfig();
    sql = neon(databaseUrl, {
      disableWarningInBrowsers: true,
    });
  }

  return sql;
}
