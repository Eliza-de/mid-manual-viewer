/**
 * Reader — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-READER
 *
 * Changes from V1:
 *   - Top bar: white minimal (was: mint solid heavy)
 *   - Back: icon button (was: text)
 *   - Title: tag mini + ellipsis + page badge pill
 *   - Bottom bar: compact icon buttons (was: full-width text)
 *   - Page jumper: pill in center (clickable)
 *   - Progress bar: 2px line at bottom
 */

import { useState } from 'react';
import { Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { usePageLoader } from '../hooks/usePageLoader.jsx';
import { useAntiCapture } from '../hooks/useAntiCapture.jsx';
import PageImage from '../components/PageImage.jsx';
import PageJumpModal from '../components/PageJumpModal.jsx';
import AntiCaptureNotice from '../components/AntiCaptureNotice.jsx';
import { COLORS } from '../brand.js';

const { Text } = Typography;

// Tag color by form_code prefix
function getTagColor(formCode) {
  if (!formCode) return { bg: '#6B8278', text: 'white' };
  const code = formCode.toUpperCase();
  if (code.startsWith('FF')) return { bg: COLORS.primary, text: 'white' };
  if (code.startsWith('KEY')) return { bg: '#E8965B', text: 'white' };
  if (code.startsWith('BOOK')) return { bg: '#5DBFA0', text: 'white' };
  if (code.startsWith('SUM')) return { bg: '#A4DFCB', text: COLORS.primary };
  return { bg: '#6B8278', text: 'white' };
}

export default function Reader() {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__reader_v2_loaded) {
    console.log('%c[Reader V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__reader_v2_loaded = true;
  }

  const nav = useNavigation();
  const doc = nav.currentDoc;
  const page = nav.currentPage;
  const totalPages = doc?.page_count || 0;
  const [jumpOpen, setJumpOpen] = useState(false);

  const { tabHidden } = useAntiCapture({
  enabled: true,
  documentId: doc?.id || null,
  pageNumber: page,
  onSuspectActivity: (event) => {
    if (event.type !== 'tab_visible') {
      console.warn('[anti-capture]', event);
    }
  }
});

  const { data, loading, error } = usePageLoader(doc?.id, page, totalPages);

  if (!doc) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;
  const tagColor = getTagColor(doc.form_code);
  const progressPct = totalPages > 0 ? (page / totalPages) * 100 : 0;

  function onJump(n) {
    nav.goToPage(n);
    setJumpOpen(false);
  }

  return (
    <div style={containerStyle}>
      {/* Top Bar — clean white */}
      <div style={topBarStyle}>
        <div
          style={backBtnStyle}
          onClick={nav.closeDoc}
          role="button"
          aria-label="กลับ"
        >
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>

        <div style={titleBlockStyle}>
          {doc.form_code && (
            <span style={{ ...tagMiniStyle, background: tagColor.bg, color: tagColor.text }}>
              {doc.form_code}
            </span>
          )}
          <Text style={titleTextStyle} ellipsis>
            {doc.title}
          </Text>
        </div>

        <div style={pageInfoStyle}>
          {page} / {totalPages}
        </div>
      </div>

      {/* Compact watermark notice */}
      <AntiCaptureNotice />

      {/* PDF Image */}
      <div style={contentStyle}>
        <PageImage
          src={data}
          loading={loading}
          error={error}
          pageNumber={page}
          onSwipeLeft={isLast ? null : nav.nextPage}
          onSwipeRight={isFirst ? null : nav.prevPage}
          onRetry={() => nav.goToPage(page)}
          tabHidden={tabHidden}
        />
      </div>

      {/* Bottom Bar — compact thumb-friendly */}
      <div style={bottomBarStyle}>
        <div
          style={{
            ...navBtnStyle,
            ...(isFirst ? navBtnDisabledStyle : {})
          }}
          onClick={isFirst ? undefined : nav.prevPage}
          role="button"
          aria-label="ก่อนหน้า"
        >
          <LeftOutlined style={{ fontSize: 20 }} />
        </div>

        <div
          style={pageJumperStyle}
          onClick={() => setJumpOpen(true)}
          role="button"
          aria-label="กระโดดหน้า"
        >
          <span style={pageJumperNumStyle}>{page}</span>
          <span style={pageJumperSepStyle}>/</span>
          <span style={pageJumperTotalStyle}>{totalPages}</span>
        </div>

        <div
          style={{
            ...navBtnStyle,
            ...navBtnPrimaryStyle,
            ...(isLast ? navBtnDisabledStyle : {})
          }}
          onClick={isLast ? undefined : nav.nextPage}
          role="button"
          aria-label="ถัดไป"
        >
          <RightOutlined style={{ fontSize: 20 }} />
        </div>

        {/* Progress bar */}
        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progressPct}%` }} />
        </div>
      </div>

      <PageJumpModal
        open={jumpOpen}
        currentPage={page}
        totalPages={totalPages}
        onJump={onJump}
        onCancel={() => setJumpOpen(false)}
      />
    </div>
  );
}

// ===== Styles =====

const containerStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f5f5',
  zIndex: 100
};

// Top bar — white minimal
const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  background: 'white',
  borderBottom: '0.5px solid rgba(31,77,63,0.08)',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const backBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: '#DCEEE3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: COLORS.primary,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s'
};

const titleBlockStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const tagMiniStyle = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 999,
  letterSpacing: 0.4,
  flexShrink: 0,
  whiteSpace: 'nowrap'
};

const titleTextStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.primary,
  flex: 1,
  minWidth: 0
};

const pageInfoStyle = {
  fontSize: 11,
  color: COLORS.primary,
  background: '#F0F9F3',
  padding: '4px 10px',
  borderRadius: 999,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  flexShrink: 0
};

// Content area
const contentStyle = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f5f5'
};

// Bottom bar — compact
const bottomBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'white',
  borderTop: '0.5px solid rgba(31,77,63,0.08)',
  flexShrink: 0,
  paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  boxShadow: '0 -1px 8px rgba(31,77,63,0.04)',
  position: 'relative'
};

const navBtnStyle = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: '#DCEEE3',
  color: COLORS.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s',
  userSelect: 'none'
};

const navBtnPrimaryStyle = {
  background: COLORS.primary,
  color: 'white'
};

const navBtnDisabledStyle = {
  background: '#f1f5f9',
  color: '#cbd5e1',
  cursor: 'not-allowed',
  pointerEvents: 'none'
};

const pageJumperStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: '#F0F9F3',
  padding: '8px 12px',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.15s',
  minHeight: 42,
  boxSizing: 'border-box'
};

const pageJumperNumStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: COLORS.primary,
  fontVariantNumeric: 'tabular-nums'
};

const pageJumperSepStyle = {
  color: '#94A3B8',
  fontSize: 13
};

const pageJumperTotalStyle = {
  color: '#6B8278',
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums'
};

const progressTrackStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  background: 'rgba(31,77,63,0.05)'
};

const progressFillStyle = {
  height: '100%',
  background: `linear-gradient(90deg, #5DBFA0, ${COLORS.primary})`,
  transition: 'width 0.3s ease'
};
