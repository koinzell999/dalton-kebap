/**
 * test-order-flow.js — end-to-end order flow test
 * Requires serviceAccountKey.json in the project root.
 * Usage: node test-order-flow.js
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const PASS = '✓';
const FAIL = '✗';

function fmt(p) { return `${p} ₺`; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('\n═══ Dalton Kebap — End-to-end order flow test ═══\n');

  // ── 1. CREATE order ────────────────────────────────────
  console.log('Step 1: Customer submits order (table 99, test order)');
  const orderData = {
    table_id: 99,
    order_items: [
      { id: 'test-1', name: 'Adana Kebap Servis', price: 400, quantity: 2 },
      { id: 'test-2', name: 'Ayran',              price: 30,  quantity: 3 },
    ],
    total_price: 890,
    status: 'pending',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await db.collection('orders').add(orderData);
  console.log(`  ${PASS} Created order ${ref.id}`);

  // ── 2. VERIFY pending ──────────────────────────────────
  console.log('\nStep 2: Verify order is readable and status is "pending"');
  const snap1 = await ref.get();
  const d1 = snap1.data();
  const checks2 = [
    [d1.status === 'pending',                    'status == pending'],
    [d1.table_id === 99,                         'table_id == 99'],
    [d1.order_items.length === 2,                'order_items has 2 rows'],
    [d1.total_price === 890,                     'total_price == 890'],
    [d1.order_items[0].name === 'Adana Kebap Servis', 'item[0].name correct'],
    [d1.timestamp != null,                       'timestamp set by server'],
  ];
  checks2.forEach(([ok, label]) => console.log(`  ${ok ? PASS : FAIL} ${label}`));

  // ── 3. KITCHEN query ───────────────────────────────────
  console.log('\nStep 3: Kitchen panel query — pending orders ordered by timestamp');
  // No orderBy — matches kitchen.html which sorts client-side to avoid composite index
  const kitchenSnap = await db.collection('orders')
    .where('status', '==', 'pending')
    .get();
  const found = kitchenSnap.docs.some(d => d.id === ref.id);
  console.log(`  ${found ? PASS : FAIL} Test order appears in kitchen query (${kitchenSnap.size} total pending)`);

  // ── 4. MARK served ─────────────────────────────────────
  await sleep(500);
  console.log('\nStep 4: Kitchen marks order as served');
  await ref.update({ status: 'served' });
  const snap2 = await ref.get();
  console.log(`  ${snap2.data().status === 'served' ? PASS : FAIL} status == served`);

  // ── 5. CASHIER open query ──────────────────────────────
  console.log('\nStep 5: Cashier open-tickets query — pending + served');
  const cashierSnap = await db.collection('orders')
    .where('status', 'in', ['pending', 'served'])
    .get();
  const inCashier = cashierSnap.docs.some(d => d.id === ref.id);
  console.log(`  ${inCashier ? PASS : FAIL} Served order visible to cashier (${cashierSnap.size} total open)`);

  // ── 6. CLOSE ticket ────────────────────────────────────
  await sleep(500);
  console.log('\nStep 6: Cashier closes ticket (marks paid)');
  await ref.update({ status: 'paid' });
  const snap3 = await ref.get();
  console.log(`  ${snap3.data().status === 'paid' ? PASS : FAIL} status == paid`);

  // ── 7. VERIFY gone from open queue ────────────────────
  console.log('\nStep 7: Verify order is gone from open-tickets query');
  const afterSnap = await db.collection('orders')
    .where('status', 'in', ['pending', 'served'])
    .get();
  const stillOpen = afterSnap.docs.some(d => d.id === ref.id);
  console.log(`  ${!stillOpen ? PASS : FAIL} Order no longer in open queue`);

  // ── 8. PAID history query ──────────────────────────────
  console.log('\nStep 8: Verify order appears in paid history query');
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const paidSnap = await db.collection('orders')
    .where('status', '==', 'paid')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(todayStart))
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
  const inHistory = paidSnap.docs.some(d => d.id === ref.id);
  console.log(`  ${inHistory ? PASS : FAIL} Order in paid history (${paidSnap.size} paid today)`);

  // ── 9. CUSTOMER snapshot check ─────────────────────────
  console.log('\nStep 9: Customer onSnapshot — direct doc read returns "paid"');
  const finalSnap = await ref.get();
  console.log(`  ${finalSnap.data().status === 'paid' ? PASS : FAIL} Direct doc read status == paid`);

  // ── 10. CLEANUP ────────────────────────────────────────
  console.log('\nStep 10: Cleaning up test order');
  await ref.delete();
  const deletedSnap = await ref.get();
  console.log(`  ${!deletedSnap.exists ? PASS : FAIL} Test order deleted`);

  console.log('\n═══ Test complete ═══\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\nTest failed with error:', err.message);
  if (err.message.includes('index')) {
    console.error('→ Composite index not yet ready. Wait ~2 minutes and retry.');
  }
  process.exit(1);
});
