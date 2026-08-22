<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Show the authenticated checkout.
     */
    public function create(): Response
    {
        $products = Product::query()
            ->where('active', true)
            ->get()
            ->sortBy(fn (Product $product): int => $this->catalogPosition($product->slug))
            ->values();

        return Inertia::render('checkout', [
            'products' => ProductResource::collection($products)->resolve(),
        ]);
    }

    protected function catalogPosition(string $slug): int
    {
        $index = array_search($slug, ['p6', 'p1', 'p3', 'p4', 'p2', 'p5'], true);

        return $index === false ? 99 : $index;
    }
}
