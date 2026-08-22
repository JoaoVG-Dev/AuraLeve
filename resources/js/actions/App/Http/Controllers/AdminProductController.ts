import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminProductController::store
 * @see app/Http/Controllers/AdminProductController.php:15
 * @route '/admin/products'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/admin/products',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\AdminProductController::store
 * @see app/Http/Controllers/AdminProductController.php:15
 * @route '/admin/products'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\AdminProductController::store
 * @see app/Http/Controllers/AdminProductController.php:15
 * @route '/admin/products'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminProductController::store
 * @see app/Http/Controllers/AdminProductController.php:15
 * @route '/admin/products'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminProductController::store
 * @see app/Http/Controllers/AdminProductController.php:15
 * @route '/admin/products'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;
/**
 * @see \App\Http\Controllers\AdminProductController::update
 * @see app/Http/Controllers/AdminProductController.php:25
 * @route '/admin/products/{product}'
 */
export const update = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/admin/products/{product}',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\AdminProductController::update
 * @see app/Http/Controllers/AdminProductController.php:25
 * @route '/admin/products/{product}'
 */
update.url = (
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
        update.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\AdminProductController::update
 * @see app/Http/Controllers/AdminProductController.php:25
 * @route '/admin/products/{product}'
 */
update.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\AdminProductController::update
 * @see app/Http/Controllers/AdminProductController.php:25
 * @route '/admin/products/{product}'
 */
const updateForm = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminProductController::update
 * @see app/Http/Controllers/AdminProductController.php:25
 * @route '/admin/products/{product}'
 */
updateForm.patch = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

update.form = updateForm;
/**
 * @see \App\Http\Controllers\AdminProductController::destroy
 * @see app/Http/Controllers/AdminProductController.php:35
 * @route '/admin/products/{product}'
 */
export const destroy = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/admin/products/{product}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\AdminProductController::destroy
 * @see app/Http/Controllers/AdminProductController.php:35
 * @route '/admin/products/{product}'
 */
destroy.url = (
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
        destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\AdminProductController::destroy
 * @see app/Http/Controllers/AdminProductController.php:35
 * @route '/admin/products/{product}'
 */
destroy.delete = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\AdminProductController::destroy
 * @see app/Http/Controllers/AdminProductController.php:35
 * @route '/admin/products/{product}'
 */
const destroyForm = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminProductController::destroy
 * @see app/Http/Controllers/AdminProductController.php:35
 * @route '/admin/products/{product}'
 */
destroyForm.delete = (
    args:
        | { product: string | { slug: string } }
        | [product: string | { slug: string }]
        | string
        | { slug: string },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

destroy.form = destroyForm;
const AdminProductController = { store, update, destroy };

export default AdminProductController;
