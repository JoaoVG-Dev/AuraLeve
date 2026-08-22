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
];
