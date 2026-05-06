/**
 * Home — Phase 7: route admin pages (dashboard, users, docs, logs, upload)
 */

import { useState } from 'react';
import { NavigationProvider, useNavigation } from '../hooks/useNavigation.jsx';
import AppLayout from '../components/AppLayout.jsx';
import CategoryPage from './CategoryPage.jsx';
import Reader from './Reader.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import DocumentUpload from './admin/DocumentUpload.jsx';
import UserManagement from './admin/UserManagement.jsx';
import DocumentManagement from './admin/DocumentManagement.jsx';
import LogViewer from './admin/LogViewer.jsx';

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
    if (nav.adminPage === 'users') return <UserManagement />;
    if (nav.adminPage === 'docs') return <DocumentManagement />;
    if (nav.adminPage === 'logs') return <LogViewer />;
    return <AdminDashboard />;
  }

  // Reader
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
