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

const descriptions = JSON.parse(readFileSync('./descriptions.json', 'utf8'));
const descMap = new Map(descriptions.map(d => [d.name, d]));

async function updateDescriptions() {
  const snapshot = await db.collection('categories').get();
  let updated = 0, skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let changed = false;

    const newItems = data.items.map(item => {
      const match = descMap.get(item.name);
      if (match && !item.description) {
        changed = true;
        updated++;
        return {
          ...item,
          description: match.description,
          description_en: match.description_en,
          description_ar: match.description_ar,
        };
      }
      skipped++;
      return item;
    });

    if (changed) {
      await doc.ref.update({ items: newItems });
      console.log(`✓ Updated "${data.title}"`);
    }
  }

  console.log(`\n✅ Done! ${updated} items updated, ${skipped} already had descriptions or no match.`);
  process.exit();
}

updateDescriptions().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
