<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductImageUploader
{
    /**
     * @return array{url: string, pathname: string, contentType: string|null, size: int|null, storage: string}
     */
    public function upload(UploadedFile $file): array
    {
        $pathname = $this->pathname($file);
        $storage = (string) config('auraleve.uploads.product_image_storage', 'public');

        if ($storage === 'vercel_blob') {
            return $this->uploadToVercelBlob($file, $pathname);
        }

        return $this->uploadToPublicDisk($file, $pathname);
    }

    /**
     * @return array{url: string, pathname: string, contentType: string|null, size: int|null, storage: string}
     */
    protected function uploadToPublicDisk(UploadedFile $file, string $pathname): array
    {
        $path = $file->storeAs(dirname($pathname), basename($pathname), 'public');

        if ($path === false) {
            throw ValidationException::withMessages([
                'image' => 'Nao foi possivel salvar a imagem agora.',
            ]);
        }

        return [
            'url' => Storage::disk('public')->url($path),
            'pathname' => $path,
            'contentType' => $file->getMimeType(),
            'size' => $this->fileSize($file),
            'storage' => 'public',
        ];
    }

    /**
     * @return array{url: string, pathname: string, contentType: string|null, size: int|null, storage: string}
     */
    protected function uploadToVercelBlob(UploadedFile $file, string $pathname): array
    {
        $token = trim((string) config('auraleve.uploads.vercel_blob_token'));
        $storeId = $this->storeId($token);

        if ($token === '' || $storeId === '') {
            throw ValidationException::withMessages([
                'image' => 'Configure BLOB_READ_WRITE_TOKEN na Vercel antes de enviar imagens.',
            ]);
        }

        $realPath = $file->getRealPath();

        if (! is_string($realPath)) {
            throw ValidationException::withMessages([
                'image' => 'Nao foi possivel ler a imagem enviada.',
            ]);
        }

        $contents = file_get_contents($realPath);
        $size = $this->fileSize($file);

        if ($contents === false) {
            throw ValidationException::withMessages([
                'image' => 'Nao foi possivel ler a imagem enviada.',
            ]);
        }

        $response = Http::timeout(30)
            ->retry(2, 250)
            ->withToken($token)
            ->withHeaders([
                'Accept' => 'application/json',
                'x-api-blob-request-id' => "{$storeId}:".((int) (microtime(true) * 1000)).':'.Str::random(12),
                'x-api-blob-request-attempt' => '0',
                'x-api-version' => '12',
                'x-content-length' => (string) ($size ?? 0),
                'x-content-type' => $file->getMimeType() ?: 'application/octet-stream',
                'x-vercel-blob-access' => 'public',
                'x-vercel-blob-store-id' => $storeId,
            ])
            ->withBody($contents, $file->getMimeType() ?: 'application/octet-stream')
            ->put($this->blobEndpoint($pathname));

        if (! $response->successful()) {
            $message = $response->json('error.message')
                ?? $response->json('error')
                ?? 'Nao foi possivel enviar a imagem para o Vercel Blob.';

            throw ValidationException::withMessages([
                'image' => is_string($message) ? $message : 'Nao foi possivel enviar a imagem para o Vercel Blob.',
            ]);
        }

        $body = $response->json();
        $url = (string) data_get($body, 'url');
        $contentType = data_get($body, 'contentType');

        if ($url === '') {
            throw ValidationException::withMessages([
                'image' => 'O Vercel Blob nao retornou a URL da imagem.',
            ]);
        }

        return [
            'url' => $url,
            'pathname' => (string) data_get($body, 'pathname', $pathname),
            'contentType' => is_string($contentType) ? $contentType : $file->getMimeType(),
            'size' => $size,
            'storage' => 'vercel_blob',
        ];
    }

    protected function pathname(UploadedFile $file): string
    {
        $extension = strtolower($file->extension() ?: $file->guessExtension() ?: 'jpg');
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'produto';

        return 'products/'.now()->format('Y/m')."/{$name}-".Str::ulid().".{$extension}";
    }

    protected function blobEndpoint(string $pathname): string
    {
        $baseUrl = rtrim((string) config('auraleve.uploads.vercel_blob_api_url'), '/');

        return $baseUrl.'/?'.http_build_query(['pathname' => $pathname]);
    }

    protected function storeId(string $token): string
    {
        $configuredStoreId = trim((string) config('auraleve.uploads.vercel_blob_store_id'));

        if ($configuredStoreId !== '') {
            return Str::after($configuredStoreId, 'store_');
        }

        $parts = explode('_', $token);

        return $parts[3] ?? '';
    }

    protected function fileSize(UploadedFile $file): ?int
    {
        $size = $file->getSize();

        return is_int($size) ? $size : null;
    }
}
