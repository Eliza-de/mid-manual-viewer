/**
 * 01_create_sheets.gs — Bootstrap script
 *
 * Run this ONCE after creating a new Google Sheet.
 * Creates all required sheets with correct headers.
 *
 * To run:
 * 1. In Apps Script editor, select function "bootstrapSheets" from dropdown
 * 2. Click Run
 * 3. Authorize when prompted
 * 4. Check execution log for "✅ Done"
 *
 * Idempotent: safe to run multiple times.
 */

function bootstrapSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Bootstrapping sheets in: ' + ss.getName());

  const sheets = [
    {
      name: 'Users',
      headers: [
        'id', 'line_user_id', 'display_name', 'picture_url', 'department',
        'employee_code', 'pin_hash', 'pin_salt', 'pin_attempts', 'pin_locked_until',
        'is_admin', 'status', 'created_at', 'approved_at', 'approved_by',
        'last_login_at', 'pin_changed_at'
      ],
      widths: [40, 220, 140, 200, 120, 100, 280, 220, 60, 160, 70, 80, 160, 160, 220, 160, 160]
    },
    {
      name: 'Documents',
      headers: [
        'id', 'title', 'form_code', 'category', 'description',
        'drive_pdf_id', 'drive_pages_folder_id', 'page_count', 'sort_order',
        'status', 'created_at', 'updated_at', 'created_by'
      ],
      widths: [40, 320, 100, 90, 280, 200, 200, 80, 70, 80, 160, 160, 220]
    },
    {
      name: 'AccessLogs',
      headers: [
        'id', 'timestamp', 'line_user_id', 'document_id',
        'action', 'page_number', 'user_agent', 'session_id'
      ],
      widths: [40, 160, 220, 220, 120, 80, 280, 280]
    },
    {
      name: 'AuthLogs',
      headers: ['id', 'timestamp', 'line_user_id', 'action', 'details', 'user_agent'],
      widths: [40, 160, 220, 120, 280, 280]
    },
    {
      name: 'AuditLogs',
      headers: ['id', 'timestamp', 'actor_line_user_id', 'action', 'target', 'details'],
      widths: [40, 160, 220, 140, 220, 320]
    },
    {
      name: 'Config',
      headers: ['key', 'value', 'description'],
      widths: [240, 280, 320]
    }
  ];

  // Remove default "Sheet1" if it exists and we have other sheets
  let sheet1 = ss.getSheetByName('Sheet1');

  sheets.forEach(spec => {
    let sheet = ss.getSheetByName(spec.name);
    if (!sheet) {
      sheet = ss.insertSheet(spec.name);
      Logger.log('  Created: ' + spec.name);
    } else {
      Logger.log('  Exists:  ' + spec.name);
    }

    // Write headers
    const range = sheet.getRange(1, 1, 1, spec.headers.length);
    range.setValues([spec.headers]);
    range.setFontWeight('bold');
    range.setBackground('#1e3a5f');
    range.setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Set column widths
    spec.widths.forEach((w, idx) => {
      sheet.setColumnWidth(idx + 1, w);
    });

    // Apply text format to all cells (so date strings stay as strings)
    if (spec.name !== 'Config') {
      const fullRange = sheet.getRange(1, 1, sheet.getMaxRows(), spec.headers.length);
      fullRange.setNumberFormat('@');
    }
  });

  // Delete Sheet1 if empty
  if (sheet1 && sheet1.getLastRow() === 0) {
    ss.deleteSheet(sheet1);
    Logger.log('  Removed default Sheet1');
  }

  Logger.log('✅ Done. Sheets bootstrapped successfully.');
  Logger.log('Spreadsheet ID: ' + ss.getId());
  Logger.log('Next step: run seedConfig() to populate defaults.');
}
