/**
 * DocumentManagement — Phases 7 + 8 + 9 + 11
 * Phase 9 NEW: multi-select + bulk archive/restore + bulk update category
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Card, Button, List, Tag, Tabs, Modal, message, Form, Input, InputNumber,
  Radio, Typography, Dropdown, Empty, Spin, Checkbox, Select
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, MoreOutlined, UndoOutlined, SwapOutlined, TagOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  listAllDocuments, updateDocument, archiveDocument, restoreDocument,
  bulkArchiveDocuments, bulkRestoreDocuments, bulkUpdateCategory
} from '../../api/admin.js';
import SearchBar from '../../components/SearchBar.jsx';
import BulkActionBar from '../../components/BulkActionBar.jsx';
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
  const [bulkLoading, setBulkLoading] = useState(false);

  const [editing, setEditing] = useState(null);
  const [editForm] = Form.useForm();
  const [replacingDoc, setReplacingDoc] = useState(null);

  const [selected, setSelected] = useState(new Map());
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false);
  const [bulkNewCategory, setBulkNewCategory] = useState('full_book');

  const selectedCount = selected.size;
  const allSelected = docs.length > 0 && docs.every(d => selected.has(d.id));
  const someSelected = docs.some(d => selected.has(d.id));

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const r = await listAllDocuments(getIdToken(), auth.session.token, { status: tab, search, category });
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
  useEffect(() => { setSelected(new Map()); }, [tab, search, category]);

  function toggleSelect(doc) {
    const m = new Map(selected);
    if (m.has(doc.id)) m.delete(doc.id);
    else m.set(doc.id, doc);
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

  // ============ INDIVIDUAL ACTIONS ============

  function openEdit(doc) {
    setEditing(doc);
    editForm.setFieldsValue({
      title: doc.title, form_code: doc.form_code, category: doc.category,
      description: doc.description, sort_order: doc.sort_order
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
      content: `Archive "${doc.title}"?`,
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

  // ============ BULK ACTIONS (Phase 9) ============

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
          const r = await action(getIdToken(), auth.session.token, ids);
          if (r.ok) {
            const msg = `✅ สำเร็จ ${r.succeeded}` + (r.failed_count > 0 ? ` · ⚠️ ผิดพลาด ${r.failed_count}` : '');
            message.success(msg, 4);
            setSelected(new Map());
            load();
          } else {
            message.error(r.error || `${label}ไม่สำเร็จ`);
          }
        } catch (err) {
          message.error(err.message || 'เกิดข้อผิดพลาด');
        } finally {
          setBulkLoading(false);
        }
      }
    });
  }

  async function handleBulkUpdateCategory() {
    const ids = Array.from(selected.keys());
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      const r = await bulkUpdateCategory(getIdToken(), auth.session.token, ids, bulkNewCategory);
      if (r.ok) {
        const msg = `✅ เปลี่ยนหมวด ${r.succeeded} เอกสาร` + (r.failed_count > 0 ? ` · ⚠️ ผิด ${r.failed_count}` : '');
        message.success(msg, 4);
        setSelected(new Map());
        setBulkCategoryOpen(false);
        load();
      } else {
        message.error(r.error || 'ไม่สำเร็จ');
      }
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setBulkLoading(false);
    }
  }

  const bulkActions = useMemo(() => {
    if (tab === 'active') {
      return [
        {
          key: 'bulkCategory',
          icon: <TagOutlined />,
          label: 'เปลี่ยนหมวด',
          onClick: () => setBulkCategoryOpen(true),
          loading: bulkLoading
        },
        {
          key: 'bulkArchive',
          icon: <DeleteOutlined />,
          label: 'Archive ทั้งหมด',
          danger: true,
          onClick: () => runBulk(bulkArchiveDocuments, 'Archive', true),
          loading: bulkLoading
        }
      ];
    }
    if (tab === 'archived') {
      return [{
        key: 'bulkRestore',
        icon: <UndoOutlined />,
        label: 'Restore ทั้งหมด',
        onClick: () => runBulk(bulkRestoreDocuments, 'Restore'),
        loading: bulkLoading
      }];
    }
    return [];
  }, [tab, bulkLoading]);

  function buildActionMenu(doc) {
    if (doc.status === 'active') {
      return [
        { key: 'edit', icon: <EditOutlined />, label: 'แก้ไขข้อมูล', onClick: () => openEdit(doc) },
        { key: 'replacePages', icon: <SwapOutlined style={{ color: COLORS.accent }} />, label: 'แก้ไขหน้า', onClick: () => setReplacingDoc(doc) },
        { type: 'divider' },
        { key: 'archive', icon: <DeleteOutlined />, label: 'Archive', danger: true, onClick: () => handleArchive(doc) }
      ];
    }
    return [{ key: 'restore', icon: <UndoOutlined />, label: 'Restore', onClick: () => handleRestore(doc) }];
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

      <div style={{ ...contentStyle, paddingBottom: selectedCount > 0 ? 80 : 12 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 6 }}>
                <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleSelectAll}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    เลือกทั้งหมด ({docs.length})
                  </Text>
                </Checkbox>
              </div>

              <List
                dataSource={docs}
                renderItem={doc => {
                  const isChecked = selected.has(doc.id);
                  return (
                    <Card
                      size="small"
                      style={{
                        marginBottom: 8,
                        borderColor: isChecked ? COLORS.primary : undefined,
                        background: isChecked ? COLORS.bgSoft : undefined
                      }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelect(doc)} style={{ marginTop: 4 }} />
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
                  );
                }}
              />
            </>
          )}
        </div>
      </div>

      <BulkActionBar
        selectedCount={selectedCount}
        onClear={() => setSelected(new Map())}
        actions={bulkActions}
      />

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

      {/* Bulk update category modal */}
      <Modal
        title={`เปลี่ยนหมวด ${selectedCount} เอกสาร`}
        open={bulkCategoryOpen}
        onCancel={() => setBulkCategoryOpen(false)}
        onOk={handleBulkUpdateCategory}
        okText="เปลี่ยนหมวด"
        cancelText="ยกเลิก"
        confirmLoading={bulkLoading}
        okButtonProps={{ style: { background: COLORS.primary, borderColor: COLORS.primary } }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>เลือกหมวดใหม่สำหรับเอกสารทั้งหมดที่เลือก:</Text>
        </div>
        <Radio.Group
          value={bulkNewCategory}
          onChange={(e) => setBulkNewCategory(e.target.value)}
        >
          <Radio.Button value="full_book">📚 เต็มเล่ม</Radio.Button>
          <Radio.Button value="topic">📑 เรื่อง</Radio.Button>
          <Radio.Button value="summary">📋 สรุป</Radio.Button>
        </Radio.Group>
      </Modal>

      {/* Replace Pages modal */}
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
