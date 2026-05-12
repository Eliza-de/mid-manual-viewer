/**
 * LogViewer — V2 (Phase 10)
 * BUILD: 2026-05-12-V2-LOGVIEWER
 *
 * 3 tabs: auth / audit / access
 * CSV export for each tab
 * Pagination
 */
import { useEffect, useState } from 'react';
import { Tabs, Table, Button, message, Tag, Spin, Input } from 'antd';
import {
  HistoryOutlined, ReloadOutlined, DownloadOutlined,
  SearchOutlined, LoginOutlined, SettingOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import { getAuthLogs, getAuditLogs, getAccessLogs, exportLogsCSV } from '../api/adminV2.js';
import { COLORS, SHADOWS, RADIUS } from '../brandV2.js';
import PageHeader from '../components/PageHeader.jsx';

const PAGE_SIZE = 50;

function fmt(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleString('th-TH', { hour12: false });
}

export default function LogViewer() {
  if (typeof window !== 'undefined' && !window.__logviewer_v2_loaded) {
    console.log('%c[LogViewer V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__logviewer_v2_loaded = true;
  }

  const nav = useNavigation();
  const [tab, setTab] = useState('auth');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const opts = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      let data;
      if (tab === 'auth') data = await getAuthLogs(token, opts);
      if (tab === 'audit') data = await getAuditLogs(token, opts);
      if (tab === 'access') data = await getAccessLogs(token, opts);
      setRows(data?.logs || []);
      setTotal(data?.total || 0);
    } catch (e) {
      message.error('โหลด log ไม่สำเร็จ');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [tab, page]);

  async function doExport() {
    setExporting(true);
    try {
      const token = await getIdToken();
      const blob = await exportLogsCSV(token, tab);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab}-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('Export CSV สำเร็จ');
    } catch (e) {
      message.error('Export ไม่สำเร็จ');
    } finally { setExporting(false); }
  }

  // Columns per tab
  const authCols = [
    { title: 'เวลา', dataIndex: 'created_at', render: fmt, width: 160 },
    { title: 'ผู้ใช้', dataIndex: 'user_name' },
    { title: 'Event', dataIndex: 'event', render: e => {
      const colors = { login: 'green', logout: 'default', failed: 'red', pin_set: 'blue' };
      return <Tag color={colors[e] || 'default'}>{e}</Tag>;
    }},
    { title: 'IP', dataIndex: 'ip', width: 130 },
  ];
  const auditCols = [
    { title: 'เวลา', dataIndex: 'created_at', render: fmt, width: 160 },
    { title: 'Admin', dataIndex: 'admin_name' },
    { title: 'Action', dataIndex: 'action', render: a => <Tag color="orange">{a}</Tag> },
    { title: 'Target', dataIndex: 'target' },
    { title: 'Detail', dataIndex: 'detail', ellipsis: true },
  ];
  const accessCols = [
    { title: 'เวลา', dataIndex: 'created_at', render: fmt, width: 160 },
    { title: 'ผู้ใช้', dataIndex: 'user_name' },
    { title: 'เอกสาร', dataIndex: 'doc_title', ellipsis: true },
    { title: 'หน้า', dataIndex: 'page_no', width: 60 },
    { title: 'Device', dataIndex: 'device', width: 90 },
  ];

  const cols = tab === 'auth' ? authCols : tab === 'audit' ? auditCols : accessCols;

  // Client-side search filter
  const filtered = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return JSON.stringify(r).toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: 24 }}>
      <PageHeader
        title="Log Viewer"
        icon={<HistoryOutlined />}
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
        <Tabs
          activeKey={tab}
          onChange={k => { setTab(k); setPage(1); }}
          items={[
            { key: 'auth', label: <><LoginOutlined /> Auth</> },
            { key: 'audit', label: <><SettingOutlined /> Audit</> },
            { key: 'access', label: <><EyeOutlined /> Access</> },
          ]}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: COLORS.textMuted }} />}
            placeholder="ค้นหาใน log ปัจจุบัน"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, borderRadius: RADIUS.md }}
          />
          <Button
            type="primary" icon={<DownloadOutlined />}
            loading={exporting} onClick={doExport}
            style={{ background: COLORS.primaryDark }}
          >Export CSV</Button>
        </div>

        <div style={{
          background: COLORS.cardBg, borderRadius: RADIUS.md,
          padding: 4, boxShadow: SHADOWS.card,
        }}>
          <Table
            size="small"
            columns={cols}
            dataSource={filtered}
            rowKey={(r, i) => r.id || i}
            loading={loading}
            scroll={{ x: 600 }}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              onChange: setPage,
              showSizeChanger: false,
              showTotal: t => `ทั้งหมด ${t} รายการ`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
