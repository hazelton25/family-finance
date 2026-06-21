import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { api, fmt } from '../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function money0(n) { return '$' + Math.round(Math.abs(n || 0)).toLocaleString('en-CA'); }

export default function Reports() {
  const { currentMonth, currentYear, settings } = useApp();
  const [period, setPeriod] = useState('six'); // month | six | year
  const [pm, setPm] = useState(currentMonth);
  const [py, setPy] = useState(currentYear);
  const [monthData, setMonthData] = useState(null);
  const [trend, setTrend] = useState([]);

  // load month detail (current selected month in 'month' mode, else current month for ranking base)
  const load = useCallback(async () => {
    const s = await api.getSummary({ month: pm, year: py });
    setMonthData(s);
    setTrend(s.trend || []);
  }, [pm, py]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener('hearth:refresh', h);
    return () => window.removeEventListener('hearth:refresh', h);
  }, [load]);

  const shiftMonth = (d) => {
    let m = pm + d, y = py;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setPm(m); setPy(y);
  };

  if (!monthData) return <div className="page"><div className="eyebrow">Loading…</div></div>;

  // build window from trend (trend = ~7 months around selected). For 'six'/'year' use trend tail.
  const allTrend = trend.map(t => {
    const [yy, mm] = t.month.split('-');
    return { label: MONTHS[parseInt(mm) - 1], y: parseInt(yy), m: parseInt(mm), inc: t.income, out: t.expenses };
  });
  let win;
  if (period === 'month') win = allTrend.filter(t => t.m === pm && t.y === py);
  else if (period === 'six') win = allTrend.slice(-6);
  else win = allTrend; // year = whatever trend returned (up to ~7); good enough for demo

  const periodLabel = period === 'month' ? `${MONTHS_LONG[pm - 1]} ${py}` : period === 'six' ? 'Last 6 months' : `${py}`;

  const max = Math.max(...win.flatMap(w => [w.inc, w.out]), 1);
  const inc = win.reduce((s, w) => s + w.inc, 0);
  const out = win.reduce((s, w) => s + w.out, 0);

  // ranked categories from selected month's by_category (live), scaled for multi-month
  const monthExpense = (monthData.by_category || []).filter(c => c.type === 'expense' && c.total > 0);
  const monthOut = monthData.expenses || 1;
  const scale = period === 'month' ? 1 : (out / monthOut);
  const ranked = monthExpense.map(c => ({ ...c, scaled: c.total * scale })).sort((a, b) => b.scaled - a.scaled);
  const top = ranked[0]?.scaled || 1;
  const isLive = period === 'month';

  // ---- exports ----
  const exportExcel = () => {
    const th = `style="background:#2A5C46;color:#fff;font-weight:bold;padding:6px 10px;text-align:left;border:1px solid #1f4534"`;
    const td = `style="padding:5px 10px;border:1px solid #ddd"`;
    const tdR = `style="padding:5px 10px;border:1px solid #ddd;text-align:right;mso-number-format:'$#,##0.00'"`;
    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>
      <tr><td colspan="4" style="font-size:18px;font-weight:bold;padding:10px 0">Hearth — Family Finance Report</td></tr>
      <tr><td colspan="4" style="color:#666;padding-bottom:14px">Period: ${periodLabel} · ${settings?.family_name || ''}</td></tr>
      <tr><th ${th}>Summary</th><th ${th}>Amount</th><td></td><td></td></tr>
      <tr><td ${td}>Total income</td><td ${tdR}>${inc.toFixed(2)}</td></tr>
      <tr><td ${td}>Total spending</td><td ${tdR}>${out.toFixed(2)}</td></tr>
      <tr><td ${td}>Net</td><td ${tdR}>${(inc - out).toFixed(2)}</td></tr>
      <tr><td colspan="4" style="padding:8px"></td></tr>
      <tr><th ${th}>Category</th><th ${th}>Spent</th><th ${th}>% of spend</th><td></td></tr>
      ${ranked.map(c => `<tr><td ${td}>${c.name}</td><td ${tdR}>${c.scaled.toFixed(2)}</td><td ${td} align="right">${(c.scaled / out * 100).toFixed(1)}%</td></tr>`).join('')}
      </table></body></html>`;
    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hearth-report-' + periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.xls';
    a.click(); URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hearth Report — ${periodLabel}</title>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Hanken Grotesk',sans-serif;color:#1A1D18;padding:48px 52px;font-size:13px}
    .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid #1A1D18;padding-bottom:18px;margin-bottom:26px}
    h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:30px;letter-spacing:-.02em}
    .eyebrow{font-family:'Spline Sans Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8A8F86;margin-bottom:4px}
    .stats{display:flex;gap:40px;margin-bottom:30px}.stat .v{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;font-size:26px}
    .pos{color:#2A5C46}.neg{color:#E4572E}
    h2{font-family:'Spline Sans Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A8F86;font-weight:500;margin:26px 0 10px;border-bottom:1px solid #E3E1D8;padding-bottom:7px}
    table{width:100%;border-collapse:collapse}th{font-family:'Spline Sans Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#8A8F86;text-align:left;font-weight:500;padding:6px 8px;border-bottom:1px solid #E3E1D8}
    td{padding:7px 8px;border-bottom:1px solid #F0EEE6}.r{text-align:right;font-family:'Spline Sans Mono',monospace;font-size:12px}
    .bar{height:7px;background:#F0EEE6;border-radius:99px;overflow:hidden;min-width:120px}.fill{height:100%;background:#2A5C46;border-radius:99px}
    .foot{margin-top:34px;padding-top:14px;border-top:1px solid #E3E1D8;font-family:'Spline Sans Mono',monospace;font-size:9.5px;color:#8A8F86;display:flex;justify-content:space-between}
    @media print{body{padding:24px 28px}}</style></head><body>
    <div class="head"><div><div class="eyebrow">Family finance report</div><h1>Hearth</h1></div>
    <div style="text-align:right"><div class="eyebrow">Period</div><div style="font-weight:700;font-size:16px">${periodLabel}</div></div></div>
    <div class="stats">
      <div class="stat"><div class="eyebrow">Income</div><div class="v pos">${money0(inc)}</div></div>
      <div class="stat"><div class="eyebrow">Spending</div><div class="v neg">${money0(out)}</div></div>
      <div class="stat"><div class="eyebrow">Net</div><div class="v ${inc - out >= 0 ? 'pos' : 'neg'}">${inc - out >= 0 ? '+' : ''}${money0(inc - out)}</div></div>
      <div class="stat"><div class="eyebrow">Savings rate</div><div class="v">${inc > 0 ? Math.round((inc - out) / inc * 100) : 0}%</div></div>
    </div>
    <h2>Spending by category</h2><table>
    <tr><th>Category</th><th></th><th style="text-align:right">Spent</th><th style="text-align:right">% of spend</th></tr>
    ${ranked.map(c => `<tr><td style="font-weight:600">${c.icon} ${c.name}</td><td><div class="bar"><div class="fill" style="width:${(c.scaled / top * 100).toFixed(1)}%"></div></div></td><td class="r">${money0(c.scaled)}</td><td class="r">${(c.scaled / out * 100).toFixed(1)}%</td></tr>`).join('')}
    </table>
    <div class="foot"><span>Generated by Hearth · ${new Date().toLocaleDateString('en-CA')}</span><span>${settings?.family_name || 'hearth.local'}</span></div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <div className="eyebrow">{periodLabel}</div>
          <h1 className="page-title">Reports</h1>
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          <button className="btn-export" onClick={exportExcel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 13 6 6m0-6-6 6" /></svg>
            Excel
          </button>
          <button className="btn-export" onClick={exportPDF}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6m-3 3 3 3 3-3" /></svg>
            PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center mb-[18px]">
        <div className="seg">
          {[['month', 'Month'], ['six', '6 months'], ['year', 'Year']].map(([v, l]) => (
            <button key={v} className={period === v ? 'on' : ''} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
        {period === 'month' && (
          <div className="month-pager">
            <button className="pager-btn" onClick={() => shiftMonth(-1)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg></button>
            <span className="pager-label">{MONTHS[pm - 1]} {py}</span>
            <button className="pager-btn" onClick={() => shiftMonth(1)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg></button>
          </div>
        )}
      </div>

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="card card-pad">
          <div className="flex justify-between items-baseline mb-[18px]">
            <span className="eyebrow">Income vs spending</span>
            <span className="flex gap-[18px]">
              <span className="flex items-center gap-[7px] mono" style={{ fontSize: 11.5, color: 'var(--stone)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--fir)' }} />in</span>
              <span className="flex items-center gap-[7px] mono" style={{ fontSize: 11.5, color: 'var(--stone)' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--coral)' }} />out</span>
            </span>
          </div>
          <div className="flex items-end gap-2.5" style={{ height: 200, paddingTop: 10 }}>
            {win.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex gap-1 items-end w-full justify-center" style={{ height: '100%' }}>
                  <div title={`in ${money0(w.inc)}`} style={{ width: '38%', maxWidth: 26, height: `${(w.inc / max * 100).toFixed(1)}%`, background: 'var(--fir)', borderRadius: '6px 6px 2px 2px' }} />
                  <div title={`out ${money0(w.out)}`} style={{ width: '38%', maxWidth: 26, height: `${(w.out / max * 100).toFixed(1)}%`, background: 'var(--coral)', borderRadius: '6px 6px 2px 2px' }} />
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--stone)' }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow mb-[18px]">Where it goes · {periodLabel.toLowerCase()}</div>
          {ranked.map((c, i) => (
            <div key={c.category_id || c.name} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: i < ranked.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--stone)', width: 18 }}>{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 font-semibold" style={{ fontSize: 13.5 }}>{c.icon} {c.name}</span>
              <div style={{ flex: 2, height: 6, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.scaled / top * 100).toFixed(1)}%`, background: 'var(--ink)', borderRadius: 99 }} />
              </div>
              <span className="mono" style={{ fontSize: 12.5, width: 84, textAlign: 'right' }}>{money0(c.scaled)}</span>
            </div>
          ))}
          {!isLive && <div className="eyebrow" style={{ marginTop: 14 }}>estimated from category mix · live detail for current month</div>}
        </div>
      </div>
    </div>
  );
}
