'use strict';
// HomeFlow · Πίτα περιουσίας, μετρητά (ATM), ανά άτομο, δικές μου υπενθυμίσεις
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Πίτα περιουσίας (Χρήματα › Σύνοψη) ----------
const PIE_COLORS = ['#0e7c86', '#2563eb', '#7c3aed', '#16a34a', '#ca8a04', '#db2777', '#64748b'];
function assetPie() {
  const parts = KINDS.map(([k, label, icon], i) => {
    let v = 0;
    for (const a of DB.accounts) if (!a.archived && a.kind === k) { const b = lastBal(a); if (b) v += toEur(b.balance, a.currency); }
    return { k, label, icon, v: Math.max(0, v), color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(p => p.v > 0.5);
  const usd = DB.accounts.filter(a => !a.archived && a.currency === 'USD').reduce((s, a) => s + Math.max(0, toEur((lastBal(a) || {}).balance || 0, 'USD')), 0);
  const tot = parts.reduce((s, p) => s + p.v, 0);
  if (!tot) return '';
  const R = 80, r = 48, C = 100;
  let ang = -Math.PI / 2, svg = '';
  for (const p of parts) {
    const a2 = ang + 2 * Math.PI * (p.v / tot), large = a2 - ang > Math.PI ? 1 : 0;
    const pt = (rad, a) => `${(C + rad * Math.cos(a)).toFixed(2)} ${(C + rad * Math.sin(a)).toFixed(2)}`;
    const d = parts.length === 1 ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} L ${C - 0.01} ${C - r} A ${r} ${r} 0 1 0 ${C} ${C - r} Z`
      : `M ${pt(R, ang)} A ${R} ${R} 0 ${large} 1 ${pt(R, a2)} L ${pt(r, a2)} A ${r} ${r} 0 ${large} 0 ${pt(r, ang)} Z`;
    svg += `<path d="${d}" fill="${p.color}" data-action="tab" data-page="money" data-k="${p.k}" style="cursor:pointer"><title>${p.label}: ${eur0(p.v)} (${Math.round(p.v / tot * 100)}%)</title></path>`;
    ang = a2;
  }
  svg += `<text x="${C}" y="${C - 4}" text-anchor="middle" font-size="13" style="fill:var(--ink-3)">Σύνολο</text><text x="${C}" y="${C + 16}" text-anchor="middle" font-size="17" font-weight="700" style="fill:var(--ink)">${eur0(tot)}</text>`;
  return `<div class="panel"><h2>Πού είναι τα χρήματα</h2><div class="h-hint">Σε ευρώ. Πατήστε ένα κομμάτι για να δείτε τους λογαριασμούς του.</div>
    <div class="pie-wrap"><svg class="pie" viewBox="0 0 200 200" role="img" aria-label="Κατανομή περιουσίας">${svg}</svg>
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
