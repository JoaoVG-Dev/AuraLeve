import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
export const stock = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: stock.url(args, options),
    method: 'patch',
});

stock.definition = {
    methods: ['patch'],
    url: '/admin/products/{product}/stock',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
stock.url = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'slug' in args) {
        args = { product: args.slug };
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        product:
            typeof args.product === 'object' ? args.product.slug : args.product,
    };

    return (
        stock.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
stock.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: stock.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
const stockForm = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: stock.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
stockForm.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: stock.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

stock.form = stockForm;
const products = {
    stock: Object.assign(stock, stock),
};

export default products;
