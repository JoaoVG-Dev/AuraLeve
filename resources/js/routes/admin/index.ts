import orders from './orders';
import products from './products';
const admin = {
    orders: Object.assign(orders, orders),
    products: Object.assign(products, products),
};

export default admin;
