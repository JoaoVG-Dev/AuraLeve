<?php

return [
    'admin_emails' => array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('AURALEVE_ADMIN_EMAILS', ''))
    ))),

    'shipping_methods' => [
        'pac' => [
            'label' => 'PAC',
            'eta' => '7 a 10 dias uteis',
            'amount' => 15.9,
        ],
        'sedex' => [
            'label' => 'SEDEX',
            'eta' => '3 a 5 dias uteis',
            'amount' => 25.9,
        ],
        'sedex10' => [
            'label' => 'SEDEX 10',
            'eta' => '1 a 2 dias uteis',
            'amount' => 35.9,
        ],
    ],

    'uploads' => [
        'product_image_storage' => env(
            'AURALEVE_PRODUCT_IMAGE_STORAGE',
            env('BLOB_READ_WRITE_TOKEN') ? 'vercel_blob' : 'public'
        ),
        'product_image_max_kb' => (int) env('AURALEVE_PRODUCT_IMAGE_MAX_KB', 4096),
        'vercel_blob_api_url' => env('VERCEL_BLOB_API_URL', 'https://vercel.com/api/blob'),
        'vercel_blob_token' => env('BLOB_READ_WRITE_TOKEN'),
        'vercel_blob_store_id' => env('BLOB_STORE_ID'),
    ],
];
