import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
export const success = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: success.url(args, options),
    method: 'get',
});

success.definition = {
    methods: ['get', 'head'],
    url: '/pagamento/mercado-pago/{order}/sucesso',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
success.url = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args };
    }

    if (
        typeof args === 'object' &&
        !Array.isArray(args) &&
        'external_reference' in args
    ) {
        args = { order: args.external_reference };
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        order:
            typeof args.order === 'object'
                ? args.order.external_reference
                : args.order,
    };

    return (
        success.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
success.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: success.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
success.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: success.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
const successForm = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: success.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
successForm.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: success.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::success
 * @see app/Http/Controllers/MercadoPagoReturnController.php:13
 * @route '/pagamento/mercado-pago/{order}/sucesso'
 */
successForm.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: success.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

success.form = successForm;
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
export const failure = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: failure.url(args, options),
    method: 'get',
});

failure.definition = {
    methods: ['get', 'head'],
    url: '/pagamento/mercado-pago/{order}/falha',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
failure.url = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args };
    }

    if (
        typeof args === 'object' &&
        !Array.isArray(args) &&
        'external_reference' in args
    ) {
        args = { order: args.external_reference };
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        order:
            typeof args.order === 'object'
                ? args.order.external_reference
                : args.order,
    };

    return (
        failure.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
failure.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: failure.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
failure.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: failure.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
const failureForm = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: failure.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
failureForm.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: failure.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::failure
 * @see app/Http/Controllers/MercadoPagoReturnController.php:21
 * @route '/pagamento/mercado-pago/{order}/falha'
 */
failureForm.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: failure.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

failure.form = failureForm;
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
export const pending = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: pending.url(args, options),
    method: 'get',
});

pending.definition = {
    methods: ['get', 'head'],
    url: '/pagamento/mercado-pago/{order}/pendente',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
pending.url = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args };
    }

    if (
        typeof args === 'object' &&
        !Array.isArray(args) &&
        'external_reference' in args
    ) {
        args = { order: args.external_reference };
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        order:
            typeof args.order === 'object'
                ? args.order.external_reference
                : args.order,
    };

    return (
        pending.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
pending.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: pending.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
pending.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: pending.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
const pendingForm = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: pending.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
pendingForm.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: pending.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\MercadoPagoReturnController::pending
 * @see app/Http/Controllers/MercadoPagoReturnController.php:29
 * @route '/pagamento/mercado-pago/{order}/pendente'
 */
pendingForm.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: pending.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

pending.form = pendingForm;
const MercadoPagoReturnController = { success, failure, pending };

export default MercadoPagoReturnController;
