/**
 * LogViewer — Admin console
 *
 * 3 tabs: auth / audit / access · Pagination · CSV export
 */
import { useEffect, useState } from 'react';
import { Card, Button, Tabs, Tag, message, Typography, Empty, Spin, Pagination } from 'antd';
import {
  ReloadOutlined, KeyOutlined, CrownOutlined, EyeOutlined, DownloadOutlined,
} from '@ant-design/icons';
import {
  getAuthLogs, getAuditLogs, getAccessLogs,
  exportAuthLogs, exportAuditLogs, exportAccessLogs,
} from '../api/admin';

const { Text } = Typography;
const PAGE_SIZE = 25;

const MINT_DARK = '#1F4D3F';
const MINT_SOFT = '#DCEEE3';

const AUTH_EVENT_LABELS = {
  register: { color: 'blue', text: 'ลงทะเบียน' },
  pin_set: { color: 'cyan', text: 'ตั้ง PIN' },
  login_success: { color: 'green', text: 'เข้าระบบ' },
  login_fail: { color: 'orange', text: 'PIN ผิด' },
  locked: { color: 'red', text: 'ถูก lock' },
};

const AUDIT_ACTION_LABELS = {
  bootstrap_admin_promoted: 'Bootstrap admin',
  admin_create_document: 'สร้างเอกสาร',
  admin_update_document: 'แก้ไขเอกสาร',
  admin_archive_document: 'Archive เอกสาร',
  admin_restore_document: 'Restore เอกสาร',
  admin_replace_page: 'แทนหน้า',
  admin_append_pages: 'เพิ่มหน้าท้าย',
  admin_replace_all_pages: 'แทนทุกหน้า',
  admin_approve_user: 'อนุมัติผู้ใช้',
  admin_disable_user: 'ระงับผู้ใช้',
  admin_enable_user: 'เปิดใช้ผู้ใช้',
  admin_grant_admin: 'มอบสิทธิ์ admin',
  admin_revoke_admin: 'ถอดสิทธิ์ admin',
  admin_reset_pin: 'Reset PIN',
  admin_bulk_approve_users: 'อนุมัติหลายคน',
  admin_bulk_disable_users: 'ระงับหลายคน',
  admin_bulk_enable_users: 'เปิดใช้หลายคน',
  admin_bulk_archive_documents: 'Archive หลายฉบับ',
  admin_bulk_restore_documents: 'Restore หลายฉบับ',
  admin_bulk_update_category: 'เปลี่ยนหมวด',
  admin_export_logs: 'Export Logs',
};

export default function LogViewer() {
  const [tab, setTab] = useState('auth');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  async function load(pageNumber = 1) {
    setLoading(true);
    try {
      const opts = { limit: PAGE_SIZE, offset: (pageNumber - 1) * PAGE_SIZE };
      const fn = tab === 'auth' ? getAuthLogs : tab === 'audit' ? getAuditLogs : getAccessLogs;
      const r = await fn(opts);
      setLogs(r.logs || []);
    } catch (err) {
      message.error(err.message || 'โหลด log ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [tab]);

  function changePage(p) { setPage(p); load(p); }

  async function handleExport() {
    setExporting(true);
    try {
      const fn = tab === 'auth' ? exportAuthLogs : tab === 'audit' ? exportAuditLogs : exportAccessLogs;
      await fn({});
      message.success('Export CSV สำเร็จ');
    } catch (err) {
      message.error(err.message || 'Export ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>📋 ดู Log</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
            Export CSV
          </Button>
          <button onClick={() => load(page)} style={refreshBtnStyle} title="รีเฟรช">
            <ReloadOutlined spin={loading} />
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: 'auth',   label: <span><KeyOutlined /> Auth</span> },
            { key: 'audit',  label: <span><CrownOutlined /> Audit</span> },
            { key: 'access', label: <span><EyeOutlined /> Access</span> },
          ]}
        />

        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : logs.length === 0 ? (
          <Empty description="ไม่มีข้อมูล" style={{ padding: 40 }} />
        ) : (
          <>
            {tab === 'auth'   && <AuthLogs logs={logs} />}
            {tab === 'audit'  && <AuditLogs logs={logs} />}
            {tab === 'access' && <AccessLogs logs={logs} />}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={logs.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : page * PAGE_SIZE}
                showSizeChanger={false}
                size="small"
                onChange={changePage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AuthLogs({ logs }) {
  return logs.map(l => {
    const ev = AUTH_EVENT_LABELS[l.event] || { color: 'default', text: l.event };
    return (
      <Card key={l.id} size="small" style={logCardStyle} styles={{ body: { padding: 12 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Tag color={ev.color} style={{ marginInlineEnd: 0, fontSize: 11 }}>{ev.text}</Tag>
              <Text strong style={{ fontSize: 13 }}>
                {l.display_name || l.line_user_id?.slice(0, 12) + '...'}
              </Text>
            </div>
            {l.department && <Text type="secondary" style={{ fontSize: 11 }}>{l.department}</Text>}
            {l.detail && <div style={{ fontSize: 11, color: '#6B8278', marginTop: 2 }}>{l.detail}</div>}
          </div>
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(l.created_at)}</Text>
        </div>
      </Card>
    );
  });
}

function AuditLogs({ logs }) {
  return logs.map(l => {
    const actionLabel = AUDIT_ACTION_LABELS[l.action] || l.action;
    let meta = null;
    try { meta = JSON.parse(l.meta_json || '{}'); } catch {}
    return (
      <Card key={l.id} size="small" style={logCardStyle} styles={{ body: { padding: 12 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tag color="purple" style={{ fontSize: 11, marginInlineEnd: 0 }}>{actionLabel}</Tag>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              by <Text strong>{l.actor_name || l.actor_line_user_id?.slice(0, 12) + '...'}</Text>
            </div>
            {l.target_id && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                target: {l.target_id.length > 30 ? l.target_id.slice(0, 30) + '...' : l.target_id}
              </Text>
            )}
            {meta && Object.keys(meta).length > 0 && (
              <div style={{ fontSize: 10, color: '#6B8278', marginTop: 2, fontFamily: 'monospace' }}>
                {Object.entries(meta).slice(0, 4).map(([k, v]) => `${k}=${String(v).slice(0, 30)}`).join(' · ')}
              </div>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(l.created_at)}</Text>
        </div>
      </Card>
    );
  });
}

function AccessLogs({ logs }) {
  return logs.map(l => (
    <Card key={l.id} size="small" style={logCardStyle} styles={{ body: { padding: 12 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12 }}>
            <Text strong>{l.display_name || l.line_user_id?.slice(0, 12) + '...'}</Text>
            <Text type="secondary"> เปิด </Text>
          </div>
          <div style={{ fontSize: 12, color: MINT_DARK, marginTop: 2 }}>
            {l.document_title || l.document_id}
            {l.page_number && (
              <Tag color={MINT_DARK} style={{ marginLeft: 6, fontSize: 10, color: '#fff', borderColor: MINT_DARK }}>
                หน้า {l.page_number}
              </Tag>
            )}
          </div>
          {l.department && <Text type="secondary" style={{ fontSize: 11 }}>{l.department}</Text>}
        </div>
        <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(l.created_at)}</Text>
      </div>
    </Card>
  ));
}

function fmt(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const pageHeaderStyle = {
  background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};
const pageTitleStyle = { margin: 0, fontSize: 22, fontWeight: 700, color: MINT_DARK };
const refreshBtnStyle = {
  background: MINT_SOFT, border: 'none', borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', color: MINT_DARK,
};
const cardStyle = {
  background: '#fff', borderRadius: 14, padding: 20,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};
const logCardStyle = {
  marginBottom: 8, borderRadius: 10,
  borderColor: 'rgba(31,77,63,0.08)', borderWidth: '0.5px',
};
