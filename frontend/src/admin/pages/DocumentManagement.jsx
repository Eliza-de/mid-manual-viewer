/**
 * DocumentManagement — Admin console
 *
 * 2 tabs: active / archived
 * Search + category filter
 * Edit metadata, archive/restore, replace pages (single/append/all)
 * Bulk: archive/restore, update category
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Card, Button, List, Tag, Tabs, Modal, message, Form, Input, InputNumber,
  Radio, Typography, Dropdown, Empty, Spin, Checkbox, Select, Upload, Space,
} from 'antd';
import {
  FileTextOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, MoreOutlined, UndoOutlined, SwapOutlined, TagOutlined,
  SearchOutlined, UploadOutlined, InboxOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  listAllDocuments, updateDocument, archiveDocument, restoreDocument,
  deleteDocument,
  bulkArchiveDocuments, bulkRestoreDocuments, bulkDeleteDocuments,
  bulkUpdateCategory,
  replacePage, appendPages, replaceAllPages,
} from '../api/admin';

const { Text } = Typography;
const { Dragger } = Upload;

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';

const CATEGORY_LABEL = { full_book: 'เล่ม', topic: 'บท', summary: 'รีวิว' };
const CATEGORY_OPTIONS = [
  { label: 'เล่ม', value: 'full_book' },
  { label: 'บท', value: 'topic' },
  { label: 'รีวิว', value: 'summary' },
];

function getTagColor(formCode) {
  if (!formCode) return { bg: '#6B8278', text: 'white' };
  const code = formCode.toUpperCase();
  if (code.startsWith('FF'))   return { bg: MINT_DARK, text: 'white' };
  if (code.startsWith('KEY'))  return { bg: '#E8965B', text: 'white' };
  if (code.startsWith('BOOK')) return { bg: MINT_MID, text: 'white' };
  if (code.startsWith('SUM'))  return { bg: '#A4DFCB', text: MINT_DARK };
  return { bg: '#6B8278', text: 'white' };
}

export default function DocumentManagement() {
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editForm] = Form.useForm();
  const [replacing, setReplacing] = useState(null);

  const [selected, setSelected] = useState(new Map());
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkNewCategory, setBulkNewCategory] = useState('full_book');

  const selectedCount = selected.size;
  const allSelected = docs.length > 0 && docs.every(d => selected.has(d.id));
  const someSelected = docs.some(d => selected.has(d.id));

  async function load() {
    setLoading(true);
    try {
      const r = await listAllDocuments({ status: tab, search, category });
      setDocs(r.documents || []);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tab, search, category]);
  useEffect(() => { setSelected(new Map()); }, [tab, search, category]);

  function toggleSelect(d) {
    const m = new Map(selected);
    if (m.has(d.id)) m.delete(d.id);
    else m.set(d.id, d);
    setSelected(m);
  }

  function toggleSelectAll() {
    if (allSelected) setSelected(new Map());
    else {
      const m = new Map();
      docs.forEach(d => m.set(d.id, d));
      setSelected(m);
    }
  }

  function openEdit(doc) {
    setEditing(doc);
    editForm.setFieldsValue({
      title: doc.title, form_code: doc.form_code, category: doc.category,
      description: doc.description, sort_order: doc.sort_order,
    });
  }

  async function handleEditSubmit(values) {
    try {
      await updateDocument(editing.id, values);
      message.success('บันทึกสำเร็จ');
      setEditing(null);
      load();
    } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
  }

  async function handleArchive(doc) {
    Modal.confirm({
      title: 'Archive เอกสาร',
      content: `Archive "${doc.title}"?`,
      okText: 'Archive', okButtonProps: { danger: true }, cancelText: 'ยกเลิก',
      async onOk() {
        try {
          await archiveDocument(doc.id);
          message.success('Archive สำเร็จ');
          load();
        } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
      },
    });
  }

  async function handleRestore(doc) {
    try {
      await restoreDocument(doc.id);
      message.success('Restore สำเร็จ');
      load();
    } catch (err) { message.error(err.message || 'ไม่สำเร็จ'); }
  }

  async function handleDelete(doc) {
    Modal.confirm({
      title: 'ลบเอกสารถาวร',
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            ลบ "<strong>{doc.title}</strong>" <strong style={{ color: '#EF4444' }}>ถาวร</strong> ({doc.page_count} หน้า)?
          </p>
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: 10, fontSize: 12, color: '#991B1B', marginTop: 8,
          }}>
            ⚠️ การกระทำนี้ <strong>กู้คืนไม่ได้</strong> — จะลบทั้งข้อมูลเอกสารและไฟล์รูปทุกหน้าออกจาก R2
          </div>
        </div>
      ),
      okText: 'ลบถาวร', okType: 'danger',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      async onOk() {
        try {
          const r = await deleteDocument(doc.id);
          message.success(`ลบสำเร็จ (${r.pages_deleted ?? doc.page_count} หน้า)`);
          load();
        } catch (err) { message.error(err.message || 'ลบไม่สำเร็จ'); }
      },
    });
  }

  async function runBulk(action, label, danger = false) {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    Modal.confirm({
      title: `${label} (${ids.length} เอกสาร)`,
      content: `ยืนยัน ${label} เอกสาร ${ids.length} ฉบับ?`,
      okText: 'ยืนยัน', okButtonProps: { danger }, cancelText: 'ยกเลิก',
      async onOk() {
        setBulkLoading(true);
        try {
          const r = await action(ids);
          const msg = `✅ สำเร็จ ${r.succeeded ?? ids.length}` + (r.failed_count > 0 ? ` · ⚠️ ผิดพลาด ${r.failed_count}` : '');
          message.success(msg, 4);
          setSelected(new Map());
          load();
        } catch (err) {
          message.error(err.message || `${label}ไม่สำเร็จ`);
        } finally {
          setBulkLoading(false);
        }
      },
    });
  }

  async function handleBulkUpdateCategory() {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const r = await bulkUpdateCategory(ids, bulkNewCategory);
      const msg = `✅ เปลี่ยนหมวด ${r.succeeded ?? ids.length} เอกสาร` + (r.failed_count > 0 ? ` · ⚠️ ผิด ${r.failed_count}` : '');
      message.success(msg, 4);
      setSelected(new Map());
      setBulkCategoryOpen(false);
      load();
    } catch (err) {
      message.error(err.message || 'ไม่สำเร็จ');
    } finally {
      setBulkLoading(false);
    }
  }

  const bulkActions = useMemo(() => {
    if (tab === 'active') {
      return [
        { key: 'cat', icon: <TagOutlined />, label: 'เปลี่ยนหมวด', onClick: () => setBulkCategoryOpen(true), loading: bulkLoading },
        { key: 'arc', icon: <DeleteOutlined />, label: 'Archive ทั้งหมด', danger: true, onClick: () => runBulk(bulkArchiveDocuments, 'Archive', true), loading: bulkLoading },
      ];
    }
    if (tab === 'archived') {
      return [
        { key: 'res', icon: <UndoOutlined />, label: 'Restore ทั้งหมด', onClick: () => runBulk(bulkRestoreDocuments, 'Restore'), loading: bulkLoading },
        { key: 'del', icon: <DeleteOutlined />, label: 'ลบถาวรทั้งหมด', danger: true, onClick: () => handleBulkDelete(), loading: bulkLoading },
      ];
    }
    return [];
  }, [tab, bulkLoading, selectedCount]);

  function handleBulkDelete() {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    const docs = ids.map(id => selected.get(id)).filter(Boolean);
    const totalPages = docs.reduce((s, d) => s + (d.page_count || 0), 0);

    Modal.confirm({
      title: `ลบถาวร ${ids.length} เอกสาร`,
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: (
        <div>
          <p style={{ marginTop: 0 }}>
            ลบ <strong>{ids.length} เอกสาร</strong> ({totalPages} หน้า) <strong style={{ color: '#EF4444' }}>ถาวร</strong>?
          </p>
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
            padding: 10, fontSize: 12, color: '#991B1B', marginTop: 8,
          }}>
            ⚠️ การกระทำนี้ <strong>กู้คืนไม่ได้</strong> — จะลบทั้งข้อมูลเอกสารและไฟล์รูปทุกหน้าออกจาก R2
          </div>
        </div>
      ),
      okText: 'ลบถาวร', okType: 'danger',
      okButtonProps: { danger: true },
      cancelText: 'ยกเลิก',
      async onOk() {
        setBulkLoading(true);
        try {
          const r = await bulkDeleteDocuments(ids);
          const msg = `✅ ลบสำเร็จ ${r.succeeded ?? ids.length}` +
            (r.pages_deleted ? ` · ${r.pages_deleted} หน้า` : '') +
            (r.failed_count > 0 ? ` · ⚠️ ผิดพลาด ${r.failed_count}` : '');
          message.success(msg, 4);
          setSelected(new Map());
          load();
        } catch (err) {
          message.error(err.message || 'ลบไม่สำเร็จ');
        } finally {
          setBulkLoading(false);
        }
      },
    });
  }

  function buildActionMenu(doc) {
    if (doc.status === 'active') {
      return [
        { key: 'edit', icon: <EditOutlined />, label: 'แก้ไขข้อมูล', onClick: () => openEdit(doc) },
        { key: 'replace', icon: <SwapOutlined style={{ color: MINT_MID }} />, label: 'แทนหน้า / เพิ่มหน้า', onClick: () => setReplacing(doc) },
        { type: 'divider' },
        { key: 'archive', icon: <DeleteOutlined />, label: 'Archive', danger: true, onClick: () => handleArchive(doc) },
      ];
    }
    return [
      { key: 'restore', icon: <UndoOutlined />, label: 'Restore', onClick: () => handleRestore(doc) },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: 'ลบถาวร', danger: true, onClick: () => handleDelete(doc) },
    ];
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>📄 จัดการเอกสาร</h1>
        <button onClick={load} style={refreshBtnStyle} title="รีเฟรช">
          <ReloadOutlined spin={loading} />
        </button>
      </div>

      <div style={cardStyle}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'active', label: 'ใช้งาน' },
            { key: 'archived', label: 'Archived' },
          ]}
        />

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="ค้นหาชื่อ / form code..."
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 10, flex: '1 1 300px', maxWidth: 480 }}
          />
          <Select
            value={category || undefined}
            onChange={(v) => setCategory(v || '')}
            placeholder="ทุกหมวด"
            allowClear
            options={CATEGORY_OPTIONS}
            style={{ minWidth: 160 }}
          />
        </div>

        {loading && docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
        ) : docs.length === 0 ? (
          <Empty description={search || category ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไข' : 'ไม่มีเอกสาร'} style={{ padding: 40 }} />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 6 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll}>
                <Text type="secondary" style={{ fontSize: 12 }}>เลือกทั้งหมด ({docs.length})</Text>
              </Checkbox>
              {selectedCount > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>เลือก {selectedCount}</Text>
              )}
            </div>

            <List
              dataSource={docs}
              renderItem={doc => {
                const isChecked = selected.has(doc.id);
                const tagColor = getTagColor(doc.form_code);
                return (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 8,
                      borderColor: isChecked ? MINT_DARK : 'rgba(31,77,63,0.08)',
                      background: isChecked ? MINT_SOFT : '#fff',
                      borderRadius: 12,
                      borderWidth: '0.5px',
                    }}
                    styles={{ body: { padding: 12 } }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Checkbox checked={isChecked} onChange={() => toggleSelect(doc)} style={{ marginTop: 4 }} />
                      <div style={docThumbStyle}>
                        <FileTextOutlined style={{ fontSize: 22, color: 'white' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {doc.form_code && (
                          <span style={{
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            letterSpacing: 0.4,
                            marginBottom: 4,
                            background: tagColor.bg,
                            color: tagColor.text,
                          }}>{doc.form_code}</span>
                        )}
                        <div style={{ fontWeight: 600, fontSize: 14, color: MINT_DARK, lineHeight: 1.3 }}>
                          {doc.title}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                          {CATEGORY_LABEL[doc.category] || doc.category} · {doc.page_count} หน้า · ลำดับ {doc.sort_order}
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
                );
              }}
            />
          </>
        )}
      </div>

      {selectedCount > 0 && (
        <div style={bulkBarStyle}>
          <span style={{ fontWeight: 600 }}>เลือก {selectedCount} เอกสาร</span>
          <Space>
            {bulkActions.map(a => (
              <Button
                key={a.key}
                icon={a.icon}
                danger={a.danger}
                loading={a.loading}
                onClick={a.onClick}
                type={a.danger ? 'default' : 'primary'}
                style={a.danger ? {} : { background: '#fff', borderColor: '#fff', color: MINT_DARK }}
              >
                {a.label}
              </Button>
            ))}
            <Button type="text" style={{ color: '#fff' }} onClick={() => setSelected(new Map())}>ยกเลิก</Button>
          </Space>
        </div>
      )}

      {/* Edit metadata modal */}
      <Modal
        title="แก้ไขข้อมูลเอกสาร"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        okText="บันทึก" cancelText="ยกเลิก"
        okButtonProps={{ style: { background: MINT_DARK, borderColor: MINT_DARK } }}
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
              <Radio value="full_book">เล่ม</Radio>
              <Radio value="topic">บท</Radio>
              <Radio value="summary">รีวิว</Radio>
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

      {/* Bulk category modal */}
      <Modal
        title={`เปลี่ยนหมวด ${selectedCount} เอกสาร`}
        open={bulkCategoryOpen}
        onCancel={() => setBulkCategoryOpen(false)}
        onOk={handleBulkUpdateCategory}
        confirmLoading={bulkLoading}
        okText="เปลี่ยนหมวด" cancelText="ยกเลิก"
        okButtonProps={{ style: { background: MINT_DARK, borderColor: MINT_DARK } }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>เลือกหมวดใหม่:</Text>
        </div>
        <Radio.Group value={bulkNewCategory} onChange={(e) => setBulkNewCategory(e.target.value)}>
          <Radio.Button value="full_book">เล่ม</Radio.Button>
          <Radio.Button value="topic">บท</Radio.Button>
          <Radio.Button value="summary">รีวิว</Radio.Button>
        </Radio.Group>
      </Modal>

      {/* Replace pages modal */}
      <ReplacePagesModal
        open={!!replacing}
        doc={replacing}
        onClose={() => setReplacing(null)}
        onSuccess={() => { setReplacing(null); load(); }}
      />
    </div>
  );
}

// ============================================
// ReplacePagesModal — inline component
// ============================================
function ReplacePagesModal({ open, doc, onClose, onSuccess }) {
  const [mode, setMode] = useState('append'); // 'append' | 'single' | 'all'
  const [pageNo, setPageNo] = useState(1);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode('append');
      setPageNo(1);
      setFiles([]);
    }
  }, [open]);

  async function handleSubmit() {
    if (!doc) return;
    if (files.length === 0) {
      message.warning('เลือกไฟล์ก่อน');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'single') {
        await replacePage(doc.id, pageNo, files[0]);
        message.success(`แทนหน้า ${pageNo} สำเร็จ`);
      } else if (mode === 'append') {
        await appendPages(doc.id, files);
        message.success(`เพิ่ม ${files.length} หน้า สำเร็จ`);
      } else if (mode === 'all') {
        await replaceAllPages(doc.id, files);
        message.success(`แทนทุกหน้า สำเร็จ`);
      }
      onSuccess?.();
    } catch (err) {
      message.error(err.message || 'ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={doc ? `แทน/เพิ่มหน้า — ${doc.title}` : ''}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={busy}
      okText="ดำเนินการ" cancelText="ยกเลิก"
      okButtonProps={{ style: { background: MINT_DARK, borderColor: MINT_DARK } }}
      width={520}
    >
      <Radio.Group
        value={mode}
        onChange={(e) => { setMode(e.target.value); setFiles([]); }}
        style={{ marginBottom: 16 }}
      >
        <Radio.Button value="append">เพิ่มหน้าท้าย</Radio.Button>
        <Radio.Button value="single">แทนหน้าเดียว</Radio.Button>
        <Radio.Button value="all">แทนทุกหน้า</Radio.Button>
      </Radio.Group>

      {mode === 'single' && (
        <div style={{ marginBottom: 12 }}>
          <Text style={{ marginRight: 8 }}>หน้าที่:</Text>
          <InputNumber min={1} max={doc?.page_count || 99} value={pageNo} onChange={setPageNo} />
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            (เอกสารนี้มี {doc?.page_count} หน้า)
          </Text>
        </div>
      )}

      <Dragger
        multiple={mode !== 'single'}
        maxCount={mode === 'single' ? 1 : 999}
        accept="image/png,image/jpeg,application/pdf"
        beforeUpload={(file, fileList) => {
          setFiles(mode === 'single' ? [file] : fileList);
          return false;
        }}
        fileList={files.map((f, i) => ({ uid: i, name: f.name, status: 'done' }))}
        onRemove={(f) => setFiles(files.filter((_, i) => i !== f.uid))}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: MINT_MID }} /></p>
        <p className="ant-upload-text">คลิกหรือลากไฟล์มาวางที่นี่</p>
        <p className="ant-upload-hint" style={{ fontSize: 12 }}>
          {mode === 'single' ? 'เลือก 1 ไฟล์' : 'เลือกหลายไฟล์ได้ (PNG/JPG/PDF)'}
        </p>
      </Dragger>
    </Modal>
  );
}

const pageHeaderStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: '16px 20px',
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};

const pageTitleStyle = {
  margin: 0, fontSize: 22, fontWeight: 700, color: MINT_DARK,
};

const refreshBtnStyle = {
  background: MINT_SOFT, border: 'none', borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', color: MINT_DARK,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};

const bulkBarStyle = {
  position: 'fixed',
  bottom: 16, left: '50%', transform: 'translateX(-50%)',
  background: MINT_DARK, color: '#fff',
  padding: '10px 20px', borderRadius: 12,
  display: 'flex', alignItems: 'center', gap: 16,
  boxShadow: '0 4px 16px rgba(31,77,63,0.25)',
  zIndex: 200,
};

const docThumbStyle = {
  width: 44, height: 56, borderRadius: 8,
  background: `linear-gradient(135deg, ${MINT_MID}, ${MINT_DARK})`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 2px 4px rgba(31,77,63,0.08)',
};
