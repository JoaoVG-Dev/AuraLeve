<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\MercadoPagoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

class MercadoPagoReturnController extends Controller
{
    public function success(Request $request, Order $order, MercadoPagoService $mercadoPago): RedirectResponse
    {
        $this->syncPayment($request, $mercadoPago);

        return to_route('orders.show', ['order' => $order->external_reference])
            ->with('status', 'payment_success');
    }

    public function failure(Request $request, Order $order, MercadoPagoService $mercadoPago): RedirectResponse
    {
        $this->syncPayment($request, $mercadoPago);

        return to_route('orders.show', ['order' => $order->external_reference])
            ->with('status', 'payment_failure');
    }

    public function pending(Request $request, Order $order, MercadoPagoService $mercadoPago): RedirectResponse
    {
        $this->syncPayment($request, $mercadoPago);

        return to_route('orders.show', ['order' => $order->external_reference])
            ->with('status', 'payment_pending');
    }

    protected function syncPayment(Request $request, MercadoPagoService $mercadoPago): void
    {
        $paymentId = $request->query('payment_id');

        if (! is_numeric($paymentId)) {
            return;
        }

        try {
            $mercadoPago->syncPayment((int) $paymentId);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
