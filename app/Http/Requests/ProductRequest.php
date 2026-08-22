<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $slug = trim((string) $this->input('slug'));

        if ($slug === '') {
            $slug = Str::slug((string) $this->input('name'));
        }

        $this->merge([
            'slug' => $this->uniqueSlug(Str::slug($slug)),
            'active' => filter_var($this->input('active', true), FILTER_VALIDATE_BOOL),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => [
                'required',
                'string',
                'max:60',
                Rule::unique('products', 'slug')->ignore($this->product()?->id),
            ],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:1000'],
            'category' => ['required', 'string', 'max:60'],
            'stone' => ['nullable', 'string', 'max:60'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999.99'],
            'stock' => ['required', 'integer', 'min:0', 'max:9999'],
            'badge' => ['nullable', 'string', 'max:30'],
            'reviews' => ['required', 'integer', 'min:0', 'max:99999'],
            'image_path' => ['required', 'string', 'max:255'],
            'detail_image_path' => ['nullable', 'string', 'max:255'],
            'active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Dê um nome para a peça.',
            'description.required' => 'Descreva a peça para a loja.',
            'category.required' => 'Informe a categoria.',
            'price.required' => 'Informe o preço.',
            'image_path.required' => 'Envie ou informe a imagem principal.',
            'slug.unique' => 'Já existe uma peça com esse identificador.',
        ];
    }

    /**
     * The product being updated, when the route carries one.
     */
    public function product(): ?Product
    {
        $product = $this->route('product');

        return $product instanceof Product ? $product : null;
    }

    /**
     * Make sure a generated slug does not collide with an existing product.
     */
    protected function uniqueSlug(string $slug): string
    {
        if ($slug === '') {
            return $slug;
        }

        $base = $slug;
        $suffix = 2;

        while (
            Product::query()
                ->where('slug', $slug)
                ->when($this->product(), fn ($query, Product $product) => $query->whereKeyNot($product->id))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
