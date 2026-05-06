/**
 * 03_create_admin.gs — Bootstrap the first admin user manually
 *
 * Use this if the LIFF-based bootstrap flow isn't working.
 * Manually insert an admin row into the Users sheet.
 *
 * BEFORE RUNNING:
 *   1. Edit the LINE_USER_ID, DISPLAY_NAME, DEPARTMENT below
 *   2. Make sure bootstrapSheets() has been run
 */

function createBootstrapAdmin() {
  // ============ EDIT THESE ============
  const LINE_USER_ID = 'U____PASTE_YOUR_LINE_USER_ID_HERE____';
  const DISPLAY_NAME = 'Elizabeth';
  const DEPARTMENT = 'IT';
  const EMPLOYEE_CODE = '';
  // ====================================

  if (LINE_USER_ID.indexOf('PASTE') >= 0) {
    throw new Error('Edit LINE_USER_ID in this script before running.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  if (!sheet) {
    throw new Error('Users sheet not found. Run bootstrapSheets() first.');
  }

  // Check if already exists
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === LINE_USER_ID) {
      Logger.log('User already exists at row ' + (i + 1) + '. Updating to admin...');
      sheet.getRange(i + 1, 11).setValue('TRUE'); // is_admin column
      sheet.getRange(i + 1, 12).setValue('active'); // status column
      Logger.log('✅ Promoted existing user to admin.');
      return;
    }
  }

  const now = new Date().toISOString();
  const row = [
    Utilities.getUuid(),     // id
    LINE_USER_ID,            // line_user_id
    DISPLAY_NAME,            // display_name
    '',                      // picture_url
    DEPARTMENT,              // department
    EMPLOYEE_CODE,           // employee_code
    '',                      // pin_hash (set on first PIN setup)
    '',                      // pin_salt
    0,                       // pin_attempts
    '',                      // pin_locked_until
    'TRUE',                  // is_admin
    'active',                // status
    now,                     // created_at
    now,                     // approved_at
    'BOOTSTRAP',             // approved_by
    '',                      // last_login_at
    ''                       // pin_changed_at
  ];
  sheet.appendRow(row);

  // Also seed bootstrap_admin_line_id in Config
  const configSheet = ss.getSheetByName('Config');
  if (configSheet) {
    const configData = configSheet.getDataRange().getValues();
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === 'bootstrap_admin_line_id') {
        configSheet.getRange(i + 1, 2).setValue(LINE_USER_ID);
        Logger.log('  Set bootstrap_admin_line_id in Config');
        break;
      }
    }
  }

  Logger.log('✅ Bootstrap admin created.');
  Logger.log('   line_user_id: ' + LINE_USER_ID);
  Logger.log('   Set PIN via the LIFF app on first login.');
}
