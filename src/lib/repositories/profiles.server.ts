import { getDb } from "@/lib/db/client.server";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string) {
  const sql = getDb();
  const rows = await sql`
    select id, full_name, phone, created_at, updated_at
    from public.users
    where id = ${userId}::uuid
      and disabled_at is null
    limit 1
  `;

  return (rows[0] as ProfileRow | undefined) ?? null;
}

export async function upsertProfile(input: { userId: string; fullName: string; phone: string }) {
  const sql = getDb();
  const rows = await sql`
    update public.users
    set full_name = ${input.fullName || null},
        phone = ${input.phone || null},
        updated_at = now()
    where id = ${input.userId}::uuid
      and disabled_at is null
    returning id, full_name, phone, created_at, updated_at
  `;

  if (!rows[0]) throw new Error("Usuario nao encontrado");
  return rows[0] as ProfileRow;
}
