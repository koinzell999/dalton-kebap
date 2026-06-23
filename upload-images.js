import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch {
  console.error("❌ serviceAccountKey.json not found.");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'dalton-kebap.firebasestorage.app',
});

const db = getFirestore();
const bucket = getStorage().bucket();

const IMAGE_FOLDER = 'F:\\downloads edge\\yemekresimlere';

const NAME_TO_FILE = {
  // ÇORBALAR
  "Mercimek Çorbası":          "mercimek.jpg",
  "Ezogelin Çorbası":          "ezogelincorba.webp",
  // DÖNER
  "Zurna Döner":               "zurna döner.jpg",
  "Bazuka Döner":              "bazuka.jpg",
  "Klasik Döner":              "klasık döner.webp",
  "Muska Döner":               "muska döner.jpeg",
  "Pilav Üstü Döner":          "pilav üstü döner.jpg",
  "Tavuk İskender":            "selale_tavuk_iskender.jpg",
  "İskender":                  "iskender.jpg",
  "Hatay Usulü Döner":         "hatay.jpg",
  "Antakya Usulü Döner":       "3 antakya.jpg",
  "Antakya Kaşarlı Döner":     "antakya kaşarlı.webp",
  "Antakya Tavuklu Döner":     "antakya.jpg",
  // DÜRÜMLER
  "Kebap Dürüm":               "WhatsApp Image 2025-10-01 at 17.22.11 (2).jpeg",
  "Et Dürüm":                  "WhatsApp Image 2025-10-01 at 17.22.10 (1).jpeg",
  "Kuşbaşı Dürüm":             "kuşbaşı dürüm.jpg",
  "Kıymalı Dürüm":             "WhatsApp Image 2025-10-01 at 17.22.10 (2).jpeg",
  "Tavuk Dürüm":               "tavuk dürüm.jpg",
  "Tavuk Tanuni":              "tavuk tanuni.jfif",
  "Döner Dürüm":               "tavuk-durum-d7f5aeca-e8f0-4eda-9f18-56c68b718912.jpg",
  "Ciğer Dürüm":               "ciger-durum.jpg",
  // EKMEK ARASI
  "Ekmek Arası Köfte":         "ekmek arası köfte.webp",
  "Ekmek Arası Döner":         "ekmek döner.jpg",
  // IZGARA & KEBAP
  "Adana Kebap":               "WhatsApp Image 2025-10-01 at 17.22.11.jpeg",
  "Urfa Kebabı":               "urfa servis.jpg",
  "Viranşehir Kebabı":         "viranşehir.jpg",
  "Siverek Kebabı":            "siverek kebabı.jpg",
  "Haşhaş Kebabı":             "hasşhaş.jpg",
  "Vali Kebabı":               "vali-kebabi.jpg",
  "Patlıcan Kebabı":           "patlıcan kebabı.jpg",
  "Domatesli Köfte":           "domatesli_day.jpeg",
  "Izgara Köfte":              "kofte-1.jpg",
  "Köfte Porsiyon":            "köfte.jpg",
  "Satır Köfte":               "satır köfte servis.jpg",
  "Et Şiş":                    "kesbasi-sis-kebab-tarifi.jpg",
  "Kuşbaşı Şiş":               "kuşbaşı servis.webp",
  "Kuşbaşı Servis":            "kusbasi-servis.jpg",
  "Tavuk Şiş":                 "tavuk şiş.jpeg",
  "Tavuk Kanat":               "WhatsApp Image 2025-10-01 at 17.33.48.jpeg",
  "Tavuk Pirzola":             "TavukPirzola_kare.jpg",
  "Tavuklu Karışık Izgara":    "tavuklu karışık ızgara.jpg",
  "Karışık Izgara":            "WhatsApp Image 2025-10-01 at 17.33.49.jpeg",
  "Etli Karışık Izgara":       "etli karışık ızgra.jpg",
  "Ciğer Kebabı":              "famous-urfa-meat-liver-ciger-600nw-2194030713.webp",
  "Ciğer Servis":              "ciğer servis.jpg",
  "1 Kg Adana":                "1 kg adana.jpeg",
  // TAVUK
  "Yarım Tavuk / Piliç":       "WhatsApp Image 2025-10-01 at 19.01.04.jpeg",
  "Izgara Tavuk But":          "WhatsApp Image 2025-10-01 at 17.22.11 (7).jpeg",
  "Tavuk Izgara Tabak":        "WhatsApp Image 2025-10-01 at 17.22.11 (1).jpeg",
  "Tavuk Kanat Servis":        "kanat servis.jpeg",
  // ÖZEL KEBAPLAR
  "Beyti Sarma":               "beyti sarma.jpeg",
  "Kaşarlı Beyti Kebabı":      "images (1).jpeg",
  "Sultan Lokması":            "sultan lokması.jpg",
  // KARIŞIK TABAKLAR
  "Karışık Şiş":               "images.jpeg",
  "Karışık Izgara Tabak":      "WhatsApp Image 2025-10-01 at 17.33.49 (1).jpeg",
};

function getContentType(filename) {
  const ext = extname(filename).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png')  return 'image/png';
  return 'image/jpeg'; // .jpg .jpeg .jfif
}

async function run() {
  console.log(`📂 Image folder: ${IMAGE_FOLDER}\n`);

  const snap = await db.collection('categories').orderBy('order').get();
  const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let uploaded = 0, alreadyDone = 0, missing = 0;

  for (const cat of categories) {
    console.log(`\n── ${cat.title} ──`);
    const updatedItems = cat.items.map((i) => ({ ...i }));
    let catChanged = false;

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      const filename = NAME_TO_FILE[item.name];

      if (!filename) {
        console.log(`  ⚠️  No image mapped: ${item.name}`);
        continue;
      }

      // Skip if already has a URL
      if (item.imageUrl && item.imageUrl.startsWith('https://')) {
        console.log(`  ⏭  Already uploaded: ${item.name}`);
        alreadyDone++;
        continue;
      }

      const localPath = join(IMAGE_FOLDER, filename);
      if (!existsSync(localPath)) {
        console.log(`  ❌ File not found: ${filename}`);
        missing++;
        continue;
      }

      const storagePath = `menu-items/${cat.id}/${item.id}`;
      const token = randomUUID();

      await bucket.upload(localPath, {
        destination: storagePath,
        metadata: {
          contentType: getContentType(filename),
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

      const imageUrl =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
        `${encodeURIComponent(storagePath)}?alt=media&token=${token}`;

      updatedItems[i] = { ...item, imageUrl };
      catChanged = true;
      uploaded++;
      console.log(`  ✓ ${item.name}`);
    }

    if (catChanged) {
      await db.collection('categories').doc(cat.id).update({ items: updatedItems });
    }
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`✅ Uploaded:      ${uploaded}`);
  console.log(`⏭  Already done:  ${alreadyDone}`);
  console.log(`❌ Missing files: ${missing}`);
  console.log(`${'─'.repeat(40)}\n`);
  process.exit();
}

run().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
