const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ── validateOrder ─────────────────────────────────────────────────────────────
// Fires on every new order. Cancels the order if:
//   1. An ordered item doesn't exist in the menu
//   2. An ordered item is marked available: false
//   3. total_price doesn't match the sum of catalog prices × quantities (±1 ₺ tolerance)
//
// This closes the REST API bypass where a customer could submit a manipulated
// total_price or order items that are marked unavailable via direct Firestore writes.
exports.validateOrder = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap) => {
    const order = snap.data();

    // Only validate pending orders (shouldn't be otherwise on create, but be safe)
    if (order.status !== 'pending') return null;

    // Build item catalog from all categories
    const categoriesSnap = await db.collection('categories').get();
    const itemMap = new Map(); // itemId → { price, available, name }
    categoriesSnap.forEach((doc) => {
      (doc.data().items || []).forEach((item) => {
        const price = parseFloat(String(item.price || '0').replace(/[^\d.]/g, ''));
        itemMap.set(item.id, {
          price:     isNaN(price) ? 0 : price,
          available: item.available !== false, // default: available
          name:      item.name || item.id,
        });
      });
    });

    const orderItems = order.order_items || [];

    // 1. Availability check
    for (const oi of orderItems) {
      const catalog = itemMap.get(oi.id);
      if (!catalog) {
        await snap.ref.update({
          status:        'cancelled',
          cancel_reason: 'Ürün artık mevcut değil.',
        });
        return null;
      }
      if (!catalog.available) {
        await snap.ref.update({
          status:        'cancelled',
          cancel_reason: `${catalog.name} şu an mevcut değil.`,
        });
        return null;
      }
    }

    // 2. Price integrity check
    const expectedTotal = orderItems.reduce((sum, oi) => {
      const catalog = itemMap.get(oi.id);
      return sum + (catalog ? catalog.price * (oi.quantity || 1) : 0);
    }, 0);

    if (Math.abs(expectedTotal - (order.total_price || 0)) > 1) {
      await snap.ref.update({
        status:        'cancelled',
        cancel_reason: 'Fiyat doğrulanamadı.',
      });
      return null;
    }

    return null;
  });
