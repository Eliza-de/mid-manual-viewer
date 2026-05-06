/**
 * useNavigation — global navigation state
 *
 * Phase 5: เพิ่ม adminMode สำหรับ admin pages
 */

import { createContext, useContext, useState, useCallback } from 'react';

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPage, setAdminPage] = useState('dashboard');  // 'dashboard' | 'upload'

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
    if (currentPage < currentDoc.page_count) setCurrentPage(currentPage + 1);
  }, [currentDoc, currentPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  // Admin mode
  const openAdmin = useCallback(() => {
    setAdminMode(true);
    setAdminPage('dashboard');
  }, []);

  const closeAdmin = useCallback(() => {
    setAdminMode(false);
    setAdminPage('dashboard');
  }, []);

  const goAdminPage = useCallback((page) => {
    setAdminPage(page);
  }, []);

  const value = {
    currentDoc,
    currentPage,
    openDoc,
    closeDoc,
    goToPage,
    nextPage,
    prevPage,
    isReading: !!currentDoc,

    // Admin
    adminMode,
    adminPage,
    openAdmin,
    closeAdmin,
    goAdminPage
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNavigation must be used inside NavigationProvider');
  return ctx;
}
