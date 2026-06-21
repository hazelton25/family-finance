import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function money0(n) { return '$' + Math.round(Math.abs(n || 0)).toLocaleString('en-CA'); }

export default function Budgets() {
  const { categories, currentMonth, setCurrentMonth, currentYear, setCurrentYear, showToast } = useApp();
  const nav = useNavigate();
  const [perf, setPerf] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');

  const load = useCallback(async () => {
    const p = await api.getBudgetPerformance({ month: currentMonth, year: currentYear });
    setPerf(p || []);
  }, [currentMonth, currentYear]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener('hearth:refresh', h);
    return () => window.removeEventListener('hearth:refresh', h);
  }, [load]);

  const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both');
  const perfById = Object.fromEntries(perf.map(p => [p.category_id, p]));
  const rows = expenseCats.map(c => ({
    category_id: c.id, category_name: c.name, icon: c.icon, color: c.color,
    budget: perfById[c.id]?.budget || 0, actual: perfById[c.id]?.actual || 0,
  })).sort((a, b) => b.actual - a.actual);

  const planned = rows.reduce((s, r) => s + r.budget, 0);
  const spent = rows.reduce((s, r) => s + r.actual, 0);

  const shiftMonth = (d) => {
    let m = currentMonth + d, y = currentYear;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setCurrentMonth(m); setCurrentYear(y);
  };

  const startEdit = (r) => { setEditing(r.category_id); setEditVal(r.budget || ''); };
  const commit = async (r) => {
    const v = parseFloat(editVal);
    if (!isNaN(v) && v >= 0) {
      await api.createBudget({ category_id: r.category_id, amount: v, year: currentYear, month: currentMonth });
      showToast('Budget updated');
      load();
    }
    setEditing(null);
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">Monthly plan · {MONTHS[currentMonth - 1]} {currentYear}</div>
          <h1 className="page-title">Budgets</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="month-pager">
            <button className="pager-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="pager-label">{MONTHS[currentMonth - 1].slice(0, 3)} {currentYear}</span>
            <button className="pager-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
          <button className="link-more" onClick={() => nav('/categories')}>manage categories →</button>
        </div>
      </div>

      <div className="grid gap-3.5 mb-[22px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[['Planned', money0(planned), 'var(--ink)'], ['Spent', money0(spent), spent > planned ? 'var(--coral)' : 'var(--ink)'], ['Remaining', money0(planned - spent), planned - spent < 0 ? 'var(--coral)' : 'var(--fir)']].map(([l, v, c]) => (
          <div key={l} className="card" style={{ padding: '18px 20px' }}>
            <div className="eyebrow mb-[5px]">{l}</div>
            <div className="display tnum" style={{ fontWeight: 600, fontSize: 26, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad">
        {rows.map((r, i) => {
          const pct = r.budget > 0 ? (r.actual / r.budget) * 100 : 0;
          const cls = pct > 100 ? 'over' : pct > 85 ? 'warn' : '';
          return (
            <div key={r.category_id} style={{ padding: '14px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13.5 }}>
                  <span style={{ fontSize: 15 }}>{r.icon}</span>{r.category_name}
                </span>
                <span className="flex items-center gap-2.5">
                  {editing === r.category_id ? (
                    <input autoFocus type="number" className="mono" value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commit(r)}
                      onKeyDown={e => { if (e.key === 'Enter') commit(r); if (e.key === 'Escape') setEditing(null); }}
                      style={{ width: 90, fontSize: 13, textAlign: 'right', border: '1px solid var(--fir)', borderRadius: 8, padding: '4px 8px', background: 'var(--card)', outline: 'none' }} />
                  ) : (
                    <span className="mono" style={{ fontSize: 12, color: 'var(--stone)' }}>
                      <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{money0(r.actual)}</b> / {r.budget > 0 ? money0(r.budget) : '—'}
                    </span>
                  )}
                  <button className="link-more" onClick={() => startEdit(r)}>edit</button>
                </span>
              </div>
              <div className="b-track"><div className={`b-fill ${cls}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              {pct > 100 && <div className="mono" style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4 }}>over by {money0(r.actual - r.budget)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
