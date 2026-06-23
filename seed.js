import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (err) {
  console.error("\n❌ Error: 'serviceAccountKey.json' not found.");
  console.error("Download it from: Firebase Console > Project Settings > Service Accounts > Generate new private key\n");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const menuData = [
  {
    title: "ÇORBALAR",
    order: 1,
    items: [
      { id: "1-1", name: "Mercimek Çorbası",  price: "", description: "", imageUrl: "" },
      { id: "1-2", name: "Ezogelin Çorbası",   price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "DÖNER",
    order: 2,
    items: [
      { id: "2-1",  name: "Zurna Döner",            price: "", description: "", imageUrl: "" },
      { id: "2-2",  name: "Bazuka Döner",            price: "", description: "", imageUrl: "" },
      { id: "2-3",  name: "Klasik Döner",            price: "", description: "", imageUrl: "" },
      { id: "2-4",  name: "Muska Döner",             price: "", description: "", imageUrl: "" },
      { id: "2-5",  name: "Pilav Üstü Döner",        price: "", description: "", imageUrl: "" },
      { id: "2-6",  name: "Tavuk İskender",          price: "", description: "", imageUrl: "" },
      { id: "2-7",  name: "İskender",                price: "", description: "", imageUrl: "" },
      { id: "2-8",  name: "Hatay Usulü Döner",       price: "", description: "", imageUrl: "" },
      { id: "2-9",  name: "Antakya Usulü Döner",     price: "", description: "", imageUrl: "" },
      { id: "2-10", name: "Antakya Kaşarlı Döner",   price: "", description: "", imageUrl: "" },
      { id: "2-11", name: "Antakya Tavuklu Döner",   price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "DÜRÜMLER",
    order: 3,
    items: [
      { id: "3-1", name: "Kebap Dürüm",   price: "", description: "", imageUrl: "" },
      { id: "3-2", name: "Et Dürüm",      price: "", description: "", imageUrl: "" },
      { id: "3-3", name: "Kuşbaşı Dürüm", price: "", description: "", imageUrl: "" },
      { id: "3-4", name: "Kıymalı Dürüm", price: "", description: "", imageUrl: "" },
      { id: "3-5", name: "Tavuk Dürüm",   price: "", description: "", imageUrl: "" },
      { id: "3-6", name: "Tavuk Tanuni",  price: "", description: "", imageUrl: "" },
      { id: "3-7", name: "Döner Dürüm",   price: "", description: "", imageUrl: "" },
      { id: "3-8", name: "Ciğer Dürüm",   price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "EKMEK ARASI",
    order: 4,
    items: [
      { id: "4-1", name: "Ekmek Arası Köfte", price: "", description: "", imageUrl: "" },
      { id: "4-2", name: "Ekmek Arası Döner", price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "IZGARA & KEBAP",
    order: 5,
    items: [
      { id: "5-1",  name: "Adana Kebap",           price: "", description: "", imageUrl: "" },
      { id: "5-2",  name: "Urfa Kebabı",            price: "", description: "", imageUrl: "" },
      { id: "5-3",  name: "Viranşehir Kebabı",      price: "", description: "", imageUrl: "" },
      { id: "5-4",  name: "Siverek Kebabı",         price: "", description: "", imageUrl: "" },
      { id: "5-5",  name: "Haşhaş Kebabı",          price: "", description: "", imageUrl: "" },
      { id: "5-6",  name: "Vali Kebabı",            price: "", description: "", imageUrl: "" },
      { id: "5-7",  name: "Patlıcan Kebabı",        price: "", description: "", imageUrl: "" },
      { id: "5-8",  name: "Domatesli Köfte",        price: "", description: "", imageUrl: "" },
      { id: "5-9",  name: "Izgara Köfte",           price: "", description: "", imageUrl: "" },
      { id: "5-10", name: "Köfte Porsiyon",         price: "", description: "", imageUrl: "" },
      { id: "5-11", name: "Satır Köfte",            price: "", description: "", imageUrl: "" },
      { id: "5-12", name: "Et Şiş",                price: "", description: "", imageUrl: "" },
      { id: "5-13", name: "Kuşbaşı Şiş",           price: "", description: "", imageUrl: "" },
      { id: "5-14", name: "Kuşbaşı Servis",         price: "", description: "", imageUrl: "" },
      { id: "5-15", name: "Tavuk Şiş",             price: "", description: "", imageUrl: "" },
      { id: "5-16", name: "Tavuk Kanat",            price: "", description: "", imageUrl: "" },
      { id: "5-17", name: "Tavuk Pirzola",          price: "", description: "", imageUrl: "" },
      { id: "5-18", name: "Tavuklu Karışık Izgara", price: "", description: "", imageUrl: "" },
      { id: "5-19", name: "Karışık Izgara",         price: "", description: "", imageUrl: "" },
      { id: "5-20", name: "Etli Karışık Izgara",    price: "", description: "", imageUrl: "" },
      { id: "5-21", name: "Ciğer Kebabı",           price: "", description: "", imageUrl: "" },
      { id: "5-22", name: "Ciğer Servis",           price: "", description: "", imageUrl: "" },
      { id: "5-23", name: "1 Kg Adana",             price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "TAVUK",
    order: 6,
    items: [
      { id: "6-1", name: "Yarım Tavuk / Piliç",  price: "", description: "", imageUrl: "" },
      { id: "6-2", name: "Izgara Tavuk But",      price: "", description: "", imageUrl: "" },
      { id: "6-3", name: "Tavuk Izgara Tabak",    price: "", description: "", imageUrl: "" },
      { id: "6-4", name: "Tavuk Kanat Servis",    price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "ÖZEL KEBAPLAR",
    order: 7,
    items: [
      { id: "7-1", name: "Beyti Sarma",          price: "", description: "", imageUrl: "" },
      { id: "7-2", name: "Kaşarlı Beyti Kebabı", price: "", description: "", imageUrl: "" },
      { id: "7-3", name: "Sultan Lokması",        price: "", description: "", imageUrl: "" },
    ],
  },
  {
    title: "KARIŞIK TABAKLAR",
    order: 8,
    items: [
      { id: "8-1", name: "Karışık Şiş",          price: "", description: "", imageUrl: "" },
      { id: "8-2", name: "Karışık Izgara Tabak",  price: "", description: "", imageUrl: "" },
    ],
  },
];

async function seed() {
  const collectionRef = db.collection('categories');

  // Clear existing documents first to avoid duplicates
  console.log("Clearing existing categories...");
  const existing = await collectionRef.get();
  await Promise.all(existing.docs.map((d) => d.ref.delete()));
  console.log(`Deleted ${existing.size} existing document(s).`);

  // Add new categories
  console.log("\nSeeding new menu data...");
  for (const category of menuData) {
    await collectionRef.add(category);
    console.log(`✓ ${category.title} (${category.items.length} items)`);
  }

  console.log(`\n✅ Done! ${menuData.length} categories seeded.`);
  process.exit();
}

seed().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
