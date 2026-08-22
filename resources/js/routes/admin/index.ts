import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import orders from './orders'
import products from './products'
/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:15
 * @route '/admin/bootstrap'
 */
export const bootstrap = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bootstrap.url(options),
    method: 'post',
})

bootstrap.definition = {
    methods: ["post"],
    url: '/admin/bootstrap',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:15
 * @route '/admin/bootstrap'
 */
bootstrap.url = (options?: RouteQueryOptions) => {
    return bootstrap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:15
 * @route '/admin/bootstrap'
 */
bootstrap.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bootstrap.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:15
 * @route '/admin/bootstrap'
 */
    const bootstrapForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bootstrap.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:15
 * @route '/admin/bootstrap'
 */
        bootstrapForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bootstrap.url(options),
            method: 'post',
        })
    
    bootstrap.form = bootstrapForm
const admin = {
    orders: Object.assign(orders, orders),
products: Object.assign(products, products),
}

export default admin