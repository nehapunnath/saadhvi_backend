const { admin } = require('../Config/firebaseAdmin');

class OrderModel {
  /** Create order, reduce stock, clear cart */
  static async createOrder(userId, orderData, cartItems) {
    console.log('===== USING UPDATED createOrder (with extraCharges) =====');
  console.log('cartItems received:', cartItems.map(i => ({
    id: i.id,
    name: i.name,
    extraCharges: i.extraCharges,
    extraChargesType: typeof i.extraCharges
  })))
  const db = admin.database();
  const batch = {}; // for atomic updates
  const orderId = db.ref('orders').push().key;

  // ────────────────────────────────────────────────
  // 1. Calculate using per-item extraCharges (not flat fee)
  // ────────────────────────────────────────────────
  const productSubtotal = cartItems.reduce((s, i) => s + (Number(i.price || 0) * (Number(i.quantity || 1))), 0);

  const shippingTotal = cartItems.reduce((s, i) => {
    const extra = Number(i.extraCharges || 0);
    return s + (extra * (Number(i.quantity || 1)));
  }, 0);

  const grandTotal = productSubtotal + shippingTotal;

  // ────────────────────────────────────────────────
  // 2. Build order object – now include extraCharges per item
  // ────────────────────────────────────────────────
  const order = {
    id: orderId,
    userId,
    items: cartItems.map(i => ({
      productId: i.id,
      name: i.name,
      price: Number(i.price || 0),
      image: i.image || '',
      quantity: Number(i.quantity || 1),
      extraCharges: Number(i.extraCharges || 0),   // ← crucial line added
    })),
    shippingAddress: orderData.shipping,
    contact: {
      name: orderData.name,
      email: orderData.email,
      phone: orderData.phone,
    },
    productSubtotal,      // clearer field names
    shippingTotal,        // renamed from 'shipping'
    total: grandTotal,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: admin.database.ServerValue.TIMESTAMP,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };

  // ────────────────────────────────────────────────
  // 3. Reduce stock (atomic)
  // ────────────────────────────────────────────────
  for (const item of cartItems) {
    const prodRef = `products/${item.id}/stock`;
    const snap = await db.ref(prodRef).once('value');
    const current = snap.val() || 0;
    if (current < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}`);
    }
    batch[prodRef] = current - item.quantity;
  }

  // 4. Write order + stock updates + clear cart
  batch[`orders/${orderId}`] = order;
  batch[`cart/${userId}`] = null; // delete whole cart node

  await db.ref().update(batch);

  return { success: true, orderId, order };
}
}

module.exports = OrderModel;