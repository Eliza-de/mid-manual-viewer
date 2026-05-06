# Security Notes

ภาพรวมการออกแบบความปลอดภัยของระบบ MID Manual Viewer และเหตุผลของแต่ละ design decision

---

## Threat Model

### Assets to protect
1. **คู่มือ PDF** — เนื้อหาภายในโรงพยาบาล ห้ามรั่วไหลภายนอก
2. **ข้อมูลผู้ใช้** — LINE User ID, ชื่อ, แผนก
3. **PIN ผู้ใช้** — ห้ามรั่วในรูป plaintext เด็ดขาด
4. **Audit trail** — ใครดูอะไร เมื่อไหร่ (เพื่อ accountability)

### Threats considered
| Threat | Mitigation | Layer |
|---|---|---|
| ผู้ไม่ได้รับอนุญาตเข้ามาดู | LIFF + LINE User ID whitelist + PIN | Auth |
| ดาวน์โหลด PDF ตรงๆ | ไม่เสิร์ฟ PDF เลย ใช้ PNG รายหน้าผ่าน proxy | Storage/Delivery |
| Save image/screenshot | Watermark ทุกหน้า + dynamic name overlay | Forensic |
| Brute force PIN | Lock หลังพลาด 5 ครั้ง 15 นาที | Auth |
| Session hijack | Short TTL + HMAC-signed token | Session |
| Insider abuse | Audit log ทุก action สำคัญ | Audit |
| Frontend code review reveals secrets | ไม่เก็บ secret ใน frontend | Architecture |
| API replay attack | Token มี timestamp + expire | Token |
| Privilege escalation | Server-side is_admin check ทุก endpoint | Authz |

### Threats accepted (out of scope Phase 0–8)
- ผู้ใช้ที่มีสิทธิ์ถ่ายรูปจอด้วยอุปกรณ์อื่น (กล้องอีกตัว) → mitigated โดย watermark forensic, ไม่ป้องกันได้สนิท
- ผู้ใช้ root/jailbreak อุปกรณ์แล้ว hook เข้า LINE app → out of scope
- การโจมตี LINE platform เอง → trusted dependency

---

## Trust Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│ UNTRUSTED ZONE                                                │
│                                                                │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ Frontend (GitHub Pages — public source code)          │   │
│  │                                                         │   │
│  │  Trust level: ZERO                                      │   │
│  │  - Anyone can read all source                          │   │
│  │  - User can modify localStorage/cookies                │   │
│  │  - User can fake any frontend value                    │   │
│  │  - Network calls from frontend are visible/replayable  │   │
│  │                                                         │   │
│  │  Frontend's only role: collect user input + LIFF token │   │
│  └───────────────────────────────────────────────────────┘   │
│                          │                                     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
              HTTPS POST ────────────────────────┐
              { liffIdToken, action, payload }   │
                           ▼                     │
┌──────────────────────────────────────────────────────────────┐
│ TRUST GATEWAY (Apps Script Web App entry)                     │
│                                                                │
│  Step 1: Verify LIFF ID Token via LINE API                    │
│  Step 2: Extract sub (line_user_id) from verified token       │
│  Step 3: Verify aud matches our LINE Channel ID               │
│  Step 4: Look up user, check status = active                  │
│  Step 5: For sensitive actions: verify session/PIN            │
│  Step 6: For admin actions: verify is_admin                   │
│                                                                │
│  IF ANY STEP FAILS → reject + log to AuthLogs                 │
└──────────────────────────────────────────────────────────────┘
                           │ (only after all checks pass)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ TRUSTED ZONE                                                  │
│                                                                │
│  - Read/write Sheets database                                 │
│  - Read PNG files from Drive                                  │
│  - Apply watermark                                             │
│  - Issue session tokens                                        │
└──────────────────────────────────────────────────────────────┘
```

### Critical rule
**Never trust any value sent by the client except the `liffIdToken`.** The token is the only thing we can verify cryptographically with LINE's public keys.

The `line_user_id` is **derived** from the verified token, never accepted from the client directly.

---

## LIFF ID Token Verification

### How it works
1. Frontend calls `liff.getIDToken()` → returns a JWT
2. Frontend POSTs `{ idToken, action, payload }` to Apps Script
3. Apps Script POSTs to `https://api.line.me/oauth2/v2.1/verify` with the token
4. LINE API returns the decoded payload if valid:
```json
{
  "sub": "U1234abc...",         // line_user_id
  "aud": "1234567890",           // our channel ID
  "iss": "https://access.line.me",
  "exp": 1234567890,
  "iat": 1234567880,
  "name": "Display Name",        // if profile scope granted
  "picture": "https://..."
}
```
5. We **must** verify:
   - HTTP 200 from LINE
   - `aud` matches our `LINE_CHANNEL_ID` from Config
   - `exp` not in the past (LINE checks this, but double-check)
6. If all pass → use `sub` as the authoritative `line_user_id`

### Implementation
See `apps-script/Auth.gs` → function `verifyLiffToken(idToken)`.

### Why not verify locally with public keys?
- LINE rotates keys; verifying remotely is simpler and always correct
- LINE API has high uptime; latency is acceptable (50–200ms)
- Apps Script has limited crypto libraries (no JWT verify out of the box)

---

## PIN Hashing

### Algorithm: HMAC-SHA256 + salt + iterations

```
salt = randomBytes(16)
hash = HMAC-SHA256(pin, salt)
for i in 0..9999:
  hash = HMAC-SHA256(hash, salt)
store: { pin_hash: base64(hash), pin_salt: base64(salt) }
```

### Why this and not bcrypt/Argon2?
- Apps Script has no native bcrypt/Argon2
- HMAC-SHA256 is built in (`Utilities.computeHmacSha256Signature`)
- 10,000 iterations on Apps Script ≈ 200–500ms (acceptable for login UX, costly for brute-force)
- For 6-digit PIN, brute force is the main threat → iteration count is the primary defense

### PIN policy enforcement (server-side)
```javascript
// Reject if any of these:
- length !== 6
- not all digits
- all same digit (000000, 111111, ...)
- ascending sequence (012345, 123456, ..., 456789)
- descending sequence (987654, ..., 543210)
- equals known weak PINs (123123, 121212, etc.)
```

Defined in `apps-script/Auth.gs` → function `validatePinPolicy(pin)`.

### Client-side validation
Same rules in JS for UX, but **server is the source of truth**. Never skip server-side validation.

---

## Session Management

### Design: stateless HMAC-signed tokens

```
sessionPayload = {
  uid: line_user_id,
  iat: now,
  exp: now + 30min,
  ver: 1
}
signature = HMAC-SHA256(JSON.stringify(payload), SECRET_KEY)
sessionToken = base64(payload) + "." + base64(signature)
```

`SECRET_KEY` is stored in `PropertiesService.getScriptProperties()` (private, not in code).

### Verification on each request
1. Split token by `.`
2. Verify signature with same key
3. Decode payload
4. Check exp > now
5. Optionally cross-check uid matches LIFF token uid

### Why stateless instead of session table?
- No DB lookup per request → faster
- Easier to invalidate via SECRET_KEY rotation
- For Phase 0–7 scale, this is enough

### When to use sessions vs LIFF token
- **LIFF token**: every entry to the app (cheap-ish, ~200ms verify)
- **Session token**: for repeated calls within a short period (e.g., flipping pages while reading) to avoid re-verifying LIFF token every page

---

## Anti-Capture Strategy (Layered Defense)

### Layer 1: Browser-level prevention
- `oncontextmenu="return false"` → no right-click menu
- CSS `user-select: none; -webkit-user-select: none;` → no text selection
- CSS `pointer-events: none` on key elements
- Disable common keyboard shortcuts (Ctrl+S, Ctrl+P, PrintScreen, F12, Ctrl+Shift+I)

**Effectiveness:** Stops casual users. Doesn't stop determined ones.

### Layer 2: Visibility detection
- `document.visibilitychange` event → log when user switches tabs
- Blur the canvas when tab loses focus, restore when regains
- Useful signal but not preventive

### Layer 3: DevTools detection (heuristic)
- Use timing-based detection (compare console.log time before/after debugger statement)
- Use window size mismatch detection
- If detected → log + show warning + (optional) auto-logout

**Effectiveness:** Heuristic, false positives possible. Use as signal only, not blocker.

### Layer 4: Static watermark (server-side, baked into PNG)
- "เอกสารภายใน รพ.วิภาราม แหลมฉบัง" + page number
- Applied during PDF→PNG pre-render (Phase 5)
- Cannot be removed without re-rendering

**Effectiveness:** Clear ownership marking, deters sharing.

### Layer 5: Dynamic watermark (client-side overlay)
- LINE display name + last 4 of LINE User ID + timestamp
- Diagonal repeating pattern, semi-transparent
- CSS `mix-blend-mode: difference` to make removal harder
- On screenshot, the user's identity is visible → forensic deterrent

**Effectiveness:** If image leaks, we know who leaked it. **This is the primary deterrent for trusted insiders.**

### Layer 6: Server-side forensic logging
- Log every page view with timestamp, user, document, page
- Periodic snapshots: which user has which document open, for how long
- If a leak is reported → triangulate from logs

**Effectiveness:** Deters internal users who know logging exists.

### What we do NOT do
- ❌ Try to disable hardware screenshots (impossible on web)
- ❌ Try to detect screen recording (most browsers don't expose this)
- ❌ DRM (overkill for hospital internal use)

### Communication to users
We will **explicitly tell users** in the app:
> "เอกสารนี้มีลายน้ำระบุตัวคุณ การเผยแพร่ภาพออกนอกโรงพยาบาลสามารถสืบย้อนกลับมาที่บัญชีของคุณได้"

Transparency is the deterrent.

---

## Audit Logging

### What we log

| Event | Sheet | When |
|---|---|---|
| LIFF init success | AuthLogs | Every app open |
| Registration | AuthLogs | New user submits register form |
| Login success | AuthLogs | After PIN verify |
| Login fail | AuthLogs | Wrong PIN |
| Account lock | AuthLogs | 5 fails in row |
| PIN change | AuthLogs | User changes PIN |
| Logout | AuthLogs | Explicit logout |
| Document open | AccessLogs | Reader page loaded |
| Page change | AccessLogs | User flips page |
| Document close | AccessLogs | Navigate away |
| Screenshot heuristic | AccessLogs | If detected |
| DevTools heuristic | AccessLogs | If detected |
| Admin: approve user | AuditLogs | Admin clicks approve |
| Admin: grant/revoke admin | AuditLogs | Role change |
| Admin: create/edit/delete doc | AuditLogs | Document mutation |
| Admin: disable user | AuditLogs | User disabled |

### What we do NOT log
- ❌ PIN values (even hashed)
- ❌ Full request/response bodies
- ❌ Sensitive personal info beyond what's needed

### Retention
- Logs grow forever in Sheets (~1-2 MB/year for typical use)
- Optional Phase 9: archive logs older than 1 year to a separate Sheet

---

## Secrets Management

### Where secrets live

| Secret | Stored in | Notes |
|---|---|---|
| Apps Script SESSION_HMAC_KEY | `PropertiesService.getScriptProperties()` | Set once during setup |
| LINE_CHANNEL_ID | Config sheet | Public-ish (it's an audience claim) |
| LINE Channel Secret | NOT used in Phase 0 | Would only be needed for Messaging API |
| Apps Script Web App URL | GitHub Secrets | `VITE_APPS_SCRIPT_URL` |
| LIFF ID | GitHub Secrets | `VITE_LIFF_ID` |

### Generating SESSION_HMAC_KEY

Run once in Apps Script:
```javascript
function setupSecrets() {
  const key = Utilities.base64Encode(
    Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
  );
  PropertiesService.getScriptProperties().setProperty('SESSION_HMAC_KEY', key);
  Logger.log('Key set. Length: ' + key.length);
}
```

### Rotation
- If suspect compromise → rotate `SESSION_HMAC_KEY` (all sessions invalidate)
- LIFF channel secret rotation: do via LINE Console
- GitHub Secrets: update in repo settings, redeploy

---

## Common Mistakes to Avoid

### ❌ Don't do
- Pass `lineUserId` in request body and trust it
- Store PIN in plaintext anywhere (request log, error log, debug print)
- Make Drive PDF/PNG files publicly accessible to "anyone with link"
- Skip token verification on a "minor" endpoint
- Log full request body (might contain PIN)
- Use `console.log` to debug PIN-related code in production
- Cache PIN-related data in `CacheService` longer than 1 minute

### ✅ Do
- Always derive `lineUserId` from verified token
- Hash PIN immediately on server, discard plaintext from memory
- Use Apps Script as proxy for all Drive access
- Verify token on every endpoint, even ping if it returns user data
- Sanitize logs of sensitive fields before writing
- Use Logger.log for development, but ensure no sensitive data
- Treat `CacheService` as session-only

---

## Incident Response Playbook (when something goes wrong)

### Suspected leak of a document
1. Check AccessLogs for who viewed that document recently
2. Cross-reference with the leaked image: extract dynamic watermark text
3. Identify the user from watermark
4. Disable user (status=disabled in Users sheet)
5. Document via AuditLogs (manual entry by admin)

### Compromised admin account
1. Set `is_admin = FALSE` for that account immediately
2. Check AuditLogs for any actions taken under that account
3. Reverse any harmful changes
4. Rotate `SESSION_HMAC_KEY` to invalidate all active sessions
5. Force PIN change for the compromised user

### Apps Script Web App URL leaked publicly
1. Not catastrophic — URL alone is useless without LIFF token
2. But to be safe: deploy a new version, get new URL
3. Update GitHub Secret `VITE_APPS_SCRIPT_URL`, redeploy frontend
4. Disable old deployment

### LINE channel compromised
1. Rotate channel secret in LINE Console
2. (We don't use channel secret in Phase 0, so impact is limited)
3. Notify users to re-login

---

## Compliance Notes

### PDPA (Thailand)
- We collect: LINE User ID, display name, picture URL, employee code, department
- Lawful basis: legitimate interest (employee using employer's system)
- Retention: while employed; on termination → admin disables account; logs retained for 1 year then archived
- User rights: can request data via admin; admin can export their record
- Consent: implicit by registering; explicit consent screen recommended for Phase 7

### JCI / Thai HA
- Audit trail satisfies "controlled access to documents" requirement
- Document version control (via `updated_at` and immutable archive of old versions) — Phase 8
- Access list is reviewable (admin can list all active users)

### Internal hospital policy
- All hospital data → must stay within Vibharam-controlled environments
- Google Workspace (Sheets/Drive) → confirm with IT/legal that this is approved
- If not → migrate to internal SQL Server in a future phase

---

## Phase 0 Security Checklist

- [ ] Apps Script Web App: "Execute as: Me" + "Anyone" access
- [ ] `SESSION_HMAC_KEY` set in Script Properties
- [ ] `LINE_CHANNEL_ID` set in Config sheet
- [ ] All Drive files (Source/, Pages/) NOT shared with "Anyone with link"
- [ ] GitHub repo `.gitignore` includes `.env*`, `.clasp.json`, `node_modules/`
- [ ] No secrets in committed files (grep for `AKfycb`, `1234567890-`, `U[a-f0-9]{32}`)
- [ ] LIFF channel scope minimized (`profile`, `openid` only — no email, no chat scopes)
- [ ] Backend `verifyLiffToken` enforces audience check
