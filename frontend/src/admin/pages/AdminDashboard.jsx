/**
 * AdminDashboard — Admin console (Phase 17 + V2 pages)
 *
 * Stats summary + quick navigation to admin sub-pages
 * Uses adminToken auth (no LIFF)
 */
import { useEffect, useState } from 'react';
import { Tag, Spin, Badge, message } from 'antd';
import {
  UsergroupAddOutlined, FileTextOutlined,
  HistoryOutlined, RightOutlined, ReloadOutlined,
  TeamOutlined, EyeOutlined, LoginOutlined,
  BarChartOutlined, BellOutlined,
} from '@ant-design/icons';
import { getStats } from '../api/admin';

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';
const ACCENT_ORANGE = '#E8965B';

export default function AdminDashboard({ user, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const r = await getStats();
      setStats(r.stats);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const cards = [
    {
      key: 'users',
      icon: <UsergroupAddOutlined />,
      title: 'จัดการผู้ใช้',
      desc: 'อนุมัติ / ระงับ / ตั้งสิทธิ์ admin',
      badge: stats?.users?.pending || 0,
      onClick: () => onNavigate('users'),
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      title: 'จัดการเอกสาร',
      desc: 'แก้ไข / archive / restore / replace pages',
      onClick: () => onNavigate('documents'),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      title: 'Analytics',
      desc: 'สถิติการใช้งาน + charts',
      onClick: () => onNavigate('analytics'),
    },
    {
      key: 'logs',
      icon: <HistoryOutlined />,
      title: 'ดู Log',
      desc: 'Auth / Audit / Access logs · Export CSV',
      onClick: () => onNavigate('logs'),
    },
    {
      key: 'notif',
      icon: <BellOutlined />,
      title: 'การแจ้งเตือน',
      desc: 'ตั้งค่า LINE notifications',
      onClick: () => onNavigate('notif'),
    },
  ];

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>📊 Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: MINT_MUTED }}>
            ยินดีต้อนรับ <strong style={{ color: MINT_DARK }}>{user?.displayName}</strong>
            {user?.department ? ` · ${user.department}` : ''}
          </span>
          <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>
          <button onClick={loadStats} style={refreshBtnStyle} title="รีเฟรช">
            <ReloadOutlined spin={loading} />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>
      ) : stats ? (
        <div style={statsGridStyle}>
          <StatCard
            icon={<TeamOutlined />}
            label="ผู้ใช้"
            value={stats.users?.total ?? 0}
            accent={MINT_DARK}
            hint={stats.users?.pending > 0 ? `รออนุมัติ ${stats.users.pending}` : null}
            hintColor="#F59E0B"
          />
          <StatCard
            icon={<FileTextOutlined />}
            label="เอกสาร active"
            value={stats.documents?.active ?? 0}
            accent={MINT_MID}
            hint={stats.documents?.archived > 0 ? `archived ${stats.documents.archived}` : null}
          />
          <StatCard
            icon={<EyeOutlined />}
            label="เปิดเอกสารวันนี้"
            value={stats.today?.accesses ?? 0}
            accent={ACCENT_ORANGE}
            hint={<><LoginOutlined style={{ fontSize: 10, marginRight: 2 }} />{stats.today?.logins ?? 0} login</>}
          />
          <StatCard
            icon={<UsergroupAddOutlined />}
            label="ผู้ใช้ active"
            value={stats.users?.active ?? 0}
            accent={MINT_DARK}
            hint={stats.users?.disabled > 0 ? `ระงับ ${stats.users.disabled}` : null}
            hintColor="#EF4444"
          />
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <div style={sectionTitleStyle}>เมนูจัดการ</div>
        <div style={actionGridStyle}>
          {cards.map(c => (
            <div
              key={c.key}
              style={actionCardStyle}
              onClick={c.onClick}
              role="button"
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(31,77,63,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(31,77,63,0.06)'}
            >
              <div style={actionIconStyle}>
                {c.badge > 0 ? (
                  <Badge count={c.badge} offset={[-2, 2]}>
                    <span style={{ fontSize: 22, color: MINT_DARK }}>{c.icon}</span>
                  </Badge>
                ) : (
                  <span style={{ fontSize: 22, color: MINT_DARK }}>{c.icon}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={actionTitleStyle}>{c.title}</div>
                <div style={actionDescStyle}>{c.desc}</div>
              </div>
              <RightOutlined style={{ color: '#CBD5E1', fontSize: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, hint, hintColor = '#94A3B8' }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 12, color: MINT_MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: accent, fontSize: 14 }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: hintColor, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

const pageHeaderStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  marginBottom: 20,
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.06)',
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const pageTitleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: MINT_DARK,
  letterSpacing: '-0.3px',
};

const refreshBtnStyle = {
  background: MINT_SOFT,
  border: 'none',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  color: MINT_DARK,
  fontSize: 14,
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const statCardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 16,
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.04)',
};

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: MINT_DARK,
  marginBottom: 10,
};

const actionGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 12,
};

const actionCardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
  border: '0.5px solid rgba(31, 77, 63, 0.06)',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.06)',
  transition: 'box-shadow 0.15s',
};

const actionIconStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: MINT_SOFT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const actionTitleStyle = {
  fontWeight: 600,
  fontSize: 15,
  color: MINT_DARK,
};

const actionDescStyle = {
  fontSize: 12,
  color: MINT_MUTED,
  marginTop: 2,
};
