<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PENDING_PAYMENT = 'pending_payment';

    public const STATUS_PAID = 'paid';

    public const STATUS_PREPARING = 'preparing';

    public const STATUS_SHIPPED = 'shipped';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_CANCELED = 'canceled';

    protected $fillable = [
        'user_id',
        'order_number',
        'external_reference',
        'status',
        'payment_status',
        'payment_provider',
        'mercado_pago_preference_id',
        'mercado_pago_payment_id',
        'mercado_pago_status_detail',
        'subtotal',
        'discount',
        'shipping_amount',
        'total',
        'currency',
        'shipping_method',
        'shipping_eta',
        'payment_method',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_cpf',
        'shipping_address',
        'gift_wrap',
        'gift_message',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'shipping_address' => 'array',
            'gift_wrap' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
