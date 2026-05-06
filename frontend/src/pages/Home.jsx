/**
 * Home — Phase 5: route between regular view, Reader, and Admin pages
 *
 * If admin mode → render admin page
 * Else if reading doc → render Reader
 * Else → render category browser
 */

import { useState } from 'react';
import { NavigationProvider, useNavigation } from '../hooks/useNavigation.jsx';
import AppLayout from '../components/AppLayout.jsx';
import CategoryPage from './CategoryPage.jsx';
import Reader from './Reader.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import DocumentUpload from './admin/DocumentUpload.jsx';

export default function Home() {
  return (
    <NavigationProvider>
      <HomeInner />
    </NavigationProvider>
  );
}

function HomeInner() {
  const nav = useNavigation();
  const [category, setCategory] = useState('topic');

  // Admin mode takes priority
  if (nav.adminMode) {
    if (nav.adminPage === 'upload') return <DocumentUpload />;
    return <AdminDashboard />;
  }

  // Reader mode
  if (nav.isReading) {
    return <Reader />;
  }

  // Default: category browser
  return (
    <AppLayout category={category} onCategoryChange={setCategory}>
      <CategoryPage category={category} />
    </AppLayout>
  );
}
