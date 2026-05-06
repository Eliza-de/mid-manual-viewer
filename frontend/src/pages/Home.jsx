/**
 * Home — main authenticated page
 *
 * Phase 2: Bottom tab navigation between 3 categories of documents
 * Phase 3: Will integrate Reader navigation
 */

import { useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import CategoryPage from './CategoryPage.jsx';

export default function Home() {
  // Default tab: 'topic' (most commonly used in daily work)
  const [category, setCategory] = useState('topic');

  return (
    <AppLayout category={category} onCategoryChange={setCategory}>
      <CategoryPage category={category} />
    </AppLayout>
  );
}
