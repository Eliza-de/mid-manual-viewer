/**
 * Analytics — Phase 13 dashboard with charts
 *
 * Charts:
 *   - Daily access (line chart)
 *   - Top documents (horizontal bar)
 *   - Registrations over time (bar)
 *   - Login activity (stacked bar)
 *   - Category usage (donut/pie)
 *   - Top users (table)
 */

import { useEffect, useState } from 'react';
import {
  Card, Button, Select, Statistic, Row, Col, Spin, message, Typography, Empty, Tag
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined,
  RiseOutlined, FallOutlined, EyeOutlined, UserOutlined, LoginOutlined, UserAddOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNavigation } from '../../hooks/useNavigation.jsx';
import { getIdToken } from '../../api/liff.js';
import {
  getAnalyticsOverview, getDailyAccess, getTopDocuments,
  getRegistrations, getLoginActivity, getCategoryUsage, getTopUsers
} from '../../api/admin.js';
import { COLORS } from '../../brand.js';

const { Text, Title } = Typography;

const PIE_COLORS = ['#1F4D3F', '#A4DFCB', '#5B8A75'];

export default function Analytics() {
  const auth = useAuth();
  const nav = useNavigation();
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [dailyAccess, setDailyAccess] = useState([]);
  const [topDocs, setTopDocs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [categoryUsage, setCategoryUsage] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  async function loadAll() {
    if (!auth.session) return;
    setLoading(true);
    const idToken = getIdToken();
    const token = auth.session.token;

    try {
      const [o, da, td, rg, la, cu, tu] = await Promise.all([
        getAnalyticsOverview(idToken, token, days),
        getDailyAccess(idToken, token, days),
        getTopDocuments(idToken, token, days, 10),
        getRegistrations(idToken, token, days),
        getLoginActivity(idToken, token, Math.min(days, 14)),
        getCategoryUsage(idToken, token, days),
        getTopUsers(idToken, token, days, 10)
      ]);

      if (o.ok) setOverview(o.overview);
      else if (o.needsLogin) { auth.logout(); return; }

      if (da.ok) setDailyAccess(da.data || []);
      if (td.ok) setTopDocs(td.data || []);
      if (rg.ok) setRegistrations(rg.data || []);
      if (la.ok) setLoginActivity(la.data || []);
      if (cu.ok) setCategoryUsage(cu.data || []);
      if (tu.ok) setTopUsers(tu.data || []);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [days]);

  function formatDateShort(d) {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <Button type="text" icon={<ArrowLeftOutlined />}
          onClick={() => nav.goAdminPage('dashboard')} style={{ color: '#fff' }}>กลับ</Button>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Analytics</div>
        <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={loadAll}
          style={{ color: '#fff' }} />
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Period selector */}
          <Card size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong>ช่วงเวลา:</Text>
              <Select
                value={days}
                onChange={setDays}
                style={{ flex: 1, maxWidth: 200 }}
                options={[
                  { label: '7 วันย้อนหลัง', value: 7 },
                  { label: '14 วันย้อนหลัง', value: 14 },
                  { label: '30 วันย้อนหลัง', value: 30 },
                  { label: '60 วันย้อนหลัง', value: 60 },
                  { label: '90 วันย้อนหลัง', value: 90 }
                ]}
              />
            </div>
          </Card>

          {loading && !overview ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : (
            <>
              {/* Overview Cards */}
              {overview && (
                <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><EyeOutlined /> เปิดเอกสาร</span>}
                        value={overview.accesses}
                        valueStyle={{ color: COLORS.primary, fontSize: 22 }}
                        suffix={<TrendBadge value={overview.trend_accesses} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><UserOutlined /> ผู้ใช้ที่ active</span>}
                        value={overview.unique_users}
                        valueStyle={{ color: COLORS.primary, fontSize: 22 }}
                        suffix={<TrendBadge value={overview.trend_unique_users} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><LoginOutlined /> เข้าระบบ</span>}
                        value={overview.logins}
                        valueStyle={{ color: COLORS.accent, fontSize: 22 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><UserAddOutlined /> สมัครใหม่</span>}
                        value={overview.new_users}
                        valueStyle={{ color: '#f59e0b', fontSize: 22 }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Daily Access */}
              <Card title={<span style={{ fontSize: 14 }}>📈 การเปิดเอกสารรายวัน</span>}
                size="small" style={{ marginBottom: 12 }}>
                {dailyAccess.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyAccess} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={formatDateShort} />
                      <Line type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2}
                        dot={{ fill: COLORS.primary, r: 3 }} name="ครั้ง" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Login Activity */}
              <Card title={<span style={{ fontSize: 14 }}>🔐 กิจกรรม Login</span>}
                size="small" style={{ marginBottom: 12 }}>
                {loginActivity.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={loginActivity} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={formatDateShort} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="success" stackId="a" fill={COLORS.accent} name="สำเร็จ" />
                      <Bar dataKey="fail" stackId="a" fill="#f59e0b" name="ผิด" />
                      <Bar dataKey="locked" stackId="a" fill="#ef4444" name="ถูก lock" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Top Documents */}
              <Card title={<span style={{ fontSize: 14 }}>🏆 Top 10 เอกสารที่เปิดบ่อย</span>}
                size="small" style={{ marginBottom: 12 }}>
                {topDocs.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={Math.max(220, topDocs.length * 30)}>
                    <BarChart data={topDocs} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="title" tick={{ fontSize: 9 }} width={120}
                        tickFormatter={(v) => v?.length > 18 ? v.slice(0, 18) + '...' : v} />
                      <Tooltip />
                      <Bar dataKey="views" fill={COLORS.primary} name="ครั้ง" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Two-column row: Category Usage + Registrations */}
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col xs={24} md={12}>
                  <Card title={<span style={{ fontSize: 14 }}>📊 หมวดที่ดูบ่อย</span>} size="small" style={{ height: '100%' }}>
                    {categoryUsage.every(c => c.views === 0) ? <Empty description="ไม่มีข้อมูล" /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={categoryUsage} dataKey="views" nameKey="label"
                            cx="50%" cy="50%" outerRadius={70} label={(e) => e.label}
                            labelLine={false}>
                            {categoryUsage.map((entry, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title={<span style={{ fontSize: 14 }}>📅 ผู้ใช้สมัครใหม่</span>} size="small" style={{ height: '100%' }}>
                    {registrations.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={registrations} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={formatDateShort} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip labelFormatter={formatDateShort} />
                          <Bar dataKey="count" fill={COLORS.accent} name="คน" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Top Users (table) */}
              <Card title={<span style={{ fontSize: 14 }}>👥 Top 10 ผู้ใช้ที่ active</span>} size="small">
                {topUsers.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <div>
                    {topUsers.map((u, i) => (
                      <div key={u.line_user_id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                        borderBottom: i < topUsers.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: i < 3 ? COLORS.primary : '#94a3b8',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {u.nickname || u.full_name || u.display_name || u.line_user_id?.slice(0, 12) + '...'}
                          </Text>
                          {u.department && (
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                              {u.department}
                            </Text>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Tag color={COLORS.primary} style={{ marginInlineEnd: 0, color: '#fff', borderColor: COLORS.primary }}>
                            {u.views} ครั้ง
                          </Tag>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                            {u.unique_docs} เอกสาร
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendBadge({ value }) {
  if (value === 0) return null;
  const isUp = value > 0;
  return (
    <span style={{
      fontSize: 11,
      color: isUp ? COLORS.accent : '#ef4444',
      marginLeft: 6
    }}>
      {isUp ? <RiseOutlined /> : <FallOutlined />} {Math.abs(value)}%
    </span>
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
