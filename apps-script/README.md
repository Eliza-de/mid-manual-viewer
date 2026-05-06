# MID Manual Viewer — Apps Script Backend

Google Apps Script Web App that serves as the backend for the LIFF frontend.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | Entry point, action router |
| `Auth.gs` | LIFF token verification, PIN hashing, session tokens |
| `Users.gs` | User CRUD |
| `Documents.gs` | Document CRUD + PNG page serving |
| `Logs.gs` | AccessLogs, AuthLogs, AuditLogs writers |
| `Admin.gs` | Admin-only endpoints |
| `Watermark.gs` | Server-side watermarking (Phase 5+) |
| `Config.gs` | Read/write Config sheet |
| `Utils.gs` | Helpers |
| `appsscript.json` | Manifest (scopes, runtime) |

## Setup (manual)

See main `docs/SETUP_GUIDE.md` Part A.

Copy each `.gs` file content into a corresponding script file in the Apps Script editor.

## Setup (with clasp)

If you prefer `clasp`:

```bash
npm install -g @google/clasp
clasp login
# In your local repo:
cd apps-script
# Create .clasp.json with your script ID
echo '{"scriptId":"YOUR_SCRIPT_ID"}' > .clasp.json
clasp push
```

> ⚠️ Don't commit `.clasp.json` — it's in `.gitignore`

## Deployment

1. Apps Script editor → **Deploy → New deployment**
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy the `/exec` URL

## One-time setup functions

Run these once after first deploy:

```javascript
// Generate session HMAC key
setupSecrets();

// Bootstrap sheets (in setup/01_create_sheets.gs)
bootstrapSheets();

// Seed default config
seedConfig();

// Optional: create first admin manually
createBootstrapAdmin();
```

## Action Endpoints

| Action | Auth | Phase | Purpose |
|---|---|---|---|
| `ping` | none | 0 | health check |
| `whoami` | LIFF token | 0 | smoke test |
| `checkRegistration` | LIFF token | 0 | check if user is registered |
| `register` | LIFF token | 1 | submit registration |
| `setPin` | LIFF token | 1 | set initial PIN |
| `verifyPin` | LIFF token | 1 | login with PIN |
| `getDocuments` | session | 2 | list active documents |
| `getPage` | session | 3 | fetch a document page as base64 PNG |
| `admin.*` | admin session | 7 | admin operations |

## Token Verification

Every authenticated request requires a `idToken` from `liff.getIDToken()`.
Backend verifies via LINE's `https://api.line.me/oauth2/v2.1/verify` endpoint.

The `line_user_id` is **always** derived from the verified token, never from the request body.

## Notes

- No ORM — direct `SpreadsheetApp` calls (matches Vibharam stack convention)
- Functions return `{ ok, data?, error? }` shape consistently
- All public functions are guarded by token verification + permission checks
- Logs are append-only; never delete
