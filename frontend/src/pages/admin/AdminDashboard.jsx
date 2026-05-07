/**
 * AdminDashboard — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-ADMIN
 *
 * Changes from V1:
 *   - Mint gradient header (was solid mint)
 *   - Welcome card: cleaner layout
 *   - Stats cards: equal sizes, unified mint colors
 *   - Action items: unified icon style
 */

import { useEffect, useState } from 'react';
import { Tag, Spin, Badge, message } from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, UsergroupAddOutlined,
  FileTextOutlined, HistoryOutlined, RightOutlined,
  ReloadOutlined, TeamOutlined, EyeOutlined, LoginOutlined,
  BarChartOutlined, BellOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import { getStats } from '../../api/admin.js';
import { COLORS } from '../../brand.js';

export default function AdminDashboard() {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__admin_v2_loaded) {
    console.log('%c[AdminDashboard V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__admin_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    if (!auth.session) return;
    setLoading(true);
    try {
      const idToken = getIdToken();
      const r = await getStats(idToken, auth.session.token);
      if (r.ok) setStats(r.stats);
      else if (r.needsLogin) auth.logout();
      else message.error(r.error || 'โหลดข้อมูลไม่สำเร็จ');
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const cards = [
    {
      key: 'upload',
      icon: <PlusOutlined />,
      title: 'เพิ่มเอกสารใหม่',
      desc: 'อัปโหลด PNG เข้าระบบ',
      onClick: () => nav.goAdminPage('upload')
    },
    {
      key: 'users',
      icon: <UsergroupAddOutlined />,
      title: 'จัดการผู้ใช้',
      desc: 'อนุมัติ / ระงับ / ตั้งสิทธิ์ admin',
      badge: stats?.users?.pending || 0,
      onClick: () => nav.goAdminPage('users')
    },
    {
      key: 'docs',
      icon: <FileTextOutlined />,
      title: 'จัดการเอกสาร',
      desc: 'แก้ไข / archive / restore',
      onClick: () => nav.goAdminPage('docs')
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      title: 'Analytics',
      desc: 'สถิติการใช้งาน + charts',
      onClick: () => nav.goAdminPage('analytics')
    },
    {
      key: 'logs',
      icon: <HistoryOutlined />,
      title: 'ดู Log',
      desc: 'Auth / Audit / Access logs · Export CSV',
      onClick: () => nav.goAdminPage('logs')
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      title: 'การแจ้งเตือน',
      desc: 'ตั้งค่า LINE notifications',
      onClick: () => nav.goAdminPage('notifications')
    }
  ];

  return (
    <div style={pageStyle}>
      {/* Mint gradient header */}
      <div style={topBarStyle}>
        <div style={iconBtnStyle} onClick={nav.closeAdmin} role="button" aria-label="กลับ">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>
        <div style={titleStyle}>
          <SafetyCertificateOutlined style={{ marginRight: 8, fontSize: 18 }} />
          Admin Dashboard
        </div>
        <div style={iconBtnStyle} onClick={loadStats} role="button" aria-label="รีเฟรช">
          <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
        </div>
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Welcome card */}
          <div style={welcomeCardStyle}>
            <div style={{ fontSize: 11, color: '#6B8278', marginBottom: 4 }}>ยินดีต้อนรับ</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: COLORS.primary }}>
                {auth.user?.displayName}
              </div>
              <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>
            </div>
            <div style={{ fontSize: 12, color: '#6B8278', marginTop: 2 }}>
              {auth.user?.nickname || auth.user?.fullName || auth.user?.department}
            </div>
          </div>

          {/* Stats — 3 equal cards */}
          {loading && !stats ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : stats ? (
            <div style={statsGridStyle}>
              <StatCard
                icon={<TeamOutlined />}
                label="ผู้ใช้"
                value={stats.users.total}
                accent={COLORS.primary}
                hint={stats.users.pending > 0 ? `รออนุมัติ ${stats.users.pending}` : null}
                hintColor="#F59E0B"
              />
              <StatCard
                icon={<FileTextOutlined />}
                label="เอกสาร"
                value={stats.documents.active}
                accent="#5DBFA0"
                hint={stats.documents.archived > 0 ? `archived ${stats.documents.archived}` : null}
              />
              <StatCard
                icon={<EyeOutlined />}
                label="เปิดวันนี้"
                value={stats.today.accesses}
                accent="#E8965B"
                hint={<><LoginOutlined style={{ fontSize: 9, marginRight: 2 }} />{stats.today.logins} login</>}
              />
            </div>
          ) : null}

          {/* Action items */}
          <div style={{ marginTop: 8 }}>
            {cards.map(c => (
              <div
                key={c.key}
                style={actionCardStyle}
                onClick={c.onClick}
                role="button"
              >
                <div style={actionIconStyle}>
                  {c.badge > 0 ? (
                    <Badge count={c.badge} offset={[-2, 2]}>
                      <span style={{ fontSize: 20, color: COLORS.primary }}>{c.icon}</span>
                    </Badge>
                  ) : (
                    <span style={{ fontSize: 20, color: COLORS.primary }}>{c.icon}</span>
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
    </div>
  );
}

// Stats sub-component
function StatCard({ icon, label, value, accent, hint, hintColor = '#94A3B8' }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 11, color: '#6B8278', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: accent, fontSize: 13 }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 10, color: hintColor, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ===== Styles =====

const pageStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: COLORS.bgSoft,
  zIndex: 100
};

const topBarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 14px',
  background: `linear-gradient(135deg, #5DBFA0 0%, ${COLORS.primary} 100%)`,
  height: 56,
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(31,77,63,0.12)'
};

const iconBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.18)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.15s'
};

const titleStyle = {
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  flex: 1,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle = {
  padding: '12px 14px',
  flex: 1,
  overflowY: 'auto'
};

const welcomeCardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '14px 16px',
  marginBottom: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  marginBottom: 12
};

const statCardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '12px 10px',
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const actionCardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '14px 14px',
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
  border: '0.5px solid rgba(31,77,63,0.06)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
  transition: 'all 0.15s'
};

const actionIconStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: '#DCEEE3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const actionTitleStyle = {
  fontWeight: 600,
  fontSize: 15,
  color: COLORS.primary
};

const actionDescStyle = {
  fontSize: 11,
  color: '#6B8278',
  marginTop: 2
};
