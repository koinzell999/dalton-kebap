import React from 'react';
import { formatPrice } from '../i18n';

export default function Receipt({ receipt, onClose, t, isRTL, mode }) {
  const { items, total, orderNumber, tableNumber } = receipt;
  const isBill = mode === 'bill';

  return (
    <div className="receipt-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="receipt-card">
        <div className="receipt-icon">{isBill ? '💳' : '✅'}</div>

        <h2 className="receipt-title">{isBill ? t('billTitle') : t('receiptTitle')}</h2>
        <p className="receipt-subtitle">{isBill ? t('billSubtitle') : t('receiptSubtitle')}</p>

        {orderNumber != null && (
          <div className="receipt-order-number">
            #{String(orderNumber).padStart(3, '0')}
          </div>
        )}

        {tableNumber != null && (
          <div className="receipt-table">{t('table')} {tableNumber}</div>
        )}

        <div className="receipt-items">
          {items.map((item, i) => (
            <div key={i} className="receipt-item">
              <span className="receipt-item-name">
                {item.quantity > 1 && <span className="receipt-item-qty">{item.quantity}×</span>}
                {item.name}
              </span>
              <span className="receipt-item-price">
                {formatPrice(String((item.price || 0) * (item.quantity || 1)))}
              </span>
            </div>
          ))}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-total">
          <span>{t('total')}</span>
          <span>{formatPrice(String(total))}</span>
        </div>

        <p className="receipt-thanks">{isBill ? t('billThanks') : t('receiptThanks')}</p>

        <button type="button" className="btn btn-primary" onClick={onClose}>
          {isBill ? t('billClose') : t('receiptClose')}
        </button>
      </div>
    </div>
  );
}
