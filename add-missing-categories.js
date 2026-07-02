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

const newCategories = [
  {
    title: "TAVUK TANTUNİLER",
    order: 9,
    items: [
      { id: crypto.randomUUID(), name: "Tavuk Tantuni Lavaş",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Tantuni Somun",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Tantuni Yoğurtlu", price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "ET TANTUNİLER",
    order: 10,
    items: [
      { id: crypto.randomUUID(), name: "Et Tantuni Lavaş",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Et Tantuni Somun",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Et Tantuni Yoğurtlu", price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "BİFTEK TANTUNİLER",
    order: 11,
    items: [
      { id: crypto.randomUUID(), name: "Biftek Tantuni Lavaş",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Biftek Tantuni Somun",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Biftek Tantuni Yoğurtlu", price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "MENÜLÜ DÜRÜMLER",
    order: 12,
    items: [
      { id: crypto.randomUUID(), name: "Ankara Özel Dürüm",         price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Ankara Özel Kaşarlı Dürüm", price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Ciğer Dürüm + Ayran",       price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Kuşbaşı Dürüm + Ayran",     price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Dürüm + Ayran",       price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "KG'LİK ÜRÜNLER",
    order: 13,
    items: [
      { id: crypto.randomUUID(), name: "Adana Kebap (Kg)", price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Karışık",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Pirzola",    price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Kanat",      price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Tavuk Sarma",      price: "", description: "", imageUrl: "" },
      { id: crypto.randomUUID(), name: "Kuzu Kuş Başı",    price: "", description: "", imageUrl: "" },
    ],
  },
];

async function addCategories() {
  const collectionRef = db.collection('categories');

  // Check which titles already exist so we don't duplicate
  const existing = await collectionRef.get();
  const existingTitles = new Set(existing.docs.map(d => d.data().title));

  console.log(`\nExisting categories: ${[...existingTitles].join(', ')}\n`);

  for (const category of newCategories) {
    if (existingTitles.has(category.title)) {
      console.log(`⏭  Skipping "${category.title}" — already exists`);
      continue;
    }
    await collectionRef.add(category);
    console.log(`✓ Added "${category.title}" (${category.items.length} items)`);
  }

  console.log('\n✅ Done! Existing data was not modified.');
  process.exit();
}

addCategories().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
