import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\AdminOrderStatusController::__invoke
 * @see app/Http/Controllers/AdminOrderStatusController.php:15
 * @route '/admin/orders/{order}/status'
 */
const AdminOrderStatusController = (
    args:
        | { order: number | { id: number } }
        | [order: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: AdminOrderStatusController.url(args, options),
    method: 'patch',
});

AdminOrderStatusController.definition = {
    methods: ['patch'],
    url: '/admin/orders/{order}/status',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\AdminOrderStatusController::__invoke
 * @see app/Http/Controllers/AdminOrderStatusController.php:15
 * @route '/admin/orders/{order}/status'
 */
AdminOrderStatusController.url = (
    args:
        | { order: number | { id: number } }
        | [order: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { order: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { order: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            order: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        order: typeof args.order === 'object' ? args.order.id : args.order,
    };

    return (
        AdminOrderStatusController.definition.url
            .replace('{order}', parsedArgs.order.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\AdminOrderStatusController::__invoke
 * @see app/Http/Controllers/AdminOrderStatusController.php:15
 * @route '/admin/orders/{order}/status'
 */
AdminOrderStatusController.patch = (
    args:
        | { order: number | { id: number } }
        | [order: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: AdminOrderStatusController.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\AdminOrderStatusController::__invoke
 * @see app/Http/Controllers/AdminOrderStatusController.php:15
 * @route '/admin/orders/{order}/status'
 */
const AdminOrderStatusControllerForm = (
    args:
        | { order: number | { id: number } }
        | [order: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: AdminOrderStatusController.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\AdminOrderStatusController::__invoke
 * @see app/Http/Controllers/AdminOrderStatusController.php:15
 * @route '/admin/orders/{order}/status'
 */
AdminOrderStatusControllerForm.patch = (
    args:
        | { order: number | { id: number } }
        | [order: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: AdminOrderStatusController.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

AdminOrderStatusController.form = AdminOrderStatusControllerForm;
export default AdminOrderStatusController;
