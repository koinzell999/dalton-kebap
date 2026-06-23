import React from 'react';
import { motion } from 'framer-motion';
import { localize, formatPrice } from '../i18n';

export default function MenuGrid({ menuData, onItemClick = () => {}, favorites = new Set(), onToggleFavorite = () => {}, t = (k) => k, lang = 'tr', isRTL = false }) {
  return (
    <div className="menu-grid" dir={isRTL ? 'rtl' : 'ltr'}>
      {menuData.map((category) => (
        <MenuSection
          key={category.id}
          id={category.id}
          category={category}
          items={category.items}
          onItemClick={onItemClick}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          t={t}
          lang={lang}
        />
      ))}
    </div>
  );
}

function MenuSection({ id, category, items, onItemClick, favorites, onToggleFavorite, t, lang }) {
  const title = localize(category, 'title', lang);
  return (
    <motion.section
      id={`cat-${id}`}
      data-cat-id={id}
      className="menu-section"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <p className="section-divider">✦ ✦ ✦</p>
      </div>
      <div className="items">
        {items.map((item, idx) => {
          const itemName = localize(item, 'name', lang);
          const itemDesc = localize(item, 'description', lang);
          return (
          <motion.div
            key={item.id}
            className="menu-item clickable"
            role="button"
            tabIndex={0}
            onClick={() => onItemClick(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onItemClick(item);
              }
            }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.99 }}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.02 }}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={itemName}
                className="item-thumb"
                loading="lazy"
                width="64"
                height="64"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="item-info">
              <span className="item-name">{itemName}</span>
              {(itemDesc || item.portion) && (
                <span className="item-desc">
                  {[itemDesc, item.portion].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <button
              className={`favorite-btn ${favorites && favorites.has && favorites.has(item.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              aria-pressed={favorites && favorites.has && favorites.has(item.id)}
              title={favorites && favorites.has && favorites.has(item.id) ? t('removeFromFavorites') : t('addToFavorites')}
            >
              ♥
            </button>
            <span className="item-price">{formatPrice(item.price)}</span>
          </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
