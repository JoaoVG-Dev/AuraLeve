<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutAddressTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_order_requires_a_street_number_and_a_state(): void
    {
        $this->actingAs(User::factory()->create());
        $this->product();

        $this->post(route('orders.store'), $this->payload([
            'numero' => '',
            'estado' => '',
        ]))->assertSessionHasErrors(['numero', 'estado']);
    }

    public function test_the_state_must_be_a_brazilian_federative_unit(): void
    {
        $this->actingAs(User::factory()->create());
        $this->product();

        $this->post(route('orders.store'), $this->payload(['estado' => 'XX']))
            ->assertSessionHasErrors('estado');
    }

    public function test_the_cpf_check_digits_are_validated(): void
    {
        $this->actingAs(User::factory()->create());
        $this->product();

        $this->post(route('orders.store'), $this->payload(['cpf' => '111.111.111-11']))
            ->assertSessionHasErrors('cpf');
    }

    public function test_a_complete_address_passes_validation(): void
    {
        $this->actingAs(User::factory()->create());
        $this->product();

        $response = $this->post(route('orders.store'), $this->payload());

        // Mercado Pago is not configured under test, so the request gets past
        // every address rule and only trips on the payment gateway.
        $response->assertSessionHasErrors('payment');
        $response->assertSessionDoesntHaveErrors([
            'cpf', 'cep', 'rua', 'numero', 'cidade', 'estado',
        ]);
    }

    public function test_the_address_is_printed_in_three_lines(): void
    {
        $order = new Order([
            'shipping_address' => [
                'cep' => '01310100',
                'street' => 'Avenida Paulista',
                'number' => '1000',
                'complement' => 'Apto 52',
                'neighborhood' => 'Bela Vista',
                'city' => 'São Paulo',
                'state' => 'SP',
            ],
        ]);

        $this->assertSame([
            'line1' => 'Avenida Paulista, 1000',
            'line2' => 'Apto 52 · Bela Vista',
            'line3' => 'São Paulo - SP · 01310-100',
        ], $order->addressLines());
    }

    protected function product(): Product
    {
        return Product::query()->create([
            'slug' => 'p6',
            'name' => 'Japamala Lápis Lazúli',
            'description' => 'Intuição, presença e verdade.',
            'category' => 'Japamalas',
            'stone' => 'Lápis Lazúli',
            'price' => 219.9,
            'stock' => 4,
            'reviews' => 120,
            'image_path' => '/images/auraleve/product-p6.png',
            'active' => true,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [['id' => 'p6', 'qty' => 1]],
            'nome' => 'Fernanda Marques',
            'email' => 'fernanda@example.com',
            'whats' => '(11) 99999-9999',
            'cpf' => '529.982.247-25',
            'cep' => '01310-100',
            'rua' => 'Avenida Paulista',
            'numero' => '1000',
            'complemento' => 'Apto 52',
            'bairro' => 'Bela Vista',
            'cidade' => 'São Paulo',
            'estado' => 'SP',
            'shipping_method' => 'pac',
            'payment_method' => 'pix',
            'gift_wrap' => false,
        ], $overrides);
    }
}
