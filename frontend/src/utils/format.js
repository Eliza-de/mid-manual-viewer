/**
 * Format helpers
 */

/**
 * Format a date as relative time in Thai (e.g. "2 วันที่แล้ว", "เมื่อสักครู่")
 */
export function relativeTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30) return 'เมื่อสักครู่';
  if (diffMin < 1) return 'ไม่ถึง 1 นาที';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;

  // Older than a week — show date
  return formatThaiDate(d);
}

/**
 * Format a date as "1 พ.ค. 2569"
 */
export function formatThaiDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[d.getMonth()];
  const yearTh = d.getFullYear() + 543;
  return `${day} ${month} ${yearTh}`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + '…';
}
