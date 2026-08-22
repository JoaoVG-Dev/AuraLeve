import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
const AdminProductStockController = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: AdminProductStockController.url(args, options),
    method: 'patch',
});

AdminProductStockController.definition = {
    methods: ['patch'],
    url: '/admin/products/{product}/stock',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
AdminProductStockController.url = (
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
        AdminProductStockController.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
AdminProductStockController.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: AdminProductStockController.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\AdminProductStockController::__invoke
 * @see app/Http/Controllers/AdminProductStockController.php:14
 * @route '/admin/products/{product}/stock'
 */
const AdminProductStockControllerForm = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: AdminProductStockController.url(args, {
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
AdminProductStockControllerForm.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: AdminProductStockController.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

AdminProductStockController.form = AdminProductStockControllerForm;
export default AdminProductStockController;
