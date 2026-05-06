import { useEffect, useState } from 'react';
import { Card, Spin, Tag, Typography, Space, Alert, Button } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined
} from '@ant-design/icons';
import { initLiff, getProfile, getIdToken, isInLineClient } from '../api/liff.js';
import { ping, whoami } from '../api/client.js';

const { Title, Text, Paragraph } = Typography;

/**
 * Phase 0 Splash — smoke test screen
 *
 * Verifies the entire stack works end-to-end:
 *   1. LIFF initialization
 *   2. Get LINE profile
 *   3. Apps Script ping (no auth)
 *   4. Apps Script whoami (with LIFF token verification)
 *
 * If all 4 are green → Phase 0 is working.
 */
function Splash() {
  const [steps, setSteps] = useState({
    liffInit: { status: 'pending', message: '' },
    profile: { status: 'pending', message: '' },
    ping: { status: 'pending', message: '' },
    whoami: { status: 'pending', message: '' }
  });
  const [profile, setProfile] = useState(null);
  const [whoamiData, setWhoamiData] = useState(null);
  const [overallError, setOverallError] = useState(null);

  useEffect(() => {
    runSmokeTest();
  }, []);

  async function runSmokeTest() {
    // Step 1: Init LIFF
    try {
      await initLiff();
      setSteps(s => ({ ...s, liffInit: { status: 'ok', message: 'LIFF initialized' } }));
    } catch (err) {
      setSteps(s => ({ ...s, liffInit: { status: 'error', message: err.message } }));
      setOverallError('LIFF initialization failed. Make sure VITE_LIFF_ID is set and you opened this URL via LINE.');
      return;
    }

    // Step 2: Get profile
    try {
      const p = await getProfile();
      setProfile(p);
      setSteps(s => ({
        ...s,
        profile: { status: 'ok', message: `${p.displayName} (${p.userId.slice(0, 8)}...)` }
      }));
    } catch (err) {
      setSteps(s => ({ ...s, profile: { status: 'error', message: err.message } }));
      return;
    }

    // Step 3: Ping Apps Script (no auth)
    try {
      const r = await ping();
      if (r.ok) {
        setSteps(s => ({
          ...s,
          ping: { status: 'ok', message: `${r.message} (v${r.version})` }
        }));
      } else {
        throw new Error(r.error || 'Ping failed');
      }
    } catch (err) {
      setSteps(s => ({ ...s, ping: { status: 'error', message: err.message } }));
      setOverallError('Cannot reach Apps Script backend. Check VITE_APPS_SCRIPT_URL.');
      return;
    }

    // Step 4: WhoAmI (with LIFF token)
    try {
      const idToken = getIdToken();
      if (!idToken) throw new Error('No ID token available');
      const r = await whoami(idToken);
      if (r.ok) {
        setWhoamiData(r);
        setSteps(s => ({
          ...s,
          whoami: { status: 'ok', message: `Token verified for ${r.lineUserId.slice(0, 12)}...` }
        }));
      } else {
        throw new Error(r.error || 'WhoAmI failed');
      }
    } catch (err) {
      setSteps(s => ({ ...s, whoami: { status: 'error', message: err.message } }));
      setOverallError('Token verification failed. Check that line_channel_id in Config sheet matches your LINE channel.');
    }
  }

  const allGreen = Object.values(steps).every(s => s.status === 'ok');

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>MID Manual Viewer</Title>
            <Text type="secondary">Phase 0 — Smoke Test</Text>
          </div>

          {!isInLineClient() && (
            <Alert
              type="warning"
              showIcon
              message="ไม่ได้เปิดผ่าน LINE"
              description="ระบบนี้ออกแบบมาให้เปิดผ่าน LINE LIFF เท่านั้น บางขั้นตอนอาจไม่ทำงาน"
            />
          )}

          <div>
            <StepRow label="1. LIFF init" step={steps.liffInit} />
            <StepRow label="2. Get profile" step={steps.profile} />
            <StepRow label="3. Backend ping" step={steps.ping} />
            <StepRow label="4. Token verify" step={steps.whoami} />
          </div>

          {profile && (
            <Card size="small" title="LINE Profile">
              <Text strong>{profile.displayName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                ID: {profile.userId}
              </Text>
            </Card>
          )}

          {whoamiData && (
            <Card size="small" title="Backend Response">
              <Text style={{ fontSize: 12 }}>
                Server time: {whoamiData.serverTime}
                <br />
                Version: {whoamiData.version}
                <br />
                Token sub matches profile: {whoamiData.lineUserId === profile?.userId ? '✅ Yes' : '❌ No'}
              </Text>
            </Card>
          )}

          {overallError && (
            <Alert type="error" showIcon message="Smoke test failed" description={overallError} />
          )}

          {allGreen && (
            <Alert
              type="success"
              showIcon
              message="✅ Phase 0 OK"
              description="ทุกขั้นตอนผ่าน — backend และ LIFF เชื่อมต่อกันได้แล้ว พร้อมเริ่ม Phase 1"
            />
          )}

          <Button block onClick={runSmokeTest}>
            ทดสอบใหม่
          </Button>

          <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
            Vibharam Laemchabang Hospital · IT Department
          </Text>
        </Space>
      </Card>
    </div>
  );
}

function StepRow({ label, step }) {
  const icon = {
    pending: <ClockCircleOutlined style={{ color: '#999' }} />,
    ok: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    error: <CloseCircleFilled style={{ color: '#f5222d' }} />
  }[step.status];

  const color = {
    pending: 'default',
    ok: 'success',
    error: 'error'
  }[step.status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ marginRight: 8 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      <Tag color={color}>
        {step.status === 'pending' && (step.status === 'pending' ? <Spin size="small" /> : step.message)}
        {step.status !== 'pending' && (step.message || step.status)}
      </Tag>
    </div>
  );
}

export default Splash;
