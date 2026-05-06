/**
 * 02_seed_config.gs — Seed default config values
 *
 * Run AFTER bootstrapSheets().
 * Idempotent: only writes keys that don't already exist.
 */

function seedConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');
  if (!sheet) {
    throw new Error('Config sheet not found. Run bootstrapSheets() first.');
  }

  const defaults = [
    ['app_name', 'MID Manual Viewer', 'ชื่อแอปที่แสดงให้ผู้ใช้'],
    ['app_version', '0.1.0', 'เวอร์ชันปัจจุบัน — bump ทุก phase'],
    ['session_ttl_minutes', '30', 'อายุ session token (นาที)'],
    ['max_pin_attempts', '5', 'จำนวนครั้งที่ใส่ PIN ผิดก่อน lock'],
    ['pin_lockout_minutes', '15', 'ระยะเวลา lock เมื่อ attempts เกิน'],
    ['pin_rotation_days', '180', 'บังคับเปลี่ยน PIN ทุก N วัน'],
    ['watermark_static_text', 'เอกสารภายใน รพ.วิภาราม แหลมฉบัง', 'ข้อความ watermark คงที่'],
    ['line_channel_id', '', '⚠️ กรอก Channel ID จาก LINE Developers Console'],
    ['bootstrap_admin_line_id', '', '⚠️ กรอก LINE User ID ของ admin คนแรก (ดูจาก LIFF login)'],
    ['allow_self_register', 'true', 'ปิดถ้าต้องการห้ามคนใหม่ลงทะเบียนเอง'],
    ['support_contact', 'IT Vibharam Laemchabang', 'แสดงในหน้าช่วยเหลือ']
  ];

  // Read existing keys
  const data = sheet.getDataRange().getValues();
  const existingKeys = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) existingKeys[data[i][0]] = i + 1; // 1-based row
  }

  let added = 0;
  let skipped = 0;
  defaults.forEach(([key, value, description]) => {
    if (existingKeys[key]) {
      skipped++;
      Logger.log('  Skip (exists): ' + key);
    } else {
      sheet.appendRow([key, value, description]);
      added++;
      Logger.log('  Added: ' + key + ' = ' + (value || '(empty)'));
    }
  });

  Logger.log('✅ Seed complete. Added: ' + added + ', Skipped: ' + skipped);

  if (defaults.some(([k]) => k === 'line_channel_id') &&
      !existingKeys['line_channel_id']) {
    Logger.log('⚠️  REMINDER: Fill in line_channel_id and bootstrap_admin_line_id');
    Logger.log('    in the Config sheet before testing the app.');
  }
}
