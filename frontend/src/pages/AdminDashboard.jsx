/**
 * AdminDashboard — V2
 * BUILD: 2026-05-12-V2-ADMIN-DASHBOARD
 *
 * Stats summary + quick navigation to admin sub-pages
 */
import { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import {
  PlusOutlined, UsergroupAddOutlined, FileTextOutlined,
  HistoryOutlined, RightOutlined, ReloadOutlined,
  TeamOutlined, EyeOutlined, LoginOutlined,
  BarChartOutlined, BellOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import { getStats } from '../api/admin.js';
import { COLORS, SHADOWS, RADIUS } from '../brand.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';

export default function AdminDashboard() {
  if (typeof window !== 'undefined' && !window.__admin_v2_loaded) {
    console.log('%c[AdminDashboard V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__admin_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await getStats(token);
      setStats(data);
    } catch (e) {
      message.error('โหลดข้อมูลไม่สำเร็จ');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const actions = [
    {
      key: 'upload',
      icon: <PlusOutlined />,
      title: 'เพิ่มเอกสารใหม่',
      desc: 'อัปโหลด PNG เข้าระบบ',
      onClick: () => nav.goTo('admin-upload'),
    },
    {
      key: 'users',
      icon: <UsergroupAddOutlined />,
      title: 'จัดการผู้ใช้',
      desc: 'อนุมัติ / ระงับ / ตั้งสิทธิ์ admin',
      onClick: () => nav.goTo('admin-users'),
    },
    {
      key: 'docs',
      icon: <FileTextOutlined />,
      title: 'จัดการเอกสาร',
      desc: 'แก้ไข / archive / restore',
      onClick: () => nav.goTo('admin-docs'),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      title: 'Analytics',
      desc: 'สถิติการใช้งาน + charts',
      onClick: () => nav.goTo('admin-analytics'),
    },
    {
      key: 'logs',
      icon: <HistoryOutlined />,
      title: 'ดู Log',
      desc: 'Auth / Audit / Access logs · Export CSV',
      onClick: () => nav.goTo('admin-logs'),
    },
    {
      key: 'notify',
      icon: <BellOutlined />,
      title: 'การแจ้งเตือน',
      desc: 'ตั้งค่า LINE notifications',
      onClick: () => nav.goTo('admin-notify'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: 40 }}>
      <PageHeader
        title="Admin Dashboard"
        icon={<SafetyCertificateOutlined />}
        onBack={() => nav.goTo('home')}
        rightAction={
          <button
            onClick={load}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              borderRadius: 10,
              width: 38,
              height: 38,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <ReloadOutlined spin={loading} />
          </button>
        }
      />

      <div style={{ padding: 14 }}>
        {/* Welcome Card */}
        <div
          style={{
            background: COLORS.cardBg,
            borderRadius: RADIUS.lg,
            padding: 16,
            boxShadow: SHADOWS.card,
            marginBottom: 14,
          }}
        >
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>ยินดีต้อนรับ</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 2px',
          }}>
            <h2 style={{
              margin: 0, color: COLORS.primaryDark, fontSize: 22, fontWeight: 700,
            }}>
              {auth?.user?.name || 'Admin'}
            </h2>
            <span style={{
              background: '#FEF3C7', color: '#92400E', padding: '2px 10px',
              borderRadius: 999, fontSize: 12, fontWeight: 600,
            }}>Admin</span>
          </div>
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>
            {auth?.user?.dept || 'IT'}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <StatCard
            icon={<TeamOutlined />}
            label="ผู้ใช้"
            value={loading ? <Spin size="small" /> : (stats?.users_total ?? '–')}
            color={COLORS.primaryDark}
          />
          <StatCard
            icon={<FileTextOutlined />}
            label="เอกสาร"
            value={loading ? <Spin size="small" /> : (stats?.docs_active ?? '–')}
            subtext={`archived ${stats?.docs_archived ?? 0}`}
            color={COLORS.primaryMid}
          />
          <StatCard
            icon={<EyeOutlined />}
            label="เปิดวันนี้"
            value={loading ? <Spin size="small" /> : (stats?.opens_today ?? '–')}
            subtext={<><LoginOutlined /> {stats?.logins_today ?? 0} login</>}
            color={COLORS.accent}
          />
        </div>

        {/* Action Items */}
        {actions.map(a => (
          <button
            key={a.key}
            onClick={a.onClick}
            style={{
              width: '100%',
              background: COLORS.cardBg,
              borderRadius: RADIUS.lg,
              padding: '14px 14px',
              boxShadow: SHADOWS.card,
              border: `1px solid ${COLORS.borderLight}`,
              marginBottom: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = SHADOWS.cardHover}
            onMouseLeave={e => e.currentTarget.style.boxShadow = SHADOWS.card}
          >
            <div style={{
              background: COLORS.primaryLight,
              color: COLORS.primaryDark,
              width: 44, height: 44,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: COLORS.primaryDark, fontSize: 16, fontWeight: 700,
              }}>{a.title}</div>
              <div style={{
                color: COLORS.textMuted, fontSize: 13, marginTop: 2,
              }}>{a.desc}</div>
            </div>
            <RightOutlined style={{ color: COLORS.textMuted }} />
          </button>
        ))}
      </div>
    </div>
  );
}
