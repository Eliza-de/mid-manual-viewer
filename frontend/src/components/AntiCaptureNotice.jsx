/**
 * AntiCaptureNotice — VERSION 2 REDESIGN (compact)
 * BUILD: 2026-05-07-V2
 *
 * Changes from V1:
 *   - Replaced Ant Alert with custom compact banner
 *   - Less vertical space
 *   - Border-left accent
 *   - Smaller typography
 */

import { useState, useEffect } from 'react';
import { SafetyOutlined, CloseOutlined } from '@ant-design/icons';

const DISMISS_KEY = 'mid_anticapture_notice_dismissed';

export default function AntiCaptureNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch (_) {}
    if (!dismissed) setVisible(true);
  }, []);

  function onClose() {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
  }

  if (!visible) return null;

  return (
    <div style={bannerStyle}>
      <SafetyOutlined style={iconStyle} />
      <div style={contentStyle}>
        <div style={titleStyle}>เอกสารนี้มีลายน้ำระบุตัวคุณ</div>
        <div style={descStyle}>การแคปเจอร์/เผยแพร่จะระบุตัวกลับได้</div>
      </div>
      <div
        style={closeBtnStyle}
        onClick={onClose}
        role="button"
        aria-label="ปิด"
      >
        <CloseOutlined style={{ fontSize: 12 }} />
      </div>
    </div>
  );
}

const bannerStyle = {
  margin: '10px 12px 8px',
  padding: '10px 12px',
  background: '#FFF8E6',
  borderRadius: 12,
  borderLeft: '3px solid #F59E0B',
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start'
};

const iconStyle = {
  color: '#F59E0B',
  fontSize: 16,
  flexShrink: 0,
  marginTop: 1
};

const contentStyle = {
  flex: 1,
  minWidth: 0,
  fontSize: 11,
  color: '#92400E',
  lineHeight: 1.4
};

const titleStyle = {
  fontWeight: 600,
  marginBottom: 2
};

const descStyle = {
  opacity: 0.85
};

const closeBtnStyle = {
  width: 22,
  height: 22,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#92400E',
  opacity: 0.6,
  flexShrink: 0,
  transition: 'opacity 0.15s'
};
