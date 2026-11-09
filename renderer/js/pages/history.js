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
  const chart = barChart({
    labels: rows.map(r => rows.length > 16 ? "'" + String(r.y).slice(2) : String(r.y)), tipHead: (l, i) => String(rows[i].y), fmt: eur0,
    series: [{ name: 'Έσοδα', values: rows.map(r => r.i), color: 'var(--inc)' }, { name: 'Έξοδα', values: rows.map(r => r.e), color: 'var(--exp)' }],
    action: i => `data-action="goto-year" data-year="${rows[i].y}" style="cursor:pointer"`
  });
  return `
  <div class="page-head"><h1>Ιστορικό χρόνων</h1><div class="spacer"></div><button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
  ${(() => { const [t, b] = tabBar('history', [{ k: 'table', icon: '📋', label: 'Πίνακας' }, { k: 'chart', icon: '📊', label: 'Γράφημα' }], 'table'); ui._histTab = t; return b; })()}
  <div class="panel ${ui._histTab === 'chart' ? '' : 'hidden'}">
    <h2>Έσοδα και έξοδα ανά χρονιά</h2>
    ${chart}
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
