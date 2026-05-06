# Setup Guide — Phase 0

Step-by-step guide to bootstrap the MID Manual Viewer project from zero.

**Estimated time:** 45–60 minutes

---

## Prerequisites

Make sure you have these accounts ready (all free):

- [ ] Google account (for Apps Script + Drive + Sheets)
- [ ] GitHub account (for source code + Pages)
- [ ] LINE Developers account (for LIFF channel)
- [ ] Node.js v18+ installed on your dev machine
- [ ] `git` installed
- [ ] (Optional but recommended) `clasp` CLI for Apps Script: `npm install -g @google/clasp`

---

## Part A: Google Sheets + Apps Script Setup

### A.1 Create the Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet → rename to `MID-Manual-DB`
3. Note the spreadsheet ID from URL (between `/d/` and `/edit`)
4. Keep this tab open

### A.2 Open Apps Script editor

1. In the Sheet → menu **Extensions → Apps Script**
2. A new tab opens with `Code.gs` (default)
3. Rename project (top-left) to `MID-Manual-Backend`

### A.3 Add all backend files

For **each** file in `apps-script/` of the handoff package:

1. In Apps Script editor: click **+** next to "Files" → **Script**
2. Name it exactly (e.g. `Auth`, `Users`, etc. — don't add `.gs`, it's added automatically)
3. Paste the content from the handoff
4. Save (Ctrl+S)

Files to add:
- `Code.gs` (rename the default one if needed)
- `Auth.gs`
- `Users.gs`
- `Documents.gs`
- `Logs.gs`
- `Admin.gs`
- `Watermark.gs`
- `Config.gs`
- `Utils.gs`

### A.4 Configure manifest

1. Click ⚙️ **Project Settings** (left sidebar)
2. Check **"Show appsscript.json manifest file"**
3. Go back to Editor → click `appsscript.json`
4. Replace content with the version from the handoff (`apps-script/appsscript.json`)
5. Save

### A.5 Run the bootstrap script

1. Add a new file `setup_01` and paste content of `setup/01_create_sheets.gs`
2. Select function `bootstrapSheets` from the dropdown at top
3. Click **Run**
4. Authorize the script when prompted (you'll see "Google hasn't verified this app" — click Advanced → Go to project)
5. Check execution log → should say `✅ Sheets created`
6. Switch to your Sheet tab → confirm you see 6 sheets: Users, Documents, AccessLogs, AuthLogs, AuditLogs, Config

### A.6 Seed the Config sheet

1. Add new file `setup_02` and paste content of `setup/02_seed_config.gs`
2. Select function `seedConfig` → Run
3. Check Config sheet — should have default key-value rows

> Note: `bootstrap_admin_line_id` will be empty for now. We'll fill it in Part D.

### A.7 Deploy as Web App

1. Click **Deploy → New deployment**
2. Click ⚙️ next to "Select type" → choose **Web app**
3. Settings:
   - **Description:** `MID Manual Viewer v0.1.0`
   - **Execute as:** `Me (your@email.com)`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. Authorize again if prompted
6. **Copy the Web App URL** — you'll need this for the frontend
   - Format: `https://script.google.com/macros/s/AKfycbx.../exec`

> Save this URL somewhere safe. If you lose it, you can find it in **Deploy → Manage deployments**.

### A.8 Test the ping endpoint

In a browser, open: `{your-web-app-url}?action=ping`

Expected response:
```json
{ "ok": true, "message": "pong", "version": "0.1.0", "timestamp": "..." }
```

If you see this → ✅ Backend is alive.

---

## Part B: LINE Developers Console Setup

### B.1 Create or select a Provider

1. Go to https://developers.line.biz/console/
2. Login with your LINE account
3. If no provider exists → **Create** → name it (e.g. "Vibharam Hospital")

### B.2 Create a Login Channel

1. Inside the provider → click **Create a new channel** → choose **LINE Login**
2. Fill in:
   - **Channel name:** `MID Manual Viewer`
   - **Channel description:** `Internal manual viewer for medical equipment`
   - **App types:** check **Web app**
   - **Email address:** your contact
3. Agree to terms → **Create**

### B.3 Note Channel info

After creation, on the channel's **Basic settings** tab, note:
- **Channel ID** (e.g. `1234567890`)
- **Channel secret** (we won't use it in Phase 0, but keep it safe)

### B.4 Create LIFF app

1. Inside the channel → tab **LIFF**
2. Click **Add**
3. Fill in:
   - **LIFF app name:** `MID Manual`
   - **Size:** `Tall`
   - **Endpoint URL:** `https://YOUR_GITHUB_USERNAME.github.io/mid-manual-viewer/`
     - You can use a placeholder URL now and update after Part C
   - **Scope:** check `profile`, `openid`
   - **Bot link feature:** Off
   - **Scan QR:** Off
   - **Module mode:** Off
4. Click **Add**
5. **Copy the LIFF ID** (format: `1234567890-abcdefgh`)
6. **Copy the LIFF URL** (format: `https://liff.line.me/{liff_id}`)

> The LIFF URL is what you'll share with users to open the app.

---

## Part C: GitHub + Frontend Setup

### C.1 Create the GitHub repo

1. Go to https://github.com/new
2. Repo name: `mid-manual-viewer`
3. Visibility: **Public** (required for free GitHub Pages)
4. Don't initialize with README — we'll push our own
5. Click **Create repository**
6. Note the repo URL (e.g. `https://github.com/elizabeth/mid-manual-viewer.git`)

### C.2 Push the frontend code

On your dev machine:

```bash
# extract the handoff package, cd into the project
cd mid-manual-viewer/frontend

# install dependencies
npm install

# test local build
npm run build

# initialize git and push
cd ..  # back to project root
git init
git branch -M main
git add .
git commit -m "Phase 0: foundation setup"
git remote add origin https://github.com/YOUR_USERNAME/mid-manual-viewer.git
git push -u origin main
```

### C.3 Configure GitHub Pages

1. On GitHub repo page → **Settings** → **Pages** (left sidebar)
2. **Source:** select **GitHub Actions**
3. (We'll deploy via the workflow file in `.github/workflows/deploy.yml`)

### C.4 Add GitHub Secrets

1. Repo **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:
   - **Name:** `VITE_LIFF_ID`
   - **Value:** (LIFF ID from Part B.4)
3. Repeat for:
   - `VITE_APPS_SCRIPT_URL` = (Web App URL from Part A.7)
   - `VITE_LINE_CHANNEL_ID` = (Channel ID from Part B.3)

### C.5 Trigger first deploy

```bash
# make a trivial change to trigger workflow
git commit --allow-empty -m "trigger deploy"
git push
```

1. On GitHub → **Actions** tab → watch the workflow run
2. Should complete in 1–2 minutes
3. Once green → go to **Settings → Pages** to see live URL
4. Open in browser — should show splash screen with "Opening through LINE..." message

> Note: Splash will only fully work when opened **inside LINE** (LIFF requires LINE in-app browser).

### C.6 Update LIFF endpoint

1. Back in LINE Developers Console → your LIFF app → **Edit**
2. Set **Endpoint URL** to the actual GitHub Pages URL (e.g. `https://elizabeth.github.io/mid-manual-viewer/`)
3. Save

---

## Part D: Bootstrap First Admin

### D.1 Open the LIFF in LINE

1. On your phone, open LINE
2. Open a chat with yourself (Keep memo) or any chat
3. Send the LIFF URL: `https://liff.line.me/{your_liff_id}`
4. Tap the URL — LIFF will open inside LINE

### D.2 Get your LINE User ID

1. The splash screen will show your LIFF init result
2. It should display: "ยังไม่ได้ลงทะเบียน — LINE User ID: U1234abc..."
3. Long-press to copy your LINE User ID, or screenshot it

### D.3 Set yourself as bootstrap admin

1. Open the Google Sheet → `Config` sheet
2. Find row with key = `bootstrap_admin_line_id`
3. Paste your LINE User ID into the `value` column
4. Save

### D.4 Register

1. Reload the LIFF app (close and reopen)
2. You should now see registration form (Phase 1 will implement this — for Phase 0, we just verify the user check works)

> In Phase 0, the app will only do a "ping" handshake. The actual registration UI is Phase 1.

### D.5 Verify ping works end-to-end

The Phase 0 frontend should display:
```
✅ LIFF initialized
✅ User ID: U1234abc...
✅ Backend ping: pong
✅ Channel ID match: yes
```

If all 4 are green → **Phase 0 complete**.

---

## Part E: Smoke Tests

Run through this checklist before declaring Phase 0 done:

### Backend
- [ ] Apps Script Web App URL responds to `?action=ping` with `{ok: true}`
- [ ] All 6 sheets exist with correct headers
- [ ] Config sheet has all default values

### Frontend
- [ ] GitHub Actions deploy succeeds without errors
- [ ] Live URL loads
- [ ] No errors in browser console
- [ ] Loads correctly in mobile viewport (Chrome DevTools mobile mode)

### LIFF
- [ ] Opens inside LINE in-app browser
- [ ] `liff.init()` succeeds
- [ ] `liff.getProfile()` returns userId, displayName
- [ ] Frontend successfully POSTs to Apps Script
- [ ] Apps Script verifies the LIFF ID token correctly

### Security
- [ ] Apps Script Web App is set to "Execute as: Me"
- [ ] LINE Channel ID stored in Apps Script Config (for token audience verification)
- [ ] No secrets in committed code (only env vars)
- [ ] Repo `.gitignore` includes `.env`, `.env.local`, `node_modules`

---

## Troubleshooting

### "Authorization required" loop in Apps Script
- Make sure you ran a function manually first (e.g. `bootstrapSheets`) and accepted the OAuth prompt
- Re-deploy the Web App after adding new scopes to `appsscript.json`

### LIFF shows "LIFF initialization failed"
- Check the LIFF ID is correct in GitHub Secrets
- Confirm the Endpoint URL in LINE Console matches GitHub Pages URL exactly (trailing slash matters!)
- LIFF requires HTTPS — GitHub Pages provides this automatically

### "CORS error" when frontend calls Apps Script
- Apps Script Web Apps return CORS-friendly responses by default
- Make sure the Web App is deployed with "Anyone" access
- Use `text/plain` content type when posting (NOT `application/json`) — Apps Script quirk
- See `frontend/src/api/client.js` for the correct fetch pattern

### GitHub Actions fails with "Permission denied"
- Repo **Settings → Actions → General → Workflow permissions** → enable **Read and write permissions**
- Repo **Settings → Pages** → ensure source is **GitHub Actions**

### Sheet bootstrap script fails
- Make sure you opened Apps Script from inside the target Sheet (uses `SpreadsheetApp.getActiveSpreadsheet()`)
- Check execution log for specific error
- Try running `bootstrapSheets` again — it should be idempotent

### LIFF works in Chrome desktop but not in LINE app
- LINE in-app browser is iOS Safari-based on iPhone, Chrome-based on Android
- Make sure no `localStorage`/`sessionStorage` usage (works fine in both, but be aware)
- Test on actual device — desktop simulators are not 100% accurate

---

## Next Steps

After Phase 0 sign-off:

1. Tag this version: `git tag v0.1.0 && git push --tags`
2. Bump `app_version` in Config sheet to `0.2.0-dev`
3. Start Phase 1: Authentication (registration → PIN setup → PIN verification)

See `HANDOFF.md` § 5 for phase roadmap.
