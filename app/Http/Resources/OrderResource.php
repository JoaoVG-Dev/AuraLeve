<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->order_number,
            'cliente' => $this->customer_name,
            'data' => $this->created_at?->format('d/m') ?? '',
            'total' => (float) $this->total,
            'st' => $this->statusIndex(),
            'status' => $this->status,
            'paymentStatus' => $this->payment_status,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item): array => [
                'name' => $item->product_name,
                'qty' => $item->quantity,
                'total' => (float) $item->total,
            ])->values()),
        ];
    }

    protected function statusIndex(): int
    {
        return match ($this->status) {
            Order::STATUS_SHIPPED => 1,
            Order::STATUS_DELIVERED => 2,
            default => 0,
        };
    }
}
