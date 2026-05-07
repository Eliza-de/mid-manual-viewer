/**
 * LogViewer — view auth/audit/access logs (Phase 7 + Phase 10 export)
 */

import { useEffect, useState } from 'react';
import { Card, Button, Tabs, Tag, message, Typography, Empty, Spin, Pagination } from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined,
  KeyOutlined, CrownOutlined, EyeOutlined, DownloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import { getAuthLogs, getAuditLogs, getAccessLogs } from '../../api/admin.js';
import ExportLogsModal from '../../components/ExportLogsModal.jsx';
import { COLORS } from '../../brand.js';

const { Text } = Typography;
const PAGE_SIZE = 25;

const AUTH_EVENT_LABELS = {
  register: { color: 'blue', text: 'ลงทะเบียน' },
  pin_set: { color: 'cyan', text: 'ตั้ง PIN' },
  login_success: { color: 'green', text: 'เข้าระบบ' },
  login_fail: { color: 'orange', text: 'PIN ผิด' },
  locked: { color: 'red', text: 'ถูก lock' }
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
  admin_export_logs: 'Export Logs'
};

export default function LogViewer() {
  const auth = useAuth();
  const nav = useNavigation();
  const [tab, setTab] = useState('auth');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  async function load(pageNumber = 1) {
    if (!auth.session) return;
    setLoading(true);
    try {
      const idToken = getIdToken();
      const offset = (pageNumber - 1) * PAGE_SIZE;
      let r;
      if (tab === 'auth') r = await getAuthLogs(idToken, auth.session.token, { limit: PAGE_SIZE, offset });
      else if (tab === 'audit') r = await getAuditLogs(idToken, auth.session.token, { limit: PAGE_SIZE, offset });
      else r = await getAccessLogs(idToken, auth.session.token, { limit: PAGE_SIZE, offset });

      if (r.ok) setLogs(r.logs);
      else if (r.needsLogin) auth.logout();
      else message.error(r.error || 'โหลด log ไม่สำเร็จ');
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [tab]);

  function changePage(p) { setPage(p); load(p); }

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>ดู Log</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="text" icon={<DownloadOutlined />} onClick={() => setExportOpen(true)}
            style={{ color: '#fff' }} title="Export CSV" />
          <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={() => load(page)}
            style={{ color: '#fff' }} />
        </div>
      </div>

      <Tabs activeKey={tab} onChange={setTab} centered style={{ background: '#fff' }}
        items={[
          { key: 'auth', label: <span><KeyOutlined /> Auth</span> },
          { key: 'audit', label: <span><CrownOutlined /> Audit</span> },
          { key: 'access', label: <span><EyeOutlined /> Access</span> }
        ]}
      />

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : logs.length === 0 ? (
            <Empty description="ไม่มีข้อมูล" style={{ marginTop: 40 }} />
          ) : (
            <>
              {tab === 'auth' && <AuthLogs logs={logs} />}
              {tab === 'audit' && <AuditLogs logs={logs} />}
              {tab === 'access' && <AccessLogs logs={logs} />}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination current={page} pageSize={PAGE_SIZE}
                  total={logs.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : page * PAGE_SIZE}
                  showSizeChanger={false} size="small" onChange={changePage} />
              </div>
            </>
          )}
        </div>
      </div>

      <ExportLogsModal
        open={exportOpen}
        type={tab}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}

function AuthLogs({ logs }) {
  return logs.map(l => {
    const eventInfo = AUTH_EVENT_LABELS[l.event] || { color: 'default', text: l.event };
    return (
      <Card size="small" key={l.id} style={{ marginBottom: 6 }} styles={{ body: { padding: 10 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Tag color={eventInfo.color} style={{ marginInlineEnd: 0, fontSize: 10 }}>{eventInfo.text}</Tag>
              <Text strong style={{ fontSize: 13 }}>
                {l.display_name || l.line_user_id?.slice(0, 12) + '...'}
              </Text>
            </div>
            {l.department && <Text type="secondary" style={{ fontSize: 11 }}>{l.department}</Text>}
            {l.detail && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{l.detail}</div>}
          </div>
          <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
            {new Date(l.created_at).toLocaleString('th-TH', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
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
      <Card size="small" key={l.id} style={{ marginBottom: 6 }} styles={{ body: { padding: 10 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tag color="purple" style={{ fontSize: 10, marginInlineEnd: 0 }}>{actionLabel}</Tag>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              by <Text strong>{l.actor_name || l.actor_line_user_id?.slice(0, 12) + '...'}</Text>
            </div>
            {l.target_id && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                target: {l.target_id.length > 20 ? l.target_id.slice(0, 20) + '...' : l.target_id}
              </Text>
            )}
            {meta && Object.keys(meta).length > 0 && (
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                {Object.entries(meta).slice(0, 3).map(([k, v]) =>
                  `${k}=${String(v).slice(0, 30)}`
                ).join(' · ')}
              </div>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
            {new Date(l.created_at).toLocaleString('th-TH', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </div>
      </Card>
    );
  });
}

function AccessLogs({ logs }) {
  return logs.map(l => (
    <Card size="small" key={l.id} style={{ marginBottom: 6 }} styles={{ body: { padding: 10 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12 }}>
            <Text strong>{l.display_name || l.line_user_id?.slice(0, 12) + '...'}</Text>
            <Text type="secondary"> เปิด </Text>
          </div>
          <div style={{ fontSize: 11, color: COLORS.primary, marginTop: 2 }}>
            {l.document_title || l.document_id}
            {l.page_number && (
              <Tag color={COLORS.primary} style={{ marginLeft: 6, fontSize: 10, color: '#fff', borderColor: COLORS.primary }}>
                หน้า {l.page_number}
              </Tag>
            )}
          </div>
          {l.department && <Text type="secondary" style={{ fontSize: 10 }}>{l.department}</Text>}
        </div>
        <Text type="secondary" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
          {new Date(l.created_at).toLocaleString('th-TH', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </div>
    </Card>
  ));
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
