import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../lib/api';

export default function Settings() {
  const { settings, refreshSettings, showToast } = useApp();
  const [familyName, setFamilyName] = useState(settings?.family_name || '');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateSettings({ family_name: familyName });
      await refreshSettings();
      showToast('Settings saved');
    } catch (e) { showToast('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset all data and reload the sample household? This erases your transactions, budgets, and categories.')) return;
    setResetting(true);
    try {
      const d = await api.reseed();
      if (d.ok) { showToast('Sample data restored'); setTimeout(() => window.location.reload(), 600); }
      else showToast('Error: ' + (d.error || 'failed'));
    } catch (e) { showToast('Failed: ' + e.message); }
    finally { setResetting(false); }
  };

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-h">
        <div>
          <div className="eyebrow">Configuration</div>
          <h1 className="page-title">Settings</h1>
        </div>
      </div>

      <div className="card card-pad mb-[18px]">
        <div className="eyebrow mb-4">Household</div>
        <label className="f-label" htmlFor="fname">Family name</label>
        <input id="fname" className="f-input" type="text" value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="The Hazelton family" />
        <div className="mt-4">
          <button className="btn-go" style={{ padding: '11px 22px' }} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </div>

      <div className="card card-pad mb-[18px]">
        <div className="eyebrow mb-4">Data &amp; backup</div>
        <p style={{ fontSize: 14, color: 'var(--stone)', marginBottom: 14 }}>
          Your data lives in a SQLite file on the Mac Mini, mounted outside Docker so it survives rebuilds.
        </p>
        <div className="mono" style={{ fontSize: 12, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 13px', color: 'var(--ink)' }}>
          ~/projects/family-finance/data/family-finance.db
        </div>
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="font-bold mb-1" style={{ fontSize: 14 }}>Reset to sample data</div>
          <p style={{ fontSize: 13, color: 'var(--stone)', marginBottom: 12 }}>Wipes everything and reloads the demo household. No SSH required.</p>
          <button className="btn-secondary" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)', padding: '11px 18px' }} onClick={reset} disabled={resetting}>
            {resetting ? 'Resetting…' : 'Reset to sample data'}
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <div className="eyebrow mb-4">About</div>
        {[['App', 'Hearth · Family Finance'], ['Stack', 'React · Express · SQLite'], ['Fonts', 'Bricolage Grotesque · Hanken Grotesk · Spline Sans Mono']].map(([k, v]) => (
          <div key={k} className="flex justify-between" style={{ padding: '7px 0' }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--stone)' }}>{k}</span>
            <span className="mono" style={{ fontSize: 12 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
