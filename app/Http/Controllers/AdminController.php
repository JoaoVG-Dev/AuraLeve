<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Models\Order;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Show the admin dashboard.
     */
    public function __invoke(): Response
    {
        $orders = Order::query()
            ->with('items')
            ->latest()
            ->limit(50)
            ->get();

        $paidOrders = Order::query()->where('payment_status', 'approved');

        return Inertia::render('admin', [
            'orders' => OrderResource::collection($orders)->resolve(),
            'products' => ProductResource::collection(Product::query()->orderBy('category')->orderBy('name')->get())->resolve(),
            'dashboard' => [
                'revenue' => (float) (clone $paidOrders)->sum('total'),
                'orders' => Order::query()->count(),
                'averageTicket' => (float) ((clone $paidOrders)->avg('total') ?? 0),
                'toShip' => Order::query()->whereIn('status', [Order::STATUS_PAID, Order::STATUS_PREPARING])->count(),
            ],
        ]);
    }
}
