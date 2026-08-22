<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminOrderStatusController;
use App\Http\Controllers\AdminProductStockController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\MercadoPagoReturnController;
use App\Http\Controllers\MercadoPagoWebhookController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StorefrontController;
use Illuminate\Support\Facades\Route;

Route::get('/', StorefrontController::class)->name('home');
Route::post('mercado-pago/webhook', MercadoPagoWebhookController::class)->name('mercado-pago.webhook');

Route::middleware('auth')->group(function () {
    Route::get('checkout', [CheckoutController::class, 'create'])->name('checkout');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('pedidos/{order:external_reference}', [OrderController::class, 'show'])->name('orders.show');

    Route::get('pagamento/mercado-pago/{order:external_reference}/sucesso', [MercadoPagoReturnController::class, 'success'])
        ->name('mercado-pago.success');
    Route::get('pagamento/mercado-pago/{order:external_reference}/falha', [MercadoPagoReturnController::class, 'failure'])
        ->name('mercado-pago.failure');
    Route::get('pagamento/mercado-pago/{order:external_reference}/pendente', [MercadoPagoReturnController::class, 'pending'])
        ->name('mercado-pago.pending');
});

Route::middleware(['auth', 'can:access-admin'])->group(function () {
    Route::get('admin', AdminController::class)->name('admin');
    Route::patch('admin/orders/{order}/status', AdminOrderStatusController::class)->name('admin.orders.status');
    Route::patch('admin/products/{product:slug}/stock', AdminProductStockController::class)->name('admin.products.stock');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
