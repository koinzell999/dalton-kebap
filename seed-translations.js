/**
 * seed-translations.js — bulk translation helper for Dalton's Kebap
 *
 * Requires serviceAccountKey.json in the project root.
 *
 * Usage:
 *   node seed-translations.js export   → writes translations.json with all current items/categories
 *   node seed-translations.js import   → reads translations.json and writes translations to Firestore
 */

import admin from 'firebase-admin';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

if (!existsSync('./serviceAccountKey.json')) {
  console.error('ERROR: serviceAccountKey.json not found in project root.');
  process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const [,, command] = process.argv;

if (command === 'export') {
  await runExport();
} else if (command === 'import') {
  await runImport();
} else {
  console.log('Usage:');
  console.log('  node seed-translations.js export   # Generate translations.json template');
  console.log('  node seed-translations.js import   # Apply translations.json to Firestore');
  process.exit(0);
}

// ── EXPORT ─────────────────────────────────────────────────────────────────

async function runExport() {
  console.log('Fetching categories from Firestore...');
  const snap = await db.collection('categories').orderBy('order').get();

  const out = { categories: {}, items: {} };

  for (const doc of snap.docs) {
    const data = doc.data();

    // Category entry
    out.categories[doc.id] = {
      _title_tr:  data.title         || '',
      title_en:   data.title_en      || '',
      title_ar:   data.title_ar      || '',
    };

    // Item entries
    for (const item of (data.items || [])) {
      out.items[item.id] = {
        _category:      data.title   || doc.id,
        _name_tr:       item.name    || '',
        _description_tr: item.description || '',
        name_en:         item.name_en        || '',
        name_ar:         item.name_ar        || '',
        description_en:  item.description_en || '',
        description_ar:  item.description_ar || '',
      };
    }
  }

  const catCount  = Object.keys(out.categories).length;
  const itemCount = Object.keys(out.items).length;

  writeFileSync('translations.json', JSON.stringify(out, null, 2), 'utf8');
  console.log(`Exported ${catCount} categories and ${itemCount} items → translations.json`);
  console.log('');
  console.log('Instructions:');
  console.log('  1. Open translations.json');
  console.log('  2. Fill in the English and Arabic values (fields starting with _ are read-only hints)');
  console.log('  3. Run:  node seed-translations.js import');
}

// ── IMPORT ─────────────────────────────────────────────────────────────────

async function runImport() {
  if (!existsSync('translations.json')) {
    console.error('ERROR: translations.json not found. Run "export" first.');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync('translations.json', 'utf8'));
  const { categories = {}, items = {} } = data;

  console.log('Fetching categories from Firestore...');
  const snap = await db.collection('categories').orderBy('order').get();

  let updatedCats  = 0;
  let updatedItems = 0;
  let skipped      = 0;

  for (const docSnap of snap.docs) {
    const catData = docSnap.data();
    const catTrans = categories[docSnap.id];

    // Build updated category fields
    const catUpdate = {};
    if (catTrans) {
      if (catTrans.title_en !== undefined) catUpdate.title_en = catTrans.title_en;
      if (catTrans.title_ar !== undefined) catUpdate.title_ar = catTrans.title_ar;
    }

    // Build updated items array
    const newItems = (catData.items || []).map((item) => {
      const trans = items[item.id];
      if (!trans) { skipped++; return item; }

      const updated = { ...item };
      if (trans.name_en        !== undefined) updated.name_en        = trans.name_en;
      if (trans.name_ar        !== undefined) updated.name_ar        = trans.name_ar;
      if (trans.description_en !== undefined) updated.description_en = trans.description_en;
      if (trans.description_ar !== undefined) updated.description_ar = trans.description_ar;

      updatedItems++;
      return updated;
    });

    const hasItemChanges = newItems.some((item, i) =>
      JSON.stringify(item) !== JSON.stringify((catData.items || [])[i])
    );

    if (Object.keys(catUpdate).length > 0 || hasItemChanges) {
      await db.collection('categories').doc(docSnap.id).update({
        ...catUpdate,
        items: newItems,
      });
      if (Object.keys(catUpdate).length > 0) updatedCats++;
      console.log(`  ✓ ${catData.title}`);
    }
  }

  console.log('');
  console.log(`Done: ${updatedCats} categories and ${updatedItems} items updated.`);
  if (skipped > 0) console.log(`      ${skipped} items had no matching entry in translations.json (skipped).`);
}
