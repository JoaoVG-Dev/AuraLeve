import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const resetRequestSchema = z.object({
  email: z.string().trim().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(300),
  password: z.string().min(8).max(72),
});

export const getCurrentAuthUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  return getCurrentUser();
});

export const getCurrentUserAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  return { isAdmin: user?.role === "admin" };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { loginWithPassword } = await import("@/lib/auth/auth.server");
    return loginWithPassword(data);
  });

export const signup = createServerFn({ method: "POST" })
  .inputValidator((data) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const { registerCustomer } = await import("@/lib/auth/auth.server");
    return registerCustomer(data);
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { destroyCurrentSession } = await import("@/lib/auth/session.server");
  await destroyCurrentSession();
  return { ok: true };
});

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data) => resetRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { createPasswordReset } = await import("@/lib/auth/auth.server");
    return createPasswordReset(data);
  });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((data) => resetPasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const { resetPasswordWithToken } = await import("@/lib/auth/auth.server");
    await resetPasswordWithToken(data);
    return { ok: true };
  });
