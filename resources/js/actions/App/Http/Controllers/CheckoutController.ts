import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
export const create = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
});

create.definition = {
    methods: ['get', 'head'],
    url: '/checkout',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
const createForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
});
/**
 * @see \App\Http\Controllers\CheckoutController::create
 * @see app/Http/Controllers/CheckoutController.php:15
 * @route '/checkout'
 */
createForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

create.form = createForm;
const CheckoutController = { create };

export default CheckoutController;
