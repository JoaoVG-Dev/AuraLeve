import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\OrderController::store
 * @see app/Http/Controllers/OrderController.php:25
 * @route '/orders'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/orders',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\OrderController::store
 * @see app/Http/Controllers/OrderController.php:25
 * @route '/orders'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\OrderController::store
 * @see app/Http/Controllers/OrderController.php:25
 * @route '/orders'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\OrderController::store
 * @see app/Http/Controllers/OrderController.php:25
 * @route '/orders'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\OrderController::store
 * @see app/Http/Controllers/OrderController.php:25
 * @route '/orders'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
export const show = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/pedidos/{order}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
show.url = (
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
        show.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
show.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
show.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
const showForm = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
showForm.get = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\OrderController::show
 * @see app/Http/Controllers/OrderController.php:52
 * @route '/pedidos/{order}'
 */
showForm.head = (
    args:
        | { order: string | { external_reference: string } }
        | [order: string | { external_reference: string }]
        | string
        | { external_reference: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;
const OrderController = { store, show };

export default OrderController;
