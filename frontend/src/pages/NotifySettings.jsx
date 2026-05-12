/**
 * NotifySettings — V2 (Phase 14)
 * BUILD: 2026-05-12-V2-NOTIFY
 *
 * LINE notification toggles for admin alerts:
 *   - New user pending approval
 *   - Failed login attempts
 *   - Document upload events
 *   - Daily summary
 *
 * Test message button
 */
import { useEffect, useState } from 'react';
import { Switch, Button, message, Spin, Input, Form } from 'antd';
import {
  BellOutlined, ReloadOutlined, SendOutlined, SaveOutlined,
  UserAddOutlined, WarningOutlined, FileAddOutlined,
  ClockCircleOutlined, MessageOutlined,
} from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import { getNotifySettings, updateNotifySettings, testNotification } from '../api/admin.js';
import { COLORS, SHADOWS, RADIUS } from '../brand.js';
import PageHeader from '../components/PageHeader.jsx';

const TOGGLES = [
  {
    key: 'notify_pending_user',
    icon: <UserAddOutlined />,
    title: 'มี user รออนุมัติ',
    desc: 'แจ้งเมื่อมีผู้ใช้ใหม่ลงทะเบียน',
    color: COLORS.primaryDark,
  },
  {
    key: 'notify_failed_login',
    icon: <WarningOutlined />,
    title: 'Failed login alerts',
    desc: 'แจ้งเมื่อมีการพยายาม login ผิดเกิน 3 ครั้ง',
    color: COLORS.danger,
  },
  {
    key: 'notify_doc_upload',
    icon: <FileAddOutlined />,
    title: 'อัปโหลดเอกสารใหม่',
    desc: 'แจ้งเมื่อมีเอกสารใหม่ถูกอัปโหลด',
    color: COLORS.primaryMid,
  },
  {
    key: 'notify_daily_summary',
    icon: <ClockCircleOutlined />,
    title: 'สรุปประจำวัน',
    desc: 'ส่งสรุปการใช้งานทุกวันเวลา 18:00',
    color: COLORS.accent,
  },
];

export default function NotifySettings() {
  if (typeof window !== 'undefined' && !window.__notify_v2_loaded) {
    console.log('%c[NotifySettings V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__notify_v2_loaded = true;
  }

  const nav = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({});
  const [groupId, setGroupId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await getNotifySettings(token);
      setSettings(data?.settings || {});
      setGroupId(data?.line_group_id || '');
    } catch (e) {
      message.error('โหลดการตั้งค่าไม่สำเร็จ');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function toggleKey(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      const token = await getIdToken();
      await updateNotifySettings(token, { settings, line_group_id: groupId });
      message.success('บันทึกแล้ว');
    } catch (e) {
      message.error('บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  }

  async function doTest() {
    setTesting(true);
    try {
      const token = await getIdToken();
      await testNotification(token);
      message.success('ส่งข้อความทดสอบแล้ว — เช็คใน LINE');
    } catch (e) {
      message.error('ส่งทดสอบไม่สำเร็จ — เช็ค LINE Group ID');
    } finally { setTesting(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: 24 }}>
      <PageHeader
        title="Notification Settings"
        icon={<BellOutlined />}
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <>
            {/* LINE Group ID */}
            <div style={{
              background: COLORS.cardBg, borderRadius: RADIUS.lg,
              padding: 14, marginBottom: 14, boxShadow: SHADOWS.card,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              }}>
                <MessageOutlined style={{ color: COLORS.primaryDark, fontSize: 18 }} />
                <span style={{ color: COLORS.primaryDark, fontWeight: 700, fontSize: 15 }}>
                  LINE Group ID
                </span>
              </div>
              <Input
                placeholder="C1234567890abcdef..."
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                style={{ borderRadius: RADIUS.md, marginBottom: 8 }}
              />
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
                ID ของกลุ่ม LINE ที่จะรับ notification (ต้องเพิ่ม Bot เข้ากลุ่มก่อน)
              </div>
            </div>

            {/* Toggles */}
            {TOGGLES.map(t => (
              <div
                key={t.key}
                style={{
                  background: COLORS.cardBg, borderRadius: RADIUS.lg,
                  padding: 14, marginBottom: 10, boxShadow: SHADOWS.card,
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <div style={{
                  background: COLORS.primaryLight, color: t.color,
                  width: 42, height: 42, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: COLORS.primaryDark, fontSize: 15, fontWeight: 700,
                  }}>{t.title}</div>
                  <div style={{
                    color: COLORS.textMuted, fontSize: 12, marginTop: 2,
                  }}>{t.desc}</div>
                </div>
                <Switch
                  checked={!!settings[t.key]}
                  onChange={v => toggleKey(t.key, v)}
                />
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button
                size="large" icon={<SendOutlined />}
                loading={testing} onClick={doTest}
                style={{ flex: 1 }}
              >ส่งทดสอบ</Button>
              <Button
                type="primary" size="large" icon={<SaveOutlined />}
                loading={saving} onClick={save}
                style={{ flex: 1, background: COLORS.primaryDark }}
              >บันทึก</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
