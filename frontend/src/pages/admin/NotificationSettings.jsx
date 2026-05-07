/**
 * NotificationSettings — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-NOTIFICATIONS
 *
 * Changes from V1:
 *   - Mint gradient header (was solid mint)
 *   - Glass icon buttons in header
 *   - Cleaner card styling
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, Switch, Input, message, Typography, Alert, Space,
  Avatar, Spin, Modal, Tag
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, SendOutlined, BellOutlined,
  KeyOutlined, UserOutlined, SaveOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  getNotificationSettings, updateNotificationSettings,
  testNotification, getNotificationRecipients
} from '../../api/admin.js';
import { COLORS } from '../../brand.js';

const { Text } = Typography;

export default function NotificationSettings() {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__notif_v2_loaded) {
    console.log('%c[NotificationSettings V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__notif_v2_loaded = true;
  }

  const auth = useAuth();
  const nav = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [recipients, setRecipients] = useState([]);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenInputVisible, setTokenInputVisible] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  async function load() {
    if (!auth.session) return;
    setLoading(true);
    const idToken = getIdToken();
    const token = auth.session.token;
    try {
      const [s, r] = await Promise.all([
        getNotificationSettings(idToken, token),
        getNotificationRecipients(idToken, token)
      ]);
      if (s.ok) setSettings(s.settings);
      else if (s.needsLogin) auth.logout();
      if (r.ok) setRecipients(r.recipients);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveSettings(updates) {
    setSaving(true);
    try {
      const r = await updateNotificationSettings(getIdToken(), auth.session.token, updates);
      if (r.ok) {
        message.success('บันทึกสำเร็จ');
        await load();
        return true;
      }
      message.error(r.error || 'บันทึกไม่สำเร็จ');
      return false;
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(field, value) {
    await saveSettings({ [field]: value });
  }

  async function handleSaveToken() {
    if (!tokenInput.trim()) {
      message.warning('กรุณาใส่ token');
      return;
    }
    const ok = await saveSettings({ channel_token: tokenInput.trim() });
    if (ok) {
      setTokenInput('');
      setShowTokenInput(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const r = await testNotification(getIdToken(), auth.session.token);
      if (r.ok) {
        Modal.success({
          title: '✅ ส่งสำเร็จ',
          content: 'กรุณาเช็ค LINE ของคุณ — ควรได้รับข้อความทดสอบจาก Bot'
        });
      } else {
        Modal.error({
          title: '❌ ส่งไม่สำเร็จ',
          content: r.error || 'เกิดข้อผิดพลาด'
        });
      }
    } catch (err) {
      message.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setTesting(false);
    }
  }

  if (loading && !settings) {
    return (
      <div style={pageStyle}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const isEnabled = settings?.enabled || false;
  const tokenSet = settings?.channel_token_set || false;

  return (
    <div style={pageStyle}>
      {/* Mint gradient header */}
      <div style={topBarStyle}>
        <div style={iconBtnStyle} onClick={() => nav.goAdminPage('dashboard')} role="button">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>
        <div style={titleStyle}>การแจ้งเตือน</div>
        <div style={iconBtnStyle} onClick={load} role="button">
          <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
        </div>
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Setup notice */}
          {settings && !tokenSet && (
            <Alert
              type="warning"
              showIcon
              icon={<InfoCircleOutlined />}
              message="ยังไม่ได้ตั้งค่า"
              description={
                <div style={{ fontSize: 12 }}>
                  <p style={{ margin: 0 }}>การใช้ LINE Notifications ต้อง:</p>
                  <ol style={{ paddingLeft: 18, marginTop: 4, marginBottom: 4 }}>
                    <li>สร้าง Messaging API channel ใน LINE Developers Console</li>
                    <li>คัดลอก Channel access token (long-lived)</li>
                    <li>วางใน "Channel Token" ด้านล่าง</li>
                    <li>เพิ่ม Bot เป็นเพื่อนใน LINE</li>
                    <li>กดปุ่มทดสอบ</li>
                  </ol>
                </div>
              }
              style={{ marginBottom: 12, borderRadius: 12 }}
            />
          )}

          {/* Master Switch */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 15, color: COLORS.primary }}>
                  <BellOutlined /> เปิด/ปิดการแจ้งเตือน
                </Text>
                <div style={{ fontSize: 11, color: '#6B8278', marginTop: 2 }}>
                  ส่งแจ้งเตือนผ่าน LINE ไปยัง admin ทั้งหมด
                </div>
              </div>
              <Switch
                checked={isEnabled}
                disabled={saving || !tokenSet}
                onChange={(v) => handleToggle('enabled', v)}
                style={isEnabled ? { background: COLORS.primary } : {}}
              />
            </div>
          </div>

          {/* Channel Token */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <KeyOutlined style={{ marginRight: 6 }} /> Channel Access Token
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>สถานะ:</Text>
              {tokenSet ? (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>✓ ตั้งค่าแล้ว</Tag>
              ) : (
                <Tag color="orange" style={{ marginInlineEnd: 0 }}>ยังไม่ได้ตั้งค่า</Tag>
              )}
            </div>

            {!showTokenInput ? (
              <Button
                size="middle"
                icon={<KeyOutlined />}
                onClick={() => setShowTokenInput(true)}
                block
                style={{ borderRadius: 10 }}
              >
                {tokenSet ? 'เปลี่ยน Token' : 'ตั้งค่า Token'}
              </Button>
            ) : (
              <Space.Compact style={{ width: '100%' }}>
                <Input.Password
                  placeholder="paste token here..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  visibilityToggle={{
                    visible: tokenInputVisible,
                    onVisibleChange: setTokenInputVisible
                  }}
                />
                <Button onClick={() => { setTokenInput(''); setShowTokenInput(false); }} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveToken}
                  loading={saving}
                  disabled={!tokenInput.trim()}
                  style={tokenInput.trim() ? primaryBtnStyle : disabledBtnStyle}
                >
                  บันทึก
                </Button>
              </Space.Compact>
            )}

            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 10, lineHeight: 1.5 }}>
              💡 หา Token ใน LINE Developers → Provider → Channel (Messaging API) → Messaging API tab → Channel access token
            </div>
          </div>

          {/* Event toggles */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>เหตุการณ์ที่จะแจ้งเตือน</div>

            <EventToggle
              icon="🔔"
              title="ผู้ใช้ใหม่รออนุมัติ"
              desc="เมื่อมี user สมัครใหม่"
              checked={settings?.notify_on_register || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_register', v)}
            />
            <EventToggle
              icon="🔒"
              title="ผู้ใช้ถูก lock"
              desc="เมื่อ user ใส่ PIN ผิดเกินกำหนด"
              checked={settings?.notify_on_locked || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_locked', v)}
              divider
            />
            <EventToggle
              icon="👤"
              title="Admin actions (ผู้ใช้)"
              desc="อนุมัติ / ระงับ / เปิดใช้ / Reset PIN / สิทธิ์ admin"
              checked={settings?.notify_on_user_actions || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_user_actions', v)}
              divider
            />
            <EventToggle
              icon="📄"
              title="Admin actions (เอกสาร)"
              desc="เพิ่ม / แก้ไข / archive / restore / replace pages"
              checked={settings?.notify_on_document_actions || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_document_actions', v)}
              divider
            />
          </div>

          {/* Test button */}
          <div style={cardStyle}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTest}
              loading={testing}
              disabled={!tokenSet}
              block
              size="large"
              style={tokenSet ? primaryBtnStyle : disabledBtnStyle}
            >
              ทดสอบส่งข้อความ
            </Button>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
              ส่งข้อความทดสอบไปยังคุณเอง (ต้องเพิ่ม Bot เป็นเพื่อนก่อน)
            </div>
          </div>

          {/* Recipients */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>
              <UserOutlined style={{ marginRight: 6 }} />
              ผู้รับการแจ้งเตือน ({recipients.length} คน)
            </div>
            {recipients.length === 0 ? (
              <Text type="secondary">ไม่มี admin ที่ active</Text>
            ) : (
              recipients.map((r, i) => (
                <div key={r.line_user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < recipients.length - 1 ? '0.5px solid #f0f0f0' : 'none'
                }}>
                  <Avatar icon={<UserOutlined />} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {r.nickname || r.full_name || r.display_name}
                    </Text>
                    {r.last_login_at && (
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>
                        last login: {new Date(r.last_login_at).toLocaleString('th-TH', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                  <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>
                </div>
              ))
            )}
            <div style={{ fontSize: 11, color: '#6B8278', marginTop: 10, lineHeight: 1.6 }}>
              📌 admin ทุกคนต้องเพิ่ม Bot เป็นเพื่อนใน LINE ถึงจะได้รับการแจ้งเตือน
              <br />
              💡 ผู้ทำ action จะไม่ได้รับ notification ของตัวเอง
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Event toggle row
function EventToggle({ icon, title, desc, checked, disabled, onChange, divider }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderTop: divider ? '0.5px solid #f0f0f0' : 'none'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, color: '#1F2937' }}>
          {icon} {title}
        </Text>
        <div style={{ fontSize: 11, color: '#6B8278', marginTop: 2 }}>{desc}</div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={checked ? { background: COLORS.primary } : {}}
      />
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
  flexShrink: 0
};

const titleStyle = {
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  flex: 1,
  textAlign: 'center'
};

const contentStyle = {
  padding: 12,
  flex: 1,
  overflowY: 'auto'
};

const cardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '14px 16px',
  marginBottom: 12,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)'
};

const cardTitleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.primary,
  marginBottom: 10
};

// Primary button = strong green with WHITE text
const primaryBtnStyle = {
  background: COLORS.primary,
  borderColor: COLORS.primary,
  color: 'white',
  fontWeight: 500
};

// Disabled button = LIGHT gray (text visible!)
const disabledBtnStyle = {
  background: '#E5E7EB',
  borderColor: '#E5E7EB',
  color: '#9CA3AF',
  fontWeight: 500
};
