/**
 * Watermark v2 — diagonal repeating overlay with user identity
 *
 * Phase 4.1 fix:
 *   - Remove mix-blend-mode (not reliable on LIFF in-app browser)
 *   - Use stroke + fill for visibility on any background
 *   - Wider/denser tile pattern
 *   - Stronger opacity
 *   - Render as fixed-position over Reader content (not inside zoom wrapper)
 */

import { useState, useEffect, useMemo } from 'react';
import './Watermark.css';

const TILE_W = 280;
const TILE_H = 150;
const ROTATE_DEG = -28;

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

  const dataUri = useMemo(() => buildPatternSvg(text), [text]);

  return (
    <div
      className="wm-overlay"
      style={{ backgroundImage: `url("${dataUri}")` }}
      aria-hidden="true"
    />
  );
}

function formatHHMM(d) {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function buildPatternSvg(text) {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Each tile: 2 staggered rows for denser coverage.
  // Use stroke (white) + fill (dark gray) so text is visible on any background.
  // Stroke goes UNDER the fill (paint-order: stroke).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}" viewBox="0 0 ${TILE_W} ${TILE_H}">
  <g transform="rotate(${ROTATE_DEG} ${TILE_W / 2} ${TILE_H / 2})"
     font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
     font-size="14"
     font-weight="700"
     style="paint-order: stroke; stroke: rgba(255,255,255,0.55); stroke-width: 3; stroke-linejoin: round;">
    <text x="20" y="${TILE_H * 0.30}" fill="rgba(15,23,42,0.55)">${safe}</text>
    <text x="${TILE_W * 0.50}" y="${TILE_H * 0.78}" fill="rgba(15,23,42,0.55)">${safe}</text>
  </g>
</svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}