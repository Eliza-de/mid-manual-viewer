/**
 * Watermark — diagonal repeating overlay with user identity
 *
 * Forensic deterrent: if a screenshot leaks, the watermark identifies
 * who viewed the document and when.
 *
 * Update timestamp every 60s so watermark stays current.
 */

import { useState, useEffect, useMemo } from 'react';
import './Watermark.css';

const TILE_W = 240;
const TILE_H = 130;
const ROTATE_DEG = -25;

export default function Watermark({ user, profile }) {
  const [now, setNow] = useState(new Date());

  // Update every 60 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Build watermark text
  const text = useMemo(() => {
    const name = user?.displayName || profile?.displayName || 'Unknown';
    const userId = profile?.userId || '';
    const last4 = userId ? userId.slice(-4) : '????';
    const dept = user?.department || '';
    const time = formatHHMM(now);
    return `${name} · ${last4} · ${dept} · ${time}`;
  }, [user, profile, now]);

  // Build tiled SVG pattern as data URL (resolution-independent)
  const dataUri = useMemo(() => buildPatternSvg(text), [text]);

  return (
    <div
      className="watermark-overlay"
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
  // Escape text for SVG
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Two staggered rows of text in each tile for denser coverage
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}">
    <g transform="rotate(${ROTATE_DEG} ${TILE_W / 2} ${TILE_H / 2})" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Sukhumvit Set,IBM Plex Sans Thai,sans-serif" font-size="13" font-weight="500" fill="rgba(0,0,0,0.32)">
      <text x="20" y="40">${safe}</text>
      <text x="${TILE_W / 2 + 20}" y="${TILE_H / 2 + 40}">${safe}</text>
    </g>
  </svg>`;

  // encodeURIComponent for safe data URL embedding
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
