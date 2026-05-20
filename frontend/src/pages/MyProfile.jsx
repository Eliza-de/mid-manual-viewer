/**
 * MyProfile — self profile page (LIFF, PIN-gated)
 *
 * Shown when entering via the special URL `?view=member`. Reuses the same
 * AuthProvider so all auth gates run (register / pending / PIN). On
 * 'authenticated', renders this instead of Home.
 *
 * Read-only: shows profile + stats + change-PIN shortcut + edit shortcut.
 * Edit/PIN-change UIs piggyback the existing modals (EditProfileModal,
 * PinSetup). For now we show the values + provide buttons to open them.
 */

import { useEffect, useState } from 'react';
import { Card, Avatar, Tag, Button, Typography, Spin, Alert, Space, Divider, message } from 'antd';
import {
  UserOutlined, EditOutlined, LockOutlined, LogoutOutlined,
  CrownOutlined, BookOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.jsx';
import { getIdToken } from '../api/liff.js';
import { getMyProfile, updateProfile, clearSession } from '../api/auth.js';
import EditProfileModal from '../components/EditProfileModal.jsx';
import { COLORS } from '../brand.js';

const { Title, Text } = Typography;

function relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return '—';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} วินาทีที่แล้ว`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  return `${Math.floor(mo / 12)} ปีที่แล้ว`;
}

export default function MyProfile() {
  const auth = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await getMyProfile(getIdToken(), auth.session.token);
      if (!r.ok) {
        if (r.needsLogin) { auth.logout(); return; }
        setError(r.error || 'โหลดโปรไฟล์ไม่สำเร็จ');
        setLoading(false);
        return;
      }
      setProfile(r.profile);
      setStats(r.stats);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!auth.session) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.session?.token]);

  function handleLogout() {
    clearSession();
    auth.logout();
  }

  if (loading) {
    return (
      <div style={loadingBoxStyle}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <Alert type="error" showIcon message="โหลดโปรไฟล์ไม่สำเร็จ" description={error}
          style={{ borderRadius: 12 }} />
        <Button onClick={load} block style={{ marginTop: 12 }}>ลองใหม่</Button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header avatar + name */}
      <Card style={headerCardStyle} styles={{ body: { padding: 24 } }}>
        <div style={{ textAlign: 'center' }}>
          {profile.pictureUrl
            ? <Avatar src={profile.pictureUrl} size={100} />
            : <Avatar icon={<UserOutlined />} size={100} />}
          <Title level={4} style={{ margin: '12px 0 4px', color: COLORS.primary }}>
            {profile.fullName || profile.displayName}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {profile.nickname && `${profile.nickname} · `}
            <code style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 4 }}>
              {profile.loginCode || '—'}
            </code>
          </Text>
          {profile.department && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>แผนก: {profile.department}</Text>
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {profile.status === 'active' && <Tag color="green">✓ ใช้งานได้</Tag>}
            {profile.isAdmin && <Tag color="gold" icon={<CrownOutlined />}>Admin</Tag>}
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card title={<><LockOutlined /> ความปลอดภัย</>} style={sectionCardStyle}
        styles={{ body: { padding: 16 } }}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <div style={rowStyle}>
            <Text type="secondary">PIN เปลี่ยนล่าสุด</Text>
            <Text strong>{profile.pinChangedAt ? relTime(profile.pinChangedAt) : 'ไม่เคย'}</Text>
          </div>
          <div style={rowStyle}>
            <Text type="secondary">เข้าระบบล่าสุด</Text>
            <Text strong>{profile.lastLoginAt ? relTime(profile.lastLoginAt) : '—'}</Text>
          </div>
          <div style={rowStyle}>
            <Text type="secondary">สร้างบัญชี</Text>
            <Text strong>{relTime(profile.createdAt)}</Text>
          </div>
        </Space>
      </Card>

      {/* Activity */}
      <Card title={<><BookOutlined /> การใช้งาน</>} style={sectionCardStyle}
        styles={{ body: { padding: 16 } }}>
        <div style={rowStyle}>
          <Text type="secondary">เปิดดูเอกสารทั้งหมด</Text>
          <Text strong style={{ fontSize: 18, color: COLORS.primary }}>
            {stats?.totalViews ?? 0} ครั้ง
          </Text>
        </div>

        {stats?.topDocuments?.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              เอกสารที่อ่านบ่อย (30 วัน)
            </Text>
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              {stats.topDocuments.map((d, i) => (
                <div key={d.document_id || i} style={topDocRowStyle}>
                  <span style={topDocNumStyle}>{i + 1}.</span>
                  <Text ellipsis style={{ flex: 1 }}>{d.title || '(เอกสารถูกลบ)'}</Text>
                  <Tag color="green" style={{ marginInlineEnd: 0 }}>{d.views}</Tag>
                </div>
              ))}
            </Space>
          </>
        )}
      </Card>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
        <Button
          icon={<EditOutlined />}
          size="large"
          onClick={() => setEditOpen(true)}
          style={primaryActionStyle}
          block
        >
          แก้ไขข้อมูลของฉัน
        </Button>
        <Button
          icon={<LogoutOutlined />}
          size="large"
          danger
          onClick={handleLogout}
          block
          style={{ height: 48 }}
        >
          ออกจากระบบ
        </Button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <ClockCircleOutlined /> Session จะหมดอายุภายใน 30 นาที
        </Text>
      </div>

      <EditProfileModal
        open={editOpen}
        user={{
          displayName: profile.displayName,
          fullName: profile.fullName,
          nickname: profile.nickname,
          loginCode: profile.loginCode,
        }}
        onCancel={() => setEditOpen(false)}
        onSave={async (fields) => {
          const r = await updateProfile(getIdToken(), fields);
          if (!r.ok) {
            message.error(r.error || 'ไม่สำเร็จ');
            throw new Error(r.error || 'ไม่สำเร็จ');
          }
          message.success('บันทึกข้อมูลสำเร็จ');
          setEditOpen(false);
          load();
        }}
      />
    </div>
  );
}

const pageStyle = {
  padding: 12,
  maxWidth: 520,
  margin: '0 auto',
  paddingBottom: 24,
};

const loadingBoxStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: COLORS.bgSoft,
};

const headerCardStyle = {
  borderRadius: 16,
  marginBottom: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  background: 'linear-gradient(180deg, #F0F9F3 0%, #ffffff 60%)',
};

const sectionCardStyle = {
  borderRadius: 14,
  marginBottom: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
};

const topDocRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
};

const topDocNumStyle = {
  fontSize: 11,
  color: '#6B8278',
  fontWeight: 600,
  minWidth: 18,
};

const primaryActionStyle = {
  background: COLORS.primary,
  borderColor: COLORS.primary,
  color: 'white',
  height: 48,
  fontWeight: 500,
};
