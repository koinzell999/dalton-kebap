import React from 'react';

export default function OrderStatus({ orderState, tableNumber, orderNumber, editTimeLeft, onEdit, onNewOrder, cancelReason, t, isRTL }) {
  const isServed    = orderState === 'served';
  const isCancelled = orderState === 'cancelled';
  const isWaiting   = orderState === 'waiting';
  const canEdit     = isWaiting && editTimeLeft != null && editTimeLeft > 0;

  function fmtCountdown(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return t('editWindowRemaining')
      .replace('{m}', m)
      .replace('{s}', String(s).padStart(2, '0'));
  }

  const icon  = isCancelled ? '❌' : isServed ? '🎉' : '🍽️';
  const title = isCancelled ? t('orderCancelledTitle') : isServed ? t('orderServedTitle') : t('orderReceivedTitle');
  const msg   = isCancelled ? t('orderCancelledMsg')   : isServed ? t('orderServedMsg')   : t('orderReceivedMsg');

  return (
    <div className="order-status-overlay" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`order-status-card${isCancelled ? ' order-status-cancelled' : ''}`}>
        <div className="order-status-icon">{icon}</div>

        {orderNumber != null && !isCancelled && (
          <div className="order-status-number">
            #{String(orderNumber).padStart(3, '0')}
          </div>
        )}

        <h2 className="order-status-title">{title}</h2>
        <p className="order-status-msg">{msg}</p>

        {isCancelled && cancelReason && (
          <p className="order-cancel-reason">
            <strong>{t('orderCancelReason')}</strong> {cancelReason}
          </p>
        )}

        {tableNumber && !isCancelled && (
          <div className="order-status-table">
            {t('table')} {tableNumber}
          </div>
        )}

        {isWaiting && <div className="order-spinner" />}

        {canEdit && (
          <button type="button" className="btn order-edit-btn" onClick={onEdit}>
            ✏️ {t('editOrder')}
            <span className="order-edit-countdown"> — {fmtCountdown(editTimeLeft)}</span>
          </button>
        )}

        {isWaiting && editTimeLeft === 0 && (
          <p className="order-edit-closed">{t('editWindowClosed')}</p>
        )}

        {(isServed || isCancelled) && (
          <button type="button" className="btn btn-primary" onClick={onNewOrder}>
            {t('newOrder')}
          </button>
        )}
      </div>
    </div>
  );
}
