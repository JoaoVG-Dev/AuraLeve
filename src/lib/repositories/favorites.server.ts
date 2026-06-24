import { getDb } from "@/lib/db/client.server";
import { mapProduct } from "@/lib/repositories/catalog.server";
import type { Product } from "@/lib/types";

type FavoriteIdRow = { product_id: string };

export async function listFavoriteProductIds(userId: string) {
  const sql = getDb();
  const rows = await sql`
    select product_id
    from public.product_favorites
    where user_id = ${userId}::uuid
    order by created_at desc
  `;

  return rows.map((row) => (row as FavoriteIdRow).product_id);
}

export async function listFavoriteProducts(userId: string): Promise<Product[]> {
  const sql = getDb();
  const rows = await sql`
    select
      p.*,
      coalesce(
        (
          select jsonb_agg(jsonb_build_object('energy_id', pe.energy_id))
          from public.product_energies pe
          where pe.product_id = p.id
        ),
        '[]'::jsonb
      ) as product_energies
    from public.product_favorites pf
    join public.products p on p.id = pf.product_id
    where pf.user_id = ${userId}::uuid
    order by pf.created_at desc
  `;

  return rows.map((row) => mapProduct(row as Parameters<typeof mapProduct>[0]));
}

export async function addFavoriteProduct(userId: string, productId: string) {
  const sql = getDb();
  const productRows = await sql`
    select id
    from public.products
    where id = ${productId}::uuid
    limit 1
  `;

  if (!productRows[0]) throw new Error("Produto nao encontrado");

  await sql`
    insert into public.product_favorites (user_id, product_id)
    values (${userId}::uuid, ${productId}::uuid)
    on conflict (user_id, product_id) do nothing
  `;
}

export async function removeFavoriteProduct(userId: string, productId: string) {
  const sql = getDb();
  await sql`
    delete from public.product_favorites
    where user_id = ${userId}::uuid
      and product_id = ${productId}::uuid
  `;
}
