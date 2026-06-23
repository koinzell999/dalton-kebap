import React from 'react';

export default function OrderStatus({ orderState, tableNumber, onNewOrder, t, isRTL }) {
  const isServed = orderState === 'served';

  return (
    <div className="order-status-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="order-status-card">
        <div className="order-status-icon">{isServed ? '🎉' : '🍽️'}</div>

        <h2 className="order-status-title">
          {isServed ? t('orderServedTitle') : t('orderReceivedTitle')}
        </h2>

        <p className="order-status-msg">
          {isServed ? t('orderServedMsg') : t('orderReceivedMsg')}
        </p>

        {tableNumber && (
          <div className="order-status-table">
            {t('table')} {tableNumber}
          </div>
        )}

        {!isServed && <div className="order-spinner" />}

        {isServed && (
          <button type="button" className="btn btn-primary" onClick={onNewOrder}>
            {t('newOrder')}
          </button>
        )}
      </div>
    </div>
  );
}
