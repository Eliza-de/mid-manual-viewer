/**
 * DocumentManagement — V2
 * BUILD: 2026-05-12-V2-DOCMGMT
 *
 * Features:
 *   - 2 tabs: active / archived
 *   - Search
 *   - Edit metadata (title, code, category, sort_order)
 *   - Archive / Restore
 *   - Phase 11: Replace pages (re-upload PDF/PNG)
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Button, List, Tag, Tabs, Modal, message, Space,
  Typography, Input, Spin, Form, InputNumber, Upload,
} from 'antd';
import {
  FileTextOutlined, EditOutlined, InboxOutlined,
  ReloadOutlined, SearchOutlined, UndoOutlined,
  CloudUploadOutlined, FileAddOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import {
  listAllDocs, updateDoc, archiveDoc, restoreDoc, replaceDocPages,
} from '../api/adminV2.js';
import { COLORS, SHADOWS, RADIUS } from '../brandV2.js';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

const { Text } = Typography;
const { Dragger } = Upload;

export default function DocumentManagement() {
  if (typeof window !== 'undefined' && !window.__docmgmt_v2_loaded) {
    console.log('%c[DocumentManagement V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__docmgmt_v2_loaded = true;
  }

  const nav = useNavigation();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [replacing, setReplacing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await listAllDocs(token, { archived: tab === 'archived' ? 1 : 0 });
      setDocs(data?.documents || []);
    } catch (e) {
      message.error('โหลดเอกสารไม่สำเร็จ');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q) ||
      (d.category || '').toLowerCase().includes(q)
    );
  }, [docs, search]);

  function openEdit(d) {
    setEditing(d);
    form.setFieldsValue({
      title: d.title, code: d.code, category: d.category, sort_order: d.sort_order,
    });
  }
  async function saveEdit() {
    const vals = await form.validateFields();
    const token = await getIdToken();
    await updateDoc(token, { id: editing.id, ...vals });
    message.success('บันทึกแล้ว');
    setEditing(null); load();
  }
  async function doArchive(d) {
    Modal.confirm({
      title: `Archive "${d.title}"?`,
      content: 'เอกสารจะถูกซ่อนจากผู้ใช้ทั่วไป สามารถ restore ภายหลังได้',
      okText: 'Archive', okButtonProps: { danger: true },
      onOk: async () => {
        const token = await getIdToken();
        await archiveDoc(token, d.id);
        message.success('Archived แล้ว'); load();
      },
    });
  }
  async function doRestore(d) {
    const token = await getIdToken();
    await restoreDoc(token, d.id);
    message.success('Restore แล้ว'); load();
  }

  async function doReplace(file) {
    const token = await getIdToken();
    try {
      await replaceDocPages(token, replacing.id, file);
      message.success('Replace pages สำเร็จ');
      setReplacing(null); load();
    } catch (e) { message.error('Replace ไม่สำเร็จ'); }
    return false;
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: 24 }}>
      <PageHeader
        title="Document Management"
        icon={<FileTextOutlined />}
        onBack={() => nav.goTo('admin')}
        rightAction={
          <button
            onClick={load}
            style={{
              background: 'rgba(255,255,255,0.25)', border: 'none',
              borderRadius: 10, width: 38, height: 38, color: '#fff', cursor: 'pointer',
            }}
          ><ReloadOutlined spin={loading} /></button>
        }
      />

      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined style={{ color: COLORS.textMuted }} />}
            placeholder="ค้นหา title / code / category"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, borderRadius: RADIUS.md }}
          />
          <Button
            type="primary" size="large" icon={<FileAddOutlined />}
            style={{ background: COLORS.primaryDark }}
            onClick={() => nav.goTo('admin-upload')}
          >เพิ่ม</Button>
        </div>

        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'active', label: '📄 เอกสารที่ใช้งาน' },
            { key: 'archived', label: '📦 Archived' },
          ]}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📄" title="ไม่พบเอกสาร"
            subtitle={tab === 'archived' ? 'ยังไม่มี archived' : 'อัปโหลดเอกสารใหม่ได้เลย'} />
        ) : (
          <List
            dataSource={filtered}
            renderItem={d => (
              <div style={{
                background: COLORS.cardBg, borderRadius: RADIUS.md,
                padding: 12, marginBottom: 8, boxShadow: SHADOWS.card,
                border: `1px solid ${COLORS.borderLight}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    background: COLORS.primaryLight, color: COLORS.primaryDark,
                    width: 42, height: 42, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 18,
                  }}>
                    <FileTextOutlined />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ color: COLORS.primaryDark, fontSize: 15, display: 'block' }}>
                      {d.title}
                    </Text>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {d.code && <Tag color="default" style={{ margin: 0 }}>{d.code}</Tag>}
                      {d.category && <Tag color="green" style={{ margin: 0 }}>{d.category}</Tag>}
                      <Tag style={{ margin: 0 }}>{d.page_count || 0} หน้า</Tag>
                    </div>
                    <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 6 }}>
                      sort: {d.sort_order || 0} · updated: {d.updated_at ? new Date(d.updated_at).toLocaleDateString('th-TH') : '–'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                  {tab === 'active' ? (
                    <>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(d)}>แก้ไข</Button>
                      <Button size="small" icon={<CloudUploadOutlined />} onClick={() => setReplacing(d)}>Replace</Button>
                      <Button size="small" danger icon={<InboxOutlined />} onClick={() => doArchive(d)}>Archive</Button>
                    </>
                  ) : (
                    <Button size="small" type="primary" icon={<UndoOutlined />}
                      style={{ background: COLORS.primaryDark }}
                      onClick={() => doRestore(d)}>Restore</Button>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        title="แก้ไขข้อมูลเอกสาร"
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        okText="บันทึก"
        cancelText="ยกเลิก"
        okButtonProps={{ style: { background: COLORS.primaryDark } }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Form Code">
            <Input placeholder="เช่น HR-001" />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort Order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Replace Modal */}
      <Modal
        open={!!replacing}
        title={`Replace pages: ${replacing?.title || ''}`}
        onCancel={() => setReplacing(null)}
        footer={null}
      >
        <Dragger
          accept="application/pdf,image/png"
          beforeUpload={doReplace}
          showUploadList={false}
        >
          <p><CloudUploadOutlined style={{ fontSize: 40, color: COLORS.primaryDark }} /></p>
          <p>ลากไฟล์ PDF/PNG มาวางที่นี่</p>
          <p style={{ color: COLORS.textMuted, fontSize: 12 }}>
            ไฟล์เดิมจะถูก replace ทั้งหมด ไม่สามารถ undo ได้
          </p>
        </Dragger>
      </Modal>
    </div>
  );
}
