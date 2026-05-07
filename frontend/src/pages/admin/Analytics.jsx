/**
 * Analytics — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2-ANALYTICS
 *
 * Changes from V1:
 *   - Mint gradient header (matches AdminDashboard V2)
 *   - Glass icon buttons
 *   - Cleaner cards
 */

import { useEffect, useState } from 'react';
import {
  Card, Select, Statistic, Row, Col, Spin, message, Typography, Empty, Tag
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

const { Text } = Typography;

// Mint sage palette for charts
const PIE_COLORS = ['#1F4D3F', '#5DBFA0', '#A4DFCB'];
const CHART_PRIMARY = COLORS.primary;     // #1F4D3F
const CHART_SECONDARY = '#5DBFA0';
const CHART_ACCENT = '#E8965B';

export default function Analytics() {
  // V2 marker
  if (typeof window !== 'undefined' && !window.__analytics_v2_loaded) {
    console.log('%c[Analytics V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__analytics_v2_loaded = true;
  }

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
      {/* Mint gradient header */}
      <div style={topBarStyle}>
        <div style={iconBtnStyle} onClick={() => nav.goAdminPage('dashboard')} role="button">
          <ArrowLeftOutlined style={{ fontSize: 18 }} />
        </div>
        <div style={titleStyle}>Analytics</div>
        <div style={iconBtnStyle} onClick={loadAll} role="button">
          <ReloadOutlined spin={loading} style={{ fontSize: 18 }} />
        </div>
      </div>

      <div style={contentStyle}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Period selector */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong style={{ color: COLORS.primary }}>ช่วงเวลา:</Text>
              <Select
                value={days}
                onChange={setDays}
                style={{ flex: 1, maxWidth: 240 }}
                options={[
                  { label: '7 วันย้อนหลัง', value: 7 },
                  { label: '14 วันย้อนหลัง', value: 14 },
                  { label: '30 วันย้อนหลัง', value: 30 },
                  { label: '60 วันย้อนหลัง', value: 60 },
                  { label: '90 วันย้อนหลัง', value: 90 }
                ]}
              />
            </div>
          </div>

          {loading && !overview ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
          ) : (
            <>
              {/* Overview Cards */}
              {overview && (
                <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                  <Col xs={12} sm={12} md={6}>
                    <div style={statCardStyle}>
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><EyeOutlined /> เปิดเอกสาร</span>}
                        value={overview.accesses}
                        valueStyle={{ color: COLORS.primary, fontSize: 22 }}
                        suffix={<TrendBadge value={overview.trend_accesses} />}
                      />
                    </div>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <div style={statCardStyle}>
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><UserOutlined /> ผู้ใช้ที่ active</span>}
                        value={overview.unique_users}
                        valueStyle={{ color: COLORS.primary, fontSize: 22 }}
                        suffix={<TrendBadge value={overview.trend_unique_users} />}
                      />
                    </div>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <div style={statCardStyle}>
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><LoginOutlined /> เข้าระบบ</span>}
                        value={overview.logins}
                        valueStyle={{ color: '#5DBFA0', fontSize: 22 }}
                      />
                    </div>
                  </Col>
                  <Col xs={12} sm={12} md={6}>
                    <div style={statCardStyle}>
                      <Statistic
                        title={<span style={{ fontSize: 11 }}><UserAddOutlined /> สมัครใหม่</span>}
                        value={overview.new_users}
                        valueStyle={{ color: '#E8965B', fontSize: 22 }}
                      />
                    </div>
                  </Col>
                </Row>
              )}

              {/* Daily Access */}
              <div style={cardStyle}>
                <div style={chartTitleStyle}>📈 การเปิดเอกสารรายวัน</div>
                {dailyAccess.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={dailyAccess} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={formatDateShort} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={CHART_PRIMARY}
                        strokeWidth={2}
                        dot={{ fill: CHART_PRIMARY, r: 3 }}
                        name="ครั้ง"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Login Activity */}
              <div style={cardStyle}>
                <div style={chartTitleStyle}>🔐 กิจกรรม Login</div>
                {loginActivity.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={loginActivity} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip labelFormatter={formatDateShort} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="success" stackId="a" fill={CHART_SECONDARY} name="สำเร็จ" />
                      <Bar dataKey="fail" stackId="a" fill={CHART_ACCENT} name="ผิด" />
                      <Bar dataKey="locked" stackId="a" fill="#EF4444" name="ถูก lock" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top Documents */}
              <div style={cardStyle}>
                <div style={chartTitleStyle}>🏆 Top 10 เอกสารที่เปิดบ่อย</div>
                {topDocs.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={Math.max(220, topDocs.length * 30)}>
                    <BarChart data={topDocs} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        tick={{ fontSize: 9 }}
                        width={120}
                        tickFormatter={(v) => v?.length > 18 ? v.slice(0, 18) + '...' : v}
                      />
                      <Tooltip />
                      <Bar dataKey="views" fill={CHART_PRIMARY} name="ครั้ง" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Two-column row: Category Usage + Registrations */}
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col xs={24} md={12}>
                  <div style={{ ...cardStyle, marginBottom: 0, height: '100%' }}>
                    <div style={chartTitleStyle}>📚 หมวดที่ดูบ่อย</div>
                    {categoryUsage.every(c => c.views === 0) ? <Empty description="ไม่มีข้อมูล" /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={categoryUsage}
                            dataKey="views"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={(e) => e.label}
                            labelLine={false}
                          >
                            {categoryUsage.map((entry, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ ...cardStyle, marginBottom: 0, height: '100%' }}>
                    <div style={chartTitleStyle}>📅 ผู้ใช้สมัครใหม่</div>
                    {registrations.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={registrations} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={formatDateShort} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip labelFormatter={formatDateShort} />
                          <Bar dataKey="count" fill={CHART_SECONDARY} name="คน" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Top Users */}
              <div style={cardStyle}>
                <div style={chartTitleStyle}>👥 Top 10 ผู้ใช้ที่ active</div>
                {topUsers.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <div>
                    {topUsers.map((u, i) => (
                      <div key={u.line_user_id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: i < topUsers.length - 1 ? '0.5px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: i < 3 ? COLORS.primary : '#94A3B8',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {i + 1}
                        </div>
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
                          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                            {u.unique_docs} เอกสาร
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
      color: isUp ? '#5DBFA0' : '#EF4444',
      marginLeft: 6
    }}>
      {isUp ? <RiseOutlined /> : <FallOutlined />} {Math.abs(value)}%
    </span>
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

const statCardStyle = {
  background: 'white',
  borderRadius: 14,
  padding: '14px 12px',
  border: '0.5px solid rgba(31,77,63,0.08)',
  boxShadow: '0 1px 3px rgba(31,77,63,0.04)',
  height: '100%'
};

const chartTitleStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.primary,
  marginBottom: 10
};
