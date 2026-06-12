import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function requireCurrentUserId() {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Autenticacao necessaria");
  return user.id;
}

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireCurrentUserId();
  const { getProfile } = await import("@/lib/repositories/profiles.server");
  return getProfile(userId);
});

export const saveMyProfile = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().trim().max(100),
        phone: z.string().trim().max(20),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { upsertProfile } = await import("@/lib/repositories/profiles.server");
    return upsertProfile({
      userId,
      fullName: data.fullName,
      phone: data.phone,
    });
  });
