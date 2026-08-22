import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
const StorefrontController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: StorefrontController.url(options),
    method: 'get',
})

StorefrontController.definition = {
    methods: ["get","head"],
    url: '/loja-preview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
StorefrontController.url = (options?: RouteQueryOptions) => {
    return StorefrontController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
StorefrontController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: StorefrontController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
StorefrontController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: StorefrontController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
    const StorefrontControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: StorefrontController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
        StorefrontControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: StorefrontController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\StorefrontController::__invoke
 * @see app/Http/Controllers/StorefrontController.php:15
 * @route '/loja-preview'
 */
        StorefrontControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: StorefrontController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    StorefrontController.form = StorefrontControllerForm
export default StorefrontController