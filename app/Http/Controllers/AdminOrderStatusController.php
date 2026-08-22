<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderStatusController extends Controller
{
    /**
     * Update an order workflow status.
     */
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    Order::STATUS_PAID,
                    Order::STATUS_PREPARING,
                    Order::STATUS_SHIPPED,
                    Order::STATUS_DELIVERED,
                    Order::STATUS_CANCELED,
                ]),
            ],
        ]);

        $order->forceFill([
            'status' => $validated['status'],
        ])->save();

        return back();
    }
}
