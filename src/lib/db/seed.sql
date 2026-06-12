insert into public.categories (id, name, slug, description)
values
  ('32435891-41bf-40bf-a7af-cbceed545870', 'Japamalas', 'japamalas', 'Japamalas de 108 contas'),
  ('b3eabc5e-93eb-4153-aa33-9c9525ce91ec', 'Pulseiras', 'pulseiras', 'Pulseiras energeticas'),
  ('dc6e658c-d43c-4af8-a209-cfc765b48bb1', 'Colares', 'colares', 'Colares espirituais')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();

insert into public.energies (id, name, slug, description)
values
  ('df490499-cd7a-4ee6-b861-e3f5ef840b02', 'Protecao', 'protecao', 'Escudo energetico'),
  ('11f27be5-7982-402f-9c35-defe50bd4fe2', 'Amor', 'amor', 'Cura emocional e amor proprio'),
  ('e0e5ab90-f360-4e9e-9512-500f7eff4e68', 'Prosperidade', 'prosperidade', 'Abundancia e fluxo'),
  ('ef4df7d7-56ab-4232-890b-8a9d04ce14cc', 'Intuicao', 'intuicao', 'Conexao com o divino'),
  ('22054f43-7c9d-4bd8-92c9-79b0f04bde63', 'Equilibrio', 'equilibrio', 'Harmonia dos chakras'),
  ('9c6e92b5-850e-46d1-8e65-ebbf2fffed0a', 'Sabedoria', 'sabedoria', 'Clareza e foco')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  updated_at = now();

insert into public.subcategories (id, category_id, name, slug)
values
  ('ea879a32-c5c3-45e9-bba0-9ac31fefc064', '32435891-41bf-40bf-a7af-cbceed545870', 'Pedras naturais', 'pedras-naturais'),
  ('246da533-809f-457c-aa9d-f07048a2479f', '32435891-41bf-40bf-a7af-cbceed545870', 'Madeiras sagradas', 'madeiras-sagradas'),
  ('cfd0be95-f462-4ad2-acbe-4ad6ae481bf5', 'b3eabc5e-93eb-4153-aa33-9c9525ce91ec', 'Quartzo', 'quartzo'),
  ('b18b1f9a-6ab4-4939-b04c-7fbdab31497f', 'dc6e658c-d43c-4af8-a209-cfc765b48bb1', 'Devocionais', 'devocionais')
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  slug = excluded.slug,
  updated_at = now();

insert into public.products (
  id,
  name,
  slug,
  description,
  price,
  discount_percent,
  image,
  category_id,
  subcategory_id,
  stock,
  featured,
  promo
)
values
  (
    '80612fad-7401-4812-9baa-9183a2e5a116',
    'Colar Lapis-Lazuli Devocional',
    'colar-lapis-lazuli-devocional',
    'Colar de lapis-lazuli com pingente em prata, criado para intuicao e expressao.',
    199,
    0,
    '/products/product-lapis.jpg',
    'dc6e658c-d43c-4af8-a209-cfc765b48bb1',
    'b18b1f9a-6ab4-4939-b04c-7fbdab31497f',
    7,
    true,
    false
  ),
  (
    '1a776fe1-4f43-4976-bbf4-b15192ec7d6c',
    'Japamala Ametista Sagrada',
    'japamala-ametista-sagrada',
    'Mala artesanal de 108 contas em ametista natural, fio de seda roxa e guru bead em prata.',
    289,
    15,
    '/products/product-amethyst.jpg',
    '32435891-41bf-40bf-a7af-cbceed545870',
    'ea879a32-c5c3-45e9-bba0-9ac31fefc064',
    7,
    true,
    true
  ),
  (
    '9deeaf90-d210-4c37-bb8d-ac0cf5e11d8e',
    'Japamala Onix Protecao',
    'japamala-onix-protecao',
    'Onix negro com detalhes dourados, indicado para protecao e firmeza.',
    359,
    0,
    '/products/product-onyx.jpg',
    '32435891-41bf-40bf-a7af-cbceed545870',
    'ea879a32-c5c3-45e9-bba0-9ac31fefc064',
    2,
    true,
    false
  ),
  (
    '79105c99-88a4-4467-9fb2-f20ff859eee8',
    'Pulseira Quartzo Rosa',
    'pulseira-quartzo-rosa',
    'Pulseira de quartzo rosa, pedra ligada ao amor proprio e ao cuidado emocional.',
    119,
    20,
    '/products/product-rosequartz.jpg',
    'b3eabc5e-93eb-4153-aa33-9c9525ce91ec',
    'cfd0be95-f462-4ad2-acbe-4ad6ae481bf5',
    21,
    true,
    true
  ),
  (
    '2e759d95-3ba5-4b63-844a-a41c7972188a',
    'Japamala Aventurina Verde',
    'japamala-aventurina-verde',
    'Aventurina verde com sandalo, criada para prosperidade gentil e equilibrio.',
    269,
    10,
    '/products/product-aventurine.jpg',
    '32435891-41bf-40bf-a7af-cbceed545870',
    '246da533-809f-457c-aa9d-f07048a2479f',
    10,
    false,
    true
  ),
  (
    '4ee9fc71-02c4-4e34-b95e-7c50e65b7d54',
    'Japamala Citrino Solar',
    'japamala-citrino-solar',
    '108 contas de citrino e olho de tigre para prosperidade e forca criativa.',
    329,
    0,
    '/products/product-citrine.jpg',
    '32435891-41bf-40bf-a7af-cbceed545870',
    'ea879a32-c5c3-45e9-bba0-9ac31fefc064',
    2,
    true,
    false
  )
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
  updated_at = now();

insert into public.product_energies (product_id, energy_id)
values
  ('9deeaf90-d210-4c37-bb8d-ac0cf5e11d8e', 'df490499-cd7a-4ee6-b861-e3f5ef840b02'),
  ('79105c99-88a4-4467-9fb2-f20ff859eee8', '11f27be5-7982-402f-9c35-defe50bd4fe2'),
  ('2e759d95-3ba5-4b63-844a-a41c7972188a', 'e0e5ab90-f360-4e9e-9512-500f7eff4e68'),
  ('4ee9fc71-02c4-4e34-b95e-7c50e65b7d54', 'e0e5ab90-f360-4e9e-9512-500f7eff4e68'),
  ('80612fad-7401-4812-9baa-9183a2e5a116', 'ef4df7d7-56ab-4232-890b-8a9d04ce14cc'),
  ('1a776fe1-4f43-4976-bbf4-b15192ec7d6c', 'ef4df7d7-56ab-4232-890b-8a9d04ce14cc'),
  ('2e759d95-3ba5-4b63-844a-a41c7972188a', '22054f43-7c9d-4bd8-92c9-79b0f04bde63'),
  ('1a776fe1-4f43-4976-bbf4-b15192ec7d6c', '22054f43-7c9d-4bd8-92c9-79b0f04bde63'),
  ('80612fad-7401-4812-9baa-9183a2e5a116', '9c6e92b5-850e-46d1-8e65-ebbf2fffed0a'),
  ('4ee9fc71-02c4-4e34-b95e-7c50e65b7d54', '9c6e92b5-850e-46d1-8e65-ebbf2fffed0a')
on conflict (product_id, energy_id) do nothing;

insert into public.coupons (
  id,
  code,
  type,
  value,
  min_order_total,
  starts_at,
  expires_at,
  max_uses,
  uses_count,
  one_per_customer,
  active
)
values (
  '604c0a2c-5388-434d-82c6-313d3ce43548',
  'AURA10',
  'percent',
  10,
  0,
  null,
  null,
  null,
  0,
  true,
  true
)
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
  updated_at = now();

insert into public.users (
  id,
  email,
  password_hash,
  full_name,
  phone,
  role,
  disabled_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  'cliente@example.com',
  'seed-disabled',
  'Cliente Exemplo',
  '11999999999',
  'customer',
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  updated_at = now();

insert into public.orders (
  id,
  user_id,
  status,
  payment_status,
  payment_method,
  payment_provider,
  customer_name,
  customer_email,
  customer_phone,
  address_cep,
  address_line,
  address_number,
  address_city,
  address_state,
  subtotal,
  discount,
  shipping,
  total,
  coupon_id,
  coupon_code
)
values (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  'paid',
  'paid',
  'pix',
  'mercado_pago',
  'Cliente Exemplo',
  'cliente@example.com',
  '11999999999',
  '01001000',
  'Praca da Se',
  '100',
  'Sao Paulo',
  'SP',
  95.20,
  9.52,
  0,
  85.68,
  '604c0a2c-5388-434d-82c6-313d3ce43548',
  'AURA10'
)
on conflict (id) do update set
  status = excluded.status,
  payment_status = excluded.payment_status,
  payment_method = excluded.payment_method,
  payment_provider = excluded.payment_provider,
  updated_at = now();

insert into public.order_items (
  id,
  order_id,
  product_id,
  product_name,
  product_image,
  unit_price,
  quantity,
  subtotal
)
values (
  '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333',
  '79105c99-88a4-4467-9fb2-f20ff859eee8',
  'Pulseira Quartzo Rosa',
  '/products/product-rosequartz.jpg',
  95.20,
  1,
  95.20
)
on conflict (id) do update set
  product_name = excluded.product_name,
  product_image = excluded.product_image,
  unit_price = excluded.unit_price,
  quantity = excluded.quantity,
  subtotal = excluded.subtotal;
