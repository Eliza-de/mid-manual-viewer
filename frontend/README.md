# MID Manual Viewer — Frontend

React + Vite + Ant Design app for the MID Manual Viewer LIFF application.

## Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your LIFF ID, Channel ID, and Apps Script URL

npm run dev
```

Open http://localhost:5173 in browser.

> Note: LIFF features (login, profile) only work when opened inside LINE.
> For local dev outside LINE, the smoke-test will fail at "LIFF init" — this is expected.

## Build

```bash
npm run build
# Output goes to dist/
```

## Folder Structure

```
src/
├── main.jsx              ← entry point
├── App.jsx               ← router
├── api/
│   ├── client.js         ← Apps Script API client
│   └── liff.js           ← LIFF SDK wrapper
├── pages/
│   └── Splash.jsx        ← Phase 0 smoke test
├── styles/
│   ├── global.css
│   └── antd-theme.js
└── ...                   ← Phase 1+ adds more
```

## Environment Variables

All `VITE_*` vars are inlined into the build at build time.

| Var | Purpose |
|---|---|
| `VITE_LIFF_ID` | LIFF app ID from LINE Developers Console |
| `VITE_LINE_CHANNEL_ID` | Parent LINE Login channel ID |
| `VITE_APPS_SCRIPT_URL` | Deployed Apps Script Web App URL |

In production, these come from GitHub Secrets via the deploy workflow.

## Why no localStorage?

Per Anthropic's Claude.ai artifact constraints AND for security:
- We don't persist sensitive state across sessions on the client
- All session state is in React state + Apps Script-issued session token
- The session token is stored in `sessionStorage` (cleared on tab close) for Phase 1+

For Phase 0, no storage is used at all.
