/**
 * DocumentCard — single document tile (rebranded mint theme)
 */

import { Card, Tag, Typography, Space } from 'antd';
import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import { relativeTime } from '../utils/format.js';
import { COLORS } from '../brand.js';

const { Text, Paragraph } = Typography;

export default function DocumentCard({ doc, onClick }) {
  return (
    <Card
      size="small"
      hoverable
      onClick={() => onClick(doc)}
      style={{ marginBottom: 12, cursor: 'pointer' }}
      styles={{ body: { padding: 14 } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {doc.form_code && (
            <Tag style={{
              marginBottom: 6,
              fontWeight: 600,
              background: COLORS.primary,
              color: '#fff',
              borderColor: COLORS.primary
            }}>
              {doc.form_code}
            </Tag>
          )}

          <div style={{
            fontWeight: 600,
            fontSize: 15,
            color: COLORS.primary,
            marginBottom: 4,
            lineHeight: 1.3
          }}>
            {doc.title}
          </div>

          {doc.description && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ fontSize: 12, marginBottom: 8 }}
            >
              {doc.description}
            </Paragraph>
          )}

          <Space size={12} style={{ fontSize: 11, color: '#94a3b8' }}>
            <span>
              <FileTextOutlined style={{ marginRight: 4 }} />
              {doc.page_count} หน้า
            </span>
            {doc.updated_at && (
              <span>
                อัปเดต {relativeTime(doc.updated_at)}
              </span>
            )}
          </Space>
        </div>

        <RightOutlined style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }} />
      </div>
    </Card>
  );
}
