import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const idSchema = z.object({ id: z.string().uuid() });

const categorySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
});

const subcategorySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160),
  categoryId: z.string().uuid(),
});

const energySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  price: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100),
  image: z.string().max(500),
  categoryId: z.string().uuid().nullable(),
  subcategoryId: z.string().uuid().nullable(),
  energyIds: z.array(z.string().uuid()).max(20),
  stock: z.number().int().nonnegative(),
  featured: z.boolean(),
  promo: z.boolean(),
  createdAt: z.string(),
  isNew: z.boolean().optional(),
});

const couponSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  code: z.string().trim().min(1).max(40),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrderTotal: z.number().nonnegative().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  onePerCustomer: z.boolean().optional(),
  active: z.boolean().optional(),
});

async function requireCurrentUserId() {
  const { getCurrentUser } = await import("@/lib/auth/auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Autenticacao necessaria");
  return user.id;
}

async function requireCurrentAdminUserId() {
  const userId = await requireCurrentUserId();
  const { assertAdmin } = await import("@/lib/repositories/admin.server");
  await assertAdmin(userId);
  return userId;
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { listCategories } = await import("@/lib/repositories/catalog.server");
  return listCategories();
});

export const getSubcategories = createServerFn({ method: "GET" }).handler(async () => {
  const { listSubcategories } = await import("@/lib/repositories/catalog.server");
  return listSubcategories();
});

export const getEnergies = createServerFn({ method: "GET" }).handler(async () => {
  const { listEnergies } = await import("@/lib/repositories/catalog.server");
  return listEnergies();
});

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { listProducts } = await import("@/lib/repositories/catalog.server");
  return listProducts();
});

export const getCoupons = createServerFn({ method: "GET" }).handler(async () => {
  await requireCurrentAdminUserId();
  const { listCoupons } = await import("@/lib/repositories/catalog.server");
  return listCoupons();
});

export const saveCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((data) => categorySchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { saveCategory } = await import("@/lib/repositories/catalog.server");
    await saveCategory(data);
    return { ok: true };
  });

export const deleteCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { deleteCategory } = await import("@/lib/repositories/catalog.server");
    await deleteCategory(data.id);
    return { ok: true };
  });

export const saveSubcategoryFn = createServerFn({ method: "POST" })
  .inputValidator((data) => subcategorySchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { saveSubcategory } = await import("@/lib/repositories/catalog.server");
    await saveSubcategory(data);
    return { ok: true };
  });

export const deleteSubcategoryFn = createServerFn({ method: "POST" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { deleteSubcategory } = await import("@/lib/repositories/catalog.server");
    await deleteSubcategory(data.id);
    return { ok: true };
  });

export const saveEnergyFn = createServerFn({ method: "POST" })
  .inputValidator((data) => energySchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { saveEnergy } = await import("@/lib/repositories/catalog.server");
    await saveEnergy(data);
    return { ok: true };
  });

export const deleteEnergyFn = createServerFn({ method: "POST" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { deleteEnergy } = await import("@/lib/repositories/catalog.server");
    await deleteEnergy(data.id);
    return { ok: true };
  });

export const saveProductFn = createServerFn({ method: "POST" })
  .inputValidator((data) => productSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { saveProduct } = await import("@/lib/repositories/catalog.server");
    await saveProduct(data);
    return { ok: true };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { deleteProduct } = await import("@/lib/repositories/catalog.server");
    await deleteProduct(data.id);
    return { ok: true };
  });

export const saveCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data) => couponSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { saveCoupon } = await import("@/lib/repositories/catalog.server");
    await saveCoupon(data);
    return { ok: true };
  });

export const deleteCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ data }) => {
    await requireCurrentAdminUserId();
    const { deleteCoupon } = await import("@/lib/repositories/catalog.server");
    await deleteCoupon(data.id);
    return { ok: true };
  });

export const validateCouponFn = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ code: z.string().max(40), subtotal: z.number().nonnegative() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { validateCoupon } = await import("@/lib/repositories/catalog.server");
    return validateCoupon(data.code, data.subtotal);
  });

export const getMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireCurrentUserId();
  const { listOrdersForUser } = await import("@/lib/repositories/orders.server");
  return listOrdersForUser(userId);
});

export const getAllOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireCurrentAdminUserId();
  const { listAllOrders } = await import("@/lib/repositories/orders.server");
  return listAllOrders();
});

export const getOrderDetailFn = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const userId = await requireCurrentUserId();
    const { isAdmin } = await import("@/lib/repositories/admin.server");
    const { getOrderDetail } = await import("@/lib/repositories/orders.server");
    return getOrderDetail({
      orderId: data.orderId,
      userId,
      admin: await isAdmin(userId),
    });
  });
