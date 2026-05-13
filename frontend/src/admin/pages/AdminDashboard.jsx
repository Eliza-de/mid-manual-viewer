/**
 * AdminDashboard — Admin console
 *
 * Combined snapshot + analytics. The standalone Analytics tab was
 * folded into this page; navigation lives in the top tab bar instead
 * of the old "เมนูจัดการ" shortcut grid.
 */
import { useEffect, useState } from 'react';
import { Tag, Spin, Select, Row, Col, Statistic, Empty, Typography, message } from 'antd';
import {
  ReloadOutlined,
  TeamOutlined, EyeOutlined, FileTextOutlined, LoginOutlined,
  UsergroupAddOutlined, UserOutlined, UserAddOutlined,
  RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  getStats,
  getAnalyticsOverview, getDailyAccess, getTopDocuments,
  getRegistrations, getLoginActivity, getCategoryUsage, getTopUsers,
} from '../api/admin';

const { Text } = Typography;

const MINT_DARK = '#1F4D3F';
const MINT_MID = '#5DBFA0';
const MINT_SOFT = '#DCEEE3';
const MINT_MUTED = '#6B8278';
const ACCENT_ORANGE = '#E8965B';

const PIE_COLORS = [MINT_DARK, MINT_MID, '#A4DFCB'];

export default function AdminDashboard({ user }) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [dailyAccess, setDailyAccess] = useState([]);
  const [topDocs, setTopDocs] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [categoryUsage, setCategoryUsage] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, o, da, td, rg, la, cu, tu] = await Promise.all([
        getStats().catch(() => ({ stats: null })),
        getAnalyticsOverview(days).catch(() => ({ overview: null })),
        getDailyAccess(days).catch(() => ({ data: [] })),
        getTopDocuments(days, 10).catch(() => ({ data: [] })),
        getRegistrations(days).catch(() => ({ data: [] })),
        getLoginActivity(Math.min(days, 14)).catch(() => ({ data: [] })),
        getCategoryUsage(days).catch(() => ({ data: [] })),
        getTopUsers(days, 10).catch(() => ({ data: [] })),
      ]);
      setStats(s.stats || null);
      setOverview(o.overview || null);
      setDailyAccess(da.data || []);
      setTopDocs(td.data || []);
      setRegistrations(rg.data || []);
      setLoginActivity(la.data || []);
      setCategoryUsage(cu.data || []);
      setTopUsers(tu.data || []);
    } catch (err) {
      message.error(err.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [days]);

  function formatDateShort(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h1 style={pageTitleStyle}>📊 Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: MINT_MUTED }}>
            ยินดีต้อนรับ <strong style={{ color: MINT_DARK }}>{user?.displayName}</strong>
            {user?.department ? ` · ${user.department}` : ''}
          </span>
          <Tag color="gold" style={{ marginInlineEnd: 0 }}>Admin</Tag>
          <Text style={{ fontSize: 13, color: MINT_MUTED }}>ช่วงเวลา:</Text>
          <Select
            value={days}
            onChange={setDays}
            style={{ minWidth: 150 }}
            options={[
              { label: '7 วันย้อนหลัง', value: 7 },
              { label: '14 วันย้อนหลัง', value: 14 },
              { label: '30 วันย้อนหลัง', value: 30 },
              { label: '60 วันย้อนหลัง', value: 60 },
              { label: '90 วันย้อนหลัง', value: 90 },
            ]}
          />
          <button onClick={loadAll} style={refreshBtnStyle} title="รีเฟรช">
            <ReloadOutlined spin={loading} />
          </button>
        </div>
      </div>

      {loading && !stats && !overview ? (
        <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>
      ) : (
        <>
          {/* Snapshot stats */}
          {stats && (
            <div style={statsGridStyle}>
              <SnapshotCard
                icon={<TeamOutlined />}
                label="ผู้ใช้"
                value={stats.users?.total ?? 0}
                accent={MINT_DARK}
                hint={stats.users?.pending > 0 ? `รออนุมัติ ${stats.users.pending}` : null}
                hintColor="#F59E0B"
              />
              <SnapshotCard
                icon={<FileTextOutlined />}
                label="เอกสาร active"
                value={stats.documents?.active ?? 0}
                accent={MINT_MID}
                hint={stats.documents?.archived > 0 ? `archived ${stats.documents.archived}` : null}
              />
              <SnapshotCard
                icon={<EyeOutlined />}
                label="เปิดเอกสารวันนี้"
                value={stats.today?.accesses ?? 0}
                accent={ACCENT_ORANGE}
                hint={<><LoginOutlined style={{ fontSize: 10, marginRight: 2 }} />{stats.today?.logins ?? 0} login</>}
              />
              <SnapshotCard
                icon={<UsergroupAddOutlined />}
                label="ผู้ใช้ active"
                value={stats.users?.active ?? 0}
                accent={MINT_DARK}
                hint={stats.users?.disabled > 0 ? `ระงับ ${stats.users.disabled}` : null}
                hintColor="#EF4444"
              />
            </div>
          )}

          {/* Period overview (trend) */}
          {overview && (
            <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
              <Col xs={12} sm={12} md={6}>
                <div style={trendCardStyle}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}><EyeOutlined /> เปิดเอกสาร · {days}ว</span>}
                    value={overview.accesses}
                    valueStyle={{ color: MINT_DARK, fontSize: 24 }}
                    suffix={<TrendBadge value={overview.trend_accesses} />}
                  />
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={trendCardStyle}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}><UserOutlined /> ผู้ใช้ active · {days}ว</span>}
                    value={overview.unique_users}
                    valueStyle={{ color: MINT_DARK, fontSize: 24 }}
                    suffix={<TrendBadge value={overview.trend_unique_users} />}
                  />
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={trendCardStyle}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}><LoginOutlined /> เข้าระบบ · {days}ว</span>}
                    value={overview.logins}
                    valueStyle={{ color: MINT_MID, fontSize: 24 }}
                  />
                </div>
              </Col>
              <Col xs={12} sm={12} md={6}>
                <div style={trendCardStyle}>
                  <Statistic
                    title={<span style={{ fontSize: 12 }}><UserAddOutlined /> สมัครใหม่ · {days}ว</span>}
                    value={overview.new_users}
                    valueStyle={{ color: ACCENT_ORANGE, fontSize: 24 }}
                  />
                </div>
              </Col>
            </Row>
          )}

          {/* Daily access */}
          <div style={chartCardStyle}>
            <div style={chartTitleStyle}>📈 การเปิดเอกสารรายวัน</div>
            {dailyAccess.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyAccess} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateShort} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={formatDateShort} />
                  <Line type="monotone" dataKey="count" stroke={MINT_DARK} strokeWidth={2}
                    dot={{ fill: MINT_DARK, r: 3 }} name="ครั้ง" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Login activity */}
          <div style={chartCardStyle}>
            <div style={chartTitleStyle}>🔐 กิจกรรม Login</div>
            {loginActivity.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={loginActivity} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateShort} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={formatDateShort} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="success" stackId="a" fill={MINT_MID} name="สำเร็จ" />
                  <Bar dataKey="fail" stackId="a" fill={ACCENT_ORANGE} name="ผิด" />
                  <Bar dataKey="locked" stackId="a" fill="#EF4444" name="ถูก lock" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top docs */}
          <div style={chartCardStyle}>
            <div style={chartTitleStyle}>🏆 Top 10 เอกสารที่เปิดบ่อย</div>
            {topDocs.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
              <ResponsiveContainer width="100%" height={Math.max(240, topDocs.length * 32)}>
                <BarChart data={topDocs} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={180}
                    tickFormatter={(v) => v?.length > 26 ? v.slice(0, 26) + '...' : v} />
                  <Tooltip />
                  <Bar dataKey="views" fill={MINT_DARK} name="ครั้ง" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category usage + Registrations */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <div style={{ ...chartCardStyle, marginBottom: 0, height: '100%' }}>
                <div style={chartTitleStyle}>📚 หมวดที่ดูบ่อย</div>
                {categoryUsage.length === 0 || categoryUsage.every(c => !c.views) ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryUsage} dataKey="views" nameKey="label"
                        cx="50%" cy="50%" outerRadius={80}
                        label={(e) => e.label} labelLine={false}>
                        {categoryUsage.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ ...chartCardStyle, marginBottom: 0, height: '100%' }}>
                <div style={chartTitleStyle}>📅 ผู้ใช้สมัครใหม่</div>
                {registrations.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={registrations} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateShort} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={formatDateShort} />
                      <Bar dataKey="count" fill={MINT_MID} name="คน" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Col>
          </Row>

          {/* Top users */}
          <div style={chartCardStyle}>
            <div style={chartTitleStyle}>👥 Top 10 ผู้ใช้ที่ active</div>
            {topUsers.length === 0 ? <Empty description="ไม่มีข้อมูล" /> : (
              <div>
                {topUsers.map((u, i) => (
                  <div key={u.line_user_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < topUsers.length - 1 ? '0.5px solid #f0f0f0' : 'none',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: i < 3 ? MINT_DARK : '#94A3B8',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 13 }}>
                        {u.nickname || u.full_name || u.display_name || u.line_user_id?.slice(0, 12) + '...'}
                      </Text>
                      {u.department && (
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{u.department}</Text>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Tag color={MINT_DARK} style={{ marginInlineEnd: 0, color: '#fff', borderColor: MINT_DARK }}>
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
  );
}

function SnapshotCard({ icon, label, value, accent, hint, hintColor = '#94A3B8' }) {
  return (
    <div style={snapshotCardStyle}>
      <div style={{ fontSize: 12, color: MINT_MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: accent, fontSize: 14 }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: hintColor, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function TrendBadge({ value }) {
  if (!value || value === 0) return null;
  const isUp = value > 0;
  return (
    <span style={{ fontSize: 12, color: isUp ? MINT_MID : '#EF4444', marginLeft: 6 }}>
      {isUp ? <RiseOutlined /> : <FallOutlined />} {Math.abs(value)}%
    </span>
  );
}

const pageHeaderStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.06)',
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};

const pageTitleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: MINT_DARK,
  letterSpacing: '-0.3px',
};

const refreshBtnStyle = {
  background: MINT_SOFT,
  border: 'none',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  color: MINT_DARK,
  fontSize: 14,
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const snapshotCardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 16,
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.04)',
};

const trendCardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 16,
  height: '100%',
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.04)',
};

const chartCardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 20,
  marginTop: 16,
  marginBottom: 16,
  border: '0.5px solid rgba(31, 77, 63, 0.08)',
  boxShadow: '0 1px 3px rgba(31, 77, 63, 0.04)',
};

const chartTitleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: MINT_DARK,
  marginBottom: 12,
};
