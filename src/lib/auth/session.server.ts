import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDb } from "@/lib/db/client.server";
import type { AuthUser } from "./types";
import { bytesToBase64Url } from "./password.server";

const DEFAULT_COOKIE_NAME = "auraleve_session";
const SESSION_DAYS = 30;

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AuthUser["role"];
};

function authSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value || value === "change-me") {
    throw new Error("AUTH_SECRET must be configured as a strong server-only secret.");
  }
  return value;
}

export function authCookieName() {
  return process.env.AUTH_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
}

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64Url(value);
}

export async function hashOpaqueToken(token: string) {
  const encoder = new TextEncoder();
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(`${authSecret()}:${token}`));
  return bytesToBase64Url(new Uint8Array(bytes));
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
  };
}

export async function createSession(userId: string) {
  const token = randomToken();
  const tokenHash = await hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const sql = getDb();

  await sql`
    insert into public.user_sessions (user_id, session_token_hash, expires_at, last_seen_at)
    values (${userId}::uuid, ${tokenHash}, ${expiresAt.toISOString()}, now())
  `;

  setCookie(authCookieName(), token, cookieOptions(expiresAt));
}

export async function getCurrentUserFromSession() {
  const token = getCookie(authCookieName());
  if (!token) return null;

  const tokenHash = await hashOpaqueToken(token);
  const sql = getDb();
  const rows = await sql`
    select u.id, u.email, u.full_name, u.phone, u.role
    from public.user_sessions s
    join public.users u on u.id = s.user_id
    where s.session_token_hash = ${tokenHash}
      and s.expires_at > now()
      and u.disabled_at is null
    limit 1
  `;

  const row = rows[0] as UserRow | undefined;
  if (!row) return null;

  await sql`
    update public.user_sessions
    set last_seen_at = now()
    where session_token_hash = ${tokenHash}
  `;

  return mapUser(row);
}

export async function destroyCurrentSession() {
  const token = getCookie(authCookieName());
  if (token) {
    const tokenHash = await hashOpaqueToken(token);
    const sql = getDb();
    await sql`delete from public.user_sessions where session_token_hash = ${tokenHash}`;
  }
  deleteCookie(authCookieName(), cookieOptions(new Date(0)));
}

export async function destroyUserSessions(userId: string) {
  const sql = getDb();
  await sql`delete from public.user_sessions where user_id = ${userId}::uuid`;
}

export function createResetToken() {
  return randomToken(32);
}
