/**
 * CategoryPage — page content per category
 * Phase 3: onSelect now opens the document in Reader.
 */

import { Typography } from 'antd';
import DocumentList from '../components/DocumentList.jsx';
import { useDocuments } from '../hooks/useDocuments.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';

const { Title, Text } = Typography;

const CATEGORY_INFO = {
  full_book: {
    title: 'คู่มือเต็มเล่ม',
    icon: '📚',
    description: 'คู่มือผู้ใช้แบบเต็ม สำหรับการอ้างอิง'
  },
  topic: {
    title: 'เรื่อง / ฟอร์ม',
    icon: '📑',
    description: 'ฟอร์มและเอกสารแยกตามเรื่อง'
  },
  summary: {
    title: 'สรุป',
    icon: '📋',
    description: 'สรุปสั้นๆ สำหรับอ่านเร็ว'
  }
};

export default function CategoryPage({ category }) {
  const { docs, loading, error, refetch } = useDocuments(category);
  const nav = useNavigation();
  const info = CATEGORY_INFO[category] || CATEGORY_INFO.topic;

  function onSelect(doc) {
    if (!doc.page_count || doc.page_count < 1) {
      // Probably misconfigured; show a console warning
      console.warn('Document has no pages:', doc);
      return;
    }
    nav.openDoc(doc);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#1e3a5f' }}>
          {info.icon} {info.title}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {info.description}
          {docs && ` · ${docs.length} เอกสาร`}
        </Text>
      </div>

      <DocumentList
        docs={docs}
        loading={loading}
        error={error}
        onRefetch={refetch}
        onSelect={onSelect}
      />
    </div>
  );
}
