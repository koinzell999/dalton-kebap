# Dalton's Kebap — Project Summary

## What This Project Is

A React-based restaurant e-menu web app for "Dalton's Kebap" (Turkish restaurant). It's a single-page app that shows menu categories and items fetched from Firebase Firestore. Customers can browse, search, filter, and favorite items.

---

## Tech Stack

- **Frontend:** React 18.2.0 + Vite 5.1.0
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Email/Password)
- **File Storage:** Firebase Storage
- **Animations:** Framer Motion 12.40.0
- **Styling:** Tailwind CSS (CDN) + custom CSS (inline styles for admin panel)
- **Hosting:** Firebase Hosting
- **Firebase project ID:** `dalton-kebap`

---

## Firestore Data Structure

Collection: `categories`

Each document:
```json
{
  "title": "IZGARA VE KEBAP SERVİS",
  "order": 1,
  "items": [
    {
      "id": "101",
      "name": "Adana Kebap",
      "price": "400 ₺",
      "description": "",
      "imageUrl": ""
    }
  ]
}
```

Items are stored as an **array inside each category document** (not a separate collection).

---

## File Structure (src/)

```
src/
  firebase.js          ← Firebase init (db, auth, storage, analytics)
  main.jsx             ← Entry point; routes /admin → AdminRoot, else → App
  App.jsx              ← Public-facing menu
  index.css            ← Global styles
  components/
    CategoryTabs.jsx   ← Horizontal category navigation
    MenuGrid.jsx       ← Displays menu items by category
    SearchBar.jsx      ← Search + filter bar
    ItemModal.jsx      ← Item detail popup with quantity selector
  admin/
    AdminRoot.jsx      ← Auth state wrapper (shows Login or AdminPanel)
    Login.jsx          ← Email/password login form
    AdminPanel.jsx     ← Full CRUD control panel
```

---

## What Was Built (Admin Panel)

### Routing
- `main.jsx` checks `window.location.pathname.startsWith('/admin')`
- If true → renders `AdminRoot` (admin panel)
- Otherwise → renders `App` (public menu)
- Firebase Hosting already has a `"source": "**"` rewrite to `index.html`, so `/admin` works as a SPA route

### AdminRoot (`src/admin/AdminRoot.jsx`)
- Listens to Firebase Auth state with `onAuthStateChanged`
- Shows a loading screen while checking auth
- Shows `Login` if not authenticated
- Shows `AdminPanel` if authenticated
- Overrides the body background to dark (`#1a0f0a`) since the public menu has an orange gradient body

### Login (`src/admin/Login.jsx`)
- Email + password form
- Uses `signInWithEmailAndPassword` from Firebase Auth
- Shows Turkish error message on failure
- Styled to match restaurant color theme (dark background, orange/yellow accents)
- Users are added via Firebase Console → Authentication → Users

### AdminPanel (`src/admin/AdminPanel.jsx`)
Full CRUD for the menu:

**Categories:**
- View all categories with item count and order number
- Add new category (name + sort order)
- Edit category (name + sort order)
- Delete category (with confirmation modal — deletes entire category and all its items)

**Menu Items (within each category):**
- View all items with thumbnail, name, description, price
- Add new item (name, price, description, image)
- Edit existing item (same fields)
- Delete item (with confirmation modal)

**Image upload:**
- User can pick a file → uploaded to Firebase Storage at `menu-items/{categoryId}/{itemId}`
- OR paste a direct image URL
- Image preview shown before saving
- Download URL stored in Firestore item's `imageUrl` field

**Other:**
- Logout button (uses `signOut`)
- "← Menüye Dön" link back to public menu
- Sticky header showing logged-in email

---

## Security Rules

### `firestore.rules`
```
categories → read: public, write: authenticated users only
everything else → denied
```

### `storage.rules` (new file)
```
menu-items/** → read: public, write: authenticated users only
```

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/firebase.js` | Added `getAuth` and `getStorage` exports |
| `src/main.jsx` | Added `/admin` routing |
| `src/admin/AdminRoot.jsx` | Created |
| `src/admin/Login.jsx` | Created |
| `src/admin/AdminPanel.jsx` | Created |
| `firestore.rules` | Updated — allow auth writes |
| `storage.rules` | Created |
| `firebase.json` | Added `"storage": { "rules": "storage.rules" }` |

---

## Setup Steps Still Needed (Firebase Console)

1. **Enable Authentication**
   - Firebase Console → Authentication → Sign-in method → Email/Password → Enable

2. **Add admin users**
   - Firebase Console → Authentication → Users → Add user
   - These credentials are used to log in to the admin panel

3. **Enable Firebase Storage**
   - Firebase Console → Storage → Get started

4. **Deploy rules**
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

5. **Deploy the app**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## How to Access the Admin Panel

- **Production:** `https://dalton-kebap.web.app/admin`
- **Local dev:** `http://localhost:5173/admin`

Log in with credentials added via Firebase Console. The panel is not linked from the public menu — it's accessed by typing the URL directly.

---

## Color Theme

| Name | Hex |
|------|-----|
| Background dark | `#1a0f0a` |
| Card dark | `#2c1e16` |
| Border | `#3d2b1f` |
| Orange (primary) | `#e25822` |
| Yellow (accent) | `#f4d03f` |
| Text | `#f5e6d3` |
| Muted text | `#a0856c` |
| Danger/red | `#c0392b` |

---

## Build Status

`npm run build` completes successfully. Warnings are pre-existing from Framer Motion (`"use client"` directives) and a bundle size notice — not errors.
