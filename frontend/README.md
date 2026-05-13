# Lean Buddy By Med-healthup — Frontend

React + Vite + Ant Design app for the LINE LIFF mobile viewer and desktop admin console.

## Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with VITE_LIFF_ID, VITE_LINE_CHANNEL_ID, VITE_API_URL

npm run dev      # http://localhost:5173
npm run lint     # eslint src
```

> Note: LIFF features (login, profile) only work when opened inside LINE.
> Local dev outside LINE will fail at "LIFF init" — that's expected.
> The `/admin` route works in any browser (uses QR pairing, not LIFF).

## Build

```bash
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

## Folder Structure

```
src/
├── main.jsx                ← path-based split (lazy-loads AdminApp for /admin/*)
├── App.jsx                 ← LIFF auth gate
├── brand.js                ← BRAND + COLORS
├── api/                    ← client, liff, auth, documents, pages, anti_capture, admin
├── hooks/                  ← useAuth, useDocuments, useNavigation, usePageLoader,
│                             useThumbnail, useAntiCapture
├── liff/QrConfirmHandler.jsx
├── utils/format.js
├── pages/                  ← LIFF pages (Splash, Register, PinEntry, Home, Reader, ...)
│   └── admin/              ← LIFF-based admin pages (mounted from Home.jsx)
├── admin/                  ← Desktop admin console (QR-login, no LIFF)
│   ├── AdminApp.jsx
│   ├── api/admin.js
│   ├── lib/adminSession.js
│   └── pages/              ← QrLogin + 6 admin pages
└── components/             ← shared UI (DocumentCard, PageImage, PinPad,
                              EditUserModal, EditProfileModal, ...)
```

## Environment Variables

All `VITE_*` vars are inlined at build time.

| Var | Purpose |
|---|---|
| `VITE_LIFF_ID` | LIFF app ID from LINE Developers Console |
| `VITE_LINE_CHANNEL_ID` | Parent LINE Login channel ID |
| `VITE_API_URL` | Cloudflare Worker base URL (`https://mid-manual-api.elizanu-de.workers.dev`) |

Production values are baked in via `vite.config.js` fallback + Cloudflare Pages env.

## No localStorage for LIFF session

The LIFF flow keeps the issued `sessionToken` in `sessionStorage` so it clears on tab
close. Only the **desktop admin** stores its `adminToken` in `localStorage`
(`lean_buddy_admin_session`) because the desktop console doesn't have an alternative
session source (no LIFF re-auth).
