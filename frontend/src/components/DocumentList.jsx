/**
 * DocumentList — renders list of documents with skeleton/empty/error states
 */

import { Card, Skeleton, Result, Button, Empty } from 'antd';
import { ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import DocumentCard from './DocumentCard.jsx';

export default function DocumentList({ docs, loading, error, onRefetch, onSelect }) {
  // Loading state
  if (loading && (!docs || docs.length === 0)) {
    return (
      <div>
        {[1, 2, 3].map(i => (
          <Card key={i} size="small" style={{ marginBottom: 12 }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Result
        status="warning"
        title="โหลดข้อมูลไม่สำเร็จ"
        subTitle={error}
        extra={
          <Button icon={<ReloadOutlined />} onClick={onRefetch}>
            ลองใหม่
          </Button>
        }
      />
    );
  }

  // Empty state
  if (!docs || docs.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />}
        description="ยังไม่มีเอกสารในหมวดนี้"
        style={{ padding: '40px 0' }}
      />
    );
  }

  // Has data
  return (
    <div>
      {docs.map(doc => (
        <DocumentCard key={doc.id} doc={doc} onClick={onSelect} />
      ))}
    </div>
  );
}
