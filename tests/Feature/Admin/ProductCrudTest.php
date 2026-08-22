<?php

namespace Tests\Feature\Admin;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_cannot_create_products(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post(route('admin.products.store'), $this->payload())
            ->assertForbidden();

        $this->assertDatabaseCount('products', 0);
    }

    public function test_admins_can_create_a_product(): void
    {
        $this->actingAs($this->admin());

        $this->post(route('admin.products.store'), $this->payload())
            ->assertRedirect();

        $this->assertDatabaseHas('products', [
            'slug' => 'japamala-teste',
            'name' => 'Japamala Teste',
            'stock' => 5,
            'active' => true,
        ]);
    }

    public function test_the_slug_is_generated_from_the_name_when_missing(): void
    {
        $this->actingAs($this->admin());

        $this->post(route('admin.products.store'), $this->payload(['slug' => '']))
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['slug' => 'japamala-teste']);
    }

    public function test_a_generated_slug_does_not_collide(): void
    {
        $this->actingAs($this->admin());
        $this->product(['slug' => 'japamala-teste']);

        $this->post(route('admin.products.store'), $this->payload(['slug' => '']))
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['slug' => 'japamala-teste-2']);
    }

    public function test_admins_can_update_a_product(): void
    {
        $this->actingAs($this->admin());
        $product = $this->product();

        $this->patch(
            route('admin.products.update', $product),
            $this->payload(['slug' => $product->slug, 'name' => 'Outro nome', 'price' => 250.5])
        )->assertRedirect();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Outro nome',
            'price' => 250.5,
        ]);
    }

    public function test_admins_can_delete_a_product_that_was_never_sold(): void
    {
        $this->actingAs($this->admin());
        $product = $this->product();

        $this->delete(route('admin.products.destroy', $product))->assertRedirect();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_a_product_with_orders_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin);
        $product = $this->product();

        $order = Order::query()->create([
            'user_id' => $admin->id,
            'order_number' => 'AL-000000-0001',
            'external_reference' => 'ref-1',
            'status' => Order::STATUS_PAID,
            'payment_status' => 'approved',
            'subtotal' => 219.9,
            'discount' => 0,
            'shipping_amount' => 15.9,
            'total' => 235.8,
            'shipping_method' => 'pac',
            'shipping_eta' => '7 a 10 dias uteis',
            'payment_method' => 'pix',
            'customer_name' => 'Fernanda Marques',
            'customer_email' => 'fernanda@example.com',
            'customer_phone' => '11999999999',
            'customer_cpf' => '52998224725',
            'shipping_address' => ['cep' => '01310100', 'city' => 'São Paulo'],
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_slug' => $product->slug,
            'quantity' => 1,
            'unit_price' => $product->price,
            'total' => $product->price,
        ]);

        $this->delete(route('admin.products.destroy', $product))
            ->assertSessionHasErrors('product');

        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    protected function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function product(array $overrides = []): Product
    {
        return Product::query()->create(array_merge([
            'slug' => 'japamala-existente',
            'name' => 'Japamala Existente',
            'description' => 'Uma peça já cadastrada.',
            'category' => 'Japamalas',
            'stone' => 'Ágata',
            'price' => 219.9,
            'stock' => 3,
            'reviews' => 10,
            'image_path' => '/images/auraleve/product-p1.png',
            'active' => true,
        ], $overrides));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return array_merge([
            'slug' => 'japamala-teste',
            'name' => 'Japamala Teste',
            'description' => 'Peça feita à mão para a prática diária.',
            'category' => 'Japamalas',
            'stone' => 'Lápis Lazúli',
            'price' => 219.9,
            'stock' => 5,
            'badge' => 'NOVA',
            'reviews' => 0,
            'image_path' => '/images/auraleve/product-p6.png',
            'detail_image_path' => null,
            'active' => true,
        ], $overrides);
    }
}
