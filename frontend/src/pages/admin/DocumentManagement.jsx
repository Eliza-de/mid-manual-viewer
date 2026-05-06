/**
 * DocumentManagement — admin document edit/archive
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, List, Tag, Tabs, Modal, message, Form, Input, InputNumber,
  Radio, Typography, Dropdown, Empty, Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MoreOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  listAllDocuments, updateDocument, archiveDocument, restoreDocument
} from '../../api/admin.js';

const { Text } = Typography;

const CATEGORY_LABEL = {
  full_book: '📚 เต็มเล่ม',
  topic: '📑 เรื่อง',
  summary: '📋 สรุป'
};

export default function DocumentManagement() {
  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('active');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editForm] = Form.useForm();

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const idToken = getIdToken();
      const r = await listAllDocuments(idToken, auth.session.token, tab);
      if (r.ok) {
        setDocs(r.documents);
      } else {
        if (r.needsLogin) auth.logout();
        else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab]);

  function openEdit(doc) {
    setEditing(doc);
    editForm.setFieldsValue({
      title: doc.title,
      form_code: doc.form_code,
      category: doc.category,
      description: doc.description,
      sort_order: doc.sort_order
    });
  }

  async function handleEditSubmit(values) {
    const idToken = getIdToken();
    const r = await updateDocument(idToken, auth.session.token, editing.id, values);
    if (r.ok) {
      message.success('บันทึกสำเร็จ');
      setEditing(null);
      load();
    } else {
      message.error(r.error || 'ไม่สำเร็จ');
    }
  }

  async function handleArchive(doc) {
    Modal.confirm({
      title: 'Archive เอกสาร',
      content: `Archive "${doc.title}"? เอกสารจะไม่แสดงในรายการของผู้ใช้`,
      okText: 'Archive',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      async onOk() {
        const idToken = getIdToken();
        const r = await archiveDocument(idToken, auth.session.token, doc.id);
        if (r.ok) {
          message.success('Archive สำเร็จ');
          load();
        } else {
          message.error(r.error || 'ไม่สำเร็จ');
        }
      }
    });
  }

  async function handleRestore(doc) {
    const idToken = getIdToken();
    const r = await restoreDocument(idToken, auth.session.token, doc.id);
    if (r.ok) {
      message.success('Restore สำเร็จ');
      load();
    } else {
      message.error(r.error || 'ไม่สำเร็จ');
    }
  }

  function buildActionMenu(doc) {
    if (doc.status === 'active') {
      return [
        { key: 'edit', icon: <EditOutlined />, label: 'แก้ไข', onClick: () => openEdit(doc) },
        { type: 'divider' },
        { key: 'archive', icon: <DeleteOutlined />, label: 'Archive', danger: true, onClick: () => handleArchive(doc) }
      ];
    }
    return [
      { key: 'restore', icon: <UndoOutlined />, label: 'Restore', onClick: () => handleRestore(doc) }
    ];
  }

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')}
          style={{ color: '#fff' }}
        >
          กลับ
        </Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          จัดการเอกสาร
        </div>
        <Button
          type="text"
          icon={<ReloadOutlined spin={loading} />}
          onClick={load}
          style={{ color: '#fff' }}
        />
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        centered
        style={{ background: '#fff' }}
        items={[
          { key: 'active', label: 'ใช้งาน' },
          { key: 'archived', label: 'Archived' }
        ]}
      />

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {loading && docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : docs.length === 0 ? (
            <Empty description="ไม่มีเอกสาร" style={{ marginTop: 40 }} />
          ) : (
            <List
              dataSource={docs}
              renderItem={doc => (
                <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 12 } }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <FileTextOutlined style={{ fontSize: 24, color: '#1e3a5f', marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {doc.form_code && (
                        <Tag color="blue" style={{ fontSize: 10, marginBottom: 4 }}>
                          {doc.form_code}
                        </Tag>
                      )}
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1e3a5f', lineHeight: 1.3 }}>
                        {doc.title}
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        {CATEGORY_LABEL[doc.category]} · {doc.page_count} หน้า · ลำดับ {doc.sort_order}
                      </Text>
                      {doc.updated_at && (
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          แก้ไขล่าสุด: {new Date(doc.updated_at).toLocaleString('th-TH')}
                        </Text>
                      )}
                    </div>
                    <Dropdown menu={{ items: buildActionMenu(doc) }} placement="bottomRight" trigger={['click']}>
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                </Card>
              )}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title="แก้ไขเอกสาร"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} requiredMark={false}>
          <Form.Item label="ชื่อเอกสาร" name="title" rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item label="Form Code" name="form_code">
            <Input maxLength={20} placeholder="ไม่บังคับ" />
          </Form.Item>
          <Form.Item label="หมวด" name="category" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="full_book">📚 เต็มเล่ม</Radio>
              <Radio value="topic">📑 เรื่อง</Radio>
              <Radio value="summary">📋 สรุป</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="คำอธิบาย" name="description">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="ลำดับการแสดง" name="sort_order">
            <InputNumber min={1} max={9999} style={{ width: 100 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const pageStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  background: '#f5f7fa', zIndex: 100
};

const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px', background: '#1e3a5f',
  height: 52, flexShrink: 0
};

const contentStyle = {
  padding: 12, flex: 1, overflowY: 'auto'
};
