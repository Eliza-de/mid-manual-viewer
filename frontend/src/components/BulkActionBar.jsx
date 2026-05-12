/**
 * BulkActionBar — floating action bar shown when items are selected.
 *
 * Usage:
 *   <BulkActionBar
 *     selectedCount={selected.length}
 *     onClear={() => setSelected([])}
 *     actions={[
 *       { key: 'archive', icon: <Icon/>, label: 'Archive', danger: true, onClick: ... }
 *     ]}
 *   />
 */

import { Button, Space, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { COLORS } from '../brand.js';

const { Text } = Typography;

export default function BulkActionBar({ selectedCount, onClear, actions = [] }) {
  if (selectedCount === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <Space size={8} style={{ flex: 1 }}>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClear} style={{ color: '#fff' }} />
          <Text strong style={{ color: '#fff', fontSize: 14 }}>
            เลือก {selectedCount} รายการ
          </Text>
        </Space>
        <Space size={4} wrap={false} style={{ overflowX: 'auto' }}>
          {actions.map(a => (
            <Button
              key={a.key}
              size="small"
              icon={a.icon}
              onClick={a.onClick}
              danger={a.danger}
              type={a.danger ? 'primary' : 'default'}
              loading={a.loading}
              disabled={a.disabled}
            >
              {a.label}
            </Button>
          ))}
        </Space>
      </div>
    </div>
  );
}

const containerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 200,
  padding: '8px 8px max(8px, env(safe-area-inset-bottom)) 8px',
  background: COLORS.primary,
  boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
  animation: 'slideUp 0.2s ease-out'
};

const innerStyle = {
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 8
};
