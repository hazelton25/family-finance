import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';

const EMOJIS = ['🏠','🛒','🏒','⚽','🏦','⛽','🚗','🍽️','☕','⚡','🦷','💊','📺','✈️','🎁','🐾','🎓','👕','💪','🔨','🎬','🧹','📦','💼','💵','📈','🏛️','🛡️'];
const COLORS = ['#2A5C46','#3E7CB1','#C9A227','#E4572E','#8A6FBE','#B5536B','#D98E32','#5B7B6E','#6B7280','#1F7A8C'];
function money0(n) { return '$' + Math.round(Math.abs(n || 0)).toLocaleString('en-CA'); }

export default function Categories() {
  const { categories, refreshCategories, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [emoji, setEmoji] = useState('🏷️');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditId(null); setName(''); setType('expense'); setEmoji('🏷️'); setColor(COLORS[0]); setOpen(true);
  };
  const openEdit = (c) => {
    setEditId(c.id); setName(c.name); setType(c.type); setEmoji(c.icon); setColor(c.color); setOpen(true);
  };
  const close = () => setOpen(false);

  const shake = (el) => el?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 220 });

  const save = async () => {
    if (!name.trim()) { shake(document.getElementById('cat-name')); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.updateCategory(editId, { name: name.trim(), type, color, icon: emoji });
        showToast('Category updated');
      } else {
        await api.createCategory({ name: name.trim(), type, color, icon: emoji });
        showToast('Category created — ' + name.trim());
      }
      await refreshCategories();
      window.dispatchEvent(new Event('hearth:refresh'));
      close();
    } catch (e) {
      showToast('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    const c = categories.find(x => x.id === editId);
    if (!confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    try {
      await api.deleteCategory(editId);
      showToast('Category deleted');
      await refreshCategories();
      close();
    } catch (e) {
      showToast(e.message);
    }
  };

  const sorted = [...categories].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'income' ? 1 : -1;
    return (b.transaction_count || 0) - (a.transaction_count || 0);
  });

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">{categories.length} categories</div>
          <h1 className="page-title">Categories</h1>
        </div>
        <button className="btn-add" onClick={openNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
          New category
        </button>
      </div>

      <div className="card" style={{ padding: '8px 24px' }}>
        {sorted.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3.5" style={{ padding: '14px 0', borderBottom: i < sorted.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <div className="grid place-items-center shrink-0" style={{ width: 42, height: 42, borderRadius: 12, fontSize: 19, background: (c.color || '#888') + '1f', border: '1px solid ' + (c.color || '#888') + '55' }}>{c.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold" style={{ fontSize: 14.5 }}>{c.name}</div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--stone)', marginTop: 1 }}>
                {c.transaction_count || 0} transaction{(c.transaction_count || 0) === 1 ? '' : 's'} · <span style={{ textTransform: 'capitalize' }}>{c.type}</span>
              </div>
            </div>
            <button className="chip" onClick={() => openEdit(c)} style={{ padding: '6px 14px' }}>Edit</button>
          </div>
        ))}
      </div>

      {open && (
        <div className="scrim" onClick={e => e.target === e.currentTarget && close()}>
          <div className="sheet" role="dialog">
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="eyebrow">{editId ? 'Edit' : 'New'}</div>
                <div className="display" style={{ fontWeight: 600, fontSize: 22 }}>{editId ? name || 'Category' : 'Category'}</div>
              </div>
              <button className="x-btn" onClick={close}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
            </div>

            {/* preview */}
            <div className="flex items-center gap-3 mb-4" style={{ background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
              <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 11, fontSize: 20, background: color + '1f', border: '1px solid ' + color + '55' }}>{emoji}</div>
              <div>
                <div className="font-bold">{name || 'Category name'}</div>
                <div className="eyebrow" style={{ textTransform: 'capitalize' }}>{type}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="f-label" htmlFor="cat-name">Name</label>
              <input id="cat-name" className="f-input" type="text" placeholder="e.g. Pets" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="mb-4">
              <label className="f-label">Type</label>
              <div className="flex gap-2">
                {['expense', 'income', 'both'].map(t => (
                  <button key={t} className={type === t ? 'chip on' : 'chip'} style={{ textTransform: 'capitalize', flex: 1 }} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="f-label">Emoji</label>
              <div className="flex flex-wrap gap-[7px]">
                {EMOJIS.map(e => (
                  <button key={e} className={emoji === e ? 'chip on' : 'chip'} style={{ padding: '7px 10px', fontSize: 16 }} onClick={() => setEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="f-label">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} className={color === c ? 'swatch on' : 'swatch'} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 mt-[22px]">
              {editId && <button className="btn-secondary" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }} onClick={del}>Delete</button>}
              <button className="btn-secondary" style={{ flex: 1 }} onClick={close}>Cancel</button>
              <button className="btn-go" style={{ flex: 1.4 }} onClick={save} disabled={saving}>{editId ? 'Save changes' : 'Create category'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
