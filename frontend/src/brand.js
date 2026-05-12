/**
 * Lean Buddy — Design tokens + Brand metadata
 * Mint Sage theme
 *
 * ⚠️ FIXED 2026-05-12: เพิ่ม BRAND export ที่ Register.jsx เคยใช้
 */

// ===== BRAND METADATA =====
export const BRAND = {
  name:        'Lean Buddy',
  fullName:    'Lean Buddy By Med-healthup',
  company:     'บริษัท เมดเฮลท์อัพ จำกัด',
  companyEn:   'Med-healthup Co., Ltd.',
  tagline:     'คู่มือทำงานยุคใหม่ ง่ายแค่หยิบมือถือ',
  taglineEn:   'Modern manual viewer — at your fingertips',
  version:     '2.0.0',
  buildDate:   '2026-05-12',
  logo:        '🌿',  // mint leaf emoji (placeholder — เปลี่ยนเป็น path SVG ถ้ามี)
};

// ===== COLORS =====
export const COLORS = {
  primary:      '#A4DFCB',
  primaryDark:  '#1F4D3F',
  primaryMid:   '#5BB494',
  primaryLight: '#E8F5EE',
  accent:       '#FFA94D',
  success:      '#52C41A',
  warning:      '#FAAD14',
  danger:       '#FF4D4F',
  info:         '#1890FF',
  textMain:     '#1F2937',
  textMuted:    '#6B7280',
  bgMain:       '#F0F9F4',
  cardBg:       '#FFFFFF',
  border:       '#E5E7EB',
  borderLight:  '#F3F4F6',
};

// ===== HEADER GRADIENT =====
export const HEADER_GRADIENT =
  'linear-gradient(135deg, #A4DFCB 0%, #7BC9AC 50%, #5BB494 100%)';

// ===== SHADOWS =====
export const SHADOWS = {
  card:      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  cardHover: '0 4px 12px rgba(31,77,63,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  header:    '0 2px 8px rgba(31,77,63,0.12)',
};

// ===== RADIUS =====
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

// ===== DEFAULT EXPORT (เผื่อมีไฟล์ที่ import default) =====
export default { BRAND, COLORS, HEADER_GRADIENT, SHADOWS, RADIUS };
