# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository scope

This directory contains the **frontend** of the MID Manual Viewer (secure PDF manual reader for Vibharam Laemchabang Hospital). The backend Cloudflare Worker lives in a **separate repo at `G:\mid-manual-cf\`** and must be edited there. Changes that touch endpoint shape, auth, or DB usually span both repos.

Documentation in `HANDOFF.md` / `README.md` still describes a Google Apps Script backend — that is historical. Production now runs on Cloudflare Workers + D1 + R2 (`mid-manual-api.elizanu-de.workers.dev`). Treat the API base URL in `frontend/.env.production` and `frontend/vite.config.js` as authoritative.

## Common commands

```bash
# Frontend (run from frontend/)
npm install
npm run dev            # vite dev server on :5173
npm run build          # production build → dist/
npm run preview        # preview built dist
npm run lint           # eslint src

# Worker (run from G:/mid-manual-cf/workers/)
npx wrangler dev       # local worker
npx wrangler deploy    # production deploy (auto mode blocks this — user must run)
npx wrangler tail      # live logs
npx wrangler d1 execute mid-manual-db --remote --command="..."
```

No test framework is configured.

## Two-app split inside one bundle

`frontend/src/main.jsx` routes by URL path **before** React mounts:

- `/admin/*` → `src/admin/AdminApp.jsx` (no LIFF, QR-login + adminToken)
- everything else → `src/App.jsx` (LIFF mobile flow + PIN + viewer)

The two apps share `node_modules` and the Vite bundle but otherwise have **separate trees** for auth, API client, theme, and pages. Don't import LIFF or `useAuth` into `src/admin/`, and don't import `src/admin/api/admin` from the LIFF app — they speak different auth protocols.

## Auth protocols (this trips people up)

Backend admin routes (`/api/admin/{stats,users,documents,logs,analytics,notifications}/*`) accept **both** auth modes via the unified `requireAdminAuth` middleware (`worker/src/middleware/admin_session.ts`):

1. **LIFF mode (mobile)** — body `{ idToken, sessionToken, payload }`. `idToken` is the LIFF ID token, `sessionToken` is the JWT issued after PIN verify. Used by `src/pages/admin/*` and `src/api/client.js`.
2. **adminToken mode (desktop)** — body `{ adminToken, payload }`. Issued after QR-pairing flow (`/api/admin/qr/init` → scan in LIFF → `/api/admin/qr/confirm` → desktop polls `/api/admin/qr/poll`). Used by `src/admin/api/admin.js` and stored in `localStorage` under `lean_buddy_admin_session`.

If a new admin route is added in the worker, mount it under `requireAdminAuth`, **not** the legacy `requireSession + requireAdmin` pair, otherwise the desktop console will 401 with `Missing idToken`.

## File-upload contract

`/api/admin/documents/{create,replacePage,appendPages,replaceAllPages}` parses request body as **JSON** with base64-encoded page data:

```js
{ adminToken | idToken+sessionToken,
  payload: { ..., pages: [{ data: "<base64 png/jpg, no data: prefix>" }, ...] } }
```

It does **not** accept multipart `FormData`. The frontend helper in `src/admin/api/admin.js` (`fileToBase64`, `filesToBase64Pages`) handles this — don't switch back to multipart without changing the worker first.

## Frontend layout cheat-sheet

```
src/
  App.jsx               LIFF auth gate (Splash → Register → Pending → PinSetup → PinEntry → Home)
  main.jsx              path-based split between App and AdminApp
  api/
    client.js           legacy LIFF API client (POST JSON)
    liff.js             LIFF SDK init + getIdToken
    auth.js             register/setPin/verifyPin + sessionToken storage
    admin.js            legacy admin wrappers (idToken+sessionToken signatures) — used by src/pages/admin/*
    adminV2.js          parallel V2 set of admin wrappers — used by src/pages/{AdminDashboard,Analytics,...}.jsx
  brand.js              old palette (COLORS.brand, BRAND.appName) — kept for legacy LIFF pages
  brandV2.js            new palette (COLORS.primaryDark, SHADOWS, RADIUS, HEADER_GRADIENT) — V2 pages only
  pages/                LIFF pages: Splash, Register, Pending, PinEntry, Reader, Home, …
    admin/              original LIFF-based admin pages (still wired into Home.jsx)
  admin/                Desktop admin console (Phase 17, QR-login, no LIFF)
    AdminApp.jsx        tab nav: dashboard / upload / users / documents / analytics / logs / notif
    api/admin.js        adminCall (adminToken auth) + endpoint wrappers
    lib/adminSession.js localStorage session: { adminToken, expiresAt, user }
    pages/              QrLogin + 6 admin pages (filled-in versions)
  liff/QrConfirmHandler.jsx   LIFF-side handler for ?pair=<code> URLs
  components/
    BulkActionBar.jsx        legacy (prop: selectedCount, COLORS.primary)
    BulkActionBarV2.jsx      V2 (prop: count, COLORS.primaryDark)
    PageHeader / StatCard / EmptyState   V2-only, import brandV2
```

**Three parallel admin UIs exist** and they are not interchangeable:

| Path | UI | Auth | API |
|------|----|------|-----|
| `src/pages/admin/*.jsx` | mobile LIFF (mint gradient header, fixed-position) | `idToken+sessionToken` | `src/api/admin.js` |
| `src/pages/{AdminDashboard,…}.jsx` | mobile V2 redesign | `idToken+sessionToken` | `src/api/adminV2.js` |
| `src/admin/pages/*.jsx` | **desktop** (full-width, tab nav from `AdminApp`) | `adminToken` | `src/admin/api/admin.js` |

Pages in `src/admin/pages/*` receive `{ user, onNavigate }` props from `AdminApp.jsx` and must **not** render their own top bar — the tab nav and header are provided by the parent.

## Worker layout cheat-sheet (G:/mid-manual-cf/workers/src/)

- `index.ts` mounts `/api/auth`, `/api/documents`, `/api/admin/analytics`, `/api/admin/notifications`, `/api/admin/qr`, `/api/admin/*`. Order matters — sub-paths must register before the catch-all `/api/admin`.
- `middleware/session.ts` — legacy `requireSession + requireAdmin` (LIFF only). Still used by `routes/documents.ts` (mobile users) and `routes/anti_capture.ts`.
- `middleware/admin_session.ts` — `requireAdminSession` (adminToken only, for `/qr/me`, `/qr/logout`) and **`requireAdminAuth`** (the unified one — use this for every new admin route).
- `lib/r2.ts` — `putPage`, `deleteDocumentPages`, `buildPageKey`, `newDocumentPrefix`.
- `lib/admin_session.ts` — admin JWT signing/verifying + `admin_sessions` table operations.
- `lib/line_notify.ts` — flex/text builders for admin LINE notifications. New action types must be added to both `DOC_ACTION_LABELS` and the `action:` union, plus `buildBulkActionText`'s ICONS/LABELS maps.

D1 bindings live in `wrangler.toml`: `DB` (`mid-manual-db`), `PAGES` (R2 bucket `mid-manual-pages`), `SESSIONS` (KV). Schema migrations are SQL files in `G:/mid-manual-cf/schema/` and `G:/mid-manual-cf/workers/sql/`.

## Auto-failure modes to watch for

- **`Missing idToken` on legacy admin routes** → the worker route is still wrapped in `requireSession + requireAdmin` instead of `requireAdminAuth`. Fix in worker.
- **400 on `/documents/create`** → frontend sent multipart instead of base64 JSON.
- **Existing pages break after a "shared file" edit** → `src/api/admin.js`, `src/brand.js`, and `src/components/BulkActionBar.jsx` are referenced by *both* legacy LIFF admin pages and have V2 siblings (`adminV2.js`, `brandV2.js`, `BulkActionBarV2.jsx`). Modify the legacy file only if every consumer is OK with the new shape; otherwise add to the V2 file.
- **Browser still showing old bundle after fix** → the hashed JS filename changed (look at the `dist/assets/index-*.js` hash in the build output) — hard reload required.

## Deploy flow

1. Frontend: pushed via Cloudflare Pages auto-deploy on `main` (production at `mid-manual-viewer.pages.dev`).
2. Worker: must run `npx wrangler deploy` from `G:/mid-manual-cf/workers/`. The auto-mode permission classifier blocks this for Claude — ask the user to run it via `! cd G:/mid-manual-cf/workers && npx wrangler deploy`.
3. Git: `main` is the default branch, protected against direct push by Claude (`git push origin main` blocked by classifier). Open a PR or have the user push.
