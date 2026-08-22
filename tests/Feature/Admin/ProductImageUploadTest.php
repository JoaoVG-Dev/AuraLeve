<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_cannot_upload_product_images(): void
    {
        $this->actingAs(User::factory()->create());

        $this->postJson(route('admin.products.images.store'), [
            'slot' => 'image_path',
            'image' => $this->validImage('produto.png'),
        ])->assertForbidden();
    }

    public function test_admins_can_upload_product_images_to_public_disk(): void
    {
        config(['auraleve.uploads.product_image_storage' => 'public']);
        Storage::fake('public');

        $this->actingAs(User::factory()->create(['is_admin' => true]));

        $response = $this->postJson(route('admin.products.images.store'), [
            'slot' => 'image_path',
            'image' => $this->validImage('Japamala Azul.png'),
        ])->assertOk();

        $response->assertJsonPath('storage', 'public');
        $this->assertStringStartsWith('/storage/products/', $response->json('url'));
        Storage::disk('public')->assertExists($response->json('pathname'));
    }

    public function test_admins_can_upload_product_images_to_vercel_blob(): void
    {
        config([
            'auraleve.uploads.product_image_storage' => 'vercel_blob',
            'auraleve.uploads.vercel_blob_token' => 'vercel_blob_rw_store123_secret',
            'auraleve.uploads.vercel_blob_store_id' => null,
        ]);

        Http::fake([
            'https://vercel.com/api/blob/*' => Http::response([
                'url' => 'https://store123.public.blob.vercel-storage.com/products/japamala.png',
                'pathname' => 'products/japamala.png',
                'contentType' => 'image/png',
            ]),
        ]);

        $this->actingAs(User::factory()->create(['is_admin' => true]));

        $response = $this->postJson(route('admin.products.images.store'), [
            'slot' => 'image_path',
            'image' => $this->validImage('Japamala Azul.png'),
        ])->assertOk();

        $response->assertJsonPath('storage', 'vercel_blob');
        $response->assertJsonPath('url', 'https://store123.public.blob.vercel-storage.com/products/japamala.png');

        Http::assertSent(fn ($request): bool => $request->method() === 'PUT'
            && str_starts_with($request->url(), 'https://vercel.com/api/blob/?pathname=products%2F')
            && $request->hasHeader('Authorization', 'Bearer vercel_blob_rw_store123_secret')
            && $request->hasHeader('x-api-version', '12')
            && $request->hasHeader('x-vercel-blob-access', 'public')
            && $request->hasHeader('x-vercel-blob-store-id', 'store123'));
    }

    public function test_product_image_upload_rejects_non_images(): void
    {
        config(['auraleve.uploads.product_image_storage' => 'public']);
        Storage::fake('public');

        $this->actingAs(User::factory()->create(['is_admin' => true]));

        $this->postJson(route('admin.products.images.store'), [
            'slot' => 'image_path',
            'image' => UploadedFile::fake()->create('catalogo.pdf', 50, 'application/pdf'),
        ])->assertJsonValidationErrors('image');
    }

    protected function validImage(string $name): UploadedFile
    {
        $content = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
            true
        );

        $this->assertIsString($content);

        return UploadedFile::fake()->createWithContent(
            $name,
            $content
        );
    }
}
