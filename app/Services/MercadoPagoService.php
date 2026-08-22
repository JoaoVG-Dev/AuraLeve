<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Resources\Preference;
use MercadoPago\Webhook\WebhookSignatureValidator;
use RuntimeException;

class MercadoPagoService
{
    public function createCheckoutPreference(Order $order): Preference
    {
        $this->configure();

        $preference = (new PreferenceClient)->create(
            $this->preferencePayload($order),
            $this->requestOptions($order->external_reference),
        );

        $order->forceFill([
            'mercado_pago_preference_id' => $preference->id,
        ])->save();

        return $preference;
    }

    public function checkoutUrl(Preference $preference): string
    {
        if (config('mercadopago.environment') === 'production') {
            return $preference->init_point ?? '';
        }

        return $preference->sandbox_init_point ?? $preference->init_point ?? '';
    }

    public function syncPayment(int $paymentId): ?Order
    {
        $this->configure();

        $payment = (new PaymentClient)->get($paymentId);

        if (! $payment->external_reference) {
            Log::warning('Mercado Pago payment without external_reference.', [
                'payment_id' => $paymentId,
            ]);

            return null;
        }

        return DB::transaction(function () use ($payment, $paymentId): ?Order {
            $order = Order::query()
                ->where('external_reference', $payment->external_reference)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                Log::warning('Mercado Pago payment for unknown order.', [
                    'payment_id' => $paymentId,
                    'external_reference' => $payment->external_reference,
                ]);

                return null;
            }

            $wasUnpaid = $order->paid_at === null;
            $status = (string) ($payment->status ?? 'unknown');

            $order->forceFill([
                'payment_status' => $status,
                'mercado_pago_payment_id' => (string) ($payment->id ?? $paymentId),
                'mercado_pago_status_detail' => $payment->status_detail,
                'status' => $this->orderStatusForPayment($order, $status),
                'paid_at' => $status === 'approved' ? ($order->paid_at ?? now()) : $order->paid_at,
            ])->save();

            if ($status === 'approved' && $wasUnpaid) {
                $this->decrementStock($order);
            }

            return $order;
        });
    }

    /**
     * Validate Mercado Pago webhook headers before processing the payload.
     */
    public function validateWebhook(Request $request): void
    {
        $secret = (string) config('mercadopago.webhook_secret');

        if ($secret === '') {
            throw new RuntimeException('Mercado Pago webhook secret is not configured.');
        }

        WebhookSignatureValidator::validate(
            $request->header('x-signature'),
            $request->header('x-request-id'),
            $this->webhookDataId($request),
            $secret,
            300,
        );
    }

    public function webhookDataId(Request $request): ?string
    {
        return $request->query('data.id')
            ?? data_get($request->input('data'), 'id')
            ?? $request->query('id');
    }

    protected function configure(): void
    {
        $accessToken = (string) config('mercadopago.access_token');

        if ($accessToken === '') {
            throw new RuntimeException('MERCADO_PAGO_ACCESS_TOKEN is not configured.');
        }

        MercadoPagoConfig::setAccessToken($accessToken);
        MercadoPagoConfig::setRuntimeEnviroment(app()->isLocal()
            ? MercadoPagoConfig::LOCAL
            : MercadoPagoConfig::SERVER);
    }

    /**
     * @return array<string, mixed>
     */
    protected function preferencePayload(Order $order): array
    {
        $order->loadMissing('items');

        $payload = [
            'items' => [
                [
                    'id' => $order->order_number,
                    'title' => "Pedido AuraLeve {$order->order_number}",
                    'description' => $order->items->map(fn ($item) => "{$item->quantity}x {$item->product_name}")->join(', '),
                    'quantity' => 1,
                    'currency_id' => 'BRL',
                    'unit_price' => (float) $order->total,
                ],
            ],
            'payer' => [
                'name' => $order->customer_name,
                'email' => $order->customer_email,
                'phone' => [
                    'number' => $order->customer_phone,
                ],
                'identification' => [
                    'type' => 'CPF',
                    'number' => $order->customer_cpf,
                ],
                'address' => [
                    'zip_code' => data_get($order->shipping_address, 'cep'),
                    'street_name' => data_get($order->shipping_address, 'street'),
                ],
            ],
            'payment_methods' => [
                'installments' => 6,
                'default_installments' => 1,
            ],
            'back_urls' => [
                'success' => route('mercado-pago.success', ['order' => $order->external_reference]),
                'failure' => route('mercado-pago.failure', ['order' => $order->external_reference]),
                'pending' => route('mercado-pago.pending', ['order' => $order->external_reference]),
            ],
            'auto_return' => 'approved',
            'external_reference' => $order->external_reference,
            'statement_descriptor' => config('mercadopago.statement_descriptor'),
            'metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'payment_method_selected' => $order->payment_method,
            ],
        ];

        $webhookUrl = $this->webhookUrl();

        if ($webhookUrl !== null) {
            $payload['notification_url'] = $webhookUrl;
        }

        return $payload;
    }

    protected function webhookUrl(): ?string
    {
        $url = config('mercadopago.webhook_url') ?: route('mercado-pago.webhook');

        return str_starts_with((string) $url, 'https://') ? (string) $url : null;
    }

    protected function requestOptions(string $idempotencyKey): RequestOptions
    {
        $options = new RequestOptions;
        $options->setCustomHeaders([
            'X-Idempotency-Key' => $idempotencyKey,
        ]);

        return $options;
    }

    protected function orderStatusForPayment(Order $order, string $paymentStatus): string
    {
        return match ($paymentStatus) {
            'approved' => $order->status === Order::STATUS_PENDING_PAYMENT
                ? Order::STATUS_PAID
                : $order->status,
            'cancelled', 'rejected', 'refunded', 'charged_back' => Order::STATUS_CANCELED,
            default => $order->status,
        };
    }

    protected function decrementStock(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            $product = Product::query()->lockForUpdate()->find($item->product_id);

            if ($product) {
                $product->forceFill([
                    'stock' => max(0, $product->stock - $item->quantity),
                ])->save();
            }
        }
    }
}
