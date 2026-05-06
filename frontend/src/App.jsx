/**
 * App — Root component
 *
 * Wraps everything in AuthProvider, then routes based on auth status.
 * No React Router needed in Phase 1 — single-page conditional rendering.
 * Phase 7+ may add Router for admin panel sub-routes.
 */

import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Splash from './pages/Splash.jsx';
import Register from './pages/Register.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import Disabled from './pages/Disabled.jsx';
import PinSetup from './pages/PinSetup.jsx';
import PinEntry from './pages/PinEntry.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { status } = useAuth();

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
