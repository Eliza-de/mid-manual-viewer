/**
 * PinSetup — Set PIN on first login
 *
 * Two-step flow:
 *  1. Enter PIN
 *  2. Confirm PIN (must match)
 *
 * On success: backend issues session token, route to Home.
 */

import { useState } from 'react';
import { Card, Typography, Space, Alert, Button } from 'antd';
import PinPad from '../components/PinPad.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { setPin as setPinApi, saveSession } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';

const { Title, Text } = Typography;

export default function PinSetup() {
  const auth = useAuth();
  const [step, setStep] = useState(1);   // 1=enter, 2=confirm
  const [firstPin, setFirstPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorShake, setErrorShake] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  function onStep1Complete(pin) {
    setFirstPin(pin);
    setError(null);
    // Brief delay for UX
    setTimeout(() => {
      setStep(2);
      setResetSignal(s => s + 1);
    }, 200);
  }

  async function onStep2Complete(pin) {
    if (pin !== firstPin) {
      setError('PIN ไม่ตรงกัน กรุณาเริ่มใหม่');
      setErrorShake(s => s + 1);
      // After shake, reset to step 1
      setTimeout(() => {
        setFirstPin('');
        setStep(1);
        setResetSignal(s => s + 1);
      }, 600);
      return;
    }
    // Both pins match → submit
    setBusy(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await setPinApi(idToken, pin);
      if (!r.ok) {
        setError(r.error || 'ไม่สามารถตั้ง PIN ได้');
        setErrorShake(s => s + 1);
        setBusy(false);
        // After shake, restart
        setTimeout(() => {
          setFirstPin('');
          setStep(1);
          setResetSignal(s => s + 1);
        }, 600);
        return;
      }
      // Save session and switch to authenticated
      saveSession(r.sessionToken, r.expiresAt, r.user);
      auth.onLoginSuccess({
        token: r.sessionToken,
        expiresAt: r.expiresAt,
        user: r.user
      });
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด');
      setErrorShake(s => s + 1);
      setBusy(false);
    }
  }

  function restart() {
    setFirstPin('');
    setStep(1);
    setError(null);
    setResetSignal(s => s + 1);
  }

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>
              ตั้ง PIN
            </Title>
            <Text type="secondary">
              {step === 1 ? 'ตั้ง PIN 6 หลัก' : 'ยืนยัน PIN อีกครั้ง'}
            </Text>
          </div>

          {error && (
            <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
          )}

          <PinPad
            key={step}
            onComplete={step === 1 ? onStep1Complete : onStep2Complete}
            busy={busy}
            errorShake={errorShake}
            resetSignal={resetSignal}
            hint={step === 1
              ? 'เลือก PIN ที่จำง่าย แต่ผู้อื่นเดายาก'
              : 'ใส่ PIN เดิมอีกครั้งเพื่อยืนยัน'}
          />

          <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            ห้าม: เลขซ้ำ (111111) · เรียง (123456) · เลขที่เดาง่าย
          </div>

          {step === 2 && !busy && (
            <Button block type="link" onClick={restart}>
              ตั้ง PIN ใหม่
            </Button>
          )}

          {auth.user && (
            <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', display: 'block' }}>
              {auth.user.displayName} · {auth.user.department}
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
}

const containerStyle = {
  padding: 16,
  maxWidth: 480,
  margin: '0 auto'
};
