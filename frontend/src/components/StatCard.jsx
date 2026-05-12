/**
 * StatCard — Equal-size stat tiles
 */
import { COLORS, SHADOWS, RADIUS } from '../brandV2.js';

export default function StatCard({ icon, label, value, subtext, color = COLORS.primaryDark }) {
  return (
    <div
      style={{
        background: COLORS.cardBg,
        borderRadius: RADIUS.lg,
        padding: '14px 12px',
        boxShadow: SHADOWS.card,
        border: `1px solid ${COLORS.borderLight}`,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ color, fontSize: 14 }}>{icon}</span>
        <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ color, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </div>
      {subtext && (
        <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
