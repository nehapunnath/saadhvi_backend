const OrderModel = require('../Models/OrderModel');
const { admin } = require('../Config/firebaseAdmin');

class OrderController {
  /** POST /checkout */
  static async checkout(req, res) {
    try {
      const userId = req.user.uid;                 // from verifyUser
      const { name, email, phone, shipping } = req.body;

      if (!name || !email || !phone || !shipping) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
      }

      // 1. Fetch current cart
      const cartSnap = await admin.database().ref(`cart/${userId}`).once('value');
      if (!cartSnap.exists()) {
        return res.status(400).json({ success: false, error: 'Cart is empty' });
      }

      const cartItems = [];
      cartSnap.forEach(child => {
        cartItems.push({ id: child.key, ...child.val() });
      });

      // 2. Create order (stock reduction + clear cart)
      const result = await OrderModel.createOrder(userId, { name, email, phone, shipping }, cartItems);

      res.json({ success: true, orderId: result.orderId, order: result.order });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  // Add to existing OrderController
static async getAllOrders(req, res) {
  try {
    const snapshot = await admin.database().ref('orders').once('value');
    const orders = [];
    snapshot.forEach(child => {
      orders.push({ id: child.key, ...child.val() });
    });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
static async getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    const snapshot = await admin.database().ref(`orders/${orderId}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, order: { id: orderId, ...snapshot.val() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

static async updateOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;
    const updates = {};
    if (status) updates[`orders/${orderId}/status`] = status;
    if (paymentStatus) updates[`orders/${orderId}/paymentStatus`] = paymentStatus;
    await admin.database().ref().update(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

static async deleteOrder(req, res) {
  try {
    const { orderId } = req.params;
    await admin.database().ref(`orders/${orderId}`).remove();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
}

module.exports = OrderController;