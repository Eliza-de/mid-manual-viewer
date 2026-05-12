/**
 * App — Root component
 *
 * Wraps everything in AuthProvider, then routes based on auth status.
 * No React Router needed in Phase 1 — single-page conditional rendering.
 * Phase 7+ may add Router for admin panel sub-routes.
 *
 * Phase 17 — Detects ?pair=xxx in URL after LIFF login
 *            → renders QrConfirmHandler to confirm admin desktop login
 */
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Splash from './pages/Splash.jsx';
import Register from './pages/Register.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import Disabled from './pages/Disabled.jsx';
import PinSetup from './pages/PinSetup.jsx';
import PinEntry from './pages/PinEntry.jsx';
import Home from './pages/Home.jsx';
import QrConfirmHandler from './liff/QrConfirmHandler.jsx';

// Read ?pair=xxx once at module load (URL won't change during session)
const PAIR_CODE = new URLSearchParams(window.location.search).get('pair');

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { status } = useAuth();

  // Phase 17 — QR confirm handler
  // Only show after user is fully authenticated (PIN passed)
  // — must come AFTER all auth state checks
  if (PAIR_CODE && status === 'authenticated') {
    return <QrConfirmHandler pairCode={PAIR_CODE} />;
  }

  switch (status) {
    case 'loading':
    case 'error':
      return <Splash />;
    case 'unregistered':
      return <Register />;
    case 'pending':
      return <PendingApproval />;
    case 'disabled':
      return <Disabled />;
    case 'needsPin':
      return <PinSetup />;
    case 'needsLogin':
    case 'locked':
      return <PinEntry />;
    case 'authenticated':
      return <Home />;
    default:
      return <Splash />;
  }
}
