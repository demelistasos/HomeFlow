'use strict';
// HomeFlow · Σελίδα «Η χρονιά»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Η χρονιά ----------
function yearPage() {
  const year = ui.yearView;
  const a = yearAgg(year);
  const totE = round2(a.mExp.reduce((x, y) => x + y, 0));
  const totI = round2(a.mInc.reduce((x, y) => x + y, 0));
  const totNoExtra = round2(a.mExpNoExtra.reduce((x, y) => x + y, 0));
  const lastY = monthlyExpensesFor(year - 1);

  const sheet = (type) => {
    const cats = DB.categories.filter(c => c.type === type && (!c.archived || (a[type === 'expense' ? 'exp' : 'inc'][c.id]))).sort((x, y) => x.order - y.order);
    const data = type === 'expense' ? a.exp : a.inc;
    const pl = type === 'expense' ? a.expPl : a.incPl;
    const monthTot = type === 'expense' ? a.mExp : a.mInc;
    const grand = type === 'expense' ? totE : totI;
    const isExp = type === 'expense';
    const body = cats.map(c => {
      const arr = data[c.id] || Array(12).fill(0);
      const parr = pl[c.id] || Array(12).fill(0);
      const tot = round2(arr.reduce((x, y) => x + y, 0));
      const prev = isExp ? categoryYearTotal(c.id, year - 1) : null;
      const rem = isExp && c.budget ? round2(c.budget - tot) : null;
      return `<tr>
        <td class="cat">${esc(c.icon)} ${esc(c.name)}${c.extra ? ' <span class="tag">έκτακτο</span>' : ''}</td>
        ${arr.map((v, m) => `<td class="cell num" data-action="goto-cell" data-cat="${esc(c.id)}" data-m="${m + 1}" data-type="${type}">${v ? numFmt.format(v) : '<span class="zero">·</span>'}${parr[m] ? `<span class="pl" title="Προγραμματισμένα">+${numFmt.format(parr[m])}</span>` : ''}</td>`).join('')}
        <td class="tot num">${numFmt.format(tot)}</td>
        <td class="num muted">${grand ? Math.round(tot / grand * 100) + '%' : ''}</td>
        ${isExp ? `<td class="num muted">${prev != null ? numFmt.format(prev) : ''}</td>
        <td class="num">${c.budget ? numFmt.format(c.budget) : ''}</td>
        <td class="num ${rem == null ? '' : rem < 0 ? 'over' : 'ok'}">${rem == null ? '' : numFmt.format(rem)}</td>` : ''}
      </tr>`;
    }).join('');
    const prevTot = isExp ? (lastY ? round2(lastY.reduce((x, y) => x + y, 0)) : null) : null;
    const budTot = isExp ? round2(cats.reduce((x, c) => x + (c.budget || 0), 0)) : null;
    let foot = `<tr class="total"><td class="cat">Σύνολο ${isExp ? 'εξόδων' : 'εσόδων'}</td>${monthTot.map(v => `<td class="num">${numFmt.format(v)}</td>`).join('')}<td class="num">${numFmt.format(grand)}</td><td></td>
      ${isExp ? `<td class="num">${prevTot != null ? numFmt.format(prevTot) : ''}</td><td class="num">${budTot ? numFmt.format(budTot) : ''}</td><td class="num ${budTot && budTot - grand < 0 ? 'over' : ''}">${budTot ? numFmt.format(budTot - grand) : ''}</td>` : ''}</tr>`;
    if (isExp) foot += `<tr><td class="cat muted">Χωρίς τα έκτακτα</td>${a.mExpNoExtra.map(v => `<td class="num muted">${numFmt.format(v)}</td>`).join('')}<td class="num muted">${numFmt.format(totNoExtra)}</td><td></td><td></td><td></td><td></td></tr>`;
    return `<div class="sheet-wrap"><table class="sheet">
      <thead><tr><th class="cat">${isExp ? 'Έξοδα' : 'Έσοδα'}</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}<th>Σύνολο</th><th>%</th>${isExp ? `<th>${year - 1}</th><th>Πρόβλεψη</th><th>Υπόλοιπο</th>` : ''}</tr></thead>
      <tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
  };

  let cum = 0;
  const balRow = a.mInc.map((v, m) => { cum += v - a.mExp[m]; return cum; });
  return `
  <div class="page-head">
    <div class="month-nav">
      <button class="btn" data-action="year-prev">◀</button>
      <div class="month-title" style="min-width:9rem">Η χρονιά ${year}</div>
      <button class="btn" data-action="year-next">▶</button>
    </div>
    <div class="spacer"></div>
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button>
  </div>
  <div class="cards four">
    <div class="card inc"><div class="label">Έσοδα ${year}</div><div class="value inc num">${eur0(totI)}</div></div>
    <div class="card exp"><div class="label">Έξοδα ${year}</div><div class="value exp num">${eur0(totE)}</div>${lastY ? `<div class="sub">${year - 1}: ${eur0(lastY.reduce((x, y) => x + y, 0))}</div>` : ''}</div>
    <div class="card bal"><div class="label">Διαφορά</div><div class="value num" style="color:${totI - totE < 0 ? 'var(--exp)' : 'var(--brand)'}">${eur0(totI - totE)}</div></div>
    <div class="card extra"><div class="label">Έξοδα χωρίς έκτακτα</div><div class="value num">${eur0(totNoExtra)}</div><div class="sub">Έκτακτα: ${eur0(totE - totNoExtra)}</div></div>
  </div>
  ${(() => { const [t, b] = tabBar('year', [{ k: 'exp', icon: '−', label: 'Έξοδα ανά κατηγορία' }, { k: 'inc', icon: '+', label: 'Έσοδα ανά κατηγορία' }, { k: 'chart', icon: '📊', label: 'Γράφημα μηνών' }, { k: 'bal', icon: '⚖️', label: 'Υπόλοιπο ανά μήνα' }], 'exp'); ui._yearTab = t; return b; })()}
  ${ui._yearTab !== 'chart' ? '' : `<div class="panel">
    <h2>Έσοδα και έξοδα ανά μήνα</h2>
    ${monthChart(a.mInc, a.mExp, lastY, year)}
  </div>`}
  ${ui._yearTab !== 'exp' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem;margin-bottom:.3rem">Έξοδα ανά κατηγορία</h2><div class="h-hint" style="margin:0 .2rem .7rem">Όπως στο Excel. Πατήστε ένα ποσό για να δείτε από τι αποτελείται.</div>
    ${sheet('expense')}
  </div>`}
  ${ui._yearTab !== 'inc' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem">Έσοδα ανά κατηγορία</h2>
    ${sheet('income')}</div>`}
  ${ui._yearTab !== 'bal' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem">Υπόλοιπο ανά μήνα</h2>
    <div class="sheet-wrap"><table class="sheet">
      <thead><tr><th class="cat">Υπόλοιπο</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="cat">Διαφορά μήνα</td>${a.mInc.map((v, m) => { const d = v - a.mExp[m]; return `<td class="num ${d < 0 ? 'over' : 'ok'}">${numFmt.format(d)}</td>`; }).join('')}</tr>
        <tr class="total"><td class="cat">Από αρχή χρονιάς</td>${balRow.map(v => `<td class="num ${v < 0 ? 'over' : ''}">${numFmt.format(v)}</td>`).join('')}</tr>
      </tbody></table></div>
  </div>`}`;
}

function monthChart(inc, exp, lastExp, year) {
  const W = 1000, H = 300, L = 60, B = 34, T = 14;
  const max = Math.max(1, ...inc, ...exp, ...(lastExp || [0]));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / 12;
  let g = '';
  for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  let bars = '';
  for (let m = 0; m < 12; m++) {
    const x = L + m * gw + gw * 0.14, bw = gw * 0.34;
    bars += `<rect x="${x}" y="${y(inc[m])}" width="${bw}" height="${y(0) - y(inc[m])}" rx="4" style="fill:var(--inc)"><title>Έσοδα ${MONTHS[m]}: ${eur(inc[m])}</title></rect>`;
    bars += `<rect x="${x + bw + 3}" y="${y(exp[m])}" width="${bw}" height="${y(0) - y(exp[m])}" rx="4" style="fill:var(--exp)"><title>Έξοδα ${MONTHS[m]}: ${eur(exp[m])}</title></rect>`;
    bars += `<text x="${L + m * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="15" style="fill:var(--ink-2)">${MONTHS_SHORT[m]}</text>`;
  }
  let line = '';
  if (lastExp) {
    const pts = lastExp.map((v, m) => `${L + m * gw + gw / 2},${y(v)}`).join(' ');
    line = `<polyline points="${pts}" fill="none" style="stroke:var(--ink-3)" stroke-width="2.5" stroke-dasharray="6 5"/>` + lastExp.map((v, m) => `<circle cx="${L + m * gw + gw / 2}" cy="${y(v)}" r="4" style="fill:var(--ink-3)"><title>Έξοδα ${MONTHS[m]} ${year - 1}: ${eur(v)}</title></circle>`).join('');
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Έσοδα και έξοδα ανά μήνα">${g}${bars}${line}</svg>
    <div class="legend"><span><i style="background:var(--inc)"></i>Έσοδα</span><span><i style="background:var(--exp)"></i>Έξοδα</span>${lastExp ? `<span><i style="background:var(--ink-3)"></i>Έξοδα ${year - 1}</span>` : ''}</div>`;
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function kfmt(v) { return v >= 1000 ? int0.format(v / 1000) + 'χ' : int0.format(v); }
