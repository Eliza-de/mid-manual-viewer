/**
 * DocumentManagement — Phase 7 + 8 + 11 (replace pages)
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, List, Tag, Tabs, Modal, message, Form, Input, InputNumber,
  Radio, Typography, Dropdown, Empty, Spin
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, MoreOutlined, UndoOutlined, SwapOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  listAllDocuments, updateDocument, archiveDocument, restoreDocument
} from '../../api/admin.js';
import SearchBar from '../../components/SearchBar.jsx';
import ReplacePagesModal from '../../components/ReplacePagesModal.jsx';
import { COLORS } from '../../brand.js';

const { Text } = Typography;

const CATEGORY_LABEL = {
  full_book: '📚 เต็มเล่ม',
  topic: '📑 เรื่อง',
  summary: '📋 สรุป'
};

const CATEGORY_OPTIONS = [
  { label: '📚 เต็มเล่ม', value: 'full_book' },
  { label: '📑 เรื่อง', value: 'topic' },
  { label: '📋 สรุป', value: 'summary' }
];

export default function DocumentManagement() {
  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editForm] = Form.useForm();

  // NEW: replace pages modal state
  const [replacingDoc, setReplacingDoc] = useState(null);

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const r = await listAllDocuments(getIdToken(), auth.session.token, {
        status: tab, search, category
      });
      if (r.ok) setDocs(r.documents);
      else if (r.needsLogin) auth.logout();
      else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, search, category]);

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
    const r = await updateDocument(getIdToken(), auth.session.token, editing.id, values);
    if (r.ok) { message.success('บันทึกสำเร็จ'); setEditing(null); load(); }
    else message.error(r.error || 'ไม่สำเร็จ');
  }

  async function handleArchive(doc) {
    Modal.confirm({
      title: 'Archive เอกสาร',
      content: `Archive "${doc.title}"? เอกสารจะไม่แสดงในรายการของผู้ใช้`,
      okText: 'Archive', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        const r = await archiveDocument(getIdToken(), auth.session.token, doc.id);
        if (r.ok) { message.success('Archive สำเร็จ'); load(); }
        else message.error(r.error || 'ไม่สำเร็จ');
      }
    });
  }

  async function handleRestore(doc) {
    const r = await restoreDocument(getIdToken(), auth.session.token, doc.id);
    if (r.ok) { message.success('Restore สำเร็จ'); load(); }
    else message.error(r.error || 'ไม่สำเร็จ');
  }

  function handleReplacePages(doc) {
    setReplacingDoc(doc);
  }

  function buildActionMenu(doc) {
    if (doc.status === 'active') {
      return [
        { key: 'edit', icon: <EditOutlined />, label: 'แก้ไขข้อมูล', onClick: () => openEdit(doc) },
        { key: 'replacePages', icon: <SwapOutlined style={{ color: COLORS.accent }} />, label: 'แก้ไขหน้า', onClick: () => handleReplacePages(doc) },
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
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>จัดการเอกสาร</div>
        <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={load} style={{ color: '#fff' }} />
      </div>

      <Tabs activeKey={tab} onChange={setTab} centered style={{ background: '#fff' }}
        items={[
          { key: 'active', label: 'ใช้งาน' },
          { key: 'archived', label: 'Archived' }
        ]}
      />

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <SearchBar
            placeholder="ค้นหาชื่อ / form code / คำอธิบาย..."
            onSearchChange={setSearch}
            filterOptions={CATEGORY_OPTIONS}
            filterValue={category}
            onFilterChange={(v) => setCategory(v || '')}
            filterPlaceholder="หมวด"
          />

          {loading && docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : docs.length === 0 ? (
            <Empty
              description={search || category ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไข' : 'ไม่มีเอกสาร'}
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                พบ {docs.length} เอกสาร
              </Text>
              <List
                dataSource={docs}
                renderItem={doc => (
                  <Card size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: 12 } }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <FileTextOutlined style={{ fontSize: 24, color: COLORS.primary, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {doc.form_code && (
                          <Tag color={COLORS.primary} style={{ fontSize: 10, marginBottom: 4, color: '#fff', borderColor: COLORS.primary }}>
                            {doc.form_code}
                          </Tag>
                        )}
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.primary, lineHeight: 1.3 }}>
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
            </>
          )}
        </div>
      </div>

      {/* Edit metadata modal */}
      <Modal title="แก้ไขข้อมูลเอกสาร" open={!!editing} onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()} okText="บันทึก" cancelText="ยกเลิก"
        okButtonProps={{ style: { background: COLORS.primary, borderColor: COLORS.primary } }}>
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

      {/* Replace Pages modal (Phase 11) */}
      <ReplacePagesModal
        open={!!replacingDoc}
        doc={replacingDoc}
        onClose={() => setReplacingDoc(null)}
        onSuccess={() => { setReplacingDoc(null); load(); }}
      />
    </div>
  );
}

const pageStyle = {
  position: 'fixed', inset: 0,
  display: 'flex', flexDirection: 'column',
  background: COLORS.bgSoft, zIndex: 100
};

const topBarStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 12px', background: COLORS.primary,
  height: 52, flexShrink: 0
};

const contentStyle = { padding: 12, flex: 1, overflowY: 'auto' };
