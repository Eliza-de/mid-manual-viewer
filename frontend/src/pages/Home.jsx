/**
 * Home — main authenticated page
 *
 * Phase 3: Wraps everything in NavigationProvider.
 * If a doc is opened → render Reader (overlays everything).
 * Otherwise → render category browser with bottom tabs.
 */

import { useState } from 'react';
import { NavigationProvider, useNavigation } from '../hooks/useNavigation.jsx';
import AppLayout from '../components/AppLayout.jsx';
import CategoryPage from './CategoryPage.jsx';
import Reader from './Reader.jsx';

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

  // If reading a document → show Reader (full-screen overlay)
  if (nav.isReading) {
    return <Reader />;
  }

  // Otherwise → show category browser
  return (
    <AppLayout category={category} onCategoryChange={setCategory}>
      <CategoryPage category={category} />
    </AppLayout>
  );
}
