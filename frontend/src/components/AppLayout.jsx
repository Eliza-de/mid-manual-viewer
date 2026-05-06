/**
 * AppLayout — main layout with header + tabs (rebranded)
 */

import { Layout, Avatar, Dropdown, Tag } from 'antd';
import { TabBar } from 'antd-mobile';
import {
  UserOutlined, LogoutOutlined,
  BookOutlined, FileTextOutlined, UnorderedListOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { BRAND, COLORS } from '../brand.js';

const { Header, Content, Footer } = Layout;

export default function AppLayout({ category, onCategoryChange, children }) {
  const auth = useAuth();
  const nav = useNavigation();

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
    { key: 'full_book', icon: <BookOutlined />, title: 'เต็มเล่ม' },
    { key: 'topic', icon: <FileTextOutlined />, title: 'เรื่อง' },
    { key: 'summary', icon: <UnorderedListOutlined />, title: 'สรุป' }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: COLORS.bgSoft }}>
      <Header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={logoStyle}>
            <span style={{ fontSize: 16 }}>📖</span>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.primary, fontSize: 15, lineHeight: 1.2 }}>
              {BRAND.appName}
            </div>
            <div style={{ fontSize: 10, color: COLORS.primaryLight, lineHeight: 1.2 }}>
              {BRAND.appTagline}
            </div>
          </div>
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div style={{ cursor: 'pointer' }}>
            {auth.profile?.pictureUrl
              ? <Avatar src={auth.profile.pictureUrl} size={32} />
              : <Avatar icon={<UserOutlined />} size={32} />}
          </div>
        </Dropdown>
      </Header>

      <Content style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {children}
        </div>
      </Content>

      <Footer style={footerStyle}>
        <TabBar activeKey={category} onChange={onCategoryChange} safeArea>
          {tabs.map(t => (
            <TabBar.Item key={t.key} icon={t.icon} title={t.title} />
          ))}
        </TabBar>
      </Footer>
    </Layout>
  );
}

const headerStyle = {
  background: '#ffffff',
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 56,
  lineHeight: 'initial',
  borderBottom: `1px solid ${COLORS.brandLight}`,
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const logoStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: COLORS.brand,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle = {
  padding: '16px',
  flex: 1,
  overflowY: 'auto',
  paddingBottom: 80
};

const footerStyle = {
  padding: 0,
  background: '#ffffff',
  borderTop: `1px solid ${COLORS.brandLight}`,
  position: 'sticky',
  bottom: 0,
  zIndex: 10
};
