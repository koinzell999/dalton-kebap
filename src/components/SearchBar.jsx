import React from 'react';

export default function SearchBar({ query, onQueryChange, categories, selectedCategory, onCategoryChange, showFavorites, onShowFavoritesChange, t, isRTL }) {
  return (
    <div className="search-bar" dir={isRTL ? 'rtl' : 'ltr'}>
      <input
        aria-label={t('searchPlaceholder')}
        className="search-input"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        type="search"
      />

      <select
        className="category-select"
        value={selectedCategory ?? ''}
        onChange={(e) => onCategoryChange(e.target.value || null)}
        aria-label={t('categories')}
      >
        <option value="">{t('allCategories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      <button
        className={`fav-toggle ${showFavorites ? 'active' : ''}`}
        onClick={() => onShowFavoritesChange(!showFavorites)}
        title={showFavorites ? t('showAllItems') : t('showFavoritesOnly')}
        aria-pressed={showFavorites}
      >
        {showFavorites ? `♥ ${t('favorites')}` : `♡ ${t('favorites')}`}
      </button>
    </div>
  );
}
