/**
 * EmptyState — Friendly empty state with mint sage style
 */
import { COLORS } from '../brandV2.js';

export default function EmptyState({ icon = '📭', title = 'ไม่มีข้อมูล', subtitle = '' }) {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: COLORS.textMuted,
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ color: COLORS.primaryDark, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}
