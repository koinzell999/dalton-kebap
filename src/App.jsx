import React from 'react';
import MenuGrid from './components/MenuGrid';
import SearchBar from './components/SearchBar';
import CategoryTabs from './components/CategoryTabs';
import ItemModal from './components/ItemModal';
import { db } from './firebase';
import { collection, getDocs, query, orderBy, where, addDoc, doc, getDoc, onSnapshot, serverTimestamp, runTransaction, updateDoc } from 'firebase/firestore';
import { useLanguage, localize, parsePriceNum } from './i18n';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import { initTableSession, clearTableSession, getOrCreateSessionId, getCooldownRemaining, recordOrderPlaced, clearOrderCooldown } from './lib/tableSession';

// ── Active-order session persistence ──────────────────────────────────────
const ORDER_KEY = 'dk:active-order';
function saveActiveOrder(id, number, ts) {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify({ id, number, ts })); } catch {}
}
function clearActiveOrder() { try { localStorage.removeItem(ORDER_KEY); } catch {} }
function loadActiveOrder()  {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Daily sequential reference number via Firestore transaction
async function getNextOrderNumber(db) {
  const today = new Date().toISOString().slice(0, 10);
  const counterRef = doc(db, 'counters', 'daily');
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      let count = 1;
      if (snap.exists() && snap.data().date === today) count = (snap.data().count || 0) + 1;
      tx.set(counterRef, { date: today, count });
      return count;
    });
  } catch {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    return (Math.floor((Date.now() - midnight.getTime()) / 1000) % 999) + 1;
  }
}
import './index.css';

export default function App() {
  const { t, lang, setLang, isRTL } = useLanguage('auto');

  const [menuData, setMenuData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [activeCategory, setActiveCategory] = React.useState(null);
  const [theme, setTheme] = React.useState(() => {
    try {
      const saved = localStorage.getItem('dk:theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { return 'dark'; }
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('dk:theme', theme); } catch {}
  }, [theme]);

  const [favorites, setFavorites] = React.useState(() => {
    try {
      const raw = localStorage.getItem('dk:favorites');
      if (raw) {
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
      }
    } catch (e) {}
    return new Set();
  });
  const [showFavorites, setShowFavorites] = React.useState(false);

  React.useEffect(() => {
    async function fetchMenu() {
      try {
        const q = query(collection(db, "categories"), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMenuData(categories);
      } catch (err) {
        setError(t('loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = React.useMemo(
    () => menuData.map((c) => ({ id: c.id, title: localize(c, 'title', lang) })),
    [menuData, lang]
  );

  const filtered = React.useMemo(() => {
    return menuData
      .filter((cat) => (selectedCategory ? cat.id === selectedCategory : true))
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it) => {
          const haystack = [it.name, it.name_en, it.name_ar, it.description, it.description_en, it.description_ar]
            .filter(Boolean).join(' ').toLowerCase();
          const matchesQuery = haystack.includes(searchQuery.toLowerCase());
          const matchesFav = showFavorites ? favorites.has(it.id) : true;
          return matchesQuery && matchesFav;
        })
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menuData, selectedCategory, searchQuery, showFavorites, favorites, lang]);

  const [modalItem, setModalItem] = React.useState(null);
  const [showQR, setShowQR] = React.useState(false);
  const [qrSrc, setQrSrc] = React.useState('');

  // ── ERP state ──
  const [tableNumber, setTableNumber] = React.useState(null);
  const [cart, setCart] = React.useState([]);
  const [showCart, setShowCart] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderError, setOrderError] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const [sessionId] = React.useState(() => getOrCreateSessionId());
  const _savedOrder = React.useMemo(() => loadActiveOrder(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [orderId, setOrderId] = React.useState(() => _savedOrder?.id || null);
  const [orderNumber, setOrderNumber] = React.useState(() => _savedOrder?.number || null);
  const [orderPlacedAt, setOrderPlacedAt] = React.useState(() => _savedOrder?.ts || null);
  const [orderState, setOrderState] = React.useState(() => _savedOrder?.id ? 'waiting' : 'idle');
  const [editTimeLeft, setEditTimeLeft] = React.useState(null);
  const [cooldownLeft, setCooldownLeft] = React.useState(() => getCooldownRemaining());

  React.useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.menu-section'));
    if (!sections.length) {
      setActiveCategory(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.catId;
            setActiveCategory(id);
          }
        });
      },
      { root: null, rootMargin: '-35% 0px -50% 0px', threshold: 0.1 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [filtered]);

  React.useLayoutEffect(() => {
    function updateVars() {
      const headerEl = document.querySelector('.header');
      const tabsEl = document.querySelector('.category-tabs');
      const headerHeight = headerEl?.offsetHeight ?? 0;
      const tabsHeight = tabsEl?.offsetHeight ?? 0;
      document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      document.documentElement.style.setProperty('--tabs-height', `${tabsHeight}px`);
    }

    updateVars();
    window.addEventListener('resize', updateVars);

    const ro = new ResizeObserver(updateVars);
    const hdr = document.querySelector('.header');
    const tabs = document.querySelector('.category-tabs');
    if (hdr) ro.observe(hdr);
    if (tabs) ro.observe(tabs);

    return () => {
      window.removeEventListener('resize', updateVars);
      ro.disconnect();
    };
  }, [loading, filtered]);

  function handleItemClick(item) {
    setModalItem(item);
  }

  function openQR() {
    try {
      const url = window.location.href;
      const api = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
      setQrSrc(api);
    } catch (e) {
      setQrSrc('');
    }
    setShowQR(true);
  }

  function closeQR() {
    setShowQR(false);
    setQrSrc('');
  }

  function printQR() {
    const win = window.open('', '_blank', 'width=320,height=500');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>QR - Dalton's Kebap</title>
<style>
  @page { size: 80mm auto; margin: 4mm 6mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; text-align: center; color: #000; background: #fff; width: 68mm; }
  .name { font-size: 15pt; font-weight: bold; letter-spacing: 2px; margin-bottom: 2mm; }
  .sub  { font-size: 8pt; letter-spacing: 4px; margin-bottom: 3mm; color: #333; }
  hr    { border: none; border-top: 1px dashed #999; margin: 3mm 0; }
  .label { font-size: 8pt; margin-bottom: 3mm; color: #555; }
  img   { width: 64mm; height: 64mm; display: block; margin: 0 auto; }
  .url  { font-size: 6.5pt; margin-top: 3mm; color: #444; word-break: break-all; }
</style>
</head>
<body>
<p class="name">DALTON'S KEBAP</p>
<p class="sub">❖ KEBAP · DÖNER ❖</p>
<hr>
<p class="label">E-Menü için QR kodu okutun</p>
<img id="qr" src="${qrSrc}" />
<p class="url">dalton-kebap.web.app</p>
<hr>
<script>
  document.getElementById('qr').onload = function() { window.print(); };
  window.onafterprint = function() { window.close(); };
<\/script>
</body>
</html>`);
    win.document.close();
  }

  React.useEffect(() => {
    try {
      localStorage.setItem('dk:favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {}
  }, [favorites]);

  function toggleFavorite(itemId) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  // ── Table session ──
  React.useEffect(() => {
    const table = initTableSession();
    setTableNumber(table);
  }, []);

  // ── Cooldown countdown ──
  React.useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      const rem = getCooldownRemaining();
      setCooldownLeft(rem);
      if (rem <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  // ── Edit window countdown (10 minutes from order placement) ──
  const EDIT_WINDOW_SEC = 10 * 60;
  React.useEffect(() => {
    if (orderState !== 'waiting' || !orderPlacedAt) { setEditTimeLeft(null); return; }
    function tick() {
      setEditTimeLeft(Math.max(0, EDIT_WINDOW_SEC - Math.floor((Date.now() - orderPlacedAt) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [orderState, orderPlacedAt]);

  // ── Cart management ──
  function addToCart(item, qty, displayName) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        displayName: displayName || item.name,
        price: item.price,
        priceNum: parsePriceNum(item.price),
        quantity: qty,
      }];
    });
  }

  function updateCartQty(itemId, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCart((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: qty } : i));
    }
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function placeOrder() {
    if (isEditing) return saveEdit();
    if (!tableNumber || cart.length === 0 || isSubmitting) return;

    const cooldown = getCooldownRemaining();
    if (cooldown > 0) {
      setOrderError(t('cooldownWarning').replace('{sec}', cooldown));
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);
    try {
      const number = await getNextOrderNumber(db);
      const now = Date.now();
      const total = cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
      const ref = await addDoc(collection(db, 'orders'), {
        table_id: tableNumber,
        session_id: sessionId,
        order_number: number,
        order_items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.priceNum,
          quantity: item.quantity,
        })),
        total_price: total,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      saveActiveOrder(ref.id, number, now);
      recordOrderPlaced();
      setOrderId(ref.id);
      setOrderNumber(number);
      setOrderPlacedAt(now);
      setOrderState('waiting');
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error('Order failed:', err);
      setOrderError(t('orderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startEdit() {
    if (!orderId || orderState !== 'waiting') return;
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (!snap.exists() || snap.data().status !== 'pending') return;
      const restoredCart = snap.data().order_items.map((it) => ({
        id: it.id,
        name: it.name,
        displayName: it.name,
        price: String(it.price),
        priceNum: it.price,
        quantity: it.quantity,
      }));
      setCart(restoredCart);
      setIsEditing(true);
      setShowCart(true);
    } catch (err) {
      console.error('Failed to load order for editing:', err);
    }
  }

  async function saveEdit() {
    if (!orderId || cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setOrderError(null);
    try {
      const total = cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
      await updateDoc(doc(db, 'orders', orderId), {
        order_items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.priceNum,
          quantity: item.quantity,
        })),
        total_price: total,
      });
      setIsEditing(false);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error('Edit failed:', err);
      setOrderError(t('orderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewOrder() {
    clearActiveOrder();
    clearOrderCooldown();
    setOrderId(null);
    setOrderNumber(null);
    setOrderPlacedAt(null);
    setOrderState('idle');
    setIsEditing(false);
    setCooldownLeft(0);
  }

  // ── Real-time order status listener ──
  // Deps: only orderId — handles recovery after page refresh by reading current status.
  React.useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (!snap.exists()) {
        clearActiveOrder();
        setOrderId(null);
        setOrderState('idle');
        return;
      }
      const status = snap.data().status;
      if (status === 'pending') {
        setOrderState('waiting');
      } else if (status === 'served') {
        setOrderState('served');
      } else if (status === 'paid') {
        clearActiveOrder();
        clearTableSession();
        setOrderId(null);
        setOrderNumber(null);
        setOrderPlacedAt(null);
        setOrderState('idle');
        setTableNumber(null);
      }
    });
    return unsub;
  }, [orderId]);

  if (loading) return <div className="loader-container"><div className="loader"></div><p>{t('loadingMenu')}</p></div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={() => window.location.reload()}>{t('retryButton')}</button></div>;

  if (menuData.length === 0) {
    return (
      <div className="error-container">
        <p>{t('emptyMenu')}</p>
      </div>
    );
  }

  const phoneNumber = '+90 552 459 44 63';
  const phoneDigits = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${phoneDigits}`;

  return (
    <div className="app" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="header">
        <div className="header-content">
          <div className="header-brand-row">
            <svg className="brand-logo" viewBox="0 0 90 50" width="90" height="50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2,50 A43,43 0 0,1 88,50Z" fill="#c8d400"/>
              <text x="11" y="40" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="19" y="27" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="31" y="19" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="45" y="16" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="59" y="19" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="71" y="27" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <text x="79" y="40" fill="#1a2200" fontSize="6" textAnchor="middle" fontFamily="sans-serif">★</text>
              <path d="M31,37 L31,22 Q31,11 38,10 L42,13 Q45,11 48,13 L52,10 Q59,11 59,22 L59,37Z" fill="#1a1a00"/>
              <ellipse cx="45" cy="38" rx="27" ry="5.5" fill="#1a1a00"/>
              <rect x="31" y="31" width="28" height="4" fill="#3d3000"/>
            </svg>
            <div className="brand-text">
              <h1 className="brand">DALTON'S KEBAP</h1>
              <p className="brand-sub">✦ KEBAP · DÖNER ✦</p>
            </div>
          </div>
          <div className="header-actions">
            {tableNumber && (
              <span className="table-chip">{t('table')} {tableNumber}</span>
            )}
            <button
              type="button"
              className="cart-btn"
              onClick={() => setShowCart(true)}
              aria-label={t('cart')}
              title={t('cart')}
            >
              🛒
              {cart.reduce((s, it) => s + it.quantity, 0) > 0 && (
                <span className="cart-badge">
                  {cart.reduce((s, it) => s + it.quantity, 0)}
                </span>
              )}
            </button>
            <div className="lang-switcher">
              {[{code:'tr',flag:'🇹🇷'},{code:'en',flag:'🇬🇧'},{code:'ar',flag:'🇸🇦'}].map(({code,flag})=>(
                <button
                  key={code}
                  className={`lang-btn${lang===code?' active':''}`}
                  onClick={()=>setLang(code)}
                  aria-label={code.toUpperCase()}
                  title={code.toUpperCase()}
                >
                  {flag}
                </button>
              ))}
            </div>
            <button
              className="theme-toggle"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <a href={`tel:${phoneNumber}`} className="phone-link">
              <span className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
                {t('callUs')}
              </span>
              <span className="phone-number">{phoneNumber}</span>
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-link" title={t('orderWhatsapp')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.947 1.347l-.355.203-3.678-.967.984 3.231-.21.336a9.9 9.9 0 001.527 5.984 9.926 9.926 0 008.122 3.922h.002a9.926 9.926 0 008.121-3.922 9.9 9.9 0 001.528-5.984l-.209-.335 1.002-3.263-3.72.969-.362-.201a9.87 9.87 0 00-4.91-1.347"/>
              </svg>
              {t('orderShort')}
            </a>
          </div>
        </div>
        <button className="qr-btn" onClick={openQR} aria-label={t('shareMenu')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h7v7h-7z"/><path d="M7 10h.01"/><path d="M18 10h.01"/><path d="M7 21h.01"/><path d="M18 17h.01"/>
          </svg>
        </button>
      </header>

      <div className="sticky-nav">
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onTabClick={(id) => {
            const el = document.getElementById(`cat-${id}`);
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          t={t}
          isRTL={isRTL}
        />

        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showFavorites={showFavorites}
          onShowFavoritesChange={setShowFavorites}
          t={t}
          isRTL={isRTL}
        />
      </div>

      <main className="main-content">
        <div className="page-container">
          {filtered.length === 0 && (searchQuery.trim() || selectedCategory || showFavorites) ? (
            <div className="search-empty">
              🔍 {t('noResults')}
            </div>
          ) : (
            <MenuGrid
              menuData={filtered}
              onItemClick={handleItemClick}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              t={t}
              lang={lang}
              isRTL={isRTL}
            />
          )}
        </div>

        <ItemModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onAddToCart={(item, qty, displayName) => {
            addToCart(item, qty, displayName);
            setModalItem(null);
          }}
          t={t}
          lang={lang}
          isRTL={isRTL}
        />

        {showCart && (
          <Cart
            cart={cart}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
            onClose={() => {
              setShowCart(false);
              setOrderError(null);
              if (isEditing) { setIsEditing(false); setCart([]); }
            }}
            tableNumber={tableNumber}
            isSubmitting={isSubmitting}
            orderError={orderError}
            isEditing={isEditing}
            t={t}
            isRTL={isRTL}
          />
        )}

        {orderState !== 'idle' && (
          <OrderStatus
            orderState={orderState}
            tableNumber={tableNumber}
            orderNumber={orderNumber}
            editTimeLeft={editTimeLeft}
            onEdit={startEdit}
            onNewOrder={handleNewOrder}
            t={t}
            isRTL={isRTL}
          />
        )}

        {showQR && (
          <div className="qr-modal" role="dialog" aria-modal="true" onClick={closeQR} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="qr-content" onClick={(e) => e.stopPropagation()}>
              <button className="qr-close" aria-label={t('close')} onClick={closeQR}>✕</button>
              <h3>{t('qrTitle')}</h3>
              {qrSrc ? (
                <img src={qrSrc} alt={t('qrTitle')} />
              ) : (
                <div className="qr-loading">{t('loading')}</div>
              )}
              <div className="qr-actions">
                {qrSrc && (
                  <a className="btn" href={qrSrc} target="_blank" rel="noopener noreferrer">{t('downloadQr')}</a>
                )}
                {qrSrc && (
                  <button className="btn" onClick={printQR}>
                    🖨 {t('printQr')}
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    try { navigator.clipboard.writeText(window.location.href); } catch (e) {}
                  }}
                >
                  {t('copyLink')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">© {new Date().getFullYear()} Dalton's Kebap — {t('footerRights')}</footer>
    </div>
  );
}
