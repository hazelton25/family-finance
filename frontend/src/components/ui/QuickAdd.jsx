import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api, fmt } from '../../lib/api';

const TODAY = () => new Date().toISOString().split('T')[0];

export default function QuickAdd() {
  const { categories, setQuickAddOpen, showToast } = useApp();
  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState(null);
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(TODAY());
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const amtRef = useRef(null);

  const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both');

  useEffect(() => { const t = setTimeout(() => amtRef.current?.focus(), 80); return () => clearTimeout(t); }, []);

  const close = () => setQuickAddOpen(false);

  const shake = (el) => el?.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
    { duration: 220 });

  const save = async (closeAfter) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { amtRef.current?.focus(); shake(amtRef.current); return; }
    if (!catId) { shake(document.getElementById('qa-chips')); return; }
    const cat = categories.find(c => c.id === catId);
    setSaving(true);
    try {
      await api.createTransaction({
        date, amount: amt, type: 'expense', category_id: catId,
        description: desc.trim() || cat.name, payment_method: 'bank', is_recurring: 0,
      });
      if (closeAfter) {
        close();
        showToast(`Expense saved — ${fmt.currency(amt)}`);
        window.dispatchEvent(new Event('hearth:refresh'));
      } else {
        setAmount(''); setDesc('');
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
        amtRef.current?.focus();
        window.dispatchEvent(new Event('hearth:refresh'));
      }
    } catch (e) {
      showToast('Could not save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(e.metaKey || e.ctrlKey); }
  };

  const selCat = categories.find(c => c.id === catId);

  return (
    <div className="scrim" onClick={e => e.target === e.currentTarget && close()} onKeyDown={onKey}>
      <div className="sheet" role="dialog" aria-label="Add expense">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="eyebrow">Quick add</div>
            <div className="display" style={{ fontWeight: 600, fontSize: 22 }}>New expense</div>
          </div>
          <button className="x-btn" onClick={close} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="f-label" htmlFor="qa-amt">Amount</label>
          <div className="amt-input">
            <span>$</span>
            <input ref={amtRef} id="qa-amt" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <label className="f-label">Category</label>
          <div id="qa-chips" className="flex flex-wrap gap-[7px]">
            {expenseCats.map(c => (
              <button key={c.id} className={catId === c.id ? 'chip on' : 'chip'} onClick={() => setCatId(c.id)}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="f-label" htmlFor="qa-desc">Description</label>
          <input id="qa-desc" className="f-input" type="text" placeholder="What was it for?"
            value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="mb-4">
          <label className="f-label" htmlFor="qa-date">Date</label>
          <input id="qa-date" className="f-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {savedFlash && (
          <div className="flex items-center gap-2 mono animate-fade" style={{ fontSize: 12, color: 'var(--fir)', background: 'var(--fir-soft)', borderRadius: 10, padding: '9px 13px', marginBottom: 14 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            Saved — ready for the next one
          </div>
        )}

        <div className="flex gap-2.5 mt-5">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => save(false)} disabled={saving}>Save &amp; add another</button>
          <button className="btn-go" style={{ flex: 1.4 }} onClick={() => save(true)} disabled={saving}>Save expense</button>
        </div>
      </div>
    </div>
  );
}
