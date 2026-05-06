/**
 * Watermark v4 — ลดความหนาแน่น เพื่ออ่าน content ได้
 *
 * Phase 4.3 fix:
 *   - ลดจำนวน rows × cols จาก 12×4 → 6×2
 *   - opacity 25% (จาก 55%)
 *   - font-weight 500 (จาก 700)
 *   - เพิ่ม spacing ระหว่าง text
 */

import { useState, useEffect, useMemo } from 'react';
import './Watermark.css';

const ROW_HEIGHT = 200;     // เพิ่มจาก 110 → 200 (ห่างกว่า)
const STAGGER = 200;        // stagger เยอะขึ้น

export default function Watermark({ user, profile }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const text = useMemo(() => {
    const name = (user?.displayName || profile?.displayName || 'Unknown').slice(0, 24);
    const userId = profile?.userId || '';
    const last4 = userId ? userId.slice(-4) : '????';
    const dept = (user?.department || '').slice(0, 12);
    const time = formatHHMM(now);
    return `${name} · ${last4} · ${dept} · ${time}`;
  }, [user, profile, now]);

  // 6 rows × 2 texts = 12 instances (เดิม 12×4 = 48)
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const isOdd = r % 2 === 1;
    rows.push(
      <div
        key={r}
        className="wm-row"
        style={{
          top: `${r * ROW_HEIGHT}px`,
          left: isOdd ? `${STAGGER}px` : '0px'
        }}
      >
        <span className="wm-text">{text}</span>
        <span className="wm-text">{text}</span>
      </div>
    );
  }

  return (
    <div className="wm-overlay" aria-hidden="true">
      <div className="wm-rotator">
        {rows}
      </div>
    </div>
  );
}

function formatHHMM(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
