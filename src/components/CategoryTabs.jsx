import React from 'react';

export default function CategoryTabs({ categories, activeCategory, onTabClick, t, isRTL }) {
  const tabRefs = React.useRef({});

  React.useEffect(() => {
    const el = tabRefs.current[activeCategory];
    if (!el) return;
    // Manually scroll only the horizontal overflow strip — never call scrollIntoView
    // on a child of a sticky element, which causes the browser to jump the page
    // vertically back to the element's original flow position.
    const strip = el.closest('.category-tabs');
    if (!strip) return;
    const stripRect = strip.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScrollLeft =
      strip.scrollLeft + elRect.left - stripRect.left - stripRect.width / 2 + elRect.width / 2;
    strip.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
  }, [activeCategory]);

  return (
    <nav className="category-tabs" aria-label={t ? t('categories') : 'Kategoriler'} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="tabs">
        {categories.map((c) => (
          <button
            key={c.id}
            ref={(el) => { tabRefs.current[c.id] = el; }}
            className={`tab ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => onTabClick(c.id)}
            aria-current={activeCategory === c.id ? 'page' : undefined}
          >
            {c.title}
          </button>
        ))}
      </div>
    </nav>
  );
}
