import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { api, fmt } from '../lib/api';

export default function Transactions() {
  const { showToast } = useApp();
  const [txns, setTxns] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = useCallback(async () => {
    const params = {};
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search.trim()) params.search = search.trim();
    const res = await api.getTransactions(params);
    setTxns(res.transactions || []);
    setTotal(res.total || 0);
  }, [typeFilter, search]);

  useEffect(() => {
    const id = setTimeout(load, search ? 220 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('hearth:refresh', h);
    return () => window.removeEventListener('hearth:refresh', h);
  }, [load]);

  const del = async (id) => {
    await api.deleteTransaction(id);
    showToast('Transaction deleted');
    load();
  };

  // group by day
  const groups = [];
  let last = null;
  for (const t of txns) {
    if (t.date !== last) { groups.push({ date: t.date, items: [] }); last = t.date; }
    groups[groups.length - 1].items.push(t);
  }
  const dayLabel = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">{total} record{total === 1 ? '' : 's'}</div>
          <h1 className="page-title">Transactions</h1>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-[18px]">
        <div className="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="search" placeholder="Search descriptions or notes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="seg">
          {[['all', 'All'], ['expense', 'Spending'], ['income', 'Income']].map(([v, l]) => (
            <button key={v} className={typeFilter === v ? 'on' : ''} onClick={() => setTypeFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        {groups.length === 0 && <div className="text-center py-12 eyebrow">nothing matches</div>}
        {groups.map((g, gi) => (
          <div key={g.date}>
            <div className="eyebrow" style={{ padding: gi === 0 ? '0 0 6px' : '18px 0 6px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
              {dayLabel(g.date)}
            </div>
            {g.items.map(t => (
              <div key={t.id} className="t-row">
                <div className="t-ic">{t.type === 'income' ? '💼' : (t.category_icon || '💰')}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate" style={{ fontSize: 14 }}>{t.description}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--stone)', marginTop: 1 }}>
                    {fmt.shortDate(t.date)}{t.category_name ? ' · ' + t.category_name : ''}{t.payment_method ? ' · ' + t.payment_method : ''}
                  </div>
                </div>
                <span className={`display tnum ${t.type === 'income' ? 'pos' : ''}`} style={{ fontWeight: 600, fontSize: 15.5 }}>
                  {t.type === 'income' ? '+' : '−'}{fmt.currency(t.amount)}
                </span>
                <button className="t-del" onClick={() => del(t.id)} aria-label="Delete">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
