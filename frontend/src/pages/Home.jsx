/**
 * Home — main router
 *
 * Phase 13/14: added analytics + notifications admin pages
 */

import { useState } from 'react';
import { NavigationProvider, useNavigation } from '../hooks/useNavigation.jsx';
import AppLayout from '../components/AppLayout.jsx';
import CategoryPage from './CategoryPage.jsx';
import Reader from './Reader.jsx';
import VideoReader from './VideoReader.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import DocumentUpload from './admin/DocumentUpload.jsx';
import UserManagement from './admin/UserManagement.jsx';
import DocumentManagement from './admin/DocumentManagement.jsx';
import LogViewer from './admin/LogViewer.jsx';
import Analytics from './admin/Analytics.jsx';
import NotificationSettings from './admin/NotificationSettings.jsx';

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

  if (nav.adminMode) {
    if (nav.adminPage === 'upload') return <DocumentUpload />;
    if (nav.adminPage === 'users') return <UserManagement />;
    if (nav.adminPage === 'docs') return <DocumentManagement />;
    if (nav.adminPage === 'logs') return <LogViewer />;
    if (nav.adminPage === 'analytics') return <Analytics />;
    if (nav.adminPage === 'notifications') return <NotificationSettings />;
    return <AdminDashboard />;
  }

  if (nav.isReading) {
    return nav.currentDoc?.media_type === 'video' ? <VideoReader /> : <Reader />;
  }

  return (
    <AppLayout category={category} onCategoryChange={setCategory}>
      <CategoryPage category={category} />
    </AppLayout>
  );
}
