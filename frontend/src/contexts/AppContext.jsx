import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // toast helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // keyboard: N opens quick add
  useEffect(() => {
    const handler = (e) => {
      const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.key.toLowerCase() === 'n' && !inField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
      if (e.key === 'Escape') setQuickAddOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [cats, sett] = await Promise.all([api.getCategories(), api.getSettings()]);
      setCategories(cats);
      setSettings(sett);
    } catch (e) {
      console.error('Failed to load app data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshCategories = async () => {
    const cats = await api.getCategories();
    setCategories(cats);
  };
  const refreshSettings = async () => {
    const s = await api.getSettings();
    setSettings(s);
  };

  return (
    <AppContext.Provider value={{
      categories, refreshCategories,
      settings, refreshSettings, loading,
      currentMonth, setCurrentMonth,
      currentYear, setCurrentYear,
      quickAddOpen, setQuickAddOpen,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
