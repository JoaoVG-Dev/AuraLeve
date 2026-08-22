<?php

namespace App\Http\Controllers;

use App\Support\ProductImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminProductImageController extends Controller
{
    /**
     * Upload a product image from the admin panel.
     */
    public function __invoke(Request $request, ProductImageUploader $uploader): JsonResponse
    {
        $validated = $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:'.((int) config('auraleve.uploads.product_image_max_kb', 4096)),
            ],
            'slot' => ['required', 'string', Rule::in(['image_path', 'detail_image_path'])],
        ]);

        return response()->json($uploader->upload($validated['image']));
    }
}
