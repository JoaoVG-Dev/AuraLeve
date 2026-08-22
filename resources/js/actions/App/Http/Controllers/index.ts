import StorefrontController from './StorefrontController'
import AdminBootstrapController from './AdminBootstrapController'
import MercadoPagoWebhookController from './MercadoPagoWebhookController'
import CheckoutController from './CheckoutController'
import OrderController from './OrderController'
import MercadoPagoReturnController from './MercadoPagoReturnController'
import AdminController from './AdminController'
import AdminOrderStatusController from './AdminOrderStatusController'
import AdminProductStockController from './AdminProductStockController'
import AdminProductController from './AdminProductController'
import Settings from './Settings'
const Controllers = {
    StorefrontController: Object.assign(StorefrontController, StorefrontController),
AdminBootstrapController: Object.assign(AdminBootstrapController, AdminBootstrapController),
MercadoPagoWebhookController: Object.assign(MercadoPagoWebhookController, MercadoPagoWebhookController),
CheckoutController: Object.assign(CheckoutController, CheckoutController),
OrderController: Object.assign(OrderController, OrderController),
MercadoPagoReturnController: Object.assign(MercadoPagoReturnController, MercadoPagoReturnController),
AdminController: Object.assign(AdminController, AdminController),
AdminOrderStatusController: Object.assign(AdminOrderStatusController, AdminOrderStatusController),
AdminProductStockController: Object.assign(AdminProductStockController, AdminProductStockController),
AdminProductController: Object.assign(AdminProductController, AdminProductController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers