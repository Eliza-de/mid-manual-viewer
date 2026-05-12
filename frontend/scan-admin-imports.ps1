# scan-admin-imports.ps1
# รัน 1 ครั้งใน frontend folder จะเห็นทุก function ที่ใช้จาก admin.js
# ทำให้รู้ล่วงหน้าว่าต้อง alias อะไรเพิ่มอีก

Write-Host "=== Scanning all imports from api/admin.js ===" -ForegroundColor Cyan
Write-Host ""

$pattern = "from\s+['""].*api/admin['""]"
$results = Get-ChildItem -Path src -Recurse -Include *.jsx, *.js |
    Select-String -Pattern $pattern

if (-not $results) {
    Write-Host "ไม่พบ import จาก admin.js เลย — แปลก" -ForegroundColor Yellow
    exit 0
}

# Collect all unique function names imported
$funcs = New-Object System.Collections.Generic.HashSet[string]
$fileMap = @{}

foreach ($r in $results) {
    $line = $r.Line.Trim()
    Write-Host "📄 $($r.Filename):$($r.LineNumber)" -ForegroundColor Gray
    Write-Host "   $line" -ForegroundColor White

    # Extract names between { and }
    if ($line -match '\{([^}]+)\}') {
        $names = $matches[1] -split ',' | ForEach-Object { $_.Trim() }
        foreach ($n in $names) {
            # remove "as alias"
            $clean = ($n -split '\s+as\s+')[0].Trim()
            if ($clean -and -not $clean.StartsWith('//')) {
                $funcs.Add($clean) | Out-Null
                if (-not $fileMap.ContainsKey($clean)) {
                    $fileMap[$clean] = @()
                }
                $fileMap[$clean] += $r.Filename
            }
        }
    }
}

Write-Host ""
Write-Host "=== Summary: Unique functions imported ===" -ForegroundColor Cyan
$sorted = $funcs | Sort-Object
foreach ($f in $sorted) {
    $files = ($fileMap[$f] | Select-Object -Unique) -join ", "
    Write-Host "  ✓ $f" -NoNewline -ForegroundColor Green
    Write-Host "  ($files)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== Total: $($funcs.Count) unique functions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "ส่ง list นี้ให้ Claude ใน chat — จะรู้ทันทีว่า alias ไหนที่ admin.js ใหม่ยังไม่มี" -ForegroundColor Yellow
