import { createFileRoute } from "@tanstack/react-router";
import {
  handleMercadoPagoWebhook,
  mercadoPagoWebhookMethodNotAllowed,
} from "@/lib/mp-webhook.server";

// Mercado Pago webhook receiver. Configure this URL in your MP application:
//   https://<your-domain>/api/public/mp-webhook
export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      GET: async () => mercadoPagoWebhookMethodNotAllowed(),
      POST: async ({ request }) => handleMercadoPagoWebhook(request),
    },
  },
});
