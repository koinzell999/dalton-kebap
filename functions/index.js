const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Builds itemId → { price, available, name } from the categories collection.
async function buildItemMap() {
  const snap = await db.collection('categories').get();
  const map  = new Map();
  snap.forEach((doc) => {
    (doc.data().items || []).forEach((item) => {
      const price = parseFloat(String(item.price || '0').replace(/[^\d.]/g, ''));
      map.set(item.id, {
        price:     isNaN(price) ? 0 : price,
        available: item.available !== false,
        name:      item.name || item.id,
      });
    });
  });
  return map;
}

// Validates order_items and total_price against the catalog.
// Returns null if valid, or an object { cancel_reason } if invalid.
async function validateItems(orderItems, totalPrice) {
  const itemMap = await buildItemMap();

  for (const oi of orderItems) {
    const catalog = itemMap.get(oi.id);
    if (!catalog) return { cancel_reason: 'Ürün artık mevcut değil.' };
    if (!catalog.available) return { cancel_reason: `${catalog.name} şu an mevcut değil.` };
  }

  const expected = orderItems.reduce((sum, oi) => {
    const catalog = itemMap.get(oi.id);
    return sum + (catalog ? catalog.price * (oi.quantity || 1) : 0);
  }, 0);

  if (Math.abs(expected - (totalPrice || 0)) > 1) {
    return { cancel_reason: 'Fiyat doğrulanamadı.' };
  }

  return null;
}

// ── validateOrder (onCreate) ──────────────────────────────────────────────────
// Validates every new order. Cancels if items are invalid or price is wrong.
exports.validateOrder = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap) => {
    const order = snap.data();
    if (order.status !== 'pending') return null;

    const invalid = await validateItems(order.order_items || [], order.total_price);
    if (invalid) {
      await snap.ref.update({ status: 'cancelled', cancel_reason: invalid.cancel_reason });
    }
    return null;
  });

// ── validateOrderEdit (onUpdate) ─────────────────────────────────────────────
// Re-validates whenever a pending order's items or price are edited.
// Closes the bypass where a customer could edit via direct Firestore API
// after the onCreate CF already approved the original order.
exports.validateOrderEdit = functions
  .region('europe-west1')
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after  = change.after.data();

    // Only care about edits that keep the order pending
    if (before.status !== 'pending' || after.status !== 'pending') return null;

    // Only re-validate when items or price actually changed
    const itemsChanged = JSON.stringify(before.order_items) !== JSON.stringify(after.order_items);
    const priceChanged = before.total_price !== after.total_price;
    if (!itemsChanged && !priceChanged) return null;

    const invalid = await validateItems(after.order_items || [], after.total_price);
    if (invalid) {
      await change.after.ref.update({ status: 'cancelled', cancel_reason: invalid.cancel_reason });
    }
    return null;
  });
