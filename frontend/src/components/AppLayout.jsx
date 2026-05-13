/**
 * AppLayout — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-APPLAYOUT
 *
 * Changes from V1:
 *   - Header: mint gradient with white text
 *   - Top tabs (replaces bottom TabBar) — pill style with count
 *   - Cleaner spacing
 */

import { useState } from 'react';
import { Layout, Avatar, Dropdown, Tag, Badge, message } from 'antd';
import {
  UserOutlined, LogoutOutlined, EditOutlined,
  BookOutlined, FileTextOutlined, UnorderedListOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import { updateProfile } from '../api/auth.js';
import { BRAND, COLORS } from '../brand.js';
import EditProfileModal from './EditProfileModal.jsx';

const { Header, Content } = Layout;

export default function AppLayout({ category, onCategoryChange, children }) {
  // ⚡ V2 marker
  if (typeof window !== 'undefined' && !window.__applayout_v2_loaded) {
    console.log('%c[AppLayout V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__applayout_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleSaveProfile(fields) {
    const r = await updateProfile(getIdToken(), fields);
    if (r.ok) {
      message.success('บันทึกข้อมูลสำเร็จ');
      setProfileOpen(false);
      if (auth.refresh) await auth.refresh();
    } else {
      message.error(r.error || 'ไม่สำเร็จ');
      throw new Error(r.error || 'ไม่สำเร็จ');
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 8px' }}>
          <div style={{ fontWeight: 600 }}>{auth.user?.displayName}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {auth.user?.department}
            {auth.user?.isAdmin && (
              <Tag color="gold" style={{ marginLeft: 6 }}>Admin</Tag>
            )}
          </div>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    {
      key: 'editProfile',
      icon: <EditOutlined />,
      label: 'แก้ไขโปรไฟล์',
      onClick: () => setProfileOpen(true)
    },
    { type: 'divider' },
    ...(auth.user?.isAdmin ? [{
      key: 'admin',
      icon: <SafetyCertificateOutlined />,
      label: 'จัดการระบบ (Admin)',
      onClick: nav.openAdmin
    }, { type: 'divider' }] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      danger: true,
      onClick: auth.logout
    }
  ];

  const tabs = [
    { key: 'full_book', icon: <BookOutlined />, title: 'เล่ม' },
    { key: 'topic', icon: <FileTextOutlined />, title: 'บท' },
    { key: 'summary', icon: <UnorderedListOutlined />, title: 'รีวิว' }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: COLORS.bgSoft }}>
      {/* Mint gradient header */}
      <Header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={logoStyle}>
            <BookOutlined style={{ color: 'white', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'white', fontSize: 16, lineHeight: 1.2 }}>
              {BRAND.appName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.2, marginTop: 2 }}>
              {BRAND.appTagline || 'By Med-healthup'}
            </div>
          </div>
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div style={{ cursor: 'pointer', position: 'relative' }}>
            {auth.profile?.pictureUrl ? (
              <Avatar
                src={auth.profile.pictureUrl}
                size={36}
                style={{ border: '2px solid rgba(255,255,255,0.4)' }}
              />
            ) : (
              <Avatar icon={<UserOutlined />} size={36} style={{ background: 'rgba(255,255,255,0.2)' }} />
            )}
            {auth.user?.isAdmin && (
              <div style={adminDotStyle} />
            )}
          </div>
        </Dropdown>
      </Header>

      {/* Top Tabs */}
      <div style={tabBarStyle}>
        {tabs.map(t => {
          const isActive = category === t.key;
          return (
            <div
              key={t.key}
              onClick={() => onCategoryChange(t.key)}
              style={{
                ...tabItemStyle,
                ...(isActive ? tabItemActiveStyle : {})
              }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 500 }}>{t.title}</span>
            </div>
          );
        })}
      </div>

      <Content style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {children}
        </div>
      </Content>

      <EditProfileModal
        open={profileOpen}
        user={auth.user}
        onCancel={() => setProfileOpen(false)}
        onSave={handleSaveProfile}
      />
    </Layout>
  );
}

const headerStyle = {
  background: `linear-gradient(135deg, #5DBFA0 0%, ${COLORS.primary} 100%)`,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 64,
  lineHeight: 'initial',
  position: 'sticky',
  top: 0,
  zIndex: 10,
  boxShadow: '0 2px 8px rgba(31,77,63,0.12)'
};

const logoStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(8px)'
};

const adminDotStyle = {
  position: 'absolute',
  top: -2,
  right: -2,
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#E8965B',
  border: '2px solid white'
};

const tabBarStyle = {
  display: 'flex',
  gap: 6,
  padding: '12px 16px',
  background: COLORS.bgSoft,
  position: 'sticky',
  top: 64,
  zIndex: 9
};

const tabItemStyle = {
  flex: 1,
  padding: '10px 8px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.6)',
  color: '#6B8278',
  textAlign: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  transition: 'all 0.2s',
  border: '0.5px solid rgba(31,77,63,0.05)'
};

const tabItemActiveStyle = {
  background: 'white',
  color: COLORS.primary,
  boxShadow: '0 2px 8px rgba(31,77,63,0.1)',
  border: '0.5px solid rgba(31,77,63,0.1)'
};

const contentStyle = {
  padding: '8px 16px 24px',
  flex: 1,
  overflowY: 'auto'
};
