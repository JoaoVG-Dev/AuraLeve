<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminProductStockController extends Controller
{
    /**
     * Update product stock.
     */
    public function __invoke(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'stock' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        $product->forceFill([
            'stock' => $validated['stock'],
        ])->save();

        return back();
    }
}
