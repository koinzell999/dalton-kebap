import React from 'react';
import { formatPrice } from '../i18n';

export default function Cart({
  cart,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  onClose,
  tableNumber,
  isSubmitting,
  orderError = null,
  isEditing = false,
  notes = '',
  onNotesChange,
  t,
  isRTL,
}) {
  const total = cart.reduce((sum, it) => sum + it.priceNum * it.quantity, 0);

  return (
    <div className="cart-overlay" dir={isRTL ? 'rtl' : 'ltr'} onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div>
            <h2 className="cart-title">{isEditing ? t('editOrder') : t('cart')}</h2>
            {tableNumber && (
              <p className="cart-table-label">{t('table')} {tableNumber}</p>
            )}
          </div>
          <button className="cart-close" onClick={onClose} type="button" aria-label={t('close')}>
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <p className="cart-empty">{t('cartEmpty')}</p>
            <button type="button" className="btn btn-primary" onClick={onClose}>{t('browseMenu')}</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.displayName}</span>
                    <span className="cart-item-price">{formatPrice(item.price)}</span>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      aria-label="decrease"
                    >−</button>
                    <span className="cart-item-qty">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      aria-label="increase"
                    >+</button>
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => onRemove(item.id)}
                      aria-label={t('delete')}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-notes-section">
              <label className="cart-notes-label" htmlFor="cart-notes">{t('orderNotes')}</label>
              <textarea
                id="cart-notes"
                className="cart-notes-input"
                value={notes}
                onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
                placeholder={t('orderNotesPlaceholder')}
                maxLength={200}
                rows={2}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>{t('total')}</span>
                <span className="cart-total-price">{formatPrice(String(total))}</span>
              </div>

              {!tableNumber && (
                <p className="cart-no-table">{t('noTableWarning')}</p>
              )}

              {orderError && (
                <p className="cart-order-error">{orderError}</p>
              )}

              <button
                type="button"
                className="btn btn-primary cart-order-btn"
                onClick={onPlaceOrder}
                disabled={!tableNumber || isSubmitting || cart.length === 0}
              >
                {isSubmitting ? t('submitting') : isEditing ? t('saveChanges') : t('placeOrder')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
