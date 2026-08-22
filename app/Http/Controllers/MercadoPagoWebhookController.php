<?php

namespace App\Http\Controllers;

use App\Services\MercadoPagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MercadoPagoWebhookController extends Controller
{
    /**
     * Receive signed Mercado Pago payment notifications.
     */
    public function __invoke(Request $request, MercadoPagoService $mercadoPago): JsonResponse
    {
        try {
            $mercadoPago->validateWebhook($request);
        } catch (Throwable $exception) {
            Log::warning('Rejected Mercado Pago webhook.', [
                'request_id' => $request->header('x-request-id'),
                'reason' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'unauthorized'], 401);
        }

        $topic = $request->input('type')
            ?? $request->query('type')
            ?? $request->input('topic')
            ?? $request->query('topic');
        $paymentId = $mercadoPago->webhookDataId($request);

        if (in_array($topic, ['payment', 'payments'], true) && is_numeric($paymentId)) {
            $mercadoPago->syncPayment((int) $paymentId);
        }

        return response()->json(['ok' => true]);
    }
}
