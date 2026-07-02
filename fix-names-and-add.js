import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (err) {
  console.error("\n❌ Error: 'serviceAccountKey.json' not found.");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function fixNamesAndAdd() {
  const snapshot = await db.collection('categories').get();

  let durumlerDoc = null, donerDoc = null, tavukDoc = null;

  for (const doc of snapshot.docs) {
    const title = doc.data().title;
    if (title === 'DÜRÜMLER') durumlerDoc = doc;
    if (title === 'DÖNER')    donerDoc    = doc;
    if (title === 'TAVUK')    tavukDoc    = doc;
  }

  // 1. Rename "Kebap Dürüm" → "Adana Dürüm" in DÜRÜMLER
  if (durumlerDoc) {
    const items = durumlerDoc.data().items.map(i =>
      i.name === 'Kebap Dürüm' ? { ...i, name: 'Adana Dürüm' } : i
    );
    await durumlerDoc.ref.update({ items });
    console.log('✓ Renamed "Kebap Dürüm" → "Adana Dürüm"');
  }

  // 2. In DÖNER: rename İskender + Antakya Usulü Döner, add Dalton Döner
  if (donerDoc) {
    let items = donerDoc.data().items.map(i => {
      if (i.name === 'İskender')            return { ...i, name: 'İskender Döner' };
      if (i.name === 'Antakya Usulü Döner') return { ...i, name: 'Antakya Döner' };
      return i;
    });

    const alreadyHasDalton = items.some(i => i.name === 'Dalton Döner');
    if (!alreadyHasDalton) {
      items.push({ id: crypto.randomUUID(), name: 'Dalton Döner', price: '', description: '', imageUrl: '' });
      console.log('✓ Added "Dalton Döner" to DÖNER');
    } else {
      console.log('⏭  "Dalton Döner" already exists');
    }

    await donerDoc.ref.update({ items });
    console.log('✓ Renamed "İskender" → "İskender Döner"');
    console.log('✓ Renamed "Antakya Usulü Döner" → "Antakya Döner"');
  }

  // 3. Add "Tavuk Sarma Şiş" to TAVUK
  if (tavukDoc) {
    const items = tavukDoc.data().items;
    const alreadyExists = items.some(i => i.name === 'Tavuk Sarma Şiş');
    if (!alreadyExists) {
      await tavukDoc.ref.update({
        items: [...items, { id: crypto.randomUUID(), name: 'Tavuk Sarma Şiş', price: '', description: '', imageUrl: '' }],
      });
      console.log('✓ Added "Tavuk Sarma Şiş" to TAVUK');
    } else {
      console.log('⏭  "Tavuk Sarma Şiş" already exists');
    }
  }

  console.log('\n✅ Done!');
  process.exit();
}

fixNamesAndAdd().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
