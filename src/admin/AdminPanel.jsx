import React from 'react';
import { signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {
  collection, getDocs, query, orderBy, where,
  addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useLanguage, localize, formatPrice } from '../i18n';
import { useInactivityLogout } from './useInactivityLogout';

// ── THEME ────────────────────────────────────────────────
const C = {
  bg: '#3d2510',
  card: '#4a2e1a',
  cardAlt: '#5a3820',
  border: '#6b3f22',
  orange: '#f59e0b',
  yellow: '#fcd34d',
  text: '#fef3e2',
  muted: '#c4956a',
  danger: '#c0392b',
  green: '#22c55e',
  inputBg: '#2a1608',
};

// ── SHARED STYLES ────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '16px',
};
const modalStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: '14px', padding: '28px',
  width: '100%', maxWidth: '520px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
};
const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: C.inputBg, border: `1px solid ${C.border}`,
  borderRadius: '8px', color: C.text,
  fontSize: '15px', boxSizing: 'border-box',
  outline: 'none', fontFamily: 'Roboto, sans-serif',
};
const primaryBtn = {
  padding: '10px 20px', background: C.orange,
  color: '#fff', border: 'none', borderRadius: '8px',
  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  fontFamily: 'Roboto, sans-serif',
};
const secondaryBtn = {
  padding: '10px 20px', background: 'transparent',
  color: C.text, border: `1px solid ${C.border}`,
  borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
  fontFamily: 'Roboto, sans-serif',
};
const editBtn = {
  padding: '5px 11px', background: 'transparent',
  color: C.yellow, border: `1px solid ${C.yellow}`,
  borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
};
const dangerBtn = {
  padding: '5px 11px', background: 'transparent',
  color: C.danger, border: `1px solid ${C.danger}`,
  borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
};
const closeBtn = {
  background: 'transparent', border: 'none',
  color: C.muted, fontSize: '20px', cursor: 'pointer', padding: '2px 6px',
};
const errorBox = {
  background: 'rgba(192,57,43,0.15)', border: `1px solid ${C.danger}`,
  borderRadius: '8px', padding: '10px 14px',
  color: '#e74c3c', fontSize: '14px',
};

// ── FIELD ────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', color: C.text, fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── ITEM FORM MODAL ──────────────────────────────────────
function ItemFormModal({ categoryId, item, onSave, onClose, t }) {
  const isEdit = !!item;
  const [name, setName] = React.useState(item?.name || '');
  const [price, setPrice] = React.useState(() => {
    // Strip ₺ so the stored value is always a clean number
    const raw = item?.price || '';
    return raw.trim().replace(/\s*₺\s*$/, '');
  });
  const [portion, setPortion] = React.useState(item?.portion || '');
  const [description, setDescription] = React.useState(item?.description || '');
  const [nameEn, setNameEn] = React.useState(item?.name_en || '');
  const [nameAr, setNameAr] = React.useState(item?.name_ar || '');
  const [descriptionEn, setDescriptionEn] = React.useState(item?.description_en || '');
  const [descriptionAr, setDescriptionAr] = React.useState(item?.description_ar || '');
  const [showTranslations, setShowTranslations] = React.useState(
    !!(item?.name_en || item?.name_ar || item?.description_en || item?.description_ar)
  );
  const [imageUrl, setImageUrl] = React.useState(item?.imageUrl || '');
  const [imageFile, setImageFile] = React.useState(null);
  const [preview, setPreview] = React.useState(item?.imageUrl || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setImageUrl('');
  }

  function handleUrlChange(e) {
    setImageUrl(e.target.value);
    if (!imageFile) setPreview(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      setError(t('nameAndPriceRequired'));
      return;
    }
    const priceNum = parseFloat(price.trim().replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(t('invalidPrice'));
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const itemId = item?.id || crypto.randomUUID();
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const storageRef = ref(storage, `menu-items/${categoryId}/${itemId}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      await onSave({
        id: itemId,
        name: name.trim(),
        price: price.trim().replace(/\s*₺\s*$/, ''),
        portion: portion.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        name_en: nameEn.trim(),
        name_ar: nameAr.trim(),
        description_en: descriptionEn.trim(),
        description_ar: descriptionAr.trim(),
      });
      onClose();
    } catch (err) {
      setError(t('saveFailed') + ': ' + err.message);
      setIsSaving(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: C.yellow, fontSize: '18px' }}>
            {isEdit ? t('editItem') : t('addNewItem')}
          </h2>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label={`${t('itemName')} *`}>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Adana Kebap" style={inputStyle} />
          </Field>

          <Field label={`${t('itemPrice')} *`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="400" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ color: C.muted, fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>₺</span>
            </div>
          </Field>

          <Field label={t('itemPortion')}>
            <input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder={t('portionHint')} style={inputStyle} />
          </Field>

          <Field label={t('itemDescription')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
            />
          </Field>

          {/* ── Translations ── */}
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setShowTranslations(v => !v)}
              style={{ background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '7px 14px', color: C.muted, cursor: 'pointer', fontSize: '13px', width: '100%', textAlign: 'left' }}
            >
              {showTranslations ? '▾' : '▸'} {t('translationsSection')}
            </button>
          </div>
          {showTranslations && (
            <>
              <Field label={t('nameEn')}>
                <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Adana Kebab" style={inputStyle} />
              </Field>
              <Field label={t('descriptionEn')}>
                <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: '56px' }} />
              </Field>
              <Field label={t('nameAr')}>
                <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: كباب عدنة" style={{ ...inputStyle, direction: 'rtl' }} />
              </Field>
              <Field label={t('descriptionAr')}>
                <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: '56px', direction: 'rtl' }} />
              </Field>
            </>
          )}

          <Field label={t('itemImage')}>
            {preview && (
              <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', background: C.inputBg }}>
                <img src={preview} alt={t('imagePreview')} style={{ width: '100%', objectFit: 'cover', maxHeight: '180px', display: 'block' }} onError={() => setPreview('')} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', color: C.text, fontSize: '13px' }}>
                <span>📁</span>
                <span>{t('uploadFromFile')}</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              <div style={{ color: C.muted, fontSize: '12px', textAlign: 'center' }}>{t('orEnterUrl')}</div>
              <input
                value={imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                style={inputStyle}
              />
            </div>
          </Field>

          {error && <div style={{ ...errorBox, marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={secondaryBtn}>{t('cancel')}</button>
            <button type="submit" disabled={isSaving} style={{ ...primaryBtn, flex: 1, opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? t('saving') : (isEdit ? t('update') : t('add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CATEGORY FORM MODAL ──────────────────────────────────
function CategoryFormModal({ category, onSave, onClose, t }) {
  const isEdit = !!category;
  const [title, setTitle] = React.useState(category?.title || '');
  const [order, setOrder] = React.useState(category?.order ?? '');
  const [titleEn, setTitleEn] = React.useState(category?.title_en || '');
  const [titleAr, setTitleAr] = React.useState(category?.title_ar || '');
  const [showTranslations, setShowTranslations] = React.useState(!!(category?.title_en || category?.title_ar));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError(t('categoryNameRequired')); return; }
    setError('');
    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), order: Number(order) || 0, title_en: titleEn.trim(), title_ar: titleAr.trim() });
      onClose();
    } catch (err) {
      setError(t('saveFailed') + ': ' + err.message);
      setIsSaving(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: C.yellow, fontSize: '18px' }}>{isEdit ? t('editCategory') : t('newCategory')}</h2>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label={`${t('categoryName')} *`}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="IZGARA VE KEBAP" style={inputStyle} />
          </Field>
          <Field label={t('orderSortHint')}>
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="1" style={inputStyle} />
          </Field>
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setShowTranslations(v => !v)}
              style={{ background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '7px 14px', color: C.muted, cursor: 'pointer', fontSize: '13px', width: '100%', textAlign: 'left' }}
            >
              {showTranslations ? '▾' : '▸'} {t('translationsSection')}
            </button>
          </div>
          {showTranslations && (
            <>
              <Field label={t('titleEn')}>
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. GRILLS AND KEBAB" style={inputStyle} />
              </Field>
              <Field label={t('titleAr')}>
                <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="مثال: مشويات وكباب" style={{ ...inputStyle, direction: 'rtl' }} />
              </Field>
            </>
          )}
          {error && <div style={{ ...errorBox, marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={secondaryBtn}>{t('cancel')}</button>
            <button type="submit" disabled={isSaving} style={{ ...primaryBtn, flex: 1, opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? t('saving') : (isEdit ? t('update') : t('add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DELETE GUARD MODAL ───────────────────────────────────
function DeleteGuardModal({ message, onConfirm, onClose, busy, t, userEmail }) {
  const [password, setPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [isChecking, setIsChecking] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setAuthError('');
    setIsChecking(true);
    try {
      const credential = EmailAuthProvider.credential(userEmail, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      onConfirm(); // reauth succeeded — let parent handle the actual delete + its own errors
    } catch {
      setAuthError(t('loginError'));
      setIsChecking(false);
    }
  }

  const working = busy || isChecking;
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: '400px', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ color: C.text, fontSize: '15px', margin: '0 0 20px 0', lineHeight: '1.6' }}>{message}</p>
        <form onSubmit={handleSubmit}>
          <Field label={t('confirmDeletePassword')}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              style={inputStyle}
            />
          </Field>
          {authError && <div style={{ ...errorBox, marginBottom: '16px' }}>{authError}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} disabled={working} style={secondaryBtn}>{t('cancel')}</button>
            <button type="submit" disabled={working || !password.trim()} style={{ ...primaryBtn, background: C.danger, opacity: working ? 0.7 : 1 }}>
              {working ? t('deleting') : t('confirmDeleteAction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── LANG SWITCHER ─────────────────────────────────────────
function LangSwitcher({ lang, setLang }) {
  const flags = { tr: '🇹🇷', en: '🇬🇧', ar: '🇸🇦' };
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {['tr', 'en', 'ar'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            padding: '4px 10px',
            background: lang === code ? C.orange : 'transparent',
            color: lang === code ? '#fff' : C.muted,
            border: `1px solid ${lang === code ? C.orange : C.border}`,
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: lang === code ? '700' : '400',
            fontFamily: 'Roboto, sans-serif',
          }}
        >
          {flags[code]} {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── MAIN PANEL ───────────────────────────────────────────
export default function AdminPanel({ user, onInactivityLogout }) {
  const { t, lang, setLang, isRTL } = useLanguage('manual');
  const { showWarning } = useInactivityLogout(onInactivityLogout);

  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState('');

  const categoriesRef = React.useRef(categories);
  React.useEffect(() => { categoriesRef.current = categories; }, [categories]);

  const [catModal, setCatModal] = React.useState(null);
  const [itemModal, setItemModal] = React.useState(null);
  const [confirmModal, setConfirmModal] = React.useState(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);
  const [adminSearch, setAdminSearch] = React.useState('');
  const [lightboxSrc, setLightboxSrc] = React.useState(null);
  const [adminTab, setAdminTab] = React.useState('menu');
  const [todayOrders, setTodayOrders] = React.useState([]);
  const [todayOrdersLoading, setTodayOrdersLoading] = React.useState(false);

  // ── FETCH ──────────────────────────────────────────────
  async function fetchCategories() {
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFetchError('');
    } catch (err) {
      setFetchError(t('fetchError') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchCategories(); }, []);

  // ── Today's paid orders ────────────────────────────────
  React.useEffect(() => {
    if (adminTab !== 'orders') return;
    setTodayOrdersLoading(true);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'paid'),
      where('timestamp', '>=', Timestamp.fromDate(todayStart)),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q,
      snap => { setTodayOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setTodayOrdersLoading(false); },
      () => setTodayOrdersLoading(false)
    );
    return unsub;
  }, [adminTab]);

  React.useEffect(() => {
    if (!lightboxSrc) return;
    function onKey(e) { if (e.key === 'Escape') setLightboxSrc(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxSrc]);

  // ── CATEGORY CRUD ──────────────────────────────────────
  async function handleSaveCategory(data) {
    const fields = { title: data.title, order: data.order, title_en: data.title_en, title_ar: data.title_ar };
    if (catModal?.id) {
      await updateDoc(doc(db, 'categories', catModal.id), fields);
    } else {
      await addDoc(collection(db, 'categories'), { ...fields, items: [] });
    }
    await fetchCategories();
  }

  // ── ITEM CRUD ──────────────────────────────────────────
  async function handleSaveItem(categoryId, itemData) {
    const cat = categoriesRef.current.find((c) => c.id === categoryId);
    if (!cat) return;
    const idx = cat.items.findIndex((i) => i.id === itemData.id);
    const newItems = idx >= 0
      ? cat.items.map((i) => (i.id === itemData.id ? itemData : i))
      : [...cat.items, itemData];
    await updateDoc(doc(db, 'categories', categoryId), { items: newItems });
    await fetchCategories();
  }

  // ── STORAGE CLEANUP ────────────────────────────────────
  async function deleteStorageImage(imageUrl) {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) return;
    try { await deleteObject(ref(storage, imageUrl)); } catch {}
  }

  // ── AVAILABLE TOGGLE ───────────────────────────────────
  async function handleToggleAvailable(categoryId, item) {
    const cat = categoriesRef.current.find((c) => c.id === categoryId);
    if (!cat) return;
    const nowAvailable = item.available !== false;
    const newItems = cat.items.map((i) =>
      i.id === item.id ? { ...i, available: !nowAvailable } : i
    );
    await updateDoc(doc(db, 'categories', categoryId), { items: newItems });
    await fetchCategories();
  }

  // ── ITEM REORDER ───────────────────────────────────────
  async function handleMoveItem(categoryId, itemId, direction) {
    const cat = categoriesRef.current.find((c) => c.id === categoryId);
    if (!cat) return;
    const idx = cat.items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cat.items.length) return;
    const newItems = [...cat.items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    await updateDoc(doc(db, 'categories', categoryId), { items: newItems });
    await fetchCategories();
  }

  // ── CONFIRM HANDLER ────────────────────────────────────
  async function handleConfirm() {
    if (!confirmModal) return;
    setConfirmBusy(true);
    try {
      const { type, categoryId, itemId } = confirmModal;
      if (type === 'deleteCategory') {
        const cat = categoriesRef.current.find((c) => c.id === categoryId);
        if (cat) await Promise.all((cat.items || []).map(i => deleteStorageImage(i.imageUrl)));
        await deleteDoc(doc(db, 'categories', categoryId));
      } else if (type === 'deleteItem') {
        const cat = categoriesRef.current.find((c) => c.id === categoryId);
        if (cat) {
          const item = cat.items.find((i) => i.id === itemId);
          if (item) await deleteStorageImage(item.imageUrl);
          await updateDoc(doc(db, 'categories', categoryId), {
            items: cat.items.filter((i) => i.id !== itemId),
          });
        }
      }
      await fetchCategories();
      setConfirmModal(null);
    } catch (err) {
      alert(t('deleteFailed') + ': ' + err.message);
    } finally {
      setConfirmBusy(false);
    }
  }

  const displayCategories = React.useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.reduce((acc, cat) => {
      const catHaystack = [cat.title, cat.title_en, cat.title_ar].filter(Boolean).join(' ').toLowerCase();
      const catMatch = catHaystack.includes(q);
      const matchedItems = (cat.items || []).filter((item) => {
        const itemHaystack = [item.name, item.name_en, item.name_ar, item.description, item.description_en, item.description_ar]
          .filter(Boolean).join(' ').toLowerCase();
        return itemHaystack.includes(q);
      });
      if (catMatch) {
        acc.push(cat);
      } else if (matchedItems.length > 0) {
        acc.push({ ...cat, items: matchedItems });
      }
      return acc;
    }, []);
  }, [categories, adminSearch]);

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Roboto, sans-serif' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── INACTIVITY WARNING BANNER ── */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: C.orange, color: '#1a0f0a',
          padding: '10px 20px', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontWeight: '600', fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <span>⚠️ {t('inactivityWarning')}</span>
          <button
            style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '6px', padding: '4px 14px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
            onClick={() => window.dispatchEvent(new MouseEvent('mousemove'))}
          >
            {t('ok')}
          </button>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: showWarning ? '42px' : 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}>
        <div>
          <h1 style={{ margin: 0, color: C.yellow, fontFamily: 'Rye, cursive', fontSize: '18px', letterSpacing: '1px' }}>
            DALTON'S KEBAP
          </h1>
          <p style={{ margin: '2px 0 0 0', color: C.muted, fontSize: '11px' }}>
            {t('adminTitle')} · {user.email}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LangSwitcher lang={lang} setLang={setLang} />
          <a href="/" style={{ color: C.muted, fontSize: '13px', textDecoration: 'none' }}>{t('backToMenu')}</a>
          <a href="/kitchen.html" target="_blank" rel="noopener noreferrer" style={{
            padding: '7px 13px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'rgba(245,158,11,.15)', color: C.orange,
            border: `1px solid rgba(245,158,11,.35)`, textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>🔥 Mutfak</a>
          <a href="/cashier.html" target="_blank" rel="noopener noreferrer" style={{
            padding: '7px 13px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'rgba(34,197,94,.12)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,.3)', textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>💵 Kasiyer</a>
          <a href="/waiter.html" target="_blank" rel="noopener noreferrer" style={{
            padding: '7px 13px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            background: 'rgba(99,102,241,.12)', color: '#818cf8',
            border: '1px solid rgba(99,102,241,.3)', textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>🛎 Garson</a>
          <button onClick={() => signOut(auth)} style={secondaryBtn}>{t('adminLogout')}</button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '4px', padding: '0 24px' }}>
        {[['menu', t('menuManagement')], ['orders', t('todayOrders')]].map(([tab, label]) => (
          <button key={tab} onClick={() => setAdminTab(tab)} style={{
            background: 'transparent', border: 'none', borderBottom: adminTab === tab ? `2px solid ${C.orange}` : '2px solid transparent',
            color: adminTab === tab ? C.orange : C.muted, padding: '12px 16px', cursor: 'pointer',
            fontSize: '14px', fontWeight: adminTab === tab ? '700' : '400', fontFamily: 'Roboto, sans-serif',
          }}>{label}</button>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Top bar — menu tab only */}
        {adminTab === 'menu' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: C.text }}>{t('menuManagement')}</h2>
          <button onClick={() => setCatModal('new')} style={primaryBtn}>+ {t('addCategory')}</button>
        </div>
        )}

        {/* Orders tab */}
        {adminTab === 'orders' && (() => {
          const revenue = todayOrders.reduce((s, o) => s + (parseFloat(String(o.total_price).replace(/[^\d.]/g,'')) || 0), 0);
          return (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  [t('todaysRevenue'), `${revenue.toLocaleString('tr-TR')} ₺`, C.green],
                  [t('ordersCount'), todayOrders.length, C.orange],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px 24px', minWidth: '140px' }}>
                    <div style={{ color: C.muted, fontSize: '11px', marginBottom: '4px' }}>{label}</div>
                    <div style={{ color, fontSize: '22px', fontWeight: '700' }}>{val}</div>
                  </div>
                ))}
              </div>
              {todayOrdersLoading && <div style={{ color: C.muted, textAlign: 'center', padding: '40px' }}>{t('loading')}</div>}
              {!todayOrdersLoading && todayOrders.length === 0 && (
                <div style={{ color: C.muted, textAlign: 'center', padding: '60px 20px', fontSize: '15px' }}>{t('noOrdersToday')}</div>
              )}
              {todayOrders.map(o => {
                const ts = o.timestamp?.toDate?.();
                const timeStr = ts ? ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—';
                return (
                  <div key={o.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: C.yellow, fontWeight: '700', fontSize: '14px' }}>
                        Masa {o.table_id} {o.order_number != null ? `· #${String(o.order_number).padStart(3,'0')}` : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ color: C.muted, fontSize: '12px' }}>{timeStr}</span>
                        <span style={{ color: C.orange, fontWeight: '700', fontSize: '14px' }}>{parseFloat(String(o.total_price).replace(/[^\d.]/g,'')).toLocaleString('tr-TR')} ₺</span>
                      </span>
                    </div>
                    <div style={{ color: C.muted, fontSize: '12px' }}>
                      {(o.order_items || []).map(it => `${it.name} ×${it.quantity}`).join(' · ')}
                    </div>
                    {o.notes && <div style={{ marginTop: '4px', color: C.orange, fontSize: '11px' }}>📝 {o.notes}</div>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Menu tab */}
        {adminTab === 'menu' && <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="search"
              placeholder={t('searchAdmin')}
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 16px', background: C.inputBg,
                border: `1px solid ${adminSearch.trim() ? C.orange : C.border}`,
                borderRadius: '10px', color: C.text, fontSize: '15px', boxSizing: 'border-box',
                outline: 'none', fontFamily: 'Roboto, sans-serif', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = C.orange; }}
              onBlur={(e) => { e.target.style.borderColor = adminSearch.trim() ? C.orange : C.border; }}
            />
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px', color: C.muted }}>{t('loading')}</div>}
          {fetchError && <div style={{ ...errorBox, marginBottom: '24px' }}>{fetchError}</div>}

          {displayCategories.map((cat) => (
            <div key={cat.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ background: C.cardAlt, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: C.yellow, fontWeight: '700', fontSize: '15px' }}>{localize(cat, 'title', lang)}</span>
                  <span style={{ background: C.bg, color: C.muted, fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{t('order')}: {cat.order}</span>
                  <span style={{ background: C.bg, color: C.muted, fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{cat.items?.length || 0} {t('itemCount')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setCatModal(cat)} style={editBtn}>{t('edit')}</button>
                  <button onClick={() => setConfirmModal({ type: 'deleteCategory', categoryId: cat.id, message: t('deleteConfirmCategory') })} style={dangerBtn}>{t('delete')}</button>
                </div>
              </div>

              <div style={{ padding: '8px 20px 16px' }}>
                {(cat.items || []).length === 0 && <p style={{ color: C.muted, fontSize: '13px', margin: '12px 0 8px 0' }}>{t('noItemsYet')}</p>}

                {(cat.items || []).map((item, idx) => {
                  const isUnavailable = item.available === false;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${C.border}`, opacity: isUnavailable ? 0.55 : 1 }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in', filter: isUnavailable ? 'grayscale(1)' : 'none' }}
                          onError={(e) => { e.target.style.display = 'none'; }} onClick={() => setLightboxSrc(item.imageUrl)} title={t('zoomImage')} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px' }}>🍖</div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: isUnavailable ? C.muted : C.text, fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {localize(item, 'name', lang)}
                          {isUnavailable && <span style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>{t('itemUnavailable')}</span>}
                        </div>
                        {item.description && <div style={{ color: C.muted, fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                      </div>

                      <div style={{ color: C.orange, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatPrice(item.price)}</div>

                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleMoveItem(cat.id, item.id, 'up')} disabled={idx === 0} style={{ ...editBtn, padding: '4px 7px', opacity: idx === 0 ? 0.3 : 1 }} title="Yukarı taşı">↑</button>
                        <button onClick={() => handleMoveItem(cat.id, item.id, 'down')} disabled={idx === (cat.items || []).length - 1} style={{ ...editBtn, padding: '4px 7px', opacity: idx === (cat.items || []).length - 1 ? 0.3 : 1 }} title="Aşağı taşı">↓</button>
                        <button onClick={() => handleToggleAvailable(cat.id, item)} style={isUnavailable ? { ...editBtn, color: '#22c55e', borderColor: '#22c55e' } : { ...dangerBtn, color: '#f59e0b', borderColor: '#f59e0b' }}>
                          {isUnavailable ? t('markAvailable') : t('markUnavailable')}
                        </button>
                        <button onClick={() => setItemModal({ categoryId: cat.id, item })} style={editBtn}>{t('edit')}</button>
                        <button onClick={() => setConfirmModal({ type: 'deleteItem', categoryId: cat.id, itemId: item.id, message: t('deleteConfirmItem') })} style={dangerBtn}>{t('delete')}</button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => setItemModal({ categoryId: cat.id })} style={{ marginTop: '12px', padding: '8px 16px', width: '100%', background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: '8px', color: C.muted, cursor: 'pointer', fontSize: '13px', fontFamily: 'Roboto, sans-serif' }}>
                  + {t('addItem')}
                </button>
              </div>
            </div>
          ))}

          {!loading && categories.length > 0 && displayCategories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
              <p style={{ margin: 0, color: C.text, fontSize: '15px' }}>{t('noResults')}</p>
            </div>
          )}

          {!loading && categories.length === 0 && !fetchError && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: C.muted }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍽️</div>
              <p style={{ fontSize: '16px', margin: '0 0 8px 0', color: C.text }}>{t('noCategoriesYet')}</p>
              <p style={{ fontSize: '14px', margin: 0 }}>{t('noCategoriesHint')}</p>
            </div>
          )}
        </>}
      </main>

      {/* ── MODALS ── */}
      {catModal && (
        <CategoryFormModal
          category={catModal === 'new' ? null : catModal}
          onSave={handleSaveCategory}
          onClose={() => setCatModal(null)}
          t={t}
        />
      )}

      {itemModal && (
        <ItemFormModal
          categoryId={itemModal.categoryId}
          item={itemModal.item}
          onSave={(itemData) => handleSaveItem(itemModal.categoryId, itemData)}
          onClose={() => setItemModal(null)}
          t={t}
        />
      )}

      {confirmModal && (
        <DeleteGuardModal
          message={confirmModal.message}
          onConfirm={handleConfirm}
          onClose={() => !confirmBusy && setConfirmModal(null)}
          busy={confirmBusy}
          t={t}
          userEmail={user.email}
        />
      )}

      {lightboxSrc && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, cursor: 'zoom-out', padding: '16px',
          }}
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt={t('bigImage')}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', cursor: 'default', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{ position: 'fixed', top: '16px', right: '16px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '20px', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}
            onClick={() => setLightboxSrc(null)}
          >✕</button>
        </div>
      )}
    </div>
  );
}
