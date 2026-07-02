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

async function fixRedundancies() {
  const collectionRef = db.collection('categories');
  const snapshot = await collectionRef.get();

  let durumlerDoc = null, ozelKebaplarDoc = null, donerDoc = null;

  for (const doc of snapshot.docs) {
    const title = doc.data().title;
    if (title === 'DÜRÜMLER')      durumlerDoc     = doc;
    if (title === 'ÖZEL KEBAPLAR') ozelKebaplarDoc = doc;
    if (title === 'DÖNER')         donerDoc        = doc;
  }

  // 1. Remove "Tavuk Tanuni" from DÜRÜMLER
  if (durumlerDoc) {
    const items = durumlerDoc.data().items;
    const before = items.length;
    const updated = items.filter(i => i.name !== 'Tavuk Tanuni');
    if (updated.length < before) {
      await durumlerDoc.ref.update({ items: updated });
      console.log('✓ Removed "Tavuk Tanuni" from DÜRÜMLER');
    } else {
      console.log('⚠  "Tavuk Tanuni" not found in DÜRÜMLER — already removed?');
    }
  } else {
    console.log('⚠  DÜRÜMLER category not found');
  }

  // 2. Move "Sultan Lokması" from ÖZEL KEBAPLAR to DÖNER
  if (ozelKebaplarDoc && donerDoc) {
    const ozelItems = ozelKebaplarDoc.data().items;
    const sultanItem = ozelItems.find(i => i.name === 'Sultan Lokması');

    if (sultanItem) {
      // Remove from ÖZEL KEBAPLAR
      await ozelKebaplarDoc.ref.update({
        items: ozelItems.filter(i => i.name !== 'Sultan Lokması'),
      });

      // Add to DÖNER
      const donerItems = donerDoc.data().items;
      await donerDoc.ref.update({
        items: [...donerItems, sultanItem],
      });

      console.log('✓ Moved "Sultan Lokması" from ÖZEL KEBAPLAR → DÖNER');
    } else {
      console.log('⚠  "Sultan Lokması" not found in ÖZEL KEBAPLAR — already moved?');
    }
  } else {
    if (!ozelKebaplarDoc) console.log('⚠  ÖZEL KEBAPLAR category not found');
    if (!donerDoc)         console.log('⚠  DÖNER category not found');
  }

  console.log('\n✅ Done!');
  process.exit();
}

fixRedundancies().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
