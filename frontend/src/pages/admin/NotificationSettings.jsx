/**
 * NotificationSettings — Phase 14
 *
 * Admin can configure LINE notifications:
 *   - Master enable/disable
 *   - Channel access token (write-only)
 *   - Per-event toggles (notify_on_register, notify_on_locked)
 *   - Test send
 *   - View recipient list
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, Switch, Input, Form, message, Typography, Alert, Space,
  Avatar, Spin, Modal, Tag
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, SendOutlined, BellOutlined,
  KeyOutlined, UserOutlined, SaveOutlined, EyeInvisibleOutlined, EyeOutlined,
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

const { Text, Title, Paragraph } = Typography;

export default function NotificationSettings() {
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

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>การแจ้งเตือน</div>
        <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={load}
          style={{ color: '#fff' }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Setup Notice */}
          {settings && !settings.channel_token_set && (
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
              style={{ marginBottom: 12 }}
            />
          )}

          {/* Master Switch */}
          <Card size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  <BellOutlined /> เปิด/ปิดการแจ้งเตือน
                </Text>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  ส่งแจ้งเตือนผ่าน LINE ไปยัง admin ทั้งหมด
                </div>
              </div>
              <Switch
                checked={settings?.enabled || false}
                disabled={saving || !settings?.channel_token_set}
                onChange={(v) => handleToggle('enabled', v)}
                style={settings?.enabled ? { background: COLORS.primary } : {}}
              />
            </div>
          </Card>

          {/* Channel Token */}
          <Card size="small" style={{ marginBottom: 12 }} title={
            <span style={{ fontSize: 13 }}><KeyOutlined /> Channel Access Token</span>
          }>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                สถานะ:
              </Text>
              {settings?.channel_token_set ? (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>✓ ตั้งค่าแล้ว</Tag>
              ) : (
                <Tag color="orange" style={{ marginInlineEnd: 0 }}>ยังไม่ได้ตั้งค่า</Tag>
              )}
            </div>

            {!showTokenInput ? (
              <Button
                size="small"
                icon={<KeyOutlined />}
                onClick={() => setShowTokenInput(true)}
                block
              >
                {settings?.channel_token_set ? 'เปลี่ยน Token' : 'ตั้งค่า Token'}
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
                  style={{ background: COLORS.primary, borderColor: COLORS.primary }}
                >
                  บันทึก
                </Button>
              </Space.Compact>
            )}

            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
              💡 หา Token ใน LINE Developers → Provider → Channel (Messaging API) → Messaging API tab → Channel access token
            </div>
          </Card>

          {/* Event toggles */}
          <Card size="small" style={{ marginBottom: 12 }} title={
            <span style={{ fontSize: 13 }}>เหตุการณ์ที่จะแจ้งเตือน</span>
          }>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <div>
                <Text strong style={{ fontSize: 13 }}>🔔 ผู้ใช้ใหม่รออนุมัติ</Text>
                <div style={{ fontSize: 11, color: '#64748b' }}>เมื่อมี user สมัครใหม่</div>
              </div>
              <Switch
                checked={settings?.notify_on_register || false}
                disabled={saving || !settings?.enabled}
                onChange={(v) => handleToggle('notify_on_register', v)}
                style={settings?.notify_on_register ? { background: COLORS.primary } : {}}
              />
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <div>
                <Text strong style={{ fontSize: 13 }}>🔒 ผู้ใช้ถูก lock</Text>
                <div style={{ fontSize: 11, color: '#64748b' }}>เมื่อ user ใส่ PIN ผิดเกินกำหนด</div>
              </div>
              <Switch
                checked={settings?.notify_on_locked || false}
                disabled={saving || !settings?.enabled}
                onChange={(v) => handleToggle('notify_on_locked', v)}
                style={settings?.notify_on_locked ? { background: COLORS.primary } : {}}
              />
            </div>
          </Card>

          {/* Test button */}
          <Card size="small" style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTest}
              loading={testing}
              disabled={!settings?.channel_token_set}
              block
              style={{ background: COLORS.primary, borderColor: COLORS.primary }}
            >
              ทดสอบส่งข้อความ
            </Button>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              ส่งข้อความทดสอบไปยังคุณเอง (ต้องเพิ่ม Bot เป็นเพื่อนก่อน)
            </div>
          </Card>

          {/* Recipients */}
          <Card size="small" title={
            <span style={{ fontSize: 13 }}>
              <UserOutlined /> ผู้รับการแจ้งเตือน ({recipients.length} คน)
            </span>
          }>
            {recipients.length === 0 ? (
              <Text type="secondary">ไม่มี admin ที่ active</Text>
            ) : (
              recipients.map((r, i) => (
                <div key={r.line_user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                  borderBottom: i < recipients.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <Avatar icon={<UserOutlined />} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {r.nickname || r.full_name || r.display_name}
                    </Text>
                    {r.last_login_at && (
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
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
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
              📌 admin ทุกคนต้องเพิ่ม Bot เป็นเพื่อนใน LINE จึงจะได้รับการแจ้งเตือน
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
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
