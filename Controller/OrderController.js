const OrderModel = require('../Models/OrderModel');
const { admin } = require('../Config/firebaseAdmin');

class OrderController {
  static async checkout(req, res) {
  try {
    const userId = req.user.uid;
    const { name, email, phone, shipping,paymentMethod } = req.body;

    if (!name || !email || !phone || !shipping || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    // Get raw cart from database
    const cartSnap = await admin.database().ref(`cart/${userId}`).once('value');
    if (!cartSnap.exists()) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const rawCartItems = [];
    cartSnap.forEach(child => {
      rawCartItems.push({ id: child.key, ...child.val() });
    });

    // Enrich with current product data (especially extraCharges)
    const enrichedCartItems = [];
    for (const cartItem of rawCartItems) {
      const productSnap = await admin.database().ref(`products/${cartItem.id}`).once('value');
      if (productSnap.exists()) {
        const product = productSnap.val();
        enrichedCartItems.push({
          id: cartItem.id,
          name: product.name || cartItem.name,
          price: Number(product.price || cartItem.price || 0),
          image: (product.images?.[0]) || cartItem.image || '',
          quantity: Number(cartItem.quantity || 1),
          extraCharges: Number(product.extraCharges || 0),   // ← This is where it comes from
        });
      } else {
        console.warn(`Product ${cartItem.id} not found during checkout - skipping`);
      }
    }

    if (enrichedCartItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid products in cart' });
    }

    console.log('Enriched cart items for order:', enrichedCartItems.map(i => ({
      id: i.id,
      extraCharges: i.extraCharges
    })));

    const result = await OrderModel.createOrder(userId, { name, email, phone, shipping,paymentMethod, }, enrichedCartItems);

    res.json({ success: true, orderId: result.orderId, order: result.order });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
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