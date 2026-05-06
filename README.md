# MID Manual Viewer

> Secure PDF manual viewer สำหรับเครื่องมือแพทย์
> โรงพยาบาลวิภาราม แหลมฉบัง

ระบบดูคู่มือเครื่องมือแพทย์ภายในโรงพยาบาลผ่าน LINE LIFF — ปลอดภัย ห้ามดาวน์โหลด มี watermark ระบุผู้อ่าน

---

## ภาพรวม

| | |
|---|---|
| **Frontend** | React 18 + Vite + Ant Design 5 + Ant Design Mobile |
| **Backend** | Google Apps Script Web App |
| **Database** | Google Sheets |
| **Storage** | Google Drive (PDF + PNG รายหน้า) |
| **Auth** | LINE LIFF + 6-digit PIN |
| **Hosting** | GitHub Pages (frontend) + Apps Script (backend) |

---

## Quick Start

ดูคู่มือเต็ม → [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)

```bash
# Frontend dev
cd frontend
npm install
cp .env.example .env.local
# แก้ .env.local ให้ใส่ค่าจริง
npm run dev
```

---

## Documentation

| ไฟล์ | สำหรับ |
|---|---|
| [`HANDOFF.md`](HANDOFF.md) | overview ของ project + decisions + phases |
| [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) | คู่มือ setup จาก zero (45-60 นาที) |
| [`docs/SECURITY_NOTES.md`](docs/SECURITY_NOTES.md) | ภาพรวม security boundaries |
| [`docs/PDF_CONVERSION_GUIDE.md`](docs/PDF_CONVERSION_GUIDE.md) | วิธีแปลง PDF → PNG ก่อน upload |

---

## Phase Roadmap

| Phase | สิ่งที่ทำ | Status |
|---|---|---|
| 0 | Foundation: sheets, Apps Script skeleton, LIFF, GitHub Pages | ✅ |
| 1 | Authentication: register, PIN setup, PIN verify | ⏳ |
| 2 | Bottom tab navigation + document list | ⏳ |
| 3 | PDF viewer (PNG-based) + page navigation | ⏳ |
| 4 | Anti-capture overlay + dynamic watermark | ⏳ |
| 5 | Server-side static watermark + admin upload UI | ⏳ |
| 6 | Logging system | ⏳ |
| 7 | Admin panel (approval, users, docs, logs) | ⏳ |
| 8 | Hardening: rate limit, lockout, session expiry | ⏳ |

---

## Folder Structure

```
mid-manual-viewer/
├── HANDOFF.md              ← project handoff document
├── README.md               ← this file
├── .github/workflows/      ← GitHub Pages deployment
├── apps-script/            ← backend (Google Apps Script)
├── frontend/               ← frontend (Vite + React)
├── setup/                  ← bootstrap scripts (run once)
└── docs/                   ← documentation
```

---

## License

Internal use only — Vibharam Laemchabang Hospital

---

## Contact

IT Department, Vibharam Laemchabang Hospital
