-- AuraLeve catalog seed data.
-- Safe to run multiple times; it preserves IDs and upserts catalog rows.
insert into public.categories (id, name, slug, description, created_at, updated_at)
values
  ('32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'Japamalas', 'japamalas', 'Japamalas de 108 contas', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('b3eabc5e-93eb-4153-aa33-9c9525ce91ec'::uuid, 'Pulseiras', 'pulseiras', 'Pulseiras energéticas', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('dc6e658c-d43c-4af8-a209-cfc765b48bb1'::uuid, 'Colares', 'colares', 'Colares espirituais', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = excluded.updated_at;
insert into public.energies (id, name, slug, description, created_at, updated_at)
values
  ('df490499-cd7a-4ee6-b861-e3f5ef840b02'::uuid, 'Proteção', 'protecao', 'Escudo energético', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('11f27be5-7982-402f-9c35-defe50bd4fe2'::uuid, 'Amor', 'amor', 'Cura emocional e amor próprio', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('e0e5ab90-f360-4e9e-9512-500f7eff4e68'::uuid, 'Prosperidade', 'prosperidade', 'Abundância e fluxo', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('ef4df7d7-56ab-4232-890b-8a9d04ce14cc'::uuid, 'Intuição', 'intuicao', 'Conexão com o divino', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('22054f43-7c9d-4bd8-92c9-79b0f04bde63'::uuid, 'Equilíbrio', 'equilibrio', 'Harmonia dos chakras', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('9c6e92b5-850e-46d1-8e65-ebbf2fffed0a'::uuid, 'Sabedoria', 'sabedoria', 'Clareza e foco', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = excluded.updated_at;

insert into public.subcategories (id, category_id, name, slug, created_at, updated_at)
values
  ('ea879a32-c5c3-45e9-bba0-9ac31fefc064'::uuid, '32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'Pedras naturais', 'pedras-naturais', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('246da533-809f-457c-aa9d-f07048a2479f'::uuid, '32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'Madeiras sagradas', 'madeiras-sagradas', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('cfd0be95-f462-4ad2-acbe-4ad6ae481bf5'::uuid, 'b3eabc5e-93eb-4153-aa33-9c9525ce91ec'::uuid, 'Quartzo', 'quartzo', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz),
  ('b18b1f9a-6ab4-4939-b04c-7fbdab31497f'::uuid, 'dc6e658c-d43c-4af8-a209-cfc765b48bb1'::uuid, 'Devocionais', 'devocionais', '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:01.401681+00:00'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  slug = excluded.slug,
  updated_at = excluded.updated_at;

insert into public.products (id, name, slug, description, price, discount_percent, image, category_id, subcategory_id, stock, featured, promo, created_at, updated_at)
values
  ('80612fad-7401-4812-9baa-9183a2e5a116'::uuid, 'Colar Lápis-Lazúli Devocional', 'colar-lapis-lazuli-devocional', 'Colar de lápis-lazúli — pedra da verdade interior, intuição e expressão. Pendant em prata.', 199, 0, '/products/product-lapis.jpg', 'dc6e658c-d43c-4af8-a209-cfc765b48bb1'::uuid, 'b18b1f9a-6ab4-4939-b04c-7fbdab31497f'::uuid, 7, true, false, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-13T12:27:17.825924+00:00'::timestamptz),
  ('1a776fe1-4f43-4976-bbf4-b15192ec7d6c'::uuid, 'Japamala Ametista Sagrada', 'japamala-ametista-sagrada', 'Mala artesanal de 108 contas em ametista natural, fio de seda roxa e guru bead em prata. A ametista acalma a mente, eleva a vibração e aprofunda a meditação.', 289, 15, '/products/product-amethyst.jpg', '32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'ea879a32-c5c3-45e9-bba0-9ac31fefc064'::uuid, 7, true, true, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-14T03:38:40.14541+00:00'::timestamptz),
  ('9deeaf90-d210-4c37-bb8d-ac0cf5e11d8e'::uuid, 'Japamala Ônix Proteção', 'japamala-onix-protecao', 'Ônix negro com detalhes dourados — escudo energético poderoso. Indicado para quem busca proteção e firmeza.', 359, 0, '/products/product-onyx.jpg', '32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'ea879a32-c5c3-45e9-bba0-9ac31fefc064'::uuid, 2, true, false, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-15T14:11:37.437364+00:00'::timestamptz),
  ('79105c99-88a4-4467-9fb2-f20ff859eee8'::uuid, 'Pulseira Quartzo Rosa', 'pulseira-quartzo-rosa', 'Pulseira de quartzo rosa, a pedra do amor. Trabalha o coração, autoaceitação e relacionamentos harmoniosos.', 119, 20, '/products/product-rosequartz.jpg', 'b3eabc5e-93eb-4153-aa33-9c9525ce91ec'::uuid, 'cfd0be95-f462-4ad2-acbe-4ad6ae481bf5'::uuid, 21, true, true, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-16T12:49:29.302671+00:00'::timestamptz),
  ('2e759d95-3ba5-4b63-844a-a41c7972188a'::uuid, 'Japamala Aventurina Verde', 'japamala-aventurina-verde', 'Aventurina verde com sândalo. Pedra da prosperidade gentil, abre caminhos e equilibra o chakra cardíaco.', 269, 10, '/products/product-aventurine.jpg', '32435891-41bf-40bf-a7af-cbceed545870'::uuid, '246da533-809f-457c-aa9d-f07048a2479f'::uuid, 10, false, true, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-17T16:31:10.395472+00:00'::timestamptz),
  ('4ee9fc71-02c4-4e34-b95e-7c50e65b7d54'::uuid, 'Japamala Citrino Solar', 'japamala-citrino-solar', '108 contas de citrino e olho de tigre, condutoras de prosperidade e força criativa. Tassel artesanal em laranja queimado.', 329, 0, '/products/product-citrine.jpg', '32435891-41bf-40bf-a7af-cbceed545870'::uuid, 'ea879a32-c5c3-45e9-bba0-9ac31fefc064'::uuid, 2, true, false, '2026-05-13T12:27:01.401681+00:00'::timestamptz, '2026-05-17T18:07:10.313847+00:00'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  price = excluded.price,
  discount_percent = excluded.discount_percent,
  image = excluded.image,
  category_id = excluded.category_id,
  subcategory_id = excluded.subcategory_id,
  stock = excluded.stock,
  featured = excluded.featured,
  promo = excluded.promo,
  updated_at = excluded.updated_at;

insert into public.product_energies (product_id, energy_id)
values
  ('9deeaf90-d210-4c37-bb8d-ac0cf5e11d8e'::uuid, 'df490499-cd7a-4ee6-b861-e3f5ef840b02'::uuid),
  ('79105c99-88a4-4467-9fb2-f20ff859eee8'::uuid, '11f27be5-7982-402f-9c35-defe50bd4fe2'::uuid),
  ('2e759d95-3ba5-4b63-844a-a41c7972188a'::uuid, 'e0e5ab90-f360-4e9e-9512-500f7eff4e68'::uuid),
  ('4ee9fc71-02c4-4e34-b95e-7c50e65b7d54'::uuid, 'e0e5ab90-f360-4e9e-9512-500f7eff4e68'::uuid),
  ('80612fad-7401-4812-9baa-9183a2e5a116'::uuid, 'ef4df7d7-56ab-4232-890b-8a9d04ce14cc'::uuid),
  ('1a776fe1-4f43-4976-bbf4-b15192ec7d6c'::uuid, 'ef4df7d7-56ab-4232-890b-8a9d04ce14cc'::uuid),
  ('2e759d95-3ba5-4b63-844a-a41c7972188a'::uuid, '22054f43-7c9d-4bd8-92c9-79b0f04bde63'::uuid),
  ('1a776fe1-4f43-4976-bbf4-b15192ec7d6c'::uuid, '22054f43-7c9d-4bd8-92c9-79b0f04bde63'::uuid),
  ('80612fad-7401-4812-9baa-9183a2e5a116'::uuid, '9c6e92b5-850e-46d1-8e65-ebbf2fffed0a'::uuid),
  ('4ee9fc71-02c4-4e34-b95e-7c50e65b7d54'::uuid, '9c6e92b5-850e-46d1-8e65-ebbf2fffed0a'::uuid)
on conflict (product_id, energy_id) do nothing;

insert into public.coupons (id, code, type, value, min_order_total, starts_at, expires_at, max_uses, uses_count, one_per_customer, active, created_at, updated_at)
values
  ('604c0a2c-5388-434d-82c6-313d3ce43548'::uuid, 'AURA10', 'percent'::public.coupon_type, 10, 0, null, null, null, 0, true, true, '2026-05-14T14:34:10.058076+00:00'::timestamptz, '2026-05-14T14:34:10.058076+00:00'::timestamptz)
on conflict (id) do update set
  code = excluded.code,
  type = excluded.type,
  value = excluded.value,
  min_order_total = excluded.min_order_total,
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  max_uses = excluded.max_uses,
  uses_count = excluded.uses_count,
  one_per_customer = excluded.one_per_customer,
  active = excluded.active,
  updated_at = excluded.updated_at;
