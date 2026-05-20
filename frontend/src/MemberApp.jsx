/**
 * MemberApp — entrypoint for the "member profile" deep link
 *
 * URL: https://liff.line.me/<LIFF_ID>?view=member  (or any URL with ?view=member)
 *
 * Reuses the full AuthProvider so users still go through:
 *   loading → (register / pending) → PIN → MyProfile
 * The only difference vs. the main App is: on 'authenticated', we render
 * MyProfile instead of Home. Members can't accidentally browse documents
 * from here (no Reader / no nav tabs).
 */

import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Splash from './pages/Splash.jsx';
import Register from './pages/Register.jsx';
import PendingApproval from './pages/PendingApproval.jsx';
import Disabled from './pages/Disabled.jsx';
import PinSetup from './pages/PinSetup.jsx';
import PinEntry from './pages/PinEntry.jsx';
import MyProfile from './pages/MyProfile.jsx';

export default function MemberApp() {
  return (
    <AuthProvider>
      <MemberGate />
    </AuthProvider>
  );
}

function MemberGate() {
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
      return <MyProfile />;
    default:
      return <Splash />;
  }
}
