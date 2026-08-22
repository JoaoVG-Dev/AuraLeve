<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->uuid('external_reference')->unique();
            $table->string('status')->default('pending_payment')->index();
            $table->string('payment_status')->default('pending')->index();
            $table->string('payment_provider')->default('mercado_pago');
            $table->string('mercado_pago_preference_id')->nullable()->index();
            $table->string('mercado_pago_payment_id')->nullable()->index();
            $table->string('mercado_pago_status_detail')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('shipping_amount', 10, 2);
            $table->decimal('total', 10, 2);
            $table->string('currency', 3)->default('BRL');
            $table->string('shipping_method');
            $table->string('shipping_eta');
            $table->string('payment_method')->nullable();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('customer_cpf');
            $table->json('shipping_address');
            $table->boolean('gift_wrap')->default(false);
            $table->text('gift_message')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
