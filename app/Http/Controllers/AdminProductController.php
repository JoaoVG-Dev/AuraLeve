<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class AdminProductController extends Controller
{
    /**
     * Create a product.
     */
    public function store(ProductRequest $request): RedirectResponse
    {
        $product = Product::query()->create($request->validated());

        return back()->with('status', "{$product->name} entrou no catálogo.");
    }

    /**
     * Update a product.
     */
    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back()->with('status', "{$product->name} foi atualizada.");
    }

    /**
     * Remove a product that was never sold.
     */
    public function destroy(Product $product): RedirectResponse
    {
        if ($product->orderItems()->exists()) {
            throw ValidationException::withMessages([
                'product' => 'Esta peça já aparece em pedidos. Desative-a em vez de excluir.',
            ]);
        }

        $name = $product->name;
        $product->delete();

        return back()->with('status', "{$name} foi removida do catálogo.");
    }
}
