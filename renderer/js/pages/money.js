'use strict';
// HomeFlow · Σελίδα «Χρήματα» (λογαριασμοί)
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Χρήματα (λογαριασμοί) ----------
const KINDS = [
  ['current', 'Τρεχούμενοι λογαριασμοί', '🏦'], ['deposit', 'Προθεσμιακές', '🔒'], ['abroad', 'Λογαριασμοί στο εξωτερικό', '🌍'],
  ['funds', 'Αμοιβαία κεφάλαια', '📊'], ['stocks', 'Μετοχές', '📈'], ['cash', 'Μετρητά', '💵'], ['other', 'Άλλα', '📦']
];
const kindLabel = k => (KINDS.find(x => x[0] === k) || KINDS[KINDS.length - 1]);
const curSym = c => (c === 'USD' ? '$' : '€');
const usdFmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n, c) => (c === 'USD' ? usdFmt.format(n || 0) : eur(n));
const usd0Fmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const lastBal = a => (a.history.length ? a.history[a.history.length - 1] : null);
function balAt(a, date) { let b = null; for (const h of a.history) if (h.date <= date) b = h.balance; return b; }
const toEur = (n, c) => (c === 'USD' ? n / (DB.settings.usdPerEur || 1.16) : n);
function shortDate(d) { const x = new Date(d + 'T12:00'); return `${x.getDate()} ${MONTHS_SHORT[x.getMonth()]} ${x.getFullYear()}`; }
function moneyTotals(date) {
  const t = { EUR: 0, USD: 0 };
  for (const a of DB.accounts) { if (a.archived) continue; const b = date ? balAt(a, date) : (lastBal(a) || {}).balance; if (b != null) t[a.currency] += b; }
  t.all = t.EUR + toEur(t.USD, 'USD');
  return t;
}
function moneyChart() {
  // σύνολο σε € στο τέλος κάθε μήνα (τελευταίοι 12 μήνες με στοιχεία)
  const dates = DB.accounts.flatMap(a => a.history.map(h => h.date)).sort();
  if (!dates.length) return '';
  const pts = [];
  let s = dates[0].slice(0, 7);
  const end = curYM();
  for (let g = 0; s <= end && g < 240; s = addMonths(s, 1), g++) pts.push({ s, v: moneyTotals(`${s}-${pad(lastDay(s))}`).all });
  const show = pts.slice(-12);
  const W = 1000, H = 260, L = 70, B = 34, T = 14;
  const max = Math.max(1, ...show.map(p => p.v));
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / show.length;
  let svg = '';
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  show.forEach((p, k) => {
    const x = L + k * gw + gw * 0.18, bw = gw * 0.64;
    svg += `<rect x="${x}" y="${y(p.v)}" width="${bw}" height="${y(0) - y(p.v)}" rx="4" style="fill:var(--brand)"><title>${ymLabel(p.s)}: ${eur0(p.v)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="14" style="fill:var(--ink-2)">${MONTHS_SHORT[+p.s.slice(5) - 1]}${p.s.slice(5) === '01' ? " '" + p.s.slice(2, 4) : ''}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${svg}</svg>`;
}
function moneyPage() {
  const t = moneyTotals();
  const rate = DB.settings.usdPerEur || 1.16;
  const accs = DB.accounts.filter(a => !a.archived);
  const closed = DB.accounts.filter(a => a.archived);
  const lastUpd = accs.map(a => (lastBal(a) || {}).date).filter(Boolean).sort().pop();
  const yearStart = `${now.getFullYear()}-01-01`;
  const t0 = moneyTotals(yearStart);
  const byBank = {};
  for (const a of accs) { const b = (lastBal(a) || {}).balance || 0; const k = a.bank || kindLabel(a.kind)[1]; byBank[k] = (byBank[k] || 0) + toEur(b, a.currency); }
  const row = a => {
    const lb = lastBal(a);
    const prev = a.history.length > 1 ? a.history[a.history.length - 2] : null;
    const diff = lb && prev ? lb.balance - prev.balance : 0;
    return `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto auto">
      <span class="ic">${kindLabel(a.kind)[2]}</span>
      <span><div class="t1">${a.bank ? esc(a.bank) + ' · ' : ''}${esc(a.name)}</div>
        <div class="t2">${a.maturity ? `<b class="${daysUntil(a.maturity) <= 7 ? 'exp' : ''}">⏰ λήγει ${shortDate(a.maturity)}</b> · ` : ''}${esc(a.owner || '')}${lb ? `${a.owner ? ' · ' : ''}ενημ. ${shortDate(lb.date)}` : ''}${prev && Math.abs(diff) > 0.005 ? ` · <span class="${diff < 0 ? 'exp' : 'inc'}">${diff > 0 ? '+' : '−'}${money(Math.abs(diff), a.currency)}</span> από πριν` : ''}</div></span>
      <span class="amt num">${lb ? money(lb.balance, a.currency) : '—'}</span>
      <span style="display:flex;gap:.4rem"><button class="btn small primary" data-action="acc-update" data-id="${a.id}">✎ Νέο υπόλοιπο</button><button class="btn small ghost" data-action="acc-edit" data-id="${a.id}" title="Στοιχεία λογαριασμού">⚙</button></span>
    </div>`;
  };
  const groupTabs = [];
  const groupHtml = {};
  KINDS.forEach(([k, label, icon]) => {
    const list = accs.filter(a => a.kind === k).sort((x, y) => (x.bank || '').localeCompare(y.bank || '', 'el') || x.order - y.order);
    if (!list.length) return;
    groupTabs.push({ k, icon, label: label.replace('Τρεχούμενοι λογαριασμοί', 'Τρεχούμενοι').replace('Λογαριασμοί στο εξωτερικό', 'Εξωτερικό').replace('Αμοιβαία κεφάλαια', 'Αμοιβαία'), count: list.length });
    const sub = { EUR: 0, USD: 0 };
    for (const a of list) sub[a.currency] += (lastBal(a) || {}).balance || 0;
    groupHtml[k] = `<div class="panel"><h2>${icon} ${label} <span class="muted">${[sub.EUR ? eur(sub.EUR) : '', sub.USD ? usdFmt.format(sub.USD) : ''].filter(Boolean).join(' + ')}</span></h2><div class="tx-list">${list.map(row).join('')}</div></div>`;
  });
  const [mtab, mbar] = tabBar('money', [{ k: 'summary', icon: '📊', label: 'Σύνοψη' }, ...groupTabs, ...(closed.length ? [{ k: 'closed', icon: '🗄', label: 'Κλειστοί', count: closed.length }] : [])], 'summary');
  const diffYear = t.all - t0.all;
  return `
  <div class="page-head"><h1>Χρήματα</h1><div class="spacer"></div>
    <button class="btn primary no-print" data-action="acc-new">+ Νέος λογαριασμός</button>
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
  ${accs.length ? `
  <div class="cards">
    <div class="card bal"><div class="label">Όλα μαζί σε ευρώ</div><div class="value num">${eur0(t.all)}</div><div class="sub">${t0.all ? `Από 1 Ιανουαρίου: <b class="${diffYear < 0 ? 'exp' : 'inc'}">${diffYear >= 0 ? '+' : '−'}${eur0(Math.abs(diffYear))}</b>` : ''}</div></div>
    <div class="card"><div class="label">Σε ευρώ</div><div class="value num">${eur0(t.EUR)}</div></div>
    <div class="card"><div class="label">Σε δολάρια</div><div class="value num">${usd0Fmt.format(t.USD)}</div>
      <div class="sub">Ισοτιμία: 1 € = ${String(rate).replace('.', ',')} $ <button class="btn small ghost no-print" data-action="rate-edit">✎ αλλαγή</button></div></div>
  </div>
  ${lastUpd ? `<div class="h-hint" style="margin:-.6rem 0 1rem">Τελευταία ενημέρωση υπολοίπου: ${shortDate(lastUpd)}. Για να γράψετε νέο υπόλοιπο, ανοίξτε την καρτέλα του λογαριασμού (π.χ. «Τρεχούμενοι») και πατήστε «✎ Νέο υπόλοιπο».</div>` : ''}
  ${mbar}
  ${mtab === 'summary' ? `<div class="panel"><h2>Όλα μαζί, μήνα με μήνα (σε €)</h2>${moneyChart()}</div>
  <div class="panel"><h2>Ανά τράπεζα (σε €)</h2>
      <div class="bars">${Object.entries(byBank).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar-row" style="cursor:default"><span class="ic">🏦</span><span><span class="nm">${esc(k)}</span><div class="track"><div class="fill" style="width:${Math.max(2, v / Math.max(...Object.values(byBank)) * 100)}%;background:var(--brand)"></div></div></span><span class="amt num">${eur0(v)}</span></div>`).join('')}</div></div>` : ''}
  ${groupHtml[mtab] || ''}
  ${mtab === 'closed' && closed.length ? `<div class="panel"><h2>🗄 Κλειστοί λογαριασμοί</h2><div class="tx-list">${closed.map(a => `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto"><span class="ic">🗄</span><span><div class="t1">${esc(a.bank)} · ${esc(a.name)}</div></span><button class="btn small" data-action="acc-edit" data-id="${a.id}">⚙</button></div>`).join('')}</div></div>` : ''}`
    : `<div class="panel" style="max-width:46rem"><p style="font-size:1.1rem;margin-top:0">Εδώ βλέπετε όλα τα χρήματα μαζί: λογαριασμούς, προθεσμιακές, μετρητά.</p><button class="btn big primary" style="width:auto;padding:0 2rem" data-action="acc-new">+ Νέος λογαριασμός</button></div>`}`;
}
