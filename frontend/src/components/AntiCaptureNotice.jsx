/**
 * AntiCaptureNotice — one-time banner shown when first opening a Reader
 *
 * Tells the user transparently:
 *  - Document has watermark identifying you
 *  - Sharing externally can be traced back
 *
 * Honesty as deterrent — psychology research shows transparency
 * reduces unwanted sharing more than hidden DRM.
 *
 * Dismissible — sessionStorage flag so it doesn't show every page.
 */

import { useState, useEffect } from 'react';
import { Alert } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';

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
    <Alert
      type="warning"
      icon={<SafetyOutlined />}
      showIcon
      closable
      onClose={onClose}
      message="เอกสารนี้มีลายน้ำระบุตัวคุณ"
      description="การแคปเจอร์หรือเผยแพร่ภาพออกนอกโรงพยาบาลสามารถสืบย้อนกลับมาที่บัญชีของคุณได้"
      style={{
        margin: '8px 12px 0 12px',
        fontSize: 12
      }}
    />
  );
}
