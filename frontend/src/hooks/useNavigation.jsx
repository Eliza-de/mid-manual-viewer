/**
 * useNavigation — global navigation state for opened document + current page
 *
 * Used to switch between Home (document list) and Reader (page viewer)
 * without React Router.
 */

import { createContext, useContext, useState, useCallback } from 'react';

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const openDoc = useCallback((doc) => {
    setCurrentDoc(doc);
    setCurrentPage(1);
  }, []);

  const closeDoc = useCallback(() => {
    setCurrentDoc(null);
    setCurrentPage(1);
  }, []);

  const goToPage = useCallback((n) => {
    if (!currentDoc) return;
    const target = Math.max(1, Math.min(currentDoc.page_count || 1, Math.floor(n)));
    setCurrentPage(target);
  }, [currentDoc]);

  const nextPage = useCallback(() => {
    if (!currentDoc) return;
    if (currentPage < currentDoc.page_count) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentDoc, currentPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const value = {
    currentDoc,
    currentPage,
    openDoc,
    closeDoc,
    goToPage,
    nextPage,
    prevPage,
    isReading: !!currentDoc
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNavigation must be used inside NavigationProvider');
  return ctx;
}
