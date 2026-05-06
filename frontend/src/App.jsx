import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash.jsx';

/**
 * Phase 0 App — only the splash/smoke-test screen is implemented.
 * Phases 1+ will add routing for Register, PinEntry, Home, Reader, Admin, etc.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="*" element={<Splash />} />
    </Routes>
  );
}

export default App;
