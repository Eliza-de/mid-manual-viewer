/**
 * Reader — PDF reader with watermark + anti-capture (rebranded mint theme)
 *
 * Same structure as Phase 4 — only colors changed to mint sage.
 */

import { useState } from 'react';
import { Button, Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { usePageLoader } from '../hooks/usePageLoader.jsx';
import { useAntiCapture } from '../hooks/useAntiCapture.jsx';
import PageImage from '../components/PageImage.jsx';
import PageJumpModal from '../components/PageJumpModal.jsx';
import AntiCaptureNotice from '../components/AntiCaptureNotice.jsx';
import { COLORS } from '../brand.js';

const { Text } = Typography;

export default function Reader() {
  const nav = useNavigation();
  const doc = nav.currentDoc;
  const page = nav.currentPage;
  const totalPages = doc?.page_count || 0;
  const [jumpOpen, setJumpOpen] = useState(false);

  const { tabHidden } = useAntiCapture({
    enabled: true,
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

  function onJump(n) {
    nav.goToPage(n);
    setJumpOpen(false);
  }

  return (
    <div style={containerStyle}>
      <div style={topBarStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={nav.closeDoc}
          style={{ color: '#fff' }}
        >
          กลับ
        </Button>
        <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
          {doc.form_code ? (
            <Tag style={{ marginRight: 8, background: COLORS.brand, color: COLORS.primary, border: 'none' }}>
              {doc.form_code}
            </Tag>
          ) : null}
          <Text style={{ color: COLORS.bgSoft, fontSize: 13 }} ellipsis>
            {doc.title}
          </Text>
        </div>
        <Text style={{ color: COLORS.brandLight, fontSize: 13, minWidth: 56, textAlign: 'right' }}>
          {page} / {totalPages}
        </Text>
      </div>

      <AntiCaptureNotice />

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

      <div style={bottomBarStyle}>
        <Button
          icon={<LeftOutlined />}
          disabled={isFirst}
          onClick={nav.prevPage}
          size="large"
          style={{ minWidth: 100 }}
        >
          ก่อนหน้า
        </Button>
        <Button
          type="text"
          onClick={() => setJumpOpen(true)}
          style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}
        >
          {page} / {totalPages}
        </Button>
        <Button
          icon={<RightOutlined />}
          disabled={isLast}
          onClick={nav.nextPage}
          iconPosition="end"
          size="large"
          style={{ minWidth: 100, background: COLORS.accent, borderColor: COLORS.accent }}
          type="primary"
        >
          ถัดไป
        </Button>
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

const containerStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#1f2937',
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: COLORS.primary,
  borderBottom: `1px solid ${COLORS.primaryLight}`,
  height: 52,
  flexShrink: 0
};

const bottomBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: COLORS.primary,
  borderTop: `1px solid ${COLORS.primaryLight}`,
  flexShrink: 0,
  paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
};
