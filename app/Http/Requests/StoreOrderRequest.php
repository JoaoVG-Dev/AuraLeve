<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'shipping_method' => $this->input('shipping_method', $this->input('ship')),
            'payment_method' => $this->input('payment_method', $this->input('pay')),
            'gift_wrap' => filter_var($this->input('gift_wrap', false), FILTER_VALIDATE_BOOL),
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
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.id' => [
                'required',
                'string',
                Rule::exists('products', 'slug')->where('active', true),
            ],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:10'],
            'nome' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'whats' => ['required', 'string', 'max:30'],
            'cpf' => ['required', 'string', 'max:20'],
            'cep' => ['required', 'string', 'max:12'],
            'rua' => ['required', 'string', 'min:5', 'max:180'],
            'bairro' => ['nullable', 'string', 'max:120'],
            'cidade' => ['required', 'string', 'max:120'],
            'shipping_method' => ['required', Rule::in(array_keys(config('auraleve.shipping_methods')))],
            'payment_method' => ['required', Rule::in(['pix', 'cartao', 'boleto'])],
            'gift_wrap' => ['boolean'],
            'gift_message' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator): void {
            if (strlen($this->digits((string) $this->input('cpf'))) !== 11) {
                $validator->errors()->add('cpf', 'Informe um CPF com 11 dígitos.');
            }

            if (strlen($this->digits((string) $this->input('cep'))) !== 8) {
                $validator->errors()->add('cep', 'Informe um CEP com 8 dígitos.');
            }

            if (strlen($this->digits((string) $this->input('whats'))) < 10) {
                $validator->errors()->add('whats', 'Informe DDD e número do WhatsApp.');
            }
        });
    }

    public function digits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }

    /**
     * @return list<array{id: string, qty: int}>
     */
    public function orderItems(): array
    {
        $items = $this->validated('items', []);
        $result = [];

        if (! is_array($items)) {
            return $result;
        }

        foreach ($items as $row) {
            if (! is_array($row)) {
                continue;
            }

            $result[] = [
                'id' => (string) ($row['id'] ?? ''),
                'qty' => (int) ($row['qty'] ?? 0),
            ];
        }

        return $result;
    }
}
