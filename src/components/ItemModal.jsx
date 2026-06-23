import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { localize, formatPrice } from '../i18n';

const WHATSAPP = '905524594463';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 }
};

export default function ItemModal({ item, onClose, onAddToCart = null, t = (k) => k, lang = 'tr', isRTL = false }) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => { setLightboxOpen(false); setQty(1); }, [item]);

  React.useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (lightboxOpen) { setLightboxOpen(false); } else { onClose && onClose(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, lightboxOpen]);

  const itemName = item ? localize(item, 'name', lang) : '';
  const itemDesc = item ? localize(item, 'description', lang) : '';
  const whatsappText = item ? t('whatsappMessage').replace('{item}', itemName) : '';
  const whatsappUrl = item
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappText)}`
    : '#';

  return (
    <>
    <AnimatePresence>
      {item && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          transition={{ duration: 0.2 }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <motion.div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button
              className="modal-close"
              onClick={onClose}
              aria-label={t('close')}
              type="button"
            >
              ✕
            </button>

            {item.imageUrl && (
              <div
                className="modal-img"
                onClick={() => setLightboxOpen(true)}
                style={{ cursor: 'zoom-in' }}
                title={t('zoomImage')}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="eager"
                  onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                />
              </div>
            )}

            <h2 id="modal-title" className="modal-title">{itemName}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: item.portion || itemDesc ? '0' : '1.5rem' }}>
              {item.price && <div className="modal-price" style={{ margin: 0 }}>{formatPrice(item.price)}</div>}
              {item.portion && <span style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>{item.portion}</span>}
            </div>
            {itemDesc && <p className="modal-desc" style={{ marginTop: '0.75rem' }}>{itemDesc}</p>}

            {onAddToCart && (
              <div className="modal-quantity">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="decrease quantity"
                >−</button>
                <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--c-text)' }}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="increase quantity"
                >+</button>
              </div>
            )}

            <div className="modal-actions">
              {onAddToCart ? (
                <>
                  <button className="btn" onClick={onClose} type="button">
                    {t('close')}
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    style={{ flex: 2 }}
                    onClick={() => onAddToCart(item, qty, itemName)}
                  >
                    {t('addToCart')} {qty > 1 ? `(${qty})` : ''}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={onClose} type="button">
                    {t('close')}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.947 1.347l-.355.203-3.678-.967.984 3.231-.21.336a9.9 9.9 0 001.527 5.984 9.926 9.926 0 008.122 3.922h.002a9.926 9.926 0 008.121-3.922 9.9 9.9 0 001.528-5.984l-.209-.335 1.002-3.263-3.72.969-.362-.201a9.87 9.87 0 00-4.91-1.347"/>
                    </svg>
                    {t('orderWhatsapp')}
                  </a>
                </>
              )}
            </div>
            {onAddToCart && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--c-green)', fontSize: '0.8rem', fontFamily: "'Open Sans', sans-serif" }}
                >
                  {t('orderWhatsapp')}
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {lightboxOpen && item?.imageUrl && (
        <motion.div
          className="lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.img
            src={item.imageUrl}
            alt={item.name}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          />
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
