/**
 * Watermark v3 — Pure React render, no SVG data URI
 *
 * Phase 4.2 fix:
 *   - Render text directly via repeated <div>s in absolute positions
 *   - No SVG, no data URI, no blend-mode → works everywhere
 *   - Visible deterrent text + screenshot will capture it
 */

import { useState, useEffect, useMemo } from 'react';
import './Watermark.css';

const ROW_HEIGHT = 110;
const STAGGER = 100;

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

  // Build a 2D grid of repeating text — fixed count covers most screens
  const rows = [];
  for (let r = 0; r < 12; r++) {
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
