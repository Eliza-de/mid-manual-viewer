/**
 * Users.gs — User CRUD operations
 *
 * Reads/writes the Users sheet.
 * Functions are pure: take args, return data — no HTTP wrapping.
 */

const USERS_SHEET = 'Users';

// Column indices (1-based) — must match the headers in 01_create_sheets.gs
const USER_COL = {
  id: 1,
  line_user_id: 2,
  display_name: 3,
  picture_url: 4,
  department: 5,
  employee_code: 6,
  pin_hash: 7,
  pin_salt: 8,
  pin_attempts: 9,
  pin_locked_until: 10,
  is_admin: 11,
  status: 12,
  created_at: 13,
  approved_at: 14,
  approved_by: 15,
  last_login_at: 16,
  pin_changed_at: 17
};

const USER_HEADERS = [
  'id', 'line_user_id', 'display_name', 'picture_url', 'department',
  'employee_code', 'pin_hash', 'pin_salt', 'pin_attempts', 'pin_locked_until',
  'is_admin', 'status', 'created_at', 'approved_at', 'approved_by',
  'last_login_at', 'pin_changed_at'
];

// ========== Read ==========

/**
 * Find a user by their LINE User ID.
 * @returns {object|null} user record as plain object, or null if not found
 */
function getUserByLineId(lineUserId) {
  if (!lineUserId) return null;
  const sheet = getSheet(USERS_SHEET);
  const data = sheet.getDataRange().getValues();
  // data[0] is header
  for (let i = 1; i < data.length; i++) {
    if (data[i][USER_COL.line_user_id - 1] === lineUserId) {
      return rowToUser(data[i]);
    }
  }
  return null;
}

/**
 * Get all users (for admin views).
 */
function getAllUsers() {
  const sheet = getSheet(USERS_SHEET);
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push(rowToUser(data[i]));
  }
  return users;
}

function getUsersByStatus(status) {
  return getAllUsers().filter(u => u.status === status);
}

function rowToUser(row) {
  const user = {};
  USER_HEADERS.forEach((h, idx) => {
    user[h] = row[idx];
  });
  // Normalize boolean
  user.is_admin = (user.is_admin === true || user.is_admin === 'TRUE' || user.is_admin === 'true');
  return user;
}

// ========== Write (Phase 1+) ==========
// These are stubs for Phase 0; full implementation in Phase 1

function createUser(userData) {
  const sheet = getSheet(USERS_SHEET);
  const now = new Date().toISOString();
  const row = [
    userData.id || Utilities.getUuid(),
    userData.line_user_id,
    userData.display_name || '',
    userData.picture_url || '',
    userData.department || '',
    userData.employee_code || '',
    '', // pin_hash (set later)
    '', // pin_salt (set later)
    0,  // pin_attempts
    '', // pin_locked_until
    userData.is_admin === true ? 'TRUE' : 'FALSE',
    userData.status || 'pending',
    now,
    '', // approved_at
    '', // approved_by
    '', // last_login_at
    ''  // pin_changed_at
  ];
  sheet.appendRow(row);
  return rowToUser(row);
}

function updateUserField(lineUserId, fieldName, value) {
  const sheet = getSheet(USERS_SHEET);
  const data = sheet.getDataRange().getValues();
  const colIdx = USER_COL[fieldName];
  if (!colIdx) {
    throw new Error('Unknown user field: ' + fieldName);
  }
  for (let i = 1; i < data.length; i++) {
    if (data[i][USER_COL.line_user_id - 1] === lineUserId) {
      sheet.getRange(i + 1, colIdx).setValue(value);
      return true;
    }
  }
  return false;
}

function updateUserFields(lineUserId, fields) {
  const sheet = getSheet(USERS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][USER_COL.line_user_id - 1] === lineUserId) {
      const rowNum = i + 1;
      Object.keys(fields).forEach(fieldName => {
        const colIdx = USER_COL[fieldName];
        if (colIdx) {
          sheet.getRange(rowNum, colIdx).setValue(fields[fieldName]);
        }
      });
      return true;
    }
  }
  return false;
}
