# MID Manual Viewer

> Secure PDF manual viewer สำหรับเครื่องมือแพทย์
> โรงพยาบาลวิภาราม แหลมฉบัง

ระบบดูคู่มือเครื่องมือแพทย์ภายในโรงพยาบาลผ่าน LINE LIFF — ปลอดภัย ห้ามดาวน์โหลด มี watermark ระบุผู้อ่าน + admin console บน desktop

---

## Stack

| | |
|---|---|
| **Frontend** | React 18 · Vite 5 · Ant Design 5 · Ant Design Mobile · Recharts |
| **Backend** | Cloudflare Workers (Hono) — `mid-manual-api.elizanu-de.workers.dev` |
| **Database** | Cloudflare D1 — `mid-manual-db` |
| **Storage** | Cloudflare R2 — `mid-manual-pages` (1 หน้า = 1 PNG, ส่งผ่าน signed URL) |
| **Sessions** | Cloudflare KV — `SESSIONS` |
| **Auth** | LINE LIFF + 6-digit PIN (mobile) · QR pairing + adminToken (desktop) |
| **Hosting** | Cloudflare Pages — `mid-manual-viewer.pages.dev` |

Backend Worker อยู่ใน **repo แยก** ที่ `G:/mid-manual-cf/` — ต้อง deploy แยกจาก frontend

---

## Two-app split

`src/main.jsx` route ตาม URL path **ก่อน** React mount:

- `/admin/*` → `src/admin/AdminApp.jsx` — desktop admin console, ไม่ใช้ LIFF, login ด้วย QR pairing
- ทุก path อื่น → `src/App.jsx` — LIFF mobile flow (Splash → Register → Pending → PinSetup → PinEntry → Home)

ทั้งสองแชร์ Vite bundle เดียวกัน แต่ tree ของ auth/API client/theme/pages แยกขาดกัน

---

## Auth flows

### LIFF mobile
1. LIFF SDK init → `getIdToken()`
2. Register (one-time) → backend สร้าง user (status='pending')
3. Admin approve → user status='active'
4. PIN setup (one-time) → 6-digit PIN
5. PIN verify → backend ออก `sessionToken` (JWT) → เก็บไว้ทุก request

### Desktop admin (QR pairing)
1. Desktop เปิด `/admin` → ไม่มี session → QrLogin
2. Desktop เรียก `/api/admin/qr/init` → ได้ pairing code + QR image
3. Admin scan QR ใน LINE → เปิดใน LIFF → `/api/admin/qr/confirm` (มี idToken+sessionToken)
4. Desktop poll `/api/admin/qr/poll` → ได้ `adminToken` (JWT แยกชนิด, อายุ ~8 ชม.) → เก็บใน localStorage `lean_buddy_admin_session`

Backend admin endpoints อยู่ใต้ middleware `requireAdminAuth` ที่รับ **ทั้งสองโหมด** — request ส่ง `{ idToken, sessionToken, payload }` หรือ `{ adminToken, payload }` ก็ใช้ได้

---

## File-upload contract

`/api/admin/documents/{create,replacePage,appendPages,replaceAllPages}` รับ **JSON base64** ไม่ใช่ multipart:

```js
{ adminToken | idToken+sessionToken,
  payload: { ..., pages: [{ data: "<base64 png/jpg ไม่มี data: prefix>" }] } }
```

Helper อยู่ที่ `src/admin/api/admin.js` (`fileToBase64`, `filesToBase64Pages`)

---

## Folder layout

```
mid-manual-viewer/
├── README.md              ← ไฟล์นี้
├── frontend/              ← React + Vite (Cloudflare Pages deploys this)
│   └── src/
│       ├── main.jsx       ← path-based split: AdminApp vs App
│       ├── App.jsx        ← LIFF auth gate
│       ├── api/           ← LIFF API client + V1/V2 admin wrappers
│       ├── pages/         ← LIFF pages (Splash/Register/PinEntry/Home/Reader/...)
│       │   └── admin/     ← LIFF-based admin pages (legacy)
│       ├── admin/         ← Desktop admin console (Phase 17)
│       │   ├── AdminApp.jsx   ← tab nav (Dashboard/Upload/Users/Documents/Logs/Notify)
│       │   ├── api/admin.js   ← adminCall with adminToken
│       │   ├── lib/adminSession.js
│       │   └── pages/         ← QrLogin + 6 admin pages
│       ├── components/    ← DocumentCard, PageImage, PinPad, ...
│       ├── hooks/         ← useAuth, useDocuments, usePageLoader, useThumbnail, ...
│       ├── brand.js · brandV2.js   ← palette (legacy + V2)
│       └── liff/QrConfirmHandler.jsx
├── docs/                  ← legacy docs (อาจมีข้อมูล Apps Script เก่า — ใช้ตามดุลพินิจ)
├── HANDOFF.md             ← legacy handoff (เก่า)
├── apps-script/           ← legacy backend code (dead — ปัจจุบันใช้ Worker)
└── setup/                 ← bootstrap scripts (one-shot)
```

Backend repo (แยก): `G:/mid-manual-cf/`
```
mid-manual-cf/
├── workers/src/
│   ├── index.ts           ← mounts /api/{auth,documents,admin/*}
│   ├── routes/            ← admin.ts, auth.ts, documents.ts, admin_qr.ts, ...
│   ├── middleware/
│   │   ├── session.ts     ← requireSession + requireAdmin (LIFF only)
│   │   └── admin_session.ts ← requireAdminAuth (unified — use this)
│   └── lib/               ← db, r2, admin_session, line_notify, ...
├── schema/                ← D1 migrations (.sql)
└── workers/sql/           ← extra schema patches
```

---

## Quick start

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.local   # ใส่ค่า LIFF ID, API base
npm run dev                  # http://localhost:5173
npm run build                # → dist/
npm run lint

# Worker (cwd = G:/mid-manual-cf/workers/)
npx wrangler dev             # local worker
npx wrangler deploy          # production deploy
npx wrangler tail            # live logs
npx wrangler d1 execute mid-manual-db --remote --command="SELECT count(*) FROM users"
```

ไม่มี test framework

---

## Deploy

1. **Frontend** — push ไป `main` → Cloudflare Pages auto-deploys ไป `mid-manual-viewer.pages.dev`
2. **Worker** — ต้องรัน `npx wrangler deploy` ใน `G:/mid-manual-cf/workers/` ด้วยมือ
3. ลำดับสำคัญ: ถ้า frontend เรียก endpoint ใหม่ของ worker ต้อง deploy worker **ก่อน** push frontend

---

## Phase roadmap

Phases 0–17 complete (foundation, auth, viewer, watermark/anti-capture, logging, admin panel V1/V2, QR-pair desktop console, R2 binary delivery, analytics)

**Current focus:** UX polish — Chapter-N + page-1 thumbnail cards, รวม Dashboard + Analytics, lifecycle actions (permanent delete) สำหรับทั้ง documents และ users

---

## Security highlights

- ภาพหน้าไม่เก็บลง browser cache (signed URL TTL 5 นาที, edge-cached)
- Dynamic watermark แสดงชื่อ + เวลา + last-4 ของ LINE userId บนทุกหน้า
- Anti-capture: ตรวจ visibility/screenshot attempts + บันทึก `capture_attempts` table + แจ้ง admin ผ่าน LINE
- PIN lockout หลัง 5 ครั้งผิด, session expiry (LIFF + admin session แยกชนิด)
- ทุก admin action เขียน `audit_logs` + แจ้ง LINE notify channel

---

## License

Internal use only — Vibharam Laemchabang Hospital

## Contact

IT Department, Vibharam Laemchabang Hospital
