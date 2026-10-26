'use strict';
// HomeFlow · Σελίδα «Ιστορικό»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Ιστορικό ----------
function historyRows() {
  const ys = new Set([...Object.keys(DB.history).map(Number), ...yearsWithTx()]);
  return [...ys].sort((a, b) => a - b).map(y => {
    const tx = DB.transactions.filter(t => yOf(t) === y && !t.planned);
    const h = DB.history[String(y)] || {};
    const hasE = tx.some(t => t.type === 'expense'), hasI = tx.some(t => t.type === 'income');
    const e = hasE ? sum(tx.filter(t => t.type === 'expense')) : (h.expenses != null ? h.expenses : null);
    const i = hasI ? sum(tx.filter(t => t.type === 'income')) : (h.income != null ? h.income : null);
    return { y, e, i, src: hasE || hasI ? 'HomeFlow' : 'Excel' };
  });
}
function historyPage() {
  const rows = historyRows();
  const max = Math.max(1, ...rows.map(r => Math.max(r.e || 0, r.i || 0)));
  const W = 1000, H = 300, L = 60, B = 34, T = 14;
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / Math.max(rows.length, 1);
  let svg = '';
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  rows.forEach((r, k) => {
    const x = L + k * gw + gw * 0.1, bw = gw * 0.38;
    if (r.i != null) svg += `<rect x="${x}" y="${y(r.i)}" width="${bw}" height="${y(0) - y(r.i)}" rx="3" style="fill:var(--inc)"><title>Έσοδα ${r.y}: ${eur(r.i)}</title></rect>`;
    if (r.e != null) svg += `<rect x="${x + bw + 2}" y="${y(r.e)}" width="${bw}" height="${y(0) - y(r.e)}" rx="3" style="fill:var(--exp)"><title>Έξοδα ${r.y}: ${eur(r.e)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="${rows.length > 16 ? 12 : 14}" style="fill:var(--ink-2)">${rows.length > 16 ? "'" + String(r.y).slice(2) : r.y}</text>`;
  });
  return `
  <div class="page-head"><h1>Ιστορικό χρόνων</h1><div class="spacer"></div><button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
  ${(() => { const [t, b] = tabBar('history', [{ k: 'table', icon: '📋', label: 'Πίνακας' }, { k: 'chart', icon: '📊', label: 'Γράφημα' }], 'table'); ui._histTab = t; return b; })()}
  <div class="panel ${ui._histTab === 'chart' ? '' : 'hidden'}">
    <h2>Έσοδα και έξοδα ανά χρονιά</h2>
    <svg class="chart" viewBox="0 0 ${W} ${H}">${svg}</svg>
    <div class="legend"><span><i style="background:var(--inc)"></i>Έσοδα</span><span><i style="background:var(--exp)"></i>Έξοδα</span></div>
  </div>
  <div class="sheet-wrap ${ui._histTab === 'table' ? '' : 'hidden'}"><table class="data">
    <thead><tr><th>Χρονιά</th><th class="r">Έσοδα</th><th class="r">Έξοδα</th><th class="r">Διαφορά</th><th>Πηγή</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r => `<tr data-action="goto-year" data-year="${r.y}">
      <td><b>${r.y}</b></td>
      <td class="r num inc">${r.i != null ? eur0(r.i) : '<span class="muted">—</span>'}</td>
      <td class="r num exp">${r.e != null ? eur0(r.e) : '<span class="muted">—</span>'}</td>
      <td class="r num">${r.i != null && r.e != null ? `<b style="color:${r.i - r.e < 0 ? 'var(--exp)' : 'var(--brand)'}">${eur0(r.i - r.e)}</b>` : ''}</td>
      <td class="muted">${r.src === 'Excel' ? 'Σύνολα από το παλιό Excel' : 'Καταχωρήσεις'}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="muted">«—» σημαίνει ότι το παλιό Excel δεν είχε αυτό το σύνολο για εκείνη τη χρονιά.</p>`;
}
