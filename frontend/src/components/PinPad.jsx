/**
 * PinPad — Custom 6-digit PIN entry component (redesigned)
 *
 * Lean Buddy mint sage theme:
 *   - Glass-morphism numpad
 *   - Animated dots with bouncy scale
 *   - Backspace icon (⌫) instead of word
 *   - Shake on error, pulse on busy
 */

import { useState, useEffect, useRef } from 'react';
import './PinPad.css';

const PIN_LENGTH = 6;

export default function PinPad({
  onComplete,           // (pin) => void — called when 6 digits entered
  busy = false,         // disables input while verifying
  errorShake = 0,       // increment to trigger shake animation
  resetSignal = 0,      // increment to clear pin
  hint = ''             // optional hint text below dots
}) {
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const lastShakeRef = useRef(0);
  const lastResetRef = useRef(0);

  // Trigger shake animation on errorShake increment
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

  // Clear pin on reset signal
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
    <div className={`pinpad ${shaking ? 'pinpad--shake' : ''} ${busy ? 'pinpad--busy' : ''}`}>
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
