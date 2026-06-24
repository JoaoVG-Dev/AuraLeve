import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const favoriteSchema = z.object({
  productId: z.string().uuid(),
});

async function requireCurrentUserId() {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Autenticacao necessaria");
  return user.id;
}

export const getFavoriteProductIdsFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireCurrentUserId();
  const { listFavoriteProductIds } = await import("@/lib/repositories/favorites.server");
  return listFavoriteProductIds(userId);
});

export const getFavoriteProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireCurrentUserId();
  const { listFavoriteProducts } = await import("@/lib/repositories/favorites.server");
  return listFavoriteProducts(userId);
});

export const addFavoriteProductFn = createServerFn({ method: "POST" })
  .inputValidator((data) => favoriteSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { addFavoriteProduct } = await import("@/lib/repositories/favorites.server");
    await addFavoriteProduct(userId, data.productId);
    return { ok: true };
  });

export const removeFavoriteProductFn = createServerFn({ method: "POST" })
  .inputValidator((data) => favoriteSchema.parse(data))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { removeFavoriteProduct } = await import("@/lib/repositories/favorites.server");
    await removeFavoriteProduct(userId, data.productId);
    return { ok: true };
  });
