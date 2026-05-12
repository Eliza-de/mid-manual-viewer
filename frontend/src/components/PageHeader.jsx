/**
 * PageHeader — Shared V2 component
 * Mint gradient header with back button + title + optional action
 */
import { ArrowLeftOutlined } from '@ant-design/icons';
import { COLORS, HEADER_GRADIENT, SHADOWS } from '../brand.js';

export default function PageHeader({
  title,
  icon = null,
  onBack = null,
  rightAction = null,
}) {
  return (
    <div
      style={{
        background: HEADER_GRADIENT,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: SHADOWS.header,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: 'none',
            borderRadius: 10,
            width: 38,
            height: 38,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
          }}
        >
          <ArrowLeftOutlined />
        </button>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <span style={{ color: '#fff', fontSize: 20 }}>{icon}</span>
        )}
        <h1
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          {title}
        </h1>
      </div>
      {rightAction}
    </div>
  );
}
