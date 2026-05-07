/**
 * DocumentCard — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-CARD
 *
 * Changes from V1:
 *   - Colored thumbnail (left) with page count badge
 *   - Color-coded tags by form_code prefix
 *   - Better visual hierarchy
 *   - Modern card style
 */

import { FileTextOutlined, ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import { relativeTime } from '../utils/format.js';
import { COLORS } from '../brand.js';

// Color mapping by form_code prefix
function getTagColor(formCode) {
  if (!formCode) return { bg: '#6B8278', text: 'white' };
  const code = formCode.toUpperCase();

  // FF = Form Full / dark mint
  if (code.startsWith('FF')) return { bg: COLORS.primary, text: 'white' };
  // KEY = Key insight / orange
  if (code.startsWith('KEY')) return { bg: '#E8965B', text: 'white' };
  // BOOK = Book / mint mid
  if (code.startsWith('BOOK')) return { bg: '#5DBFA0', text: 'white' };
  // SUMMARY/SUM = Summary / soft mint
  if (code.startsWith('SUM')) return { bg: '#A4DFCB', text: COLORS.primary };
  // Default
  return { bg: '#6B8278', text: 'white' };
}

// Thumbnail gradient by tag
function getThumbGradient(formCode) {
  if (!formCode) return `linear-gradient(135deg, #A4DFCB, #5DBFA0)`;
  const code = formCode.toUpperCase();

  if (code.startsWith('FF')) return `linear-gradient(135deg, #5DBFA0, ${COLORS.primary})`;
  if (code.startsWith('KEY')) return `linear-gradient(135deg, #F5C8A0, #E8965B)`;
  if (code.startsWith('BOOK')) return `linear-gradient(135deg, #A4DFCB, #5DBFA0)`;
  if (code.startsWith('SUM')) return `linear-gradient(135deg, #DCEEE3, #A4DFCB)`;
  return `linear-gradient(135deg, #A4DFCB, #5DBFA0)`;
}

export default function DocumentCard({ doc, onClick }) {
  const tagColor = getTagColor(doc.form_code);
  const thumbBg = getThumbGradient(doc.form_code);

  return (
    <div
      onClick={() => onClick(doc)}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(31,77,63,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(31,77,63,0.06)';
      }}
    >
      {/* Thumbnail */}
      <div style={{ ...thumbStyle, background: thumbBg }}>
        <FileTextOutlined style={{ color: 'white', fontSize: 24 }} />
        {typeof doc.page_count === 'number' && (
          <div style={pageCountBadgeStyle}>
            {doc.page_count}p
          </div>
        )}
      </div>

      {/* Info */}
      <div style={infoStyle}>
        {/* Tag */}
        {doc.form_code && (
          <div style={{ marginBottom: 6 }}>
            <span style={{
              ...tagStyle,
              background: tagColor.bg,
              color: tagColor.text
            }}>
              {doc.form_code}
            </span>
          </div>
        )}

        {/* Title */}
        <div style={titleStyle}>
          {doc.title}
        </div>

        {/* Description */}
        {doc.description && (
          <div style={descStyle}>
            {doc.description}
          </div>
        )}

        {/* Meta */}
        <div style={metaStyle}>
          {doc.updated_at && (
            <span style={metaItemStyle}>
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              {relativeTime(doc.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <RightOutlined style={chevronStyle} />
    </div>
  );
}

// ===== Styles =====

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10,
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
  border: '0.5px solid rgba(31,77,63,0.05)',
  display: 'flex',
  gap: 12,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignItems: 'flex-start'
};

const thumbStyle = {
  width: 56,
  height: 70,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  position: 'relative',
  boxShadow: '0 2px 4px rgba(31,77,63,0.08)'
};

const pageCountBadgeStyle = {
  position: 'absolute',
  bottom: 4,
  right: 4,
  background: 'rgba(255,255,255,0.95)',
  color: COLORS.primary,
  fontSize: 9,
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: 999,
  letterSpacing: 0.3
};

const infoStyle = {
  flex: 1,
  minWidth: 0
};

const tagStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  padding: '2px 8px',
  borderRadius: 999,
  display: 'inline-block'
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.primary,
  lineHeight: 1.3,
  marginBottom: 4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const descStyle = {
  fontSize: 11,
  color: '#6B8278',
  lineHeight: 1.4,
  marginBottom: 6,
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const metaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 10,
  color: '#94A3B8'
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 3
};

const chevronStyle = {
  color: '#CBD5E1',
  fontSize: 14,
  marginTop: 28,
  flexShrink: 0
};
