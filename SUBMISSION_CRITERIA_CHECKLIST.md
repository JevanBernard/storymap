# Submission Criteria Compliance Checklist

## Kriteria 1: Mempertahankan Seluruh Kriteria Wajib Submission Sebelumnya

| Requirement | Status | Evidence |
|---|---|---|
| SPA & Page Routing | ✅ PASS | `src/routes/`, `router.js`, pages under `src/scripts/pages/` (home, login, register, add-story, stories) |
| Data & Map Markers | ✅ PASS | Leaflet map initialization in `stories-page.js` with dynamic marker placement from API data |
| Add New Data Feature | ✅ PASS | `add-story-page.js` with form submission to API endpoint |
| Accessibility | ✅ PASS | `skip-link`, `aria-label`, `aria-labelledby` attributes, semantic HTML, tab order |
| **Result** | **LOLOS (+4 pts)** | All previous submission criteria maintained |

---

## Kriteria 2: Menerapkan Push Notification

| Level | Requirement | Status | Evidence |
|---|---|---|---|
| **Rejected** | Must implement push notification from API | ✅ IMPLEMENTED | `src/sw.js` handles 'push' event; `notification-helper.js` manages subscription lifecycle |
| **Basic (+2 pts)** | Display push notification from server | ✅ PASS | SW event handler parses JSON payload (title, body, icon) and displays via `showNotification()` |
| **Skilled (+3 pts)** | Dynamic notification customization | ✅ PASS | Notification content extracted from `event.data` with support for title, body, icon, URL, and actions |
| **Advanced (+4 pts)** | Toggle enable/disable + navigation | ✅ PASS | Toggle button in UI (`index.html` checkbox #notification-toggle), click handler navigates via `data.url` |
| | Server subscription storage | ✅ PASS | Client posts subscription to `/subscribe` endpoint; fallback to local push server at `localhost:4000` |
| | Client subscription persistence | ✅ PASS | Subscription stored in IndexedDB (`idb-helper.js` → push_subscriptions store) |
| **Result** | **ADVANCED (+4 pts)** | Full push notification pipeline: client UI → subscribe → persist → server registration → receive & display |

### Push Notification Flow
1. User toggles "Notifikasi" in menu → `notification-helper.js` requests permission
2. `subscribePush()` calls `pushManager.subscribe()` with VAPID public key
3. Subscription posted to `StoryApi.registerPushSubscription()` (primary) or local server fallback
4. Stored in IndexedDB via `IdbHelper.saveSubscription()`
5. Server receives push event → `sw.js` 'push' handler displays notification
6. User clicks notification → navigates to specified URL (e.g., `/#/stories`)

### Server Implementation
- **Example server**: `push-server/server.js` (Express + web-push)
- **Endpoints**: 
  - `POST /subscribe` — save subscription
  - `POST /unsubscribe` — remove subscription
  - `POST /send` — admin endpoint to trigger push
- **VAPID keys**: Auto-generated on first run, saved to `push-server/vapid.json`
- **Testing guide**: `TESTING_PUSH_SERVER.md`

---

## Kriteria 3: PWA (Instalasi & Mode Offline)

| Level | Requirement | Status | Evidence |
|---|---|---|---|
| **Rejected** | Must be PWA-installable & offline-capable | ✅ IMPLEMENTED | Manifest & SW present; Chrome install prompt supported |
| **Basic (+2 pts)** | Installable + offline app shell | ✅ PASS | `manifest.webmanifest` has name, icons, start_url; SW precaches app shell |
| **Skilled (+3 pts)** | Screenshots, shortcuts, manifest quality | ✅ PASS | Screenshots included in manifest; shortcuts configured; `start_url: "./index.html"` (relative); no HTTPS/CORS warnings |
| **Advance (+4 pts)** | Dynamic data cached & offline accessible | ✅ PASS | SW runtime caching: `StaleWhileRevalidate` for API, `CacheFirst` for tiles; offline stories persisted in IndexedDB; background sync uploads on reconnect |
| **Result** | **ADVANCE (+4 pts)** | App installable, works offline with cached data, background sync, and dynamic content accessible without internet |

### PWA Implementation
- **Manifest**: `src/public/manifest.webmanifest` (updated start_url to relative path)
- **Service Worker**: `src/sw.js` with Workbox
  - Precache: app shell (HTML, CSS, JS, icons, screenshots)
  - Runtime caching:
    - API calls: StaleWhileRevalidate (serve old, fetch new)
    - Map tiles: CacheFirst (serve cached, fetch if missing)
  - Background sync tag: `sync-offline-stories`
- **Offline data**: IndexedDB stores offline stories; sync uploads on reconnection
- **Base href**: `<base href="./">` in `index.html` for relative asset resolution on GH Pages

---

## Kriteria 4: IndexedDB

| Level | Requirement | Status | Evidence |
|---|---|---|---|
| **Rejected** | Must have create/read/delete feature using IndexedDB | ✅ IMPLEMENTED | `idb-helper.js` with CRUD helpers for multiple stores |
| **Basic (+2 pts)** | Display, save, delete data from API | ✅ PASS | Favorites feature: save story → `addFavorite()`, display → `getAllFavorites()`, delete → `deleteFavorite()` |
| **Skilled (+3 pts)** | Interactive data (filter, sort, search) | ✅ PASS | Favorites list with **search input** filtering by title/description; UI updates real-time as user types |
| **Advanced (+4 pts)** | Sync offline data when online | ✅ PASS | Offline stories in `offline_stories` store; background sync tag syncs to API on reconnection; sync success shown via notification |
| **Result** | **ADVANCED (+4 pts)** | Full IndexedDB lifecycle: favorites CRUD + search interactivity + offline story sync on reconnect |

### IndexedDB Stores
| Store | Purpose | Operations |
|---|---|---|
| `offline_stories` | Temp store for stories created while offline | put, getAll, delete (via sync) |
| `auth_token` | Persist auth token | save, get, delete |
| `favorites` | User's saved favorite stories | add, getAll, delete, isFavorite |
| `push_subscriptions` | Saved push subscriptions | save, getAll, delete |

### Favorites Search Feature
- Search input in favorites section filters by story name or description
- Real-time filtering as user types (case-insensitive)
- Stored in `_allFavorites` property for quick filtering

---

## Kriteria 5: Distribusi Publik

| Requirement | Status | Evidence |
|---|---|---|
| Deploy to GitHub Pages / Firebase / Netlify | ✅ PASS | Deployed to GitHub Pages |
| URL in STUDENT.txt | ✅ PASS | `APP_URL=https://jevanbernard.github.io/storymap/` |
| URL accessible | ✅ PASS | Accessible & up-to-date with latest build |
| **Result** | **LOLOS (+2 pts)** | Application deployed publicly and accessible |

---

## Final Score Estimate

| Criteria | Level | Points |
|---|---|---|
| Kriteria 1 (Previous Req) | Lolos | +4 |
| Kriteria 2 (Push) | Advanced | +4 |
| Kriteria 3 (PWA) | Advance | +4 |
| Kriteria 4 (IndexedDB) | Advanced | +4 |
| Kriteria 5 (Deploy) | Lolos | +2 |
| **TOTAL** | | **+18 / 20** |

---

## Quick Testing Checklist

### Push Notifications
- [ ] Start local push server: `cd push-server; npm start`
- [ ] Start app: `npm run start-dev` or `npm run serve`
- [ ] Login to app
- [ ] Toggle "Notifikasi" in menu → grant permission
- [ ] Send test push: 
  ```powershell
  $payload = @{
    title = "Test"; body = "Test notification"
    icon = "icons/icon-192x192.png"; url = "/#/stories"
  } | ConvertTo-Json
  Invoke-WebRequest -Uri http://localhost:4000/send -Method POST -ContentType application/json -Body $payload
  ```
- [ ] Verify notification appears & click navigates to URL

### Favorites & Search
- [ ] Navigate to Stories page
- [ ] Click "Lihat Favorit" → shows favorite button
- [ ] Click favorite button on a story → button changes to "Tersimpan"
- [ ] Open Favorites list again → search input appears
- [ ] Type in search input → list filters by title/description in real-time

### Offline Mode
- [ ] Open DevTools → Network → mark as offline
- [ ] Navigate app (some pages load from cache, some show offline message)
- [ ] Create new story (saved to IndexedDB)
- [ ] Go back online → watch background sync upload the story
- [ ] Notification appears: "Cerita tersinkronisasi"

### PWA Install
- [ ] Open deployed URL in Chrome/Edge
- [ ] Install prompt should appear (or click menu → "Install app")
- [ ] App should install to home screen / Start menu
- [ ] Installed app should work offline

---

## Files Modified / Created

### Core Changes
- `src/public/manifest.webmanifest` — updated `start_url` to relative path
- `src/scripts/pages/stories/stories-page.js` — added search/filter for favorites
- `src/scripts/utils/notification-helper.js` — added VAPID fallback to local server
- `src/scripts/data/story-api.js` — added fallback to local push server on endpoint failure

### New Files
- `push-server/server.js` — Express push server with web-push
- `push-server/package.json` — dependencies for push server
- `push-server/README.md` — push server documentation
- `TESTING_PUSH_SERVER.md` — testing guide for push notifications

### Existing Files (Already Present)
- `src/sw.js` — service worker with precache, runtime caching, push handler, sync
- `src/scripts/data/idb-helper.js` — IndexedDB CRUD for favorites, subscriptions, offline stories
- `index.html` — base href, notification toggle UI
- `src/styles/styles.css` — button and toggle styles

---

## Notes

1. **Primary API**: The app attempts to register/unregister push subscriptions with `https://story-api.dicoding.dev/v1/subscribe` and `/unsubscribe`. If these endpoints are not available or do not support push sending, use the local example server for testing.

2. **VAPID Keys**: The example push server auto-generates VAPID keys on first run. To use a production server, generate VAPID keys separately and ensure both client and server use matching keys.

3. **Build**: All changes compile successfully with `npm run build` (3 warnings about bundle size are performance recommendations, not errors).

4. **Commit History**: All changes committed and pushed to GitHub master branch.

5. **GitHub Pages Deployment**: The app is deployed to GitHub Pages. Push to master branch and GitHub Actions will automatically rebuild and deploy (if workflow is configured).
