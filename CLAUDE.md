# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 18 + Vite 5 SPA for "Dalton's Kebap", a Turkish restaurant's digital menu. Firebase project ID: `dalton-kebap`.

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally

# Deploy
firebase deploy --only hosting                        # Deploy frontend
firebase deploy --only firestore:rules,storage        # Deploy security rules
firebase deploy                                       # Deploy everything
```

There is no test suite or linter configured.

## Architecture

### Routing
`main.jsx` does path-based routing without a router library: `window.location.pathname.startsWith('/admin')` renders `AdminRoot`, otherwise renders `App` (the public menu). Firebase Hosting rewrites all paths to `index.html`.

- **Public menu** — `/` — `App.jsx`
- **Admin panel** — `/admin` — `src/admin/AdminRoot.jsx` → `Login.jsx` or `AdminPanel.jsx`

### Firebase Services (`src/firebase.js`)
Exports `db` (Firestore), `auth`, `storage`, and `analytics` from a single initialized app. All components import from here — never call `initializeApp` again elsewhere.

### Firestore Data Model
Single collection: `categories`. Each document has:
```json
{
  "title": "IZGARA VE KEBAP SERVİS",
  "order": 1,
  "items": [
    { "id": "uuid", "name": "Adana Kebap", "price": "400 ₺", "description": "", "imageUrl": "" }
  ]
}
```
Items are an **array inside the category document**, not a separate subcollection. Item IDs are generated with `crypto.randomUUID()`. Categories are ordered by the `order` field.

### Public Menu (`App.jsx`)
Fetches categories on mount, then filters/searches client-side. Key state:
- `menuData` — raw Firestore data
- `filtered` — memoized result of search + category + favorites filters
- `activeCategory` — tracked via `IntersectionObserver` on `.menu-section` elements to highlight the active tab
- `favorites` — persisted to `localStorage` under key `dk:favorites` as a JSON array

CSS custom properties `--header-height` and `--tabs-height` are updated via `ResizeObserver` and used for `scroll-margin-top` on sections.

### Admin Panel (`src/admin/`)
- `AdminRoot` wraps auth state — shows `Login` or `AdminPanel`
- `AdminPanel` has full CRUD for categories and items. Item images upload to Firebase Storage at `menu-items/{categoryId}/{itemId}`, then the download URL is stored in Firestore.
- Admin panel uses **inline styles** (not CSS classes) with a `C` theme constants object at the top of `AdminPanel.jsx`.
- Admin users are created via Firebase Console → Authentication → Users. There is no signup UI.

### Styling
- Public menu: CSS classes defined in `src/index.css`; uses Framer Motion for item animations
- Admin panel: inline JS style objects (no external CSS classes)
- Brand colors: background `#1a0f0a`, orange `#e25822`, yellow `#f4d03f`, text `#f5e6d3`

### Vite Build
`vite.config.js` defines manual chunks splitting vendor bundles: `vendor-react`, `vendor-framer`, `vendor-firebase`. Framer Motion emits `"use client"` warnings during build — these are benign.

## Firebase Security Rules
- `firestore.rules`: `categories` collection is publicly readable, write requires `request.auth != null`
- `storage.rules`: `menu-items/**` is publicly readable, write requires auth

## Utility Scripts (root-level, Node.js)
- `seed.js` — seeds Firestore with initial menu data using `firebase-admin`
- `upload-images.js` — bulk-uploads images to Firebase Storage
- Both require `serviceAccountKey.json` (service account credentials, not committed to git)
