import { createMiddleware } from "@tanstack/react-start";
import { getCurrentUser } from "./auth.server";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Response("Forbidden", { status: 403 });
  return user;
}

export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await requireUser();
  return next({
    context: {
      user,
      userId: user.id,
    },
  });
});
