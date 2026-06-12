import { getDb } from "@/lib/db/client.server";

export async function isAdmin(userId: string | undefined | null) {
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`
    select 1
    from public.users
    where id = ${userId}::uuid
      and role = 'admin'::public.app_role
      and disabled_at is null
    limit 1
  `;

  return rows.length > 0;
}

export async function assertAdmin(userId: string | undefined | null) {
  if (await isAdmin(userId)) return;
  throw new Response("Forbidden", { status: 403 });
}
