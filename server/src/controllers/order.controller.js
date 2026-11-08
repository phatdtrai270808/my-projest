import orderService from '../services/order.service.js';

export class OrderController {
  // GET /api/orders
  async getAll(req, res) {
    try {
      const orders = await orderService.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/orders/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/orders
  async create(req, res) {
    try {
      const { id, subTotal, total, items } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Mã đơn hàng không được để trống' });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Đơn hàng phải có ít nhất 1 món' });
      }
      const newOrder = await orderService.createOrder(req.body);
      res.status(201).json(newOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new OrderController();

