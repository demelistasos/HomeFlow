'use strict';
// HomeFlow · Πίτα περιουσίας, μετρητά (ATM), ανά άτομο, δικές μου υπενθυμίσεις
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Πίτα περιουσίας (Χρήματα › Σύνοψη) ----------
const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#0EA5E9', '#8B5CF6', '#94A3B8'];
function assetPie() {
  const parts = KINDS.map(([k, label, icon], i) => {
    let v = 0;
    for (const a of DB.accounts) if (!a.archived && a.kind === k) { const b = lastBal(a); if (b) v += toEur(b.balance, a.currency); }
    return { k, label, icon, v: Math.max(0, v), color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(p => p.v > 0.5);
  const usd = DB.accounts.filter(a => !a.archived && a.currency === 'USD').reduce((s, a) => s + Math.max(0, toEur((lastBal(a) || {}).balance || 0, 'USD')), 0);
  const tot = parts.reduce((s, p) => s + p.v, 0);
  if (!tot) return '';
  const svg = donutChart(parts.map(p => ({ label: p.label, v: p.v, color: p.color, attrs: `data-action="tab" data-page="money" data-k="${p.k}"` })), { fmt: eur0 }).replace('class="ch-donut"', 'class="ch-donut pie"');
  return `<div class="panel"><h2>Πού είναι τα χρήματα</h2><div class="h-hint">Σε ευρώ. Πατήστε ένα κομμάτι για να δείτε τους λογαριασμούς του.</div>
    <div class="pie-wrap">${svg}
    <div class="pie-legend">${parts.sort((x, y) => y.v - x.v).map(p => `<button class="pie-item" data-action="tab" data-page="money" data-k="${p.k}"><span class="pie-dot" style="background:${p.color}"></span><span class="pie-nm">${p.icon} ${esc(p.label)}</span><b class="num">${eur0(p.v)}</b><span class="muted num">${Math.round(p.v / tot * 100)}%</span></button>`).join('')}
      ${usd > 0.5 ? `<div class="muted" style="margin-top:.4rem">Από αυτά σε δολάρια: <b>${eur0(usd)}</b> (${Math.round(usd / tot * 100)}%)</div>` : ''}</div></div></div>`;
}

// ---------- Μετρητά: πρώτα στην επιλογή λογαριασμού, κουμπί ATM ----------
const cashAccounts = () => DB.accounts.filter(a => !a.archived && a.kind === 'cash' && a.currency === 'EUR');

// ---------- Ανά άτομο (Η χρονιά › Ανά άτομο) ----------
function personYearRows(year) {
  const by = {};
  for (const t of DB.transactions) {
    if (yOf(t) !== year || t.planned) continue;
    const k = t.person || '';
    const x = by[k] = by[k] || { inc: 0, exp: 0, cats: {} };
    if (t.type === 'income') x.inc += t.amount; else { x.exp += t.amount; x.cats[t.categoryId] = (x.cats[t.categoryId] || 0) + t.amount; }
  }
  const order = [...(DB.settings.persons || []), ...Object.keys(by).filter(k => k && !(DB.settings.persons || []).includes(k)), ''];
  return order.filter(k => by[k]).map(k => ({ who: k, ...by[k], top: Object.entries(by[k].cats).sort((a, b) => b[1] - a[1]).slice(0, 3) }));
}
function personYearPanel(year) {
  const rows = personYearRows(year);
  if (!rows.length) return `<div class="panel empty">Δεν υπάρχουν κινήσεις για το ${year}.</div>`;
  return `<div class="panel"><h2>👪 Ανά άτομο ${year}</h2><div class="h-hint">Από το «Ποιος;» κάθε κίνησης. Όσες δεν έχουν άτομο φαίνονται ως «Κοινά».</div>
    <div class="sheet-wrap"><table class="data"><thead><tr><th>Ποιος</th><th class="r">Έσοδα</th><th class="r">Έξοδα</th><th class="r">Διαφορά</th><th>Τα περισσότερα έξοδα σε</th></tr></thead><tbody>
    ${rows.map(r => `<tr style="cursor:default"><td><b>${r.who ? esc(r.who) : 'Κοινά (χωρίς άτομο)'}</b></td><td class="r num inc">${eur(r.inc)}</td><td class="r num exp">${eur(r.exp)}</td>
      <td class="r num ${r.inc - r.exp < 0 ? 'exp' : 'inc'}">${r.inc - r.exp < 0 ? '−' : ''}${eur(Math.abs(r.inc - r.exp))}</td><td class="muted">${r.top.map(([c, v]) => `${esc(catName(c))} ${eur0(v)}`).join(' · ')}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}

// ---------- Δικές μου υπενθυμίσεις ----------
const noteList = () => (DB.notes = DB.notes || []);
function renderNoteDlg(d) {
  if (d.kind !== 'note') return null;
  return { head: 'neutral', title: d.id ? '✎ Υπενθύμιση' : '🔔 Νέα υπενθύμιση', body: `
    <div class="field"><label for="d-ntext">Τι να θυμηθώ;</label><input id="d-ntext" type="text" style="width:100%" value="${esc(d.text)}" placeholder="π.χ. να πάρω τον λογιστή, να πληρώσω την ασφάλεια"></div>
    <div class="row"><div class="field"><label for="d-date">Πότε;</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
      <div class="field"><label for="d-namt">Ποσό <span class="muted" style="font-weight:500">(αν υπάρχει)</span></label><div class="amount-wrap"><input id="d-namt" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.amountStr || '')}" placeholder="—"><span style="font-weight:700">€</span></div></div></div>
    <div class="hint">Θα φαίνεται στο «Να θυμηθώ» από 7 μέρες πριν, και στο Ημερολόγιο.</div>` };
}
function syncNote() {
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (v('d-ntext') !== undefined) dlg.text = v('d-ntext').trim();
  if (v('d-date')) dlg.date = v('d-date');
  if (v('d-namt') !== undefined) dlg.amountStr = v('d-namt');
}
function saveNote() {
  syncNote();
  const d = dlg, fail = m => { d.error = m; renderDlg(); };
  if (!d.text) return fail('Γράψτε τι να θυμηθείτε.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return fail('Διαλέξτε ημερομηνία.');
  const amt = d.amountStr ? parseAmount(d.amountStr) : null;
  if (d.amountStr && (amt === null || isNaN(amt))) return fail('Το ποσό δεν είναι σωστό.');
  const rec = { id: d.id || 'n' + uid(), date: d.date, text: d.text, amount: amt || null, done: false };
  const list = noteList(), i = list.findIndex(x => x.id === rec.id);
  if (i >= 0) list[i] = { ...list[i], ...rec }; else list.push(rec);
  dlg = null; renderDlg(); persist(); render(); toast('Η υπενθύμιση αποθηκεύτηκε.');
}
// για το «Να θυμηθώ» (μέσα σε 7 μέρες ή ληξιπρόθεσμες) και το Ημερολόγιο
function noteReminders() {
  return noteList().filter(n => !n.done && daysUntil(n.date) <= 7).map(n => {
    const dd = daysUntil(n.date);
    return { sort: dd, cls: dd < 0 ? 'late' : 'wait', icon: '📝', text: esc(n.text) + (n.amount ? ` · ${eur(n.amount)}` : ''),
      sub: dd < 0 ? `ήταν ${shortDate(n.date)}` : dd === 0 ? 'σήμερα' : dd === 1 ? 'αύριο' : `σε ${dd} μέρες (${shortDate(n.date)})`,
      btn: `<button class="btn small primary" data-action="note-done" data-id="${n.id}">✓ Έγινε</button> <button class="btn small ghost" data-action="note-edit" data-id="${n.id}" title="Αλλαγή">✎</button>` };
  });
}
Object.assign(actions, {
  'note-new': () => { dlg = { kind: 'note', id: null, text: '', date: todayStr(), amountStr: '', error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-ntext'); if (i) i.focus(); }, 30); },
  'note-edit': el => { const n = noteList().find(x => x.id === el.dataset.id); if (!n) return; dlg = { kind: 'note', id: n.id, text: n.text, date: n.date, amountStr: n.amount ? String(n.amount).replace('.', ',') : '', error: '' }; renderDlg(); },
  'note-done': el => { const n = noteList().find(x => x.id === el.dataset.id); if (!n) return; n.done = true; persist(); if (dlg) { dlg = null; renderDlg(); } render(); toast('Έγινε ✓', () => { n.done = false; persist(); render(); }); },
  'note-delete': () => { if (!confirmBox('Να σβηστεί η υπενθύμιση;')) return; DB.notes = noteList().filter(x => x.id !== dlg.id); dlg = null; renderDlg(); persist(); render(); },
  'acc-atm': el => { const c = cashAccounts()[0]; dlg = { kind: 'accmove', id: el.dataset.id, k: 'transfer', amountStr: '', date: todayStr(), text: 'ATM', to: c ? c.id : '', error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-amount'); if (i) i.focus(); }, 30); },
  'acc-cash-new': () => { const a = { id: 'a' + uid(), bank: '', name: 'Μετρητά (πορτοφόλι)', owner: '', currency: 'EUR', kind: 'cash', archived: false, order: DB.accounts.length, history: [{ date: todayStr(), balance: 0, at: new Date().toISOString() }], moves: [] }; DB.accounts.push(a); persist(); render(); dlg = { kind: 'accview', id: a.id, error: '' }; renderDlg(); }
});

// ---------- 5. Πορεία μετοχών / αμοιβαίων (και κάθε λογαριασμού) ----------
// «Επένδυσα» = πρώτο γραμμένο υπόλοιπο + ό,τι μπήκε/βγήκε με κινήσεις μετά. «Κέρδος» = αξία τώρα − επένδυσα.
function accInvestStats(a) {
  const tl = accTimeline(a);
  const first = tl.find(r => r.snap);
  if (!first || !tl.length) return null;
  let put = first.snap.balance;
  for (const r of tl) if (!r.snap && evKey(r) > evKey(first)) put += r.amount;
  const now = tl[tl.length - 1].bal;
  const gain = round2(now - put);
  return { from: first.date, put: round2(put), now, gain, pct: put ? gain / put * 100 : 0 };
}
function accChart(a) {
  const pts = accTimeline(a).filter(r => r.started).map(r => ({ d: r.date, v: r.bal }));
  const by = {}; for (const p of pts) by[p.d] = p.v; // μία τιμή τη μέρα (η τελευταία)
  const ds = Object.keys(by).sort().slice(-40);
  if (ds.length < 2) return '';
  const vs = ds.map(d => by[d]), up = vs[vs.length - 1] >= vs[0];
  return areaChart({ labels: ds.map(shortDate), values: vs, color: up ? 'var(--inc)' : 'var(--exp)', H: 230, fromZero: false, fmt: v => money(v, a.currency) }).replace('class="chart ch-svg"', 'class="chart ch-svg acc-chart"');
}
function accInvestPanel(a) {
  const st = accInvestStats(a);
  const chart = accChart(a);
  if (!st && !chart) return '';
  const inv = ['stocks', 'funds'].includes(a.kind);
  return `<div class="acc-invest">
    ${inv && st ? `<div class="acc-kpis">
      <div><div class="label">Επένδυσα (από ${shortDate(st.from)})</div><div class="num">${money(st.put, a.currency)}</div></div>
      <div><div class="label">Αξία τώρα</div><div class="num">${money(st.now, a.currency)}</div></div>
      <div><div class="label">${st.gain >= 0 ? 'Κέρδος' : 'Ζημιά'}</div><div class="num ${st.gain >= 0 ? 'inc' : 'exp'}">${st.gain >= 0 ? '+' : '−'}${money(Math.abs(st.gain), a.currency)} <span style="font-size:.85em">(${st.gain >= 0 ? '+' : '−'}${numFmt.format(Math.abs(st.pct))}%)</span></div></div>
    </div>` : ''}
    ${chart}</div>`;
}
// «Νέο υπόλοιπο» με ποσοστό: γράφεις +3,5 % και βγαίνει το ποσό (και αντίστροφα)
document.addEventListener('input', ev => {
  if (ev.target.id !== 'd-pct' || !dlg || dlg.kind !== 'bal') return;
  const a = DB.accounts.find(x => x.id === dlg.id), lb = lastBal(a), p = parseAmount(ev.target.value);
  if (!lb || p === null || isNaN(p)) return;
  const v = round2(lb.balance * (1 + p / 100));
  const inp = $('#d-amount'); if (inp) { inp.value = numFmt.format(v).replace(/\./g, ''); dlg.amountStr = inp.value; }
  const bd = $('#d-baldiff'); if (bd) bd.innerHTML = balDiffHint(a, v);
});

// ---------- 9. «Η χρονιά σου» ----------
function yearReviewBody(year) {
  const a = yearAgg(year);
  const sumA = arr => round2(arr.reduce((x, y) => x + y, 0));
  const tI = sumA(a.mInc), tE = sumA(a.mExp), bal = round2(tI - tE);
  const lastY = monthlyExpensesFor(year - 1);
  // για τη χρονιά που τρέχει, σύγκριση με τους ίδιους μήνες πέρσι
  const upto = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const lastE = lastY ? sumA(lastY.slice(0, upto)) : 0;
  const months = a.mExp.map((v, i) => ({ i, v })).filter(m => m.v > 0);
  const maxM = months.slice().sort((x, y) => y.v - x.v)[0], minM = months.slice().sort((x, y) => x.v - y.v)[0];
  const cats = Object.entries(a.exp).map(([id, arr]) => ({ id, v: sumA(arr) })).filter(c => c.v > 0).sort((x, y) => y.v - x.v);
  const top = cats.slice(0, 6), topMax = top[0] ? top[0].v : 1;
  const big = DB.transactions.filter(t => yOf(t) === year && t.type === 'expense' && !t.planned).sort((x, y) => y.amount - x.amount).slice(0, 5);
  const dr = typeof declRows === 'function' ? declRows(year) : [];
  const rentC = round2(dr.reduce((s, r) => s + r.ours, 0)), rentX = round2(dr.reduce((s, r) => s + r.extra, 0));
  const isCur = year === now.getFullYear();
  const m0 = moneyTotals(`${year}-01-01`).all, m1 = moneyTotals(isCur ? todayStr() : `${year}-12-31`).all;
  const card = (label, val, sub, cls) => `<div class="yr-card"><div class="label">${label}</div><div class="num ${cls || ''}">${val}</div>${sub ? `<div class="muted">${sub}</div>` : ''}</div>`;
  return `
    <div class="yr-cards">
      ${card('Μπήκαν', eur0(tI), '', 'inc')}
      ${card('Βγήκαν', eur0(tE), lastE ? `${tE > lastE ? '▲' : '▼'} ${Math.abs(Math.round((tE - lastE) / lastE * 100))}% από ${upto < 12 ? `τους ίδιους μήνες του ${year - 1}` : `το ${year - 1}`}` : '', 'exp')}
      ${card(bal >= 0 ? 'Έμειναν' : 'Λείπουν', eur0(Math.abs(bal)), tI ? `το ${Math.round(Math.abs(bal) / tI * 100)}% των εσόδων` : '', bal >= 0 ? 'inc' : 'exp')}
      ${m0 || m1 ? card('Περιουσία', eur0(m1), `${m1 - m0 >= 0 ? '+' : '−'}${eur0(Math.abs(m1 - m0))} από 1/1`, m1 - m0 >= 0 ? 'inc' : 'exp') : ''}
    </div>
    ${isCur ? `<div class="hint">Η χρονιά δεν έχει τελειώσει: τα νούμερα είναι ως σήμερα.</div>` : ''}
    <div class="yr-grid">
      <div><h3>Πού πήγαν τα περισσότερα</h3>${top.map(c => `<div class="yr-bar"><span>${esc(catIcon(c.id))} ${esc(catName(c.id))}</span><b class="num">${eur0(c.v)}</b><div class="track"><div class="fill" style="width:${Math.max(3, c.v / topMax * 100)}%"></div></div></div>`).join('') || '<p class="muted">—</p>'}</div>
      <div><h3>Οι μήνες</h3>
        ${maxM ? `<p>📈 Ο πιο ακριβός μήνας: <b>${MONTHS[maxM.i]}</b> με ${eur0(maxM.v)}.</p>` : ''}
        ${minM && minM !== maxM ? `<p>📉 Ο πιο οικονομικός: <b>${MONTHS[minM.i]}</b> με ${eur0(minM.v)}.</p>` : ''}
        ${months.length ? `<p>Κατά μέσο όρο <b>${eur0(tE / months.length)}</b> τον μήνα.</p>` : ''}
        ${rentC || rentX ? `<h3>Ενοίκια</h3><p>Ενοίκια συμβολαίου (δικό μας): <b>${eur0(rentC)}</b>${rentX ? `<br>Έξτρα για παλιές οφειλές: <b>${eur0(rentX)}</b>` : ''}</p>` : ''}
      </div>
    </div>
    ${big.length ? `<h3>Τα 5 μεγαλύτερα έξοδα</h3><table class="data"><tbody>${big.map(t => `<tr data-action="yr-tx" data-id="${t.id}"><td>${shortDate(t.date)}</td><td>${esc(catIcon(t.categoryId))} ${esc(catName(t.categoryId))}${t.note ? ' – ' + esc(t.note) : ''}</td><td class="r num exp"><b>${eur(t.amount)}</b></td></tr>`).join('')}</tbody></table>` : ''}
    <h3>Έσοδα και έξοδα ανά μήνα</h3>${monthChart(a.mInc, a.mExp, lastY, year)}`;
}
function renderYearDlg(d) {
  if (d.kind !== 'yreview') return null;
  return { head: 'neutral', title: `✨ Η χρονιά σου: ${d.year}`, body: yearReviewBody(d.year) };
}
Object.assign(actions, {
  'year-review': () => { dlg = { kind: 'yreview', year: ui.yearView || now.getFullYear(), error: '' }; renderDlg(); },
  'yr-tx': el => { const t = DB.transactions.find(x => x.id === el.dataset.id); if (!t) return; dlg = null; renderDlg(); openForm(t.type, t); }
});

// Πρόταση προβλέψεων: όσα ξοδέψαμε πέρσι σε κάθε κατηγορία, στρογγυλεμένα στα 10 €
Object.assign(actions, {
  'budget-suggest': () => {
    const y = now.getFullYear() - 1;
    const sug = DB.categories.filter(c => c.type === 'expense' && !c.archived && !c.extra).map(c => ({ c, v: categoryYearTotal(c.id, y) })).filter(x => x.v > 0);
    if (!sug.length) { toast(`Δεν υπάρχουν έξοδα για το ${y}.`); return; }
    if (!confirmBox(`Να μπουν ως προβλέψεις τα ποσά του ${y} σε ${sug.length} κατηγορίες; (Αλλάζουν και όσες έχουν ήδη πρόβλεψη. Μπορείτε να το αναιρέσετε.)`)) return;
    const before = DB.categories.map(c => [c.id, c.budget]);
    for (const { c, v } of sug) c.budget = Math.round(v / 10) * 10;
    persist(); render();
    toast(`Προβλέψεις από το ${y}: ${sug.length} κατηγορίες`, () => { for (const [id, b] of before) { const c = catById(id); if (c) c.budget = b; } persist(); render(); });
  }
});

// Λογαριασμοί με 0 €: κλείνουν όλοι μαζί (δεν σβήνονται· πάνε στους «Κλειστούς» και ανοίγουν ξανά από το ⚙)
const zeroAccounts = () => DB.accounts.filter(a => !a.archived && Math.abs(((lastBal(a) || {}).balance) || 0) < 0.005);
function zeroAccNotice() {
  const z = zeroAccounts();
  return z.length ? `<div class="notice info no-print">${z.length === 1 ? '1 λογαριασμός έχει' : z.length + ' λογαριασμοί έχουν'} υπόλοιπο 0 €. <button class="btn small" data-action="acc-close-zero">🗄 Κλείσιμο λογαριασμών με 0 €</button></div>` : '';
}
Object.assign(actions, {
  'acc-close-zero': () => {
    const z = zeroAccounts();
    if (!z.length || !confirmBox(`Να κλείσουν ${z.length} λογαριασμοί με 0 €;\n\n${z.map(accLabel).join('\n')}\n\nΔεν σβήνονται: πάνε στους «Κλειστούς» και μπορούν να ξανανοίξουν από το ⚙.`)) return;
    for (const a of z) a.archived = true;
    persist(); render();
    toast(`Έκλεισαν ${z.length} λογαριασμοί`, () => { for (const a of z) a.archived = false; persist(); render(); });
  }
});
