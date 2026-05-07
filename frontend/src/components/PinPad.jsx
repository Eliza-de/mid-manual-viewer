/**
 * PinPad — VERSION 2 REDESIGN (Lean Buddy mint sage)
 * BUILD: 2026-05-07-V2
 * If you see this comment in your file, the new version is loaded.
 */

import { useState, useEffect, useRef } from 'react';
import './PinPad.css';

const PIN_LENGTH = 6;

export default function PinPad({
  onComplete,
  busy = false,
  errorShake = 0,
  resetSignal = 0,
  hint = ''
}) {
  // ⚡ NEW VERSION MARKER — this log appears in browser console
  if (typeof window !== 'undefined' && !window.__pinpad_v2_loaded) {
    console.log('%c[PinPad V2 LOADED]', 'background:#1F4D3F;color:#A4DFCB;padding:4px 8px;border-radius:4px');
    window.__pinpad_v2_loaded = true;
  }

  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const lastShakeRef = useRef(0);
  const lastResetRef = useRef(0);

  useEffect(() => {
    if (errorShake !== lastShakeRef.current) {
      lastShakeRef.current = errorShake;
      if (errorShake > 0) {
        setShaking(true);
        const t = setTimeout(() => {
          setShaking(false);
          setPin('');
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [errorShake]);

  useEffect(() => {
    if (resetSignal !== lastResetRef.current) {
      lastResetRef.current = resetSignal;
      setPin('');
    }
  }, [resetSignal]);

  function press(digit) {
    if (busy || shaking) return;
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => onComplete(next), 100);
    }
  }

  function backspace() {
    if (busy || shaking) return;
    setPin(pin.slice(0, -1));
  }

  function clear() {
    if (busy || shaking) return;
    setPin('');
  }

  return (
    <div className={`pinpad pinpad--v2 ${shaking ? 'pinpad--shake' : ''} ${busy ? 'pinpad--busy' : ''}`}>
      <div className="pinpad__dots">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`pinpad__dot ${i < pin.length ? 'pinpad__dot--filled' : ''}`}
          />
        ))}
      </div>

      {hint && <div className="pinpad__hint">{hint}</div>}

      <div className="pinpad__keys">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button
            key={d}
            type="button"
            className="pinpad__key"
            onClick={() => press(String(d))}
            disabled={busy}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className="pinpad__key pinpad__key--util"
          onClick={clear}
          disabled={busy || pin.length === 0}
          aria-label="เคลียร์"
        >
          เคลียร์
        </button>
        <button
          type="button"
          className="pinpad__key"
          onClick={() => press('0')}
          disabled={busy}
        >
          0
        </button>
        <button
          type="button"
          className="pinpad__key pinpad__key--util pinpad__key--delete"
          onClick={backspace}
          disabled={busy || pin.length === 0}
          aria-label="ลบ"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
