import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api, fmt } from '../lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function money0(n) { return '$' + Math.round(Math.abs(n || 0)).toLocaleString('en-CA'); }

export default function Dashboard() {
  const { currentMonth, setCurrentMonth, currentYear, setCurrentYear, settings } = useApp();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [recent, setRecent] = useState([]);

  const load = useCallback(async () => {
    const [summary, perf, txns] = await Promise.all([
      api.getSummary({ month: currentMonth, year: currentYear }),
      api.getBudgetPerformance({ month: currentMonth, year: currentYear }),
      api.getTransactions({ month: currentMonth, year: currentYear, limit: 6 }),
    ]);
    setData(summary);
    setBudgets(perf || []);
    setRecent(txns.transactions || txns.items || txns || []);
  }, [currentMonth, currentYear]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener('hearth:refresh', h);
    return () => window.removeEventListener('hearth:refresh', h);
  }, [load]);

  const shiftMonth = (d) => {
    let m = currentMonth + d, y = currentYear;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setCurrentMonth(m); setCurrentYear(y);
  };

  if (!data) return <div className="page"><div className="eyebrow">Loading…</div></div>;

  const income = data.income || 0;
  const spent = data.expenses || 0;
  const left = income - spent;
  const expenseCats = (data.by_category || []).filter(c => c.type === 'expense' && c.total > 0).sort((a, b) => b.total - a.total);
  const savingsCat = expenseCats.find(c => /saving|tfsa|rrsp|resp/i.test(c.name));
  const saved = savingsCat ? savingsCat.total : 0;
  const rate = income > 0 ? Math.round(((income - spent) / income) * 100) : 0;

  // cashflow strip
  const unspent = Math.max(income - spent, 0);
  const flowTotal = spent + unspent || 1;
  const movers = budgets.filter(b => b.budget > 0).map(b => ({ ...b, pct: (b.actual / b.budget) * 100 }))
    .sort((a, b) => b.pct - a.pct).slice(0, 5);

  const monthName = MONTHS[currentMonth - 1];
  const cents = Math.round(Math.abs(left % 1) * 100);

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">{monthName} {currentYear} · {settings?.family_name || 'Your household'}</div>
          <h1 className="page-title">Where the money went</h1>
        </div>
        <div className="month-pager">
          <button className="pager-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="pager-label">{monthName.slice(0, 3)} {currentYear}</span>
          <button className="pager-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* hero */}
      <div className="card card-pad mb-[18px]">
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div>
            <div className="eyebrow mb-1.5">Left to spend this month</div>
            <div className="display tnum" style={{ fontWeight: 600, fontSize: 'clamp(44px,7vw,68px)', lineHeight: 1 }}>
              ${Math.floor(Math.abs(left)).toLocaleString('en-CA')}
              <span style={{ fontSize: '.45em', color: 'var(--stone)', fontWeight: 500 }}>.{String(cents).padStart(2, '0')}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--stone)', marginTop: 8 }}>
              of {money0(income)} income · {money0(spent)} spent so far
            </div>
          </div>
          <div className="flex gap-[34px] flex-wrap">
            {[['Income', money0(income), 'pos'], ['Spent', money0(spent), 'neg'], ['Saved', money0(saved), 'pos'], ['Savings rate', rate + '%', rate >= 20 ? 'pos' : '']].map(([label, val, cls]) => (
              <div key={label}>
                <div className="eyebrow mb-1">{label}</div>
                <div className={`display tnum ${cls}`} style={{ fontWeight: 600, fontSize: 24 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* cashflow strip */}
        <div className="mt-[30px]">
          <div className="flex justify-between items-baseline mb-2.5">
            <span className="eyebrow">Cashflow · income split by destination</span>
            <span className="eyebrow">{money0(income)} in</span>
          </div>
          <div className="flex overflow-hidden" style={{ height: 46, borderRadius: 10, border: '1px solid var(--line)' }}>
            {expenseCats.map((c, i) => (
              <div key={c.category_id} title={`${c.name} ${money0(c.total)}`}
                style={{ width: `${(c.total / flowTotal * 100).toFixed(2)}%`, minWidth: 6, background: c.color || 'var(--fir)', borderRight: i < expenseCats.length - 1 || unspent > 0 ? '2px solid var(--paper)' : 'none' }} />
            ))}
            {unspent > 0 && (
              <div title={`Unspent ${money0(unspent)}`} style={{ width: `${(unspent / flowTotal * 100).toFixed(2)}%`, minWidth: 8, background: 'repeating-linear-gradient(-45deg,var(--fir-soft),var(--fir-soft) 5px,#fff 5px,#fff 10px)' }} />
            )}
          </div>
          <div className="flex gap-4 flex-wrap mt-3">
            {expenseCats.slice(0, 6).map(c => (
              <span key={c.category_id} className="flex items-center gap-[7px] mono" style={{ fontSize: 11.5, color: 'var(--stone)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color || 'var(--fir)' }} />
                {c.name} <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{money0(c.total)}</b>
              </span>
            ))}
            {unspent > 0 && (
              <span className="flex items-center gap-[7px] mono" style={{ fontSize: 11.5, color: 'var(--stone)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'repeating-linear-gradient(-45deg,var(--fir-soft),var(--fir-soft) 3px,#fff 3px,#fff 6px)', border: '1px solid var(--line)' }} />
                unspent <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{money0(unspent)}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* two-up */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="card card-pad">
          <div className="flex justify-between items-baseline mb-[18px]">
            <span className="eyebrow">Budgets · top movers</span>
            <button className="link-more" onClick={() => nav('/budgets')}>all budgets →</button>
          </div>
          {movers.length === 0 && <div className="eyebrow">No budgets set yet</div>}
          {movers.map(b => {
            const pct = Math.min(b.pct, 100);
            const cls = b.pct > 100 ? 'over' : b.pct > 85 ? 'warn' : '';
            return (
              <div key={b.category_id} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="font-semibold flex items-center gap-2" style={{ fontSize: 13.5 }}>
                    <span style={{ fontSize: 15 }}>{b.icon}</span>{b.category_name}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--stone)' }}>
                    <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{money0(b.actual)}</b> / {money0(b.budget)}
                  </span>
                </div>
                <div className="b-track"><div className={`b-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
                {b.pct > 100 && <div className="mono" style={{ fontSize: 11, color: 'var(--coral)', marginTop: 4 }}>over by {money0(b.actual - b.budget)}</div>}
              </div>
            );
          })}
        </div>

        <div className="card card-pad">
          <div className="flex justify-between items-baseline mb-[18px]">
            <span className="eyebrow">Latest activity</span>
            <button className="link-more" onClick={() => nav('/transactions')}>all transactions →</button>
          </div>
          {recent.length === 0 && <div className="eyebrow">No transactions yet</div>}
          {recent.map(t => (
            <div key={t.id} className="t-row">
              <div className="t-ic">{t.type === 'income' ? '💼' : (t.category_icon || '💰')}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ fontSize: 14 }}>{t.description}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--stone)', marginTop: 1 }}>
                  {fmt.shortDate(t.date)}{t.category_name ? ' · ' + t.category_name : ''}
                </div>
              </div>
              <span className={`display tnum ${t.type === 'income' ? 'pos' : ''}`} style={{ fontWeight: 600, fontSize: 15.5 }}>
                {t.type === 'income' ? '+' : '−'}{fmt.currency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
