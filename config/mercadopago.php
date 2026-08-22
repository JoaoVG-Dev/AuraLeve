<?php

return [
    'access_token' => env('MERCADO_PAGO_ACCESS_TOKEN'),
    'public_key' => env('MERCADO_PAGO_PUBLIC_KEY'),
    'webhook_secret' => env('MERCADO_PAGO_WEBHOOK_SECRET'),
    'webhook_url' => env('MERCADO_PAGO_WEBHOOK_URL'),
    'environment' => env('MERCADO_PAGO_ENV', 'sandbox'),
    'statement_descriptor' => env('MERCADO_PAGO_STATEMENT_DESCRIPTOR', 'AURALEVE'),
];
