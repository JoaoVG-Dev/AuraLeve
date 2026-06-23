# Deploy na Vercel

O projeto usa TanStack Start com Nitro. Quando a Vercel executa `npm run build`, o Nitro detecta o ambiente da plataforma e gera o artefato em `.vercel/output`.

## Build Settings

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: deixar em branco

## Environment Variables

Configure em **Settings > Environment Variables**:

- `DATABASE_URL`: connection string pooled do Neon.
- `AUTH_SECRET`: segredo forte usado para assinar as sessoes.
- `AUTH_COOKIE_NAME`: opcional; padrao `auraleve_session`.
- `VITE_MP_PUBLIC_KEY`: chave publica do Mercado Pago.
- `MERCADO_PAGO_ACCESS_TOKEN`: token privado do Mercado Pago.
- `MERCADO_PAGO_WEBHOOK_SECRET`: segredo de assinatura do webhook.
- `MERCADO_PAGO_WEBHOOK_URL`: `https://<dominio>/api/public/mp-webhook`.
- `PIX_AVAILABLE`: opcional.

Nao crie `VITE_DATABASE_URL`. `DIRECT_DATABASE_URL` e as variaveis `ADMIN_*` sao usadas apenas pelos scripts locais de migracao e seed.

## Depois do primeiro deploy

1. Abra a home e o catalogo para validar a leitura do Neon.
2. Entre em `/login` com o usuario administrador e valide `/admin`.
3. Configure no Mercado Pago o webhook `https://<dominio>/api/public/mp-webhook` para eventos de pagamento.
4. Um `GET` no webhook deve responder `405 Method Not Allowed`; o Mercado Pago envia `POST`.
