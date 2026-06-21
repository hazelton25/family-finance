import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

const TABS = [
  { to: '/dashboard',    label: 'Overview' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets',      label: 'Budgets' },
  { to: '/categories',   label: 'Categories' },
  { to: '/reports',      label: 'Reports' },
];

const BOTTOM = [
  { to: '/dashboard', label: 'Home', icon: <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" /> },
  { to: '/transactions', label: 'Activity', icon: <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" /> },
  { fab: true },
  { to: '/budgets', label: 'Budgets', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></> },
  { to: '/reports', label: 'Reports', icon: <path d="M3 3v18h18M7 15l4-5 4 3 4-6" /> },
];

export function Masthead() {
  const { settings, setQuickAddOpen } = useApp();
  const familyName = settings?.family_name || 'Hearth';

  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(247,246,241,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}>
      <div className="flex items-center gap-7 px-6 mx-auto" style={{ maxWidth: 1080, height: 64 }}>
        <div className="display flex items-center gap-2.5" style={{ fontWeight: 700, fontSize: 21 }}>
          <span className="inline-flex items-center justify-center rounded-full mono" style={{ width: 26, height: 26, background: 'var(--fir)', color: 'var(--paper)', fontSize: 13, fontWeight: 600 }}>$</span>
          Hearth
        </div>
        <nav className="hidden md:flex gap-0.5 ml-2">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to}>
              {({ isActive }) => <span className={isActive ? 'tab on' : 'tab'}>{t.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden md:inline mono" style={{ fontSize: 11, color: 'var(--stone)' }}>
            <kbd style={{ border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 5, padding: '1px 5px' }}>N</kbd> quick add
          </span>
          <button className="btn-add" onClick={() => setQuickAddOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
            Add expense
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { setQuickAddOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] flex justify-around items-center"
      style={{ background: 'rgba(247,246,241,.95)', backdropFilter: 'blur(14px)', borderTop: '1px solid var(--line)', padding: '8px 6px calc(8px + env(safe-area-inset-bottom))' }}>
      {BOTTOM.map((b, i) => {
        if (b.fab) return (
          <button key="fab" onClick={() => setQuickAddOpen(true)} aria-label="Add expense"
            className="grid place-items-center text-white"
            style={{ width: 50, height: 50, borderRadius: 16, border: 'none', background: 'var(--fir)', marginTop: -22, boxShadow: '0 6px 18px rgba(42,92,70,.4)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        );
        const active = location.pathname.startsWith(b.to);
        return (
          <button key={b.to} onClick={() => navigate(b.to)}
            className="flex flex-col items-center gap-[3px] mono"
            style={{ border: 'none', background: 'none', fontSize: 10, color: active ? 'var(--fir)' : 'var(--stone)', padding: '4px 10px' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{b.icon}</svg>
            {b.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Toast() {
  const { toast } = useApp();
  return (
    <div className="fixed left-1/2 z-[200] pointer-events-none transition-all"
      style={{
        bottom: 90,
        transform: `translateX(-50%) translateY(${toast ? '0' : '12px'})`,
        opacity: toast ? 1 : 0,
        background: 'var(--ink)', color: 'var(--paper)',
        fontSize: 13.5, fontWeight: 600, padding: '11px 20px', borderRadius: 99,
        boxShadow: '0 8px 28px rgba(26,29,24,.3)',
      }}>
      {toast}
    </div>
  );
}
