<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrderRequest extends FormRequest
{
    /**
     * Brazilian federative units accepted for shipping.
     *
     * @var list<string>
     */
    public const STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
        'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
        'SP', 'SE', 'TO',
    ];

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
            'estado' => strtoupper(trim((string) $this->input('estado'))),
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
            'numero' => ['required', 'string', 'max:20'],
            'complemento' => ['nullable', 'string', 'max:120'],
            'bairro' => ['nullable', 'string', 'max:120'],
            'cidade' => ['required', 'string', 'max:120'],
            'estado' => ['required', 'string', 'size:2', Rule::in(self::STATES)],
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
            if (! $this->isValidCpf($this->digits((string) $this->input('cpf')))) {
                $validator->errors()->add('cpf', 'Informe um CPF válido.');
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
     * Validate a CPF using its two check digits.
     */
    public function isValidCpf(string $cpf): bool
    {
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf) === 1) {
            return false;
        }

        foreach ([9, 10] as $position) {
            $sum = 0;

            for ($index = 0; $index < $position; $index++) {
                $sum += (int) $cpf[$index] * ($position + 1 - $index);
            }

            $remainder = ($sum * 10) % 11;
            $digit = $remainder === 10 ? 0 : $remainder;

            if ($digit !== (int) $cpf[$position]) {
                return false;
            }
        }

        return true;
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
