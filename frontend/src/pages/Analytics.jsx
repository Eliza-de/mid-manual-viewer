/**
 * Analytics — V2 (Phase 13)
 * BUILD: 2026-05-12-V2-ANALYTICS
 *
 * Charts using Chart.js (already in stack):
 *   - Usage over time (last 30 days)
 *   - Top accessed documents
 *   - User growth (by month)
 *   - Hourly access pattern (heatmap-style bar)
 *   - Device split (desktop / mobile / liff)
 */
import { useEffect, useState, useRef } from 'react';
import { Spin, message, Segmented, Empty } from 'antd';
import {
  BarChartOutlined, ReloadOutlined, LineChartOutlined,
  PieChartOutlined, ClockCircleOutlined, MobileOutlined,
} from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation.jsx';
import { getIdToken } from '../api/liff.js';
import {
  getAnalyticsUsage, getAnalyticsTopDocs,
  getAnalyticsUserGrowth, getAnalyticsHourly, getAnalyticsDevices,
} from '../api/adminV2.js';
import { COLORS, SHADOWS, RADIUS } from '../brandV2.js';
import PageHeader from '../components/PageHeader.jsx';

// Chart.js - import statically since it's in deps
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
);

function ChartCard({ title, icon, children, loading }) {
  return (
    <div style={{
      background: COLORS.cardBg, borderRadius: RADIUS.lg,
      padding: 14, marginBottom: 14, boxShadow: SHADOWS.card,
      border: `1px solid ${COLORS.borderLight}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{ color: COLORS.primaryDark, fontSize: 18 }}>{icon}</span>
        <Text style={{ color: COLORS.primaryDark, fontWeight: 700, fontSize: 15 }}>
          {title}
        </Text>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}><Spin /></div>
      ) : children}
    </div>
  );
}

function Text({ children, style }) {
  return <span style={style}>{children}</span>;
}

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
    x: { grid: { display: false } },
  },
};

export default function Analytics() {
  if (typeof window !== 'undefined' && !window.__analytics_v2_loaded) {
    console.log('%c[Analytics V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__analytics_v2_loaded = true;
  }

  const nav = useNavigation();
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const [topDocs, setTopDocs] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [devices, setDevices] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const token = await getIdToken();
      const [u, t, g, h, d] = await Promise.all([
        getAnalyticsUsage(token, range),
        getAnalyticsTopDocs(token),
        getAnalyticsUserGrowth(token),
        getAnalyticsHourly(token),
        getAnalyticsDevices(token),
      ]);
      setUsage(u); setTopDocs(t); setUserGrowth(g); setHourly(h); setDevices(d);
    } catch (e) {
      message.error('โหลด analytics ไม่สำเร็จ');
      console.error(e);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [range]);

  const usageChart = usage && {
    labels: usage.labels || [],
    datasets: [{
      data: usage.values || [],
      borderColor: COLORS.primaryDark,
      backgroundColor: 'rgba(164,223,203,0.3)',
      fill: true, tension: 0.35, borderWidth: 2,
      pointRadius: 2, pointHoverRadius: 5,
    }],
  };

  const topDocsChart = topDocs && {
    labels: topDocs.labels || [],
    datasets: [{
      data: topDocs.values || [],
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primaryDark,
      borderWidth: 1, borderRadius: 6,
    }],
  };

  const growthChart = userGrowth && {
    labels: userGrowth.labels || [],
    datasets: [{
      data: userGrowth.values || [],
      backgroundColor: COLORS.primaryMid,
      borderRadius: 6,
    }],
  };

  const hourlyChart = hourly && {
    labels: hourly.labels || Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      data: hourly.values || [],
      backgroundColor: COLORS.accent,
      borderRadius: 4,
    }],
  };

  const devicesChart = devices && {
    labels: devices.labels || ['Desktop', 'Mobile', 'LIFF'],
    datasets: [{
      data: devices.values || [],
      backgroundColor: [COLORS.primaryDark, COLORS.primary, COLORS.accent],
      borderColor: '#fff', borderWidth: 2,
    }],
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bgMain, paddingBottom: 24 }}>
      <PageHeader
        title="Analytics"
        icon={<BarChartOutlined />}
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
        <Segmented
          block
          value={range}
          onChange={setRange}
          options={[
            { label: '7 วัน', value: 7 },
            { label: '30 วัน', value: 30 },
            { label: '90 วัน', value: 90 },
          ]}
          style={{ marginBottom: 14, background: COLORS.cardBg }}
        />

        <ChartCard title="การใช้งานรายวัน" icon={<LineChartOutlined />} loading={loading}>
          {usageChart && usageChart.labels.length > 0 ? (
            <div style={{ height: 200 }}>
              <Line data={usageChart} options={chartOpts} />
            </div>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="เอกสารที่เปิดบ่อย Top 10" icon={<BarChartOutlined />} loading={loading}>
          {topDocsChart && topDocsChart.labels.length > 0 ? (
            <div style={{ height: 240 }}>
              <Bar
                data={topDocsChart}
                options={{ ...chartOpts, indexAxis: 'y' }}
              />
            </div>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="ผู้ใช้ใหม่รายเดือน" icon={<BarChartOutlined />} loading={loading}>
          {growthChart && growthChart.labels.length > 0 ? (
            <div style={{ height: 200 }}>
              <Bar data={growthChart} options={chartOpts} />
            </div>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="ช่วงเวลาที่ใช้งาน (รายชั่วโมง)" icon={<ClockCircleOutlined />} loading={loading}>
          {hourlyChart && hourlyChart.values?.length > 0 ? (
            <div style={{ height: 180 }}>
              <Bar data={hourlyChart} options={chartOpts} />
            </div>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="อุปกรณ์ที่ใช้งาน" icon={<MobileOutlined />} loading={loading}>
          {devicesChart && devicesChart.values?.length > 0 ? (
            <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={devicesChart}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          ) : <Empty />}
        </ChartCard>
      </div>
    </div>
  );
}
