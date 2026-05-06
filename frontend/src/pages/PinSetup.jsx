/**
 * PinSetup — first-time PIN setup (rebranded)
 */

import { useState } from 'react';
import { Card, Typography, Alert, Space, Button } from 'antd';
import { useAuth } from '../hooks/useAuth.jsx';
import { setPin } from '../api/auth.js';
import { saveSession } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';
import PinPad from '../components/PinPad.jsx';
import { BRAND, COLORS } from '../brand.js';

const { Title, Text } = Typography;

export default function PinSetup() {
  const auth = useAuth();
  const [step, setStep] = useState(1);
  const [firstPin, setFirstPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorShake, setErrorShake] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  function handleFirstComplete(pin) {
    setFirstPin(pin);
    setError(null);
    setTimeout(() => {
      setStep(2);
      setResetSignal(s => s + 1);
    }, 200);
  }

  async function handleConfirmComplete(pin) {
    if (pin !== firstPin) {
      setError('PIN ไม่ตรงกัน กรุณาเริ่มใหม่');
      setErrorShake(s => s + 1);
      setTimeout(() => {
        setFirstPin('');
        setStep(1);
        setResetSignal(s => s + 1);
      }, 600);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await setPin(idToken, pin);
      if (!r.ok) {
        setError(r.error || 'ไม่สามารถตั้ง PIN ได้');
        setErrorShake(s => s + 1);
        setBusy(false);
        setTimeout(() => {
          setFirstPin('');
          setStep(1);
          setResetSignal(s => s + 1);
        }, 600);
        return;
      }
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

  function startOver() {
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
            <Title level={3} style={{ margin: 0, color: COLORS.primary }}>ตั้ง PIN</Title>
            <Text type="secondary">
              {step === 1 ? 'ตั้ง PIN 6 หลัก' : 'ยืนยัน PIN อีกครั้ง'}
            </Text>
          </div>

          {error && (
            <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />
          )}

          <PinPad
            key={step}
            onComplete={step === 1 ? handleFirstComplete : handleConfirmComplete}
            busy={busy}
            errorShake={errorShake}
            resetSignal={resetSignal}
            hint={step === 1 ? 'เลือก PIN ที่จำง่าย แต่ผู้อื่นเดายาก' : 'ใส่ PIN เดิมอีกครั้งเพื่อยืนยัน'}
          />

          <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            ห้าม: เลขซ้ำ (111111) · เรียง (123456) · เลขที่เดาง่าย
          </div>

          {step === 2 && !busy && (
            <Button block type="link" onClick={startOver}>
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
