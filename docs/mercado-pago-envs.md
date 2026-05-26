# Mercado Pago - variaveis de ambiente

## Obrigatorias

- `SUPABASE_URL` - URL do projeto Supabase.
- `SUPABASE_PUBLISHABLE_KEY` - chave publica usada pelo app e pelas server functions autenticadas.
- `SUPABASE_SERVICE_ROLE_KEY` - chave server-side para operacoes administrativas seguras.
- `MP_ACCESS_TOKEN` - token privado do Mercado Pago. Nunca deve ir para o frontend.
- `MP_PUBLIC_KEY` - chave publica usada para inicializar o SDK Mercado Pago v2 no checkout.
- `MP_WEBHOOK_SECRET` - segredo do webhook, usado para validar a assinatura oficial `x-signature`.
- `MP_WEBHOOK_URL` - opcional. Se ausente, o backend monta a URL pela origem atual.

## Sandbox x producao

- Sandbox: `MP_PUBLIC_KEY` e `MP_ACCESS_TOKEN` precisam comecar com `TEST-`.
- Producao: `MP_PUBLIC_KEY` e `MP_ACCESS_TOKEN` precisam comecar com `APP_USR-`.
- Nunca misture `MP_PUBLIC_KEY=TEST-...` com `MP_ACCESS_TOKEN=APP_USR-...`.
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

- Local: arquivo `.env` na raiz do projeto.
- Deploy/Cloudflare: configurar as variaveis em Secrets/Environment Variables do projeto publicado.
- Mercado Pago Developers: configurar a URL do webhook na aplicacao Mercado Pago e copiar o segredo de assinatura para `MP_WEBHOOK_SECRET`.

## Regras de seguranca

- O frontend nunca recebe `MP_ACCESS_TOKEN`.
- O frontend recebe apenas `MP_PUBLIC_KEY`.
- O frontend nunca marca pedido como `paid`.
- Pedido so muda para `paid` no backend, apos confirmacao consultada no Mercado Pago por webhook ou polling autenticado.
- Webhooks repetidos sao idempotentes e nao devem rebaixar pedido `paid` para `pending`.
- O checkout consulta a disponibilidade Pix antes de criar pedido; se Pix estiver indisponivel, o cliente deve usar cartao ou tentar mais tarde.
- Dados brutos de cartao e CVV nunca devem ser salvos nem logados.
- Totais e estoque continuam sendo recalculados/validados no backend pelo RPC server-only `place_order_for_user`.
