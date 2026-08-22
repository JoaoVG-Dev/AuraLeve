<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\ProductResource;
use App\Models\Order;
use App\Models\Product;
use App\Services\MercadoPagoService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class OrderController extends Controller
{
    /**
     * Create an order and redirect to Mercado Pago Checkout Pro.
     */
    public function store(StoreOrderRequest $request, MercadoPagoService $mercadoPago): SymfonyResponse
    {
        if ((string) config('mercadopago.access_token') === '') {
            throw ValidationException::withMessages([
                'payment' => 'Configure MERCADO_PAGO_ACCESS_TOKEN no .env antes de finalizar pedidos.',
            ]);
        }

        $order = $this->createPendingOrder($request);

        try {
            $preference = $mercadoPago->createCheckoutPreference($order);
            $checkoutUrl = $mercadoPago->checkoutUrl($preference);
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'payment' => 'Não foi possível abrir o checkout do Mercado Pago. Confira as chaves no .env e tente novamente.',
            ]);
        }

        if ($checkoutUrl === '') {
            throw ValidationException::withMessages([
                'payment' => 'O Mercado Pago não retornou uma URL de checkout válida.',
            ]);
        }

        return Inertia::location($checkoutUrl);
    }

    /**
     * Show the order confirmation/status page.
     */
    public function show(Request $request, Order $order): Response
    {
        $this->authorizeOrderAccess($request, $order);

        $products = Product::query()
            ->where('active', true)
            ->get()
            ->sortBy(fn (Product $product): int => $this->catalogPosition($product->slug))
            ->values();

        return Inertia::render('checkout', [
            'products' => ProductResource::collection($products)->resolve(),
            'confirmedOrder' => $this->confirmedOrder($order),
        ]);
    }

    protected function createPendingOrder(StoreOrderRequest $request): Order
    {
        $validated = $request->validated();
        $requestedItems = collect($request->orderItems())
            ->groupBy('id')
            ->map(fn (Collection $rows): int => (int) $rows->sum('qty'));

        return DB::transaction(function () use ($request, $validated, $requestedItems): Order {
            $products = Product::query()
                ->whereIn('slug', $requestedItems->keys())
                ->where('active', true)
                ->lockForUpdate()
                ->get()
                ->keyBy('slug');

            if ($products->count() !== $requestedItems->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Um dos produtos do carrinho não está disponível.',
                ]);
            }

            $subtotal = 0.0;

            foreach ($requestedItems as $slug => $quantity) {
                $product = $products->get($slug);

                if ($product->stock < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name} tem apenas {$product->stock} unidade(s) em estoque.",
                    ]);
                }

                $subtotal += round((float) $product->price * $quantity, 2);
            }

            $shipping = config("auraleve.shipping_methods.{$validated['shipping_method']}");
            $shippingAmount = (float) $shipping['amount'];
            $discount = $validated['payment_method'] === 'pix'
                ? round($subtotal * 0.05, 2)
                : 0.0;
            $total = max(0, round($subtotal - $discount + $shippingAmount, 2));

            $order = Order::query()->create([
                'user_id' => $request->user()->id,
                'order_number' => $this->nextOrderNumber(),
                'external_reference' => (string) Str::uuid(),
                'status' => Order::STATUS_PENDING_PAYMENT,
                'payment_status' => 'pending',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_amount' => $shippingAmount,
                'total' => $total,
                'shipping_method' => $validated['shipping_method'],
                'shipping_eta' => $shipping['eta'],
                'payment_method' => $validated['payment_method'],
                'customer_name' => trim($validated['nome']),
                'customer_email' => strtolower(trim($validated['email'])),
                'customer_phone' => $request->digits($validated['whats']),
                'customer_cpf' => $request->digits($validated['cpf']),
                'shipping_address' => [
                    'cep' => $request->digits($validated['cep']),
                    'street' => trim($validated['rua']),
                    'neighborhood' => trim((string) ($validated['bairro'] ?? '')),
                    'city' => trim($validated['cidade']),
                ],
                'gift_wrap' => (bool) $validated['gift_wrap'],
                'gift_message' => $validated['gift_message'] ?? null,
            ]);

            foreach ($requestedItems as $slug => $quantity) {
                $product = $products->get($slug);

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'total' => round((float) $product->price * $quantity, 2),
                    'metadata' => [
                        'stone' => $product->stone,
                        'category' => $product->category,
                    ],
                ]);
            }

            return $order->load('items');
        });
    }

    protected function nextOrderNumber(): string
    {
        do {
            $number = 'AL-'.now()->format('ymd').'-'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (Order::query()->where('order_number', $number)->exists());

        return $number;
    }

    protected function catalogPosition(string $slug): int
    {
        $index = array_search($slug, ['p6', 'p1', 'p3', 'p4', 'p2', 'p5'], true);

        return $index === false ? 99 : $index;
    }

    protected function authorizeOrderAccess(Request $request, Order $order): void
    {
        abort_unless(
            $request->user()?->id === $order->user_id || ($request->user()?->can('access-admin') ?? false),
            403,
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function confirmedOrder(Order $order): array
    {
        $shipping = config("auraleve.shipping_methods.{$order->shipping_method}", []);
        $address = $order->shipping_address ?? [];
        $cep = (string) data_get($address, 'cep', '');

        return [
            'orderNumber' => $order->order_number,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'total' => (float) $order->total,
            'payName' => match ($order->payment_method) {
                'cartao' => 'Cartão de crédito',
                'boleto' => 'Boleto bancário',
                default => 'Pix',
            },
            'ship' => ($shipping['label'] ?? strtoupper($order->shipping_method)).' · '.($shipping['eta'] ?? $order->shipping_eta),
            'address' => [
                'line1' => (string) data_get($address, 'street', ''),
                'line2' => (string) data_get($address, 'neighborhood', ''),
                'line3' => trim((string) data_get($address, 'city', '').($cep !== '' ? " · {$cep}" : '')),
            ],
        ];
    }
}
