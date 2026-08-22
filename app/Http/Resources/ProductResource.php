<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->slug,
            'databaseId' => $this->id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'cat' => $this->category,
            'stone' => $this->stone,
            'badge' => $this->badge,
            'reviews' => $this->reviews,
            'desc' => $this->description,
            'image' => $this->image_path,
            'detailImage' => $this->detail_image_path,
            'stock' => $this->stock,
            'active' => $this->active,
        ];
    }
}
