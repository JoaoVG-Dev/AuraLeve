import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:19
 * @route '/admin/bootstrap'
 */
const AdminBootstrapController = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: AdminBootstrapController.url(options),
    method: 'post',
})

AdminBootstrapController.definition = {
    methods: ["post"],
    url: '/admin/bootstrap',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:19
 * @route '/admin/bootstrap'
 */
AdminBootstrapController.url = (options?: RouteQueryOptions) => {
    return AdminBootstrapController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:19
 * @route '/admin/bootstrap'
 */
AdminBootstrapController.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: AdminBootstrapController.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:19
 * @route '/admin/bootstrap'
 */
    const AdminBootstrapControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: AdminBootstrapController.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AdminBootstrapController::__invoke
 * @see app/Http/Controllers/AdminBootstrapController.php:19
 * @route '/admin/bootstrap'
 */
        AdminBootstrapControllerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: AdminBootstrapController.url(options),
            method: 'post',
        })
    
    AdminBootstrapController.form = AdminBootstrapControllerForm
export default AdminBootstrapController