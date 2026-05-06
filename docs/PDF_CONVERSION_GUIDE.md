# PDF Conversion Guide (สำหรับ Admin)

วิธีแปลง PDF เป็น PNG รายหน้าก่อน upload เข้าระบบ MID Manual Viewer

ระบบเลือก strategy นี้เพื่อให้ปลอดภัยสูงสุด: PDF ต้นฉบับไม่ส่งไปฝั่ง client เลย → ผู้ใช้ดูได้แค่ภาพ ไม่สามารถ save-as-pdf หรือ extract text ได้

---

## เครื่องมือแนะนำ

### Option A: ImageMagick + Ghostscript (Windows/Mac/Linux)

**ติดตั้งครั้งเดียว:**

#### Windows
1. Download ImageMagick: https://imagemagick.org/script/download.php#windows
2. ติดตั้ง — ✅ check "Install legacy utilities (e.g. convert)"
3. ✅ check "Install development headers and libraries for C and C++"
4. Ghostscript จะติดตั้งให้อัตโนมัติ

#### macOS
```bash
brew install imagemagick ghostscript
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install imagemagick ghostscript
```

**ใช้งาน:**
```bash
# แปลง F-MID-005.pdf เป็น PNG รายหน้า
magick -density 150 F-MID-005.pdf -quality 90 -resize 1200x F-MID-005-page-%03d.png
```

ผลลัพธ์:
```
F-MID-005-page-000.png   (page 1)
F-MID-005-page-001.png   (page 2)
F-MID-005-page-002.png   (page 3)
...
```

> **หมายเหตุ:** ImageMagick บน Windows อาจขึ้น "not authorized" → แก้โดยแก้ไฟล์ `policy.xml` (ดู troubleshooting ด้านล่าง)

---

### Option B: pdftoppm (เร็วและเสถียรกว่า ImageMagick)

#### Windows
1. Download poppler: https://github.com/oschwartz10612/poppler-windows/releases
2. แตก zip ไปที่ `C:\poppler\`
3. เพิ่ม `C:\poppler\Library\bin` ใน PATH

#### macOS
```bash
brew install poppler
```

#### Linux
```bash
sudo apt-get install poppler-utils
```

**ใช้งาน:**
```bash
# แปลงเป็น PNG, 150 DPI
pdftoppm -png -r 150 F-MID-005.pdf F-MID-005-page
```

ผลลัพธ์:
```
F-MID-005-page-1.png
F-MID-005-page-2.png
F-MID-005-page-3.png
...
```

> ⚠️ pdftoppm ใช้ -1 indexing ส่วน ImageMagick ใช้ %03d (000-indexed) — เลือกอย่างใดอย่างหนึ่งและ rename ให้ตรงกับที่ระบบต้องการ

---

### Option C: GUI Tool (สำหรับคนไม่อยากใช้ command line)

**XnConvert** (ฟรี, Windows/Mac/Linux): https://www.xnview.com/en/xnconvert/

1. เปิด XnConvert
2. **Input:** drag PDF เข้ามา
3. **Actions:** เพิ่ม "Resize" → max width 1200
4. **Output:**
   - Format: PNG
   - Folder: `output/`
   - Filename pattern: `{Filename}-page-{Counter:000}`
5. กด **Convert**

---

## รูปแบบไฟล์ที่ระบบต้องการ

### File naming convention

ระบบต้องการชื่อไฟล์รูปแบบ:
```
page_001.png
page_002.png
page_003.png
...
page_NNN.png
```

ใช้ **3 หลัก zero-padded** เสมอ (รองรับ PDF สูงสุด 999 หน้า)

### Rename จาก output ของแต่ละ tool

#### หลังใช้ ImageMagick (`%03d` = 000-indexed)
```bash
# Windows PowerShell
Get-ChildItem "F-MID-005-page-*.png" | ForEach-Object {
  $num = [int]($_.Name -replace 'F-MID-005-page-(\d+)\.png','$1') + 1
  Rename-Item $_.FullName ("page_{0:D3}.png" -f $num)
}

# macOS/Linux bash
i=1; for f in F-MID-005-page-*.png; do
  printf -v new "page_%03d.png" $i
  mv "$f" "$new"
  i=$((i+1))
done
```

#### หลังใช้ pdftoppm (`-1` to `-N`)
```bash
# macOS/Linux bash
for f in F-MID-005-page-*.png; do
  num=$(echo "$f" | sed 's/.*page-\([0-9]*\)\.png/\1/')
  printf -v new "page_%03d.png" $num
  mv "$f" "$new"
done
```

---

## คุณภาพและขนาดไฟล์ที่แนะนำ

| Setting | Value | เหตุผล |
|---|---|---|
| DPI | 150 | คมพอสำหรับอ่าน, ไม่ใหญ่เกิน |
| Width | max 1200px | mobile screen 4x retina = 1200 width |
| Format | PNG | รองรับ transparency สำหรับ overlay watermark |
| Quality | 90 (PNG) | บีบอัดดี ไม่เสียคุณภาพ |
| File size target | ≤ 800 KB ต่อหน้า | ส่งผ่าน Apps Script ไม่ติด quota |

ถ้าได้ไฟล์ > 1MB ต่อหน้า → ลด DPI เป็น 120 หรือ width เป็น 1000

### ตรวจขนาดไฟล์ก่อน upload

```bash
# Windows PowerShell
Get-ChildItem page_*.png | Sort-Object Length -Descending | Select-Object Name, @{N='SizeKB';E={[math]::Round($_.Length/1KB,1)}} -First 5

# macOS/Linux
ls -lhS page_*.png | head -5
```

---

## Workflow แนะนำสำหรับ Admin

### Step 1: เตรียม PDF ต้นฉบับ
- ตรวจสอบ PDF ไม่ encrypt หรือ password protected
- ถ้ามีหลายเรื่องในไฟล์เดียว → แยกออกเป็นไฟล์ละเรื่อง (ใช้ Adobe Acrobat / PDF24 / smallpdf)

### Step 2: แปลงเป็น PNG
```bash
# ตัวอย่าง: F-MID-005.pdf → folder F-MID-005/
mkdir F-MID-005
cd F-MID-005
pdftoppm -png -r 150 ../F-MID-005.pdf page
# rename ตามที่ระบบต้องการ
```

### Step 3: ตรวจสอบผลลัพธ์
- เปิดดู page_001.png, page_010.png, page สุดท้าย
- ตรวจ: ตัวอักษรอ่านได้, ตารางครบ, ไม่มีหน้าหายไป
- ตรวจขนาดไฟล์ ≤ 800 KB ต่อหน้า

### Step 4: บีบเป็น ZIP
```bash
# Windows: คลิกขวา → Send to → Compressed folder
# macOS: คลิกขวา → Compress
# Linux: zip -r F-MID-005.zip F-MID-005/

# หรือ command line
zip -r F-MID-005.zip F-MID-005/
```

โครงสร้างใน ZIP:
```
F-MID-005.zip
└── F-MID-005/
    ├── page_001.png
    ├── page_002.png
    ├── page_003.png
    └── ...
```

### Step 5: Upload ผ่าน Admin Panel (Phase 7)
- หน้า **Document Management** → **Add New**
- กรอก: title, form_code, category, description
- Upload ZIP
- ระบบจะ extract และเก็บใน Drive folder อัตโนมัติ

> **Phase 0 note:** Phase 0 ยังไม่มี admin upload UI — ทำ manual ก่อนตามขั้นตอนใน "Manual Upload" ด้านล่าง

---

## Manual Upload (Phase 0–6, ก่อนมี Admin UI)

ระหว่างยังไม่มี admin panel ให้ admin ทำเอง:

### 1. สร้าง folder ใน Google Drive
```
MID-Manual-Viewer/
└── Pages/
    └── {document-uuid}/        ← admin generate UUID เอง
        ├── page_001.png
        ├── page_002.png
        └── ...
```

### 2. Generate UUID
- ใช้ https://www.uuidgenerator.net/ → Version 4
- หรือใน Apps Script: `Utilities.getUuid()`

### 3. Upload PNG files เข้า folder
- Drag & drop เข้า Google Drive
- รอจน upload เสร็จทุกไฟล์

### 4. Note Folder ID
- เปิด folder ใน Drive → URL จะเป็น `drive.google.com/drive/folders/XXXXXXXX`
- copy `XXXXXXXX` = `drive_pages_folder_id`

### 5. ตั้ง Permission
- คลิกขวา folder → **Share**
- เพิ่ม email ของ Apps Script service account (= email ของคุณที่เป็นเจ้าของ Apps Script)
- Role: **Viewer**
- ✅ ห้ามตั้ง "Anyone with link"

### 6. Insert row ใน Documents sheet
| Column | Value |
|---|---|
| id | (the UUID) |
| title | F-MID-005 ใบรายงานตรวจเช็คบำรุงรักษาเครื่องมือแพทย์ |
| form_code | F-MID-005 |
| category | topic |
| description | ใบฟอร์มรายงานการตรวจเช็คและบำรุงรักษาเครื่องมือแพทย์ |
| drive_pdf_id | (ไม่จำเป็นสำหรับ Phase 0) |
| drive_pages_folder_id | (the folder ID from step 4) |
| page_count | (จำนวนไฟล์ PNG) |
| sort_order | 1 |
| status | active |
| created_at | (now ISO 8601) |
| updated_at | (now ISO 8601) |
| created_by | (your line_user_id) |

---

## Troubleshooting

### ImageMagick "not authorized" บน Windows
แก้ไขไฟล์ policy:
```
C:\Program Files\ImageMagick-7.x.x-Q16\policy.xml
```
ลบหรือคอมเมนต์บรรทัด:
```xml
<policy domain="coder" rights="none" pattern="PDF" />
```

### ภาพออกมาเบลอ/หยาบ
- เพิ่ม `-density 200` (DPI) — ขนาดไฟล์จะใหญ่ขึ้น
- หรือใช้ `-resample 200` หลัง resize

### ภาพออกมาขนาดใหญ่เกิน
- ลด DPI: `-density 100`
- ลด resolution: `-resize 800x`
- เพิ่ม compression: `-quality 80`

### หลายหน้ารวมเป็นไฟล์เดียว
- ImageMagick: ใช้ `%03d` ใน output filename
- pdftoppm: เพิ่ม `-png` flag (default แยกไฟล์อยู่แล้ว)

### ตัวอักษรไทยเพี้ยน
- ตรวจสอบว่า PDF embed font แล้ว (เปิดด้วย Acrobat → File → Properties → Fonts → ทุก font ต้องมี "Embedded Subset")
- ถ้าไม่ embed → embed ก่อนใน Adobe Acrobat (Save As → Optimize → Fonts → Embed all)

---

## Phase 5+: Server-side Pre-render (ในอนาคต)

ตอน Phase 5 จะมี admin UI ให้ upload PDF ตรงๆ และระบบจะ:
1. รับ PDF
2. ส่งไป external converter (CloudConvert API หรือ internal pdf2image service)
3. รับ PNG กลับ → save ใน Drive
4. ฝัง static watermark ทุกหน้า
5. Update Documents sheet อัตโนมัติ

ระหว่างนั้น admin ทำ manual ตามขั้นตอนข้างบน
