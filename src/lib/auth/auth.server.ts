import { getDb } from "@/lib/db/client.server";
import type { AuthUser } from "./types";
import { hashPassword, verifyPassword } from "./password.server";
import {
  createResetToken,
  createSession,
  destroyUserSessions,
  getCurrentUserFromSession,
  hashOpaqueToken,
} from "./session.server";

type UserWithPasswordRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  role: AuthUser["role"];
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(row: Omit<UserWithPasswordRow, "password_hash">): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
  };
}

async function findUserWithPassword(email: string) {
  const sql = getDb();
  const rows = await sql`
    select id, email, password_hash, full_name, phone, role
    from public.users
    where email = ${normalizeEmail(email)}
      and disabled_at is null
    limit 1
  `;

  return (rows[0] as UserWithPasswordRow | undefined) ?? null;
}

export async function getCurrentUser() {
  return getCurrentUserFromSession();
}

export async function loginWithPassword(input: { email: string; password: string }) {
  const user = await findUserWithPassword(input.email);
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw new Error("E-mail ou senha incorretos");
  }

  await createSession(user.id);
  return mapUser(user);
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const sql = getDb();
  const email = normalizeEmail(input.email);
  const existing = await sql`
    select id
    from public.users
    where email = ${email}
    limit 1
  `;

  if (existing[0]) throw new Error("Este e-mail já está cadastrado");

  const passwordHash = await hashPassword(input.password);
  const rows = await sql`
    insert into public.users (
      email,
      password_hash,
      full_name,
      role,
      email_verified_at
    ) values (
      ${email},
      ${passwordHash},
      ${input.fullName},
      'customer'::public.app_role,
      now()
    )
    returning id, email, full_name, phone, role
  `;

  const user = mapUser(rows[0] as Omit<UserWithPasswordRow, "password_hash">);
  await createSession(user.id);
  return user;
}

export async function updateCurrentUserProfile(input: {
  userId: string;
  fullName: string;
  phone: string;
}) {
  const sql = getDb();
  const rows = await sql`
    update public.users
    set full_name = ${input.fullName || null},
        phone = ${input.phone || null},
        updated_at = now()
    where id = ${input.userId}::uuid
      and disabled_at is null
    returning id, email, full_name, phone, role
  `;

  const user = rows[0] as Omit<UserWithPasswordRow, "password_hash"> | undefined;
  if (!user) throw new Error("Usuário não encontrado");
  return mapUser(user);
}

export async function createPasswordReset(input: { email: string }) {
  const user = await findUserWithPassword(input.email);
  if (!user) return { ok: true, resetToken: null as string | null };

  const token = createResetToken();
  const tokenHash = await hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const sql = getDb();

  await sql`
    insert into public.password_reset_tokens (user_id, token_hash, expires_at)
    values (${user.id}::uuid, ${tokenHash}, ${expiresAt})
  `;

  return {
    ok: true,
    resetToken: process.env.NODE_ENV === "production" ? null : token,
  };
}

export async function resetPasswordWithToken(input: { token: string; password: string }) {
  const tokenHash = await hashOpaqueToken(input.token);
  const sql = getDb();
  const rows = await sql`
    select prt.id, prt.user_id
    from public.password_reset_tokens prt
    join public.users u on u.id = prt.user_id
    where prt.token_hash = ${tokenHash}
      and prt.used_at is null
      and prt.expires_at > now()
      and u.disabled_at is null
    limit 1
  `;

  const tokenRow = rows[0] as { id: string; user_id: string } | undefined;
  if (!tokenRow) throw new Error("Link de redefinição inválido ou expirado");

  const passwordHash = await hashPassword(input.password);
  await sql`
    update public.users
    set password_hash = ${passwordHash},
        updated_at = now()
    where id = ${tokenRow.user_id}::uuid
  `;
  await sql`
    update public.password_reset_tokens
    set used_at = now()
    where id = ${tokenRow.id}::uuid
  `;
  await destroyUserSessions(tokenRow.user_id);
}
