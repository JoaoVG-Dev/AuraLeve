# Mercado Pago - variaveis de ambiente

## Obrigatorias

- `DATABASE_URL` - connection string Neon usada pelas server functions.
- `AUTH_SECRET` - segredo server-only usado pela sessao propria do AuraLeve.
- `VITE_MP_PUBLIC_KEY` - chave publica usada para inicializar o SDK Mercado Pago v2 no checkout.
- `MERCADO_PAGO_ACCESS_TOKEN` - token privado do Mercado Pago. Nunca deve ir para o frontend.
- `MERCADO_PAGO_WEBHOOK_SECRET` - segredo do webhook, usado para validar a assinatura oficial `x-signature`.

## Opcionais

- `DIRECT_DATABASE_URL` - connection string direta do Neon para migrations e seeds locais.
- `AUTH_COOKIE_NAME` - nome do cookie HTTP-only. Padrao: `auraleve_session`.
- `MERCADO_PAGO_WEBHOOK_URL` - se ausente, o backend monta a URL pela origem atual.
- `PIX_AVAILABLE` - alterna a disponibilidade Pix exibida no checkout local.

## Sandbox x producao

- Sandbox: `VITE_MP_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` precisam comecar com `TEST-`.
- Producao: `VITE_MP_PUBLIC_KEY` e `MERCADO_PAGO_ACCESS_TOKEN` precisam comecar com `APP_USR-`.
- Nunca misture `VITE_MP_PUBLIC_KEY=TEST-...` com `MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...`.
- Quando houver mistura de ambientes, o checkout bloqueia antes de criar pedido ou pagamento.
- Logs mostram apenas se as chaves existem e o ambiente detectado (`sandbox` ou `production`), nunca os valores completos.

## Webhook

- Endpoint final: `https://<dominio-final>/api/public/mp-webhook`
- Metodo esperado: `POST`.
- `GET` deve responder `405 Method Not Allowed`.
- Configure a URL publica sem query string de segredo.
- O webhook valida a assinatura oficial Mercado Pago com headers `x-signature` e `x-request-id`.
- Query string/header com segredo continuam aceitos apenas como fallback para testes controlados.
- Eventos necessarios no Mercado Pago: `payment`/`payments`.

## Onde configurar

- Local: arquivo `.env.local` na raiz do projeto.
- Deploy/Vercel: configurar as variaveis em Settings > Environment Variables do projeto publicado.
- Mercado Pago Developers: configurar a URL do webhook na aplicacao Mercado Pago e copiar o segredo de assinatura para `MERCADO_PAGO_WEBHOOK_SECRET`.

## Regras de seguranca

- O frontend nunca recebe `MERCADO_PAGO_ACCESS_TOKEN`.
- O frontend recebe apenas `VITE_MP_PUBLIC_KEY`.
- O frontend nunca marca pedido como `paid`.
- Pedido so muda para `paid` no backend, apos confirmacao consultada no Mercado Pago por webhook ou polling autenticado.
- Webhooks repetidos sao idempotentes e nao devem rebaixar pedido `paid` para `pending`.
- O checkout consulta a disponibilidade Pix antes de criar pedido; se Pix estiver indisponivel, o cliente deve usar cartao ou tentar mais tarde.
- Dados brutos de cartao e CVV nunca devem ser salvos nem logados.
- Totais e estoque continuam sendo recalculados e validados no backend pelo RPC server-only `place_order_for_user`.
