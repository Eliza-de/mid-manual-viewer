/**
 * NotificationSettings — Admin console
 *
 * LINE channel token + event toggles + test button + recipients list
 */
import { useEffect, useState } from 'react';
import {
  Button, Switch, Input, message, Typography, Alert, Space, Avatar, Spin, Modal, Tag,
} from 'antd';
import {
  ReloadOutlined, SendOutlined, BellOutlined,
  KeyOutlined, UserOutlined, SaveOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  getNotificationSettings, updateNotificationSettings,
  testNotification, getNotificationRecipients,
} from '../api/admin';

const { Text } = Typography;

const MINT_DARK = '#1F4D3F';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';

export default function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [recipients, setRecipients] = useState([]);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenInputVisible, setTokenInputVisible] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        getNotificationSettings(),
        getNotificationRecipients().catch(() => ({ recipients: [] })),
      ]);
      setSettings(s.settings || null);
      setRecipients(r.recipients || []);
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
      await updateNotificationSettings(updates);
      message.success('บันทึกสำเร็จ');
      await load();
      return true;
    } catch (err) {
      message.error(err.message || 'บันทึกไม่สำเร็จ');
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
      await testNotification();
      Modal.success({
        title: '✅ ส่งสำเร็จ',
        content: 'กรุณาเช็ค LINE ของคุณ — ควรได้รับข้อความทดสอบจาก Bot',
      });
    } catch (err) {
      Modal.error({ title: '❌ ส่งไม่สำเร็จ', content: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setTesting(false);
    }
  }

  if (loading && !settings) {
    return <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const isEnabled = settings?.enabled || false;
  const tokenSet = settings?.channel_token_set || false;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>🔔 การแจ้งเตือน</h1>
        <button onClick={load} style={refreshBtnStyle} title="รีเฟรช">
          <ReloadOutlined spin={loading} />
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', alignItems: 'start' }}>
        <div>
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

          {/* Master switch */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 15, color: MINT_DARK }}>
                  <BellOutlined /> เปิด/ปิดการแจ้งเตือน
                </Text>
                <div style={{ fontSize: 12, color: MINT_MUTED, marginTop: 2 }}>
                  ส่งแจ้งเตือนผ่าน LINE ไปยัง admin ทั้งหมด
                </div>
              </div>
              <Switch
                checked={isEnabled}
                disabled={saving || !tokenSet}
                onChange={(v) => handleToggle('enabled', v)}
                style={isEnabled ? { background: MINT_DARK } : {}}
              />
            </div>
          </div>

          {/* Channel token */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}><KeyOutlined style={{ marginRight: 6 }} /> Channel Access Token</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>สถานะ:</Text>
              {tokenSet
                ? <Tag color="green" style={{ marginInlineEnd: 0 }}>✓ ตั้งค่าแล้ว</Tag>
                : <Tag color="orange" style={{ marginInlineEnd: 0 }}>ยังไม่ได้ตั้งค่า</Tag>}
            </div>

            {!showTokenInput ? (
              <Button icon={<KeyOutlined />} onClick={() => setShowTokenInput(true)} block style={{ borderRadius: 8 }}>
                {tokenSet ? 'เปลี่ยน Token' : 'ตั้งค่า Token'}
              </Button>
            ) : (
              <Space.Compact style={{ width: '100%' }}>
                <Input.Password
                  placeholder="paste token here..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  visibilityToggle={{ visible: tokenInputVisible, onVisibleChange: setTokenInputVisible }}
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
                  style={{ background: MINT_DARK, borderColor: MINT_DARK }}
                >
                  บันทึก
                </Button>
              </Space.Compact>
            )}

            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.5 }}>
              💡 หา Token ใน LINE Developers → Provider → Channel (Messaging API) → Messaging API tab → Channel access token
            </div>
          </div>

          {/* Event toggles */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>เหตุการณ์ที่จะแจ้งเตือน</div>
            <EventToggle icon="🔔" title="ผู้ใช้ใหม่รออนุมัติ" desc="เมื่อมี user สมัครใหม่"
              checked={settings?.notify_on_register || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_register', v)} />
            <EventToggle icon="🔒" title="ผู้ใช้ถูก lock" desc="เมื่อ user ใส่ PIN ผิดเกินกำหนด"
              checked={settings?.notify_on_locked || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_locked', v)} divider />
            <EventToggle icon="👤" title="Admin actions (ผู้ใช้)" desc="อนุมัติ / ระงับ / เปิดใช้ / Reset PIN / สิทธิ์ admin"
              checked={settings?.notify_on_user_actions || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_user_actions', v)} divider />
            <EventToggle icon="📄" title="Admin actions (เอกสาร)" desc="เพิ่ม / แก้ไข / archive / restore / replace pages"
              checked={settings?.notify_on_document_actions || false}
              disabled={saving || !isEnabled}
              onChange={(v) => handleToggle('notify_on_document_actions', v)} divider />
          </div>

          {/* Test button */}
          <div style={cardStyle}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleTest}
              loading={testing}
              disabled={!tokenSet}
              block size="large"
              style={tokenSet ? { background: MINT_DARK, borderColor: MINT_DARK } : {}}
            >
              ทดสอบส่งข้อความ
            </Button>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
              ส่งข้อความทดสอบไปยังคุณเอง (ต้องเพิ่ม Bot เป็นเพื่อนก่อน)
            </div>
          </div>
        </div>

        {/* Recipients column */}
        <div>
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
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < recipients.length - 1 ? '0.5px solid #f0f0f0' : 'none',
                }}>
                  <Avatar icon={<UserOutlined />} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {r.nickname || r.full_name || r.display_name}
                    </Text>
                    {r.last_login_at && (
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>
                        last login: {new Date(r.last_login_at).toLocaleString('th-TH', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                  <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>
                </div>
              ))
            )}
            <div style={{ fontSize: 11, color: MINT_MUTED, marginTop: 10, lineHeight: 1.6 }}>
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

function EventToggle({ icon, title, desc, checked, disabled, onChange, divider }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderTop: divider ? '0.5px solid #f0f0f0' : 'none',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, color: '#1F2937' }}>{icon} {title}</Text>
        <div style={{ fontSize: 11, color: MINT_MUTED, marginTop: 2 }}>{desc}</div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        style={checked ? { background: MINT_DARK } : {}}
      />
    </div>
  );
}

const pageHeaderStyle = {
  background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.06)',
};
const pageTitleStyle = { margin: 0, fontSize: 22, fontWeight: 700, color: MINT_DARK };
const refreshBtnStyle = {
  background: MINT_SOFT, border: 'none', borderRadius: 8,
  width: 32, height: 32, cursor: 'pointer', color: MINT_DARK,
};
const cardStyle = {
  background: '#fff', borderRadius: 14, padding: 20, marginBottom: 16,
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
};
const cardTitleStyle = {
  fontSize: 14, fontWeight: 600, color: MINT_DARK, marginBottom: 12,
};
