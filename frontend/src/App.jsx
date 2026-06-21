import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { Masthead, BottomNav, Toast } from './components/layout/Masthead';
import QuickAdd from './components/ui/QuickAdd';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

function AppShell() {
  const { quickAddOpen } = useApp();
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)' }}>
      <Masthead />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets"      element={<Budgets />} />
          <Route path="/reports"      element={<Reports />} />
          <Route path="/categories"   element={<Categories />} />
          <Route path="/settings"     element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
      <Toast />
      {quickAddOpen && <QuickAdd />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/finance">
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}
