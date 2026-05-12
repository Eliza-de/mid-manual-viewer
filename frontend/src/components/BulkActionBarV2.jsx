/**
 * BulkActionBar — Sticky bottom bar for bulk actions
 */
import { Button, Space } from 'antd';
import { COLORS, SHADOWS } from '../brandV2.js';

export default function BulkActionBar({ count, onClear, actions = [] }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.primaryDark,
        color: '#fff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <span style={{ flex: 1, fontWeight: 600 }}>
        เลือก {count} รายการ
      </span>
      <Space>
        {actions.map((a, i) => (
          <Button
            key={i}
            type={a.type || 'default'}
            danger={a.danger}
            icon={a.icon}
            onClick={a.onClick}
            loading={a.loading}
          >
            {a.label}
          </Button>
        ))}
        <Button onClick={onClear} ghost>ยกเลิก</Button>
      </Space>
    </div>
  );
}
