const { admin } = require('../Config/firebaseAdmin');

class OrderModel {
  /** Create order, reduce stock, clear cart */
  static async createOrder(userId, orderData, cartItems) {
    const db = admin.database();
    const batch = {};                     // for atomic updates
    const orderId = db.ref('orders').push().key;

    // 1. Build order object
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;

    const order = {
      id: orderId,
      userId,
      items: cartItems.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        image: i.image,
        quantity: i.quantity,
      })),
      shippingAddress: orderData.shipping,
      contact: {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
      },
      subtotal,
      shipping,
      total,
      status: 'pending',                 // admin will change after payment proof
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    // 2. Reduce stock (atomic)
    for (const item of cartItems) {
      const prodRef = `products/${item.id}/stock`;
      const snap = await db.ref(prodRef).once('value');
      const current = snap.val() || 0;
      if (current < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
      batch[prodRef] = current - item.quantity;
    }

    // 3. Write order + stock updates + clear cart
    batch[`orders/${orderId}`] = order;
    batch[`cart/${userId}`] = null;   // delete whole cart node

    await db.ref().update(batch);
    return { success: true, orderId, order };
  }
}

module.exports = OrderModel;