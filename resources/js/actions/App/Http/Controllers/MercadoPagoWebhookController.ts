import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MercadoPagoWebhookController::__invoke
 * @see app/Http/Controllers/MercadoPagoWebhookController.php:16
 * @route '/mercado-pago/webhook'
 */
const MercadoPagoWebhookController = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: MercadoPagoWebhookController.url(options),
    method: 'post',
})

MercadoPagoWebhookController.definition = {
    methods: ["post"],
    url: '/mercado-pago/webhook',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MercadoPagoWebhookController::__invoke
 * @see app/Http/Controllers/MercadoPagoWebhookController.php:16
 * @route '/mercado-pago/webhook'
 */
MercadoPagoWebhookController.url = (options?: RouteQueryOptions) => {
    return MercadoPagoWebhookController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MercadoPagoWebhookController::__invoke
 * @see app/Http/Controllers/MercadoPagoWebhookController.php:16
 * @route '/mercado-pago/webhook'
 */
MercadoPagoWebhookController.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: MercadoPagoWebhookController.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MercadoPagoWebhookController::__invoke
 * @see app/Http/Controllers/MercadoPagoWebhookController.php:16
 * @route '/mercado-pago/webhook'
 */
    const MercadoPagoWebhookControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: MercadoPagoWebhookController.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MercadoPagoWebhookController::__invoke
 * @see app/Http/Controllers/MercadoPagoWebhookController.php:16
 * @route '/mercado-pago/webhook'
 */
        MercadoPagoWebhookControllerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: MercadoPagoWebhookController.url(options),
            method: 'post',
        })
    
    MercadoPagoWebhookController.form = MercadoPagoWebhookControllerForm
export default MercadoPagoWebhookController