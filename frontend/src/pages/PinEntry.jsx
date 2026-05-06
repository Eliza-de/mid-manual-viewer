/**
 * PinEntry — PIN login screen
 *
 * Single-step PIN entry.
 * Shows lockout countdown if locked.
 * Shows attempts remaining on wrong PIN.
 */

import { useState, useEffect } from 'react';
import { Card, Typography, Space, Alert, Avatar, Button, Statistic } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import PinPad from '../components/PinPad.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { verifyPin, saveSession } from '../api/auth.js';
import { getIdToken } from '../api/liff.js';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

export default function PinEntry() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorShake, setErrorShake] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const isLocked = auth.status === 'locked';
  const lockUntil = auth.lockedUntil ? new Date(auth.lockedUntil).getTime() : null;

  async function onComplete(pin) {
    setBusy(true);
    setError(null);
    try {
      const idToken = getIdToken();
      const r = await verifyPin(idToken, pin);
      if (!r.ok) {
        if (r.status === 'locked') {
          auth.onLocked(r.lockedUntil);
          setBusy(false);
          return;
        }
        setError(r.error || 'PIN ไม่ถูกต้อง');
        if (typeof r.attemptsRemaining === 'number') {
          setAttemptsLeft(r.attemptsRemaining);
        }
        setErrorShake(s => s + 1);
        setBusy(false);
        return;
      }
      // Success — save and route
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

  // Locked screen
  if (isLocked && lockUntil) {
    return (
      <div style={containerStyle}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <LockOutlined style={{ fontSize: 48, color: '#ef4444' }} />
            <Title level={4} style={{ margin: 0 }}>บัญชีถูก lock</Title>
            <Text type="secondary">
              ใส่ PIN ผิดครบจำนวนครั้งที่กำหนด
              <br />
              กรุณาลองใหม่หลังจาก:
            </Text>
            <Countdown
              value={lockUntil}
              format="mm:ss"
              valueStyle={{ color: '#ef4444', fontSize: 36 }}
              onFinish={auth.refresh}
            />
            <Button type="primary" onClick={auth.refresh}>
              ลองใหม่
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1e3a5f' }}>
              ใส่ PIN เพื่อเข้าใช้งาน
            </Title>
          </div>

          {auth.profile && (
            <Card size="small" style={{ background: '#f8fafc', textAlign: 'center' }}>
              <Space direction="vertical" size={4}>
                {auth.profile.pictureUrl
                  ? <Avatar src={auth.profile.pictureUrl} size={48} />
                  : <Avatar icon={<UserOutlined />} size={48} />}
                <div>
                  <div style={{ fontWeight: 600 }}>{auth.profile.displayName}</div>
                  {auth.user && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {auth.user.department}
                    </Text>
                  )}
                </div>
              </Space>
            </Card>
          )}

          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              description={
                attemptsLeft !== null && attemptsLeft > 0
                  ? `เหลืออีก ${attemptsLeft} ครั้ง`
                  : null
              }
              closable
              onClose={() => setError(null)}
            />
          )}

          <PinPad
            onComplete={onComplete}
            busy={busy}
            errorShake={errorShake}
            resetSignal={resetSignal}
            hint="ใส่ PIN 6 หลัก"
          />
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
