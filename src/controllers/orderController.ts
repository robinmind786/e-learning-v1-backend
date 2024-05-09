import Order from "../models/order/orderModel";
import OrderService from "../services/OrderService";

const orderController = new OrderService(Order);

export default orderController;
