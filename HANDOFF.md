# MID Manual Viewer — Phase 0 Handoff Document

> **Project:** Secure PDF Manual Viewer สำหรับเครื่องมือแพทย์ (โรงพยาบาลวิภาราม แหลมฉบัง)
> **Phase:** 0 — Foundation Setup
> **Owner:** Elizabeth (IT Developer, Vibharam Laemchabang Hospital)
> **Last Updated:** 2026-05-06

---

## 1. Project Overview

ระบบดูคู่มือเครื่องมือแพทย์ผ่าน LINE LIFF แบบปลอดภัย ห้ามดาวน์โหลด ห้ามแคปจอ มีลายน้ำระบุผู้อ่าน

### Locked Decisions (Phase 0)

| # | Decision | Value |
|---|---|---|
| 1 | PIN Length | **6 หลัก** (digits only) |
| 2 | PDF Rendering | **Server-side PNG** (manual conversion + zip upload) |
| 3 | Multi-Admin | **Yes** — via `is_admin` column in Users sheet |
| 4 | Document Granularity | **1 PDF = 1 เรื่อง** (sub-topics split into separate files) |
| 5 | LIFF Channel | **สร้างใหม่** ใน LINE Developers Console |
| 6 | Frontend Hosting | **GitHub Pages** (Phase 0–2) → ขยับเป็น Cloudflare Pages ภายหลังถ้าจำเป็น |
| 7 | Auth Strategy | LIFF ID Token verification + PIN hash + session token |

---

## 2. Architecture (Locked)

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE Mobile App                           │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  LIFF (https://liff.line.me/{LIFF_ID})            │    │
│  │  → redirect → GitHub Pages                         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (GitHub Pages — Public Repo)                      │
│  - Vite + React 18 + Ant Design 5 + Ant Design Mobile       │
│  - LIFF SDK                                                  │
│  - PDF page renderer (PNG-based, NOT PDF.js in Phase 0)     │
│  - Anti-capture overlay + watermark                         │
│                                                              │
│  https://{username}.github.io/mid-manual-viewer/            │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS POST
                              │ { liffIdToken, action, payload }
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Google Apps Script Web App)                       │
│  Code.gs    — Router (doGet/doPost)                         │
│  Auth.gs    — LIFF token verify, PIN hash, sessions         │
│  Users.gs   — User CRUD                                      │
│  Documents.gs — Document CRUD + PNG proxy                   │
│  Logs.gs    — AccessLogs / AuthLogs / AuditLogs             │
│  Admin.gs   — Admin-only endpoints                          │
│  Watermark.gs — Server-side static watermark (Phase 4)      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌───────────────┐         ┌─────────────────┐
        │ Google Sheets │         │  Google Drive   │
        │ (Database)    │         │  (PDF + PNG)    │
        └───────────────┘         └─────────────────┘
```

### Why this architecture
- **No DoctorSmart core changes** — completely standalone
- **No own server** — uses Google free quota + GitHub Pages
- **Public frontend code is OK** because:
  - All sensitive logic is in Apps Script (private)
  - Every request requires verified LIFF ID token
  - LINE User ID must be in whitelist + valid PIN

---

## 3. Google Sheets Schema

### File: `MID-Manual-DB`

#### Sheet 1: `Users`
| Column | Type | Required | Notes |
|---|---|---|---|
| id | string | ✅ | UUID v4 |
| line_user_id | string | ✅ | unique, from LIFF |
| display_name | string | ✅ | from liff.getProfile() |
| picture_url | string | | from liff.getProfile() |
| department | string | ✅ | กรอกตอนลงทะเบียน |
| employee_code | string | | optional |
| pin_hash | string | ✅ | base64(HMAC-SHA256(pin, salt)) iter=10000 |
| pin_salt | string | ✅ | base64(16 random bytes) |
| pin_attempts | number | | reset to 0 on success, default 0 |
| pin_locked_until | datetime | | ISO 8601, empty if not locked |
| is_admin | boolean | | TRUE / FALSE |
| status | enum | ✅ | pending / active / disabled |
| created_at | datetime | ✅ | ISO 8601 |
| approved_at | datetime | | ISO 8601 |
| approved_by | string | | line_user_id of approver |
| last_login_at | datetime | | ISO 8601 |
| pin_changed_at | datetime | | ISO 8601 (for 180-day rotation) |

#### Sheet 2: `Documents`
| Column | Type | Required | Notes |
|---|---|---|---|
| id | string | ✅ | UUID v4 |
| title | string | ✅ | e.g. "F-MID-005 ใบรายงานตรวจเช็คบำรุงรักษา" |
| form_code | string | | e.g. "F-MID-005" |
| category | enum | ✅ | full_book / topic / summary |
| description | text | | |
| drive_pdf_id | string | | original PDF (admin-only access) |
| drive_pages_folder_id | string | ✅ | folder containing page_001.png, page_002.png... |
| page_count | number | ✅ | |
| sort_order | number | ✅ | for display ordering |
| status | enum | ✅ | active / hidden / archived |
| created_at | datetime | ✅ | |
| updated_at | datetime | ✅ | |
| created_by | string | ✅ | line_user_id |

#### Sheet 3: `AccessLogs`
| Column | Type | Notes |
|---|---|---|
| id | string | UUID |
| timestamp | datetime | ISO 8601 |
| line_user_id | string | |
| document_id | string | |
| action | enum | view_open / page_change / view_close / screenshot_attempt / devtools_detected |
| page_number | number | |
| user_agent | string | |
| session_id | string | |

#### Sheet 4: `AuthLogs`
| Column | Type | Notes |
|---|---|---|
| id | string | UUID |
| timestamp | datetime | |
| line_user_id | string | |
| action | enum | register / login_success / login_fail / pin_change / logout / locked |
| details | string | e.g. "attempt 3/5" |
| user_agent | string | |

#### Sheet 5: `AuditLogs` (admin actions)
| Column | Type | Notes |
|---|---|---|
| id | string | UUID |
| timestamp | datetime | |
| actor_line_user_id | string | who did it |
| action | enum | grant_admin / revoke_admin / approve_user / reject_user / disable_user / create_doc / update_doc / delete_doc |
| target | string | line_user_id or document_id |
| details | string | JSON-stringified context |

#### Sheet 6: `Config`
| key | value | Notes |
|---|---|---|
| session_ttl_minutes | 30 | session expiry |
| max_pin_attempts | 5 | before lockout |
| pin_lockout_minutes | 15 | |
| pin_rotation_days | 180 | force PIN change |
| watermark_static_text | "เอกสารภายใน รพ.วิภาราม แหลมฉบัง" | |
| bootstrap_admin_line_id | (Elizabeth's LINE User ID) | first admin |
| app_name | "MID Manual Viewer" | |
| app_version | "0.1.0" | |

---

## 4. Repository Structure

```
mid-manual-viewer/
├── README.md
├── HANDOFF.md                  ← this file
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml          ← GitHub Pages deployment
├── docs/
│   ├── SETUP_GUIDE.md          ← step-by-step setup
│   ├── ADMIN_GUIDE.md          ← how to use admin panel (Phase 7)
│   ├── PDF_CONVERSION_GUIDE.md ← how to convert PDF→PNG manually
│   └── SECURITY_NOTES.md       ← security boundaries explained
├── apps-script/
│   ├── README.md
│   ├── .clasp.json.example
│   ├── appsscript.json
│   ├── Code.gs                 ← entry, router
│   ├── Auth.gs                 ← LIFF verify, PIN, sessions
│   ├── Users.gs
│   ├── Documents.gs
│   ├── Logs.gs
│   ├── Admin.gs
│   ├── Watermark.gs            ← stub in Phase 0
│   ├── Config.gs               ← read Config sheet
│   └── Utils.gs                ← UUID, hash helpers
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   ├── public/
│   │   └── liff-favicon.png
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   ├── api/
│   │   │   ├── client.js       ← fetch wrapper
│   │   │   ├── auth.js
│   │   │   ├── documents.js
│   │   │   └── admin.js
│   │   ├── hooks/
│   │   │   ├── useLiff.js
│   │   │   ├── useSession.js
│   │   │   └── useAntiCapture.js
│   │   ├── components/
│   │   │   ├── BottomTab.jsx
│   │   │   ├── PageRenderer.jsx
│   │   │   ├── Watermark.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── pages/
│   │   │   ├── Splash.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PendingApproval.jsx
│   │   │   ├── PinEntry.jsx
│   │   │   ├── PinSetup.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Topics.jsx
│   │   │   ├── Summary.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Reader.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── ApprovalQueue.jsx
│   │   │       ├── UserManagement.jsx
│   │   │       ├── AdminManagement.jsx
│   │   │       ├── DocumentManagement.jsx
│   │   │       └── LogViewer.jsx
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── antd-theme.js
│   │   └── utils/
│   │       ├── constants.js
│   │       └── format.js
│   └── README.md
└── setup/
    ├── 01_create_sheets.gs     ← run once to bootstrap sheets
    ├── 02_seed_config.gs       ← seed Config sheet
    └── 03_create_admin.gs      ← bootstrap first admin
```

---

## 5. Phase 0 Deliverables (this handoff)

✅ Architecture finalized
✅ Sheet schema defined
✅ Project folder structure defined
✅ Setup guide written (see `docs/SETUP_GUIDE.md`)
✅ Apps Script skeleton files
✅ Frontend skeleton files
✅ GitHub Actions workflow for deployment
✅ Bootstrap scripts for Sheets

### What works after Phase 0
- Sheets created and seeded
- Apps Script deployed and reachable
- LIFF channel configured
- Frontend deploys to GitHub Pages on push
- "Hello World" page that successfully:
  - Initializes LIFF
  - Gets user profile
  - Calls Apps Script ping endpoint
  - Verifies the LIFF token roundtrip works

### What does NOT work yet (later phases)
- ❌ Registration flow → Phase 1
- ❌ PIN entry/verification → Phase 1
- ❌ Bottom tab navigation → Phase 2
- ❌ PDF viewer → Phase 3
- ❌ Anti-capture / watermark → Phase 4
- ❌ Server-side watermark → Phase 5
- ❌ Logging system → Phase 6
- ❌ Admin panel → Phase 7
- ❌ Hardening → Phase 8

---

## 6. Setup Order (do these in order)

Detailed in `docs/SETUP_GUIDE.md`. High-level:

1. **Google Cloud / Apps Script setup** (~10 min)
   - Create new Google Sheet `MID-Manual-DB`
   - Open Extensions → Apps Script
   - Copy all `.gs` files from `apps-script/`
   - Run `setup/01_create_sheets.gs`
   - Deploy as Web App (Execute as: Me, Access: Anyone)
   - Copy Web App URL

2. **LINE Developers Console setup** (~10 min)
   - Create new Provider (or use existing)
   - Create new Login Channel
   - Create LIFF app inside channel:
     - Endpoint: `https://{username}.github.io/mid-manual-viewer/`
     - Size: Tall
     - Scope: `profile`, `openid`
   - Copy LIFF ID and Channel ID

3. **GitHub setup** (~10 min)
   - Create new repo `mid-manual-viewer` (public for free Pages)
   - Push frontend code
   - Settings → Pages → Source: GitHub Actions
   - Settings → Secrets and variables → Actions:
     - `VITE_LIFF_ID` = from step 2
     - `VITE_APPS_SCRIPT_URL` = from step 1
     - `VITE_LINE_CHANNEL_ID` = from step 2
   - Push triggers auto-deploy

4. **Bootstrap first admin** (~5 min)
   - Open LIFF URL in your phone via LINE
   - Frontend will show "ยังไม่ได้ลงทะเบียน" + your LINE User ID
   - Copy that LINE User ID
   - Edit `Config` sheet → set `bootstrap_admin_line_id` = your LINE User ID
   - Reload LIFF → register → auto-promoted to admin

5. **Smoke test**
   - Confirm Sheets has new entry
   - Confirm AuthLogs has register entry
   - Confirm `is_admin = TRUE` for your user

---

## 7. Security Boundaries (read carefully)

### Trust Levels
| Layer | Trust | Notes |
|---|---|---|
| Frontend code | ❌ Untrusted (public repo) | Anyone can read |
| `liffIdToken` from client | ✅ Trusted **after verification** | Verify with `https://api.line.me/oauth2/v2.1/verify` |
| `lineUserId` from client | ❌ Never trust | Always derive from verified ID token |
| Session token (custom) | ✅ Trusted if valid HMAC | Issued by Apps Script, signed |
| PIN | ❌ Never log or store plaintext | Hash + salt + iterations only |

### Required Backend Checks (every request)
1. Parse `liffIdToken` from request body
2. Verify with LINE API → get `sub` (= line_user_id) and `aud` (must equal LIFF channel ID)
3. Look up user in Users sheet by line_user_id
4. Check status = active, not locked
5. For admin endpoints: check is_admin = TRUE
6. Then proceed with action

### Things NEVER to do
- ❌ Trust line_user_id sent in request body
- ❌ Store PIN in plaintext anywhere
- ❌ Put Apps Script URL or LIFF ID in source code (use env vars + GitHub Secrets)
- ❌ Log PIN values, even in failed attempts
- ❌ Allow admin actions without explicit is_admin check
- ❌ Make Drive files public — always proxy through Apps Script

### Things to ALWAYS do
- ✅ Verify LIFF ID token on every backend request
- ✅ Log all auth events to AuthLogs
- ✅ Log all admin actions to AuditLogs
- ✅ Use HTTPS only (LIFF requires it)
- ✅ Set short session TTL (30 min default)
- ✅ Rotate PIN every 180 days

---

## 8. Constraints & Conventions

### Code Style
- **JavaScript:** ES2022, no TypeScript in Phase 0 (add later if desired)
- **React:** Function components only, hooks
- **Naming:**
  - Files: PascalCase for components, camelCase for utils
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Comments:** Thai or English, prefer English for technical terms
- **No console.log in production builds** (use a wrapper or strip with Vite)

### Apps Script Conventions
- **No ORM** — use direct `SpreadsheetApp` calls (consistent with Vibharam stack)
- **Stored function names:** verbs first — `getUserByLineId`, `createDocument`, `verifyPin`
- **Error handling:** return `{ ok: boolean, data?: any, error?: string }` from every function
- **All public functions guarded** by token verification + permission check

### Frontend Conventions
- **Ant Design 5** + **Ant Design Mobile 5** — Mobile for tabs/touch UI, AntD 5 for admin desktop
- **Routing:** React Router v6
- **State:** React Context for session + LIFF, no Redux needed at this scale
- **API calls:** centralized in `src/api/client.js`
- **All AntD imports** explicit (don't import whole library)

### Versioning
- Each phase bumps `app_version` in Config sheet
- Apps Script: deploy new version per phase, keep old versions for rollback
- Frontend: GitHub releases with semantic version tag

---

## 9. Open Items for Future Phases

### Phase 1 (Auth)
- [ ] Decide PIN entry UI: per-digit boxes or single input?
- [ ] Show last 4 digits of LINE User ID on register form for confirmation?
- [ ] Email/SMS notification when admin approves user? (probably not, LINE push instead later)

### Phase 4 (Anti-capture)
- [ ] Watermark text format final design (size, opacity, angle, density)
- [ ] DevTools detection sensitivity (false positive risk)
- [ ] What to do on screenshot detection: log only? blur? logout?

### Phase 5 (Server-side watermark)
- [ ] Use static-only or also dynamic name on PNG? (dynamic = re-generate per user request, expensive)
- [ ] Image quality vs size tradeoff (start with PNG @ 1200px width, q=85)

### Phase 7 (Admin)
- [ ] Bulk approve UI? Single-by-single approve in v1
- [ ] Export logs to CSV? Yes, AntD Table has export
- [ ] Delete vs disable? Always disable, never hard delete

---

## 10. Files in this Handoff

See sibling files in this folder:
- `docs/SETUP_GUIDE.md` — step-by-step setup walkthrough
- `docs/PDF_CONVERSION_GUIDE.md` — how admin converts PDF to PNG
- `docs/SECURITY_NOTES.md` — security boundary deep-dive
- `apps-script/*.gs` — backend skeleton
- `frontend/**/*` — frontend skeleton
- `setup/01_create_sheets.gs` — bootstrap script

---

## 11. Acceptance Criteria for Phase 0

Phase 0 is **DONE** when all of these are true:

- [ ] Google Sheet `MID-Manual-DB` exists with all 6 sheets and correct headers
- [ ] Config sheet seeded with default values
- [ ] Apps Script deployed; ping endpoint returns `{ ok: true }`
- [ ] LIFF channel created; LIFF ID obtained
- [ ] GitHub repo created; GitHub Pages enabled
- [ ] Frontend deploys successfully on push
- [ ] Opening LIFF URL in LINE shows splash screen and your LINE User ID
- [ ] Bootstrap admin entry exists in Users sheet with `is_admin = TRUE`
- [ ] AuthLogs has register entry for bootstrap admin
- [ ] No errors in Apps Script logs
- [ ] No errors in browser console
- [ ] README.md is committed

When all checked → **Phase 0 complete, ready for Phase 1**.

---

## 12. Contact & Notes

- **Project repo:** (to be created)
- **Sheet ID:** (to be filled after creation)
- **LIFF ID:** (to be filled after creation)
- **Apps Script Web App URL:** (to be filled after deployment)
- **GitHub Pages URL:** (to be filled after deployment)

Keep these in a separate `.env.local` file (not committed) and in your password manager.
