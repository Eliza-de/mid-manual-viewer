/**
 * DocumentList — renders list of documents (rebranded mint theme)
 *
 * Same structure as Phase 2 — colors only changed.
 * DocumentCard remains in separate file (../components/DocumentCard.jsx).
 */

import { Card, Skeleton, Result, Button, Empty } from 'antd';
import { ReloadOutlined, InboxOutlined } from '@ant-design/icons';
import DocumentCard from './DocumentCard.jsx';

export default function DocumentList({ docs, loading, error, onRefetch, onSelect }) {
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

  if (!docs || docs.length === 0) {
    return (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#cbd5e1' }} />}
        description="ยังไม่มีเอกสารในหมวดนี้"
        style={{ padding: '40px 0' }}
      />
    );
  }

  return (
    <div>
      {docs.map(doc => (
        <DocumentCard key={doc.id} doc={doc} onClick={onSelect} />
      ))}
    </div>
  );
}
