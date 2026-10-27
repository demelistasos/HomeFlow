'use strict';
// HomeFlow · Εξαγωγή και συγκεντρωτικό Excel
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= εξαγωγή =======================
function csvCell(v) { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csvNum(n) { return String(round2(n)).replace('.', ','); }
async function saveText(text, name, kind) {
  if (window.homeflow) { const r = await window.homeflow.saveAs(text, name, kind); if (r && r.ok) toast('Αποθηκεύτηκε: ' + r.path); return; }
  const blob = new Blob([(kind === 'csv' ? '﻿' : '') + text], { type: kind === 'csv' ? 'text/csv' : 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
// ======================= συγκεντρωτικό Excel =======================
const XL = {
  h: v => ({ v, s: 'head' }), m: v => (v ? { v: round2(v), s: 'money' } : null), mz: v => ({ v: round2(v || 0), s: 'money' }), mb: v => ({ v: round2(v || 0), s: 'moneyB' }),
  b: v => ({ v, s: 'bold' }), tt: v => ({ v, s: 'totalTxt' }), title: v => ({ v, s: 'title' }), sub: v => ({ v, s: 'sub' }),
  d: s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return { v: (Date.UTC(y, m - 1, d || 1) - Date.UTC(1899, 11, 30)) / 86400000, s: 'date' }; },
  n: v => (v == null ? null : { v, s: 'num' })
};
function xlHeadRows(title, sub) { return [[XL.title(title)], [XL.sub(sub || `HomeFlow · ${shortDate(todayStr())}`)], []]; }
function catSheet(year, type) {
  const a = yearAgg(year), data = type === 'expense' ? a.exp : a.inc, pl = type === 'expense' ? a.expPl : a.incPl;
  const rows = xlHeadRows(`${type === 'expense' ? 'Έξοδα' : 'Έσοδα'} ${year} ανά κατηγορία`, 'Τα ποσά των προγραμματισμένων (που δεν έχουν γίνει ακόμα) δεν μετράνε.');
  rows.push([XL.h('Κατηγορία'), ...MONTHS_SHORT.map(XL.h), XL.h('Σύνολο'), ...(type === 'expense' ? [XL.h('Πρόβλεψη'), XL.h('Διαφορά')] : [])]);
  const tot = Array(12).fill(0);
  for (const c of DB.categories.filter(c => c.type === type).sort((x, y) => x.order - y.order)) {
    const arr = data[c.id];
    if (!arr && !(pl[c.id])) continue;
    const vals = arr || Array(12).fill(0);
    vals.forEach((v, i) => { tot[i] += v; });
    const sum = vals.reduce((x, y) => x + y, 0);
    rows.push([`${c.icon} ${c.name}${c.extra ? ' (έκτακτο)' : ''}`, ...vals.map(XL.m), XL.mz(sum), ...(type === 'expense' ? [c.budget ? XL.mz(c.budget) : null, c.budget ? { v: round2(c.budget - sum), s: c.budget - sum < 0 ? 'moneyR' : 'moneyG' } : null] : [])]);
  }
  rows.push([XL.tt('Σύνολο'), ...tot.map(XL.mb), XL.mb(tot.reduce((x, y) => x + y, 0)), ...(type === 'expense' ? [XL.mb(DB.categories.filter(c => c.type === 'expense').reduce((x, c) => x + (c.budget || 0), 0)), null] : [])]);
  return { name: `${type === 'expense' ? 'Έξοδα' : 'Έσοδα'} ${year}`, rows, widths: [34, ...Array(12).fill(11), 13, 13, 12], freeze: 4, landscape: true };
}
function buildSummaryBook(year, focus) {
  const sheets = [];
  const a = yearAgg(year);
  // 1. Σύνοψη
  {
    const rows = xlHeadRows(`Σύνοψη ${year}`);
    rows.push([XL.h('Μήνας'), XL.h('Έσοδα'), XL.h('Έξοδα'), XL.h('Έμειναν'), XL.h('Έξοδα χωρίς έκτακτα')]);
    let ti = 0, te = 0, tn = 0;
    for (let m = 0; m < 12; m++) {
      ti += a.mInc[m]; te += a.mExp[m]; tn += a.mExpNoExtra[m];
      rows.push([MONTHS[m], XL.m(a.mInc[m]), XL.m(a.mExp[m]), a.mInc[m] || a.mExp[m] ? { v: round2(a.mInc[m] - a.mExp[m]), s: 'money' } : null, XL.m(a.mExpNoExtra[m])]);
    }
    rows.push([XL.tt('Σύνολο'), XL.mb(ti), XL.mb(te), XL.mb(ti - te), XL.mb(tn)]);
    rows.push([], [XL.b('Με μια ματιά (σήμερα)')]);
    const mt = moneyTotals(todayStr());
    const owed = DB.tenants.reduce((x, t) => x + Math.max(0, tenantLedger(t).balance), 0);
    const taxLeft = taxInst().filter(x => !x.i.paid && +x.i.due.slice(0, 4) === year).reduce((x, y) => x + y.i.amount, 0);
    const taxLate = taxInst().filter(x => !x.i.paid && x.i.due < todayStr()).length;
    rows.push(['Όλα τα χρήματα (σε €)', XL.mz(mt.all)]);
    rows.push(['Ενοίκια που χρωστάνε', XL.mz(owed)]);
    rows.push([`Εφορία: μένουν για το ${year}`, XL.mz(taxLeft), taxLate ? `${taxLate} ληξιπρόθεσμες δόσεις` : '']);
    for (const p of DB.people) { const b = personBalance(p); rows.push([`${p.name}: ${b >= 0 ? 'μας χρωστάνε' : 'τους χρωστάμε'}`, XL.mz(Math.abs(b))]); }
    const rem = reminders();
    if (rem.length) { rows.push([], [XL.b('Να θυμηθώ')]); for (const r of rem) rows.push([r.text.replace(/<[^>]+>/g, ''), r.sub.replace(/<[^>]+>/g, '')]); }
    sheets.push({ name: `Σύνοψη ${year}`, rows, widths: [52, 16, 16, 16, 20], freeze: 4, key: 'home' });
  }
  sheets.push({ ...catSheet(year, 'expense'), key: 'year' });
  sheets.push({ ...catSheet(year, 'income'), key: 'year-inc' });
  // Κινήσεις
  {
    const rows = xlHeadRows(`Κινήσεις ${year}`, 'Όλες οι καταχωρήσεις της χρονιάς. Μπορείτε να τις φιλτράρετε από το Excel (Δεδομένα → Φίλτρο).');
    rows.push(['Ημερομηνία', 'Μήνας', 'Κατηγορία', 'Σημείωση', 'Ποιος', 'Τρόπος', 'Έσοδο', 'Έξοδο', 'Κατάσταση'].map(XL.h));
    for (const t of DB.transactions.filter(t => yOf(t) === year).sort((x, y) => x.date.localeCompare(y.date)))
      rows.push([t.dayKnown === false ? null : XL.d(t.date), MONTHS[mOf(t) - 1], catName(t.categoryId), t.note || '', t.person || '', [t.method, t.accountId && accById(t.accountId) ? accLabel(accById(t.accountId)) : ''].filter(Boolean).join(' · '),
        t.type === 'income' ? XL.mz(t.amount) : null, t.type === 'expense' ? XL.mz(t.amount) : null, t.planned ? 'προγραμματισμένο' : '']);
    sheets.push({ name: `Κινήσεις ${year}`, rows, widths: [12, 12, 30, 34, 10, 11, 13, 13, 17], freeze: 4, key: 'list', landscape: true });
  }
  // Ενοίκια
  if (DB.tenants.length) {
    const rows = xlHeadRows(`Ενοίκια ${year}`, 'Πληρωμές ανά μήνα (όλο το ποσό που έδωσε ο ενοικιαστής) και τι χρωστάει σήμερα.');
    rows.push(['Ενοικιαστής', 'Ακίνητο', 'Ενοίκιο', 'Δικό μας %', ...MONTHS_SHORT, 'Πλήρωσε', 'Χρωστάει σήμερα'].map(XL.h));
    for (const t of DB.tenants) {
      const pays = tenantPayments(t).filter(p => yOf(p) === year);
      const pm = Array(12).fill(0); pays.forEach(p => { pm[mOf(p) - 1] += paidOf(p); });
      const b = tenantLedger(t).balance;
      rows.push([`${t.name}${t.end && t.end < curYM() ? ' (έφυγε)' : ''}`, t.property || '', XL.mz(currentRent(t)), { v: shareOf(t) / 100, s: 'pct' }, ...pm.map(XL.m), XL.mz(pm.reduce((x, y) => x + y, 0)), { v: round2(b), s: b > 0.005 ? 'moneyR' : 'moneyG' }]);
    }
    sheets.push({ name: 'Ενοίκια', rows, widths: [26, 14, 12, 10, ...Array(12).fill(10), 13, 15], freeze: 4, key: 'rent', landscape: true });
    const dr = declRows(year);
    const r2 = xlHeadRows(`Ενοίκια για τη δήλωση ${year}`, 'Ενοίκιο × μήνες που ήταν νοικιασμένο, όπως στο παλιό Excel.');
    r2.push(['Ενοικιαστής', 'Ακίνητο', 'Ενοίκιο τον μήνα', 'Μήνες', 'Ενοίκια χρονιάς', 'Δικό μας %', 'Δικό μας ποσό', 'Εισπράχθηκαν'].map(XL.h));
    for (const r of dr) r2.push([r.t.name, r.t.property || '', r.rents.map(x => eur(x)).join(' → '), XL.n(r.months), XL.mz(r.contract), { v: r.share / 100, s: 'pct' }, XL.mz(r.ours), XL.mz(r.received)]);
    r2.push([XL.tt('Σύνολο'), null, null, null, XL.mb(dr.reduce((x, r) => x + r.contract, 0)), null, XL.mb(dr.reduce((x, r) => x + r.ours, 0)), XL.mb(dr.reduce((x, r) => x + r.received, 0))]);
    sheets.push({ name: `Δήλωση ${year}`, rows: r2, widths: [26, 14, 20, 8, 15, 11, 15, 15], freeze: 4, key: 'decl' });
  }
  // Χρήματα
  if (DB.accounts.length) {
    const rows = xlHeadRows('Χρήματα', `Τελευταίο υπόλοιπο κάθε λογαριασμού. Ισοτιμία: 1 € = ${String(DB.settings.usdPerEur).replace('.', ',')} $`);
    rows.push(['Είδος', 'Τράπεζα', 'Λογαριασμός', 'Ποιανού', 'Νόμισμα', 'Υπόλοιπο', 'Ημερομηνία', 'Σε €'].map(XL.h));
    let tot = 0;
    for (const [k, l] of KINDS) for (const ac of DB.accounts.filter(x => x.kind === k && !x.archived).sort((x, y) => x.order - y.order)) {
      const lb = lastBal(ac); const e = lb ? toEur(lb.balance, ac.currency) : 0; tot += e;
      rows.push([l, ac.bank, ac.name, ac.owner, ac.currency === 'USD' ? '$' : '€', lb ? { v: lb.balance, s: 'num' } : null, lb ? XL.d(lb.date) : null, XL.mz(e)]);
    }
    rows.push([XL.tt('Σύνολο σε €'), null, null, null, null, null, null, XL.mb(tot)]);
    sheets.push({ name: 'Χρήματα', rows, widths: [24, 14, 22, 14, 9, 15, 12, 15], freeze: 4, key: 'money' });
  }
  // Κινήσεις λογαριασμών (καταθέσεις, αναλήψεις, μεταφορές και έσοδα/έξοδα με λογαριασμό)
  {
    const accs = DB.accounts.filter(a => (a.moves || []).length || DB.transactions.some(t => t.accountId === a.id && !t.planned));
    if (accs.length) {
      const rows = xlHeadRows('Κινήσεις λογαριασμών', 'Το υπόλοιπο μετά από κάθε κίνηση. «📌» = υπόλοιπο που γράφτηκε με το χέρι (ή από το Excel).');
      rows.push(['Λογαριασμός', 'Ημερομηνία', 'Τι', 'Ποσό', 'Υπόλοιπο'].map(XL.h));
      for (const a of accs) for (const r of accTimeline(a)) rows.push([accLabel(a), XL.d(r.date), r.snap ? '📌 Γράφτηκε υπόλοιπο' : (r.text || (r.amount > 0 ? 'Κατάθεση' : 'Ανάληψη')), r.snap ? null : { v: r.amount, s: r.amount < 0 ? 'moneyR' : 'moneyG' }, { v: r.bal, s: 'money' }]);
      sheets.push({ name: 'Κινήσεις λογαριασμών', rows, widths: [28, 12, 40, 14, 15], freeze: 4, key: 'accmoves' });
    }
  }
  // Εφορία
  if (DB.taxes.length) {
    const rows = xlHeadRows(`Εφορία ${year}`);
    rows.push(['Οφειλή', 'Ποιος', 'Δόση', 'Λήξη', 'Ποσό', 'Κατάσταση', 'Πληρώθηκε'].map(XL.h));
    for (const t of DB.taxes) t.installments.forEach((i, k) => { if (+i.due.slice(0, 4) !== year) return; rows.push([t.name, t.person, `${k + 1} / ${t.installments.length}`, XL.d(i.due), XL.mz(i.amount), i.paid ? 'Πληρώθηκε' : i.due < todayStr() ? 'ΕΛΗΞΕ' : 'Θα πληρωθεί', i.paidDate ? XL.d(i.paidDate) : null]); });
    const ins = taxInst().filter(x => +x.i.due.slice(0, 4) === year);
    rows.push([XL.tt('Πληρώθηκαν'), null, null, null, XL.mb(ins.filter(x => x.i.paid).reduce((s, x) => s + x.i.amount, 0))]);
    rows.push([XL.tt('Μένουν'), null, null, null, XL.mb(ins.filter(x => !x.i.paid).reduce((s, x) => s + x.i.amount, 0))]);
    sheets.push({ name: `Εφορία ${year}`, rows, widths: [36, 10, 8, 12, 13, 14, 12], freeze: 4, key: 'tax' });
  }
  // Πάγια
  if (DB.recurring.length) {
    const rows = xlHeadRows('Πάγια');
    rows.push(['Τύπος', 'Κατηγορία', 'Σημείωση', 'Ποσό', 'Πόσο συχνά', 'Επόμενο', 'Τελευταίο', 'Κατάσταση'].map(XL.h));
    for (const r of DB.recurring) { const nd = nextDue(r); rows.push([r.type === 'income' ? 'Έσοδο' : 'Έξοδο', catName(r.categoryId), r.note || '', XL.mz(r.amount), freqText(r), r.active && nd ? ymLabel(nd) : '', r.until ? ymLabel(r.until) + (r.total ? ` (${r.total} δόσεις)` : '') : '', !r.active ? 'σταματημένο' : recEnded(r) ? 'τελείωσε' : r.variable ? 'ποσό κατά προσέγγιση' : '']); }
    sheets.push({ name: 'Πάγια', rows, widths: [9, 28, 30, 12, 30, 16, 24, 20], freeze: 4, key: 'recurring', landscape: true });
  }
  // Οφειλές
  for (const p of DB.people) {
    const rows = xlHeadRows(`Οφειλές: ${p.name}`, p.note || '');
    rows.push(['Ημερομηνία', 'Τι', 'Πληρώσαμε εμείς', 'Μας έδωσαν', 'Υπόλοιπο'].map(XL.h));
    let run = 0;
    for (const e of p.entries.slice().sort((x, y) => x.date.localeCompare(y.date))) { run = round2(run + (e.dir === 'out' ? e.amount : -e.amount)); rows.push([XL.d(e.date), e.text, e.dir === 'out' ? XL.mz(e.amount) : null, e.dir === 'in' ? XL.mz(e.amount) : null, XL.mz(run)]); }
    rows.push([XL.tt(run >= 0 ? 'Μας χρωστάνε' : 'Τους χρωστάμε'), null, null, null, XL.mb(Math.abs(run))]);
    sheets.push({ name: `Οφειλές ${p.name}`, rows, widths: [12, 50, 16, 14, 14], freeze: 4, key: 'people' });
  }
  // Αυτοκίνητα
  if (DB.cars.length) {
    const rows = xlHeadRows('Αυτοκίνητα');
    rows.push(['Αυτοκίνητο', 'Μάρκα / μοντέλο', 'Πινακίδα', 'Χιλιόμετρα', 'Ημερομηνία', 'Επόμενο σέρβις (km)', 'Μένουν km', `Χλμ ${year}`, 'ΚΤΕΟ'].map(XL.h));
    for (const c of DB.cars) { const k = carKm(c), st = carService(c); rows.push([c.name + (c.sold ? ' (πουλήθηκε)' : ''), [c.brand, c.model, c.year].filter(Boolean).join(' '), c.plate || '', k ? XL.n(k.km) : null, k ? XL.d(k.date) : null, st ? XL.n(st.next) : null, st ? { v: st.left, s: st.left < 0 ? 'moneyR' : 'num' } : null, XL.n(carYearKm(c, year)), c.kteo ? XL.d(c.kteo) : null]); }
    rows.push([], [XL.b('Σέρβις')], ['Αυτοκίνητο', 'Ημερομηνία', 'Χλμ', 'Τι έγινε', 'Κόστος', 'Επόμενο (km)'].map(XL.h));
    for (const c of DB.cars) for (const s of c.services.slice().sort((x, y) => y.date.localeCompare(x.date))) rows.push([c.name, XL.d(s.date), XL.n(s.km || null), s.work, XL.m(s.cost), XL.n(s.nextKm)]);
    sheets.push({ name: 'Αυτοκίνητα', rows, widths: [24, 20, 12, 34, 13, 14, 12, 12, 12], freeze: 0, key: 'cars' });
  }
  // Χωράφι
  if (DB.field && (DB.field.waterings.length || DB.field.payments.length)) {
    const rows = xlHeadRows('Χωράφι – πότισμα');
    rows.push(['Χρονιά', 'Ποτίσματα', 'Ώρες', 'Πληρώσαμε', '€ την ώρα'].map(XL.h));
    const ys = [...new Set([...DB.field.waterings.map(w => +w.date.slice(0, 4)), ...DB.field.payments.map(p => p.year)])].sort((x, y) => y - x);
    for (const y of ys) { const r = fieldYear(y); rows.push([XL.n(y), XL.n(r.ws.length), XL.n(r.hours), r.paid ? XL.mz(r.paid) : 'απλήρωτο', r.paid && r.hours ? XL.mz(r.paid / r.hours) : null]); }
    rows.push([], [XL.b(`Ποτίσματα ${year}`)], ['Ημερομηνία', 'Ώρες'].map(XL.h));
    for (const w of fieldYear(year).ws) rows.push([XL.d(w.date), XL.n(w.hours)]);
    sheets.push({ name: 'Χωράφι', rows, widths: [12, 12, 10, 14, 12], freeze: 0, key: 'field' });
  }
  // Ιστορικό
  {
    const hr = historyRows();
    const rows = xlHeadRows('Ιστορικό χρόνων');
    rows.push(['Χρονιά', 'Έσοδα', 'Έξοδα', 'Διαφορά', 'Πηγή'].map(XL.h));
    for (const r of hr) rows.push([XL.n(r.y), XL.m(r.i), XL.m(r.e), r.i != null && r.e != null ? XL.mz(r.i - r.e) : null, r.src === 'Excel' ? 'Σύνολα από το παλιό Excel' : 'Καταχωρήσεις HomeFlow']);
    sheets.push({ name: 'Ιστορικό', rows, widths: [9, 15, 15, 15, 30], freeze: 4, key: 'history' });
  }
  const want = { home: 'home', list: 'list', year: 'year', rent: 'rent', money: 'money', tax: 'tax', recurring: 'recurring', people: 'people', cars: 'cars', field: 'field', history: 'history' }[focus] || 'home';
  const idx = sheets.findIndex(s => s.key === (focus === 'rent' && ui.tabs.rent === 'decl' ? 'decl' : want));
  sheets.forEach((s, i) => { s.active = i === (idx < 0 ? 0 : idx); delete s.key; });
  return { title: `HomeFlow ${year}`, sheets };
}
function excelYearFor(page) {
  return page === 'home' ? ui.year : page === 'year' ? ui.yearView : page === 'list' ? (ui.list.year || now.getFullYear()) : page === 'tax' ? (ui.taxYear || now.getFullYear()) : page === 'rent' && ui.declYear ? ui.declYear : now.getFullYear();
}
async function exportSummary() {
  const year = excelYearFor(ui.page);
  const book = buildSummaryBook(year, ui.page);
  const name = `HomeFlow-${year}-${todayStr()}.xlsx`;
  if (window.homeflow && window.homeflow.saveXlsx) {
    const r = await window.homeflow.saveXlsx(book, name);
    if (r && r.ok) toast('Το Excel αποθηκεύτηκε και ανοίγει…'); else if (r && r.error) toast(r.error);
  } else { window.__lastBook = book; toast('Στον browser δεν φτιάχνεται Excel (μόνο στην εφαρμογή).'); }
}
async function exportTxXlsx(list, title, name) {
  const rows = xlHeadRows(title);
  rows.push(['Ημερομηνία', 'Μήνας', 'Κατηγορία', 'Σημείωση', 'Ποιος', 'Τρόπος', 'Έσοδο', 'Έξοδο', 'Κατάσταση'].map(XL.h));
  let ti = 0, te = 0;
  for (const t of list) { if (t.type === 'income') ti += t.amount; else te += t.amount; rows.push([t.dayKnown === false ? null : XL.d(t.date), `${MONTHS[mOf(t) - 1]} ${yOf(t)}`, catName(t.categoryId), t.note || '', t.person || '', [t.method, t.accountId && accById(t.accountId) ? accLabel(accById(t.accountId)) : ''].filter(Boolean).join(' · '), t.type === 'income' ? XL.mz(t.amount) : null, t.type === 'expense' ? XL.mz(t.amount) : null, t.planned ? 'προγραμματισμένο' : '']); }
  rows.push([XL.tt('Σύνολο'), null, null, null, null, null, XL.mb(ti), XL.mb(te)]);
  const book = { title, sheets: [{ name: 'Κινήσεις', rows, widths: [12, 15, 30, 34, 10, 11, 13, 13, 17], freeze: 4, landscape: true, active: true }] };
  if (window.homeflow && window.homeflow.saveXlsx) { const r = await window.homeflow.saveXlsx(book, name); if (r && r.ok) toast('Το Excel αποθηκεύτηκε και ανοίγει…'); }
  else { window.__lastBook = book; toast('Στον browser δεν φτιάχνεται Excel (μόνο στην εφαρμογή).'); }
}

function exportTx(list, name) {
  const head = ['Ημερομηνία', 'Μήνας', 'Τύπος', 'Κατηγορία', 'Ποσό', 'Σημείωση', 'Ποιος', 'Τρόπος', 'Προγραμματισμένο'];
  const lines = [head.join(';')].concat(list.map(t => [
    t.dayKnown === false ? '' : t.date.split('-').reverse().join('/'), `${MONTHS[mOf(t) - 1]} ${yOf(t)}`,
    t.type === 'income' ? 'Έσοδο' : 'Έξοδο', catName(t.categoryId), csvNum(t.amount), t.note, t.person, t.method, t.planned ? 'Ναι' : ''
  ].map(csvCell).join(';')));
  saveText(lines.join('\r\n'), name, 'csv');
}
function exportYear(year) {
  const a = yearAgg(year);
  const lines = [['Κατηγορία', ...MONTHS, 'Σύνολο'].join(';')];
  for (const type of ['expense', 'income']) {
    lines.push(type === 'expense' ? 'ΕΞΟΔΑ' : 'ΕΣΟΔΑ');
    const data = type === 'expense' ? a.exp : a.inc;
    for (const c of DB.categories.filter(c => c.type === type).sort((x, y) => x.order - y.order)) {
      const arr = data[c.id]; if (!arr) continue;
      lines.push([csvCell(c.name), ...arr.map(csvNum), csvNum(arr.reduce((x, y) => x + y, 0))].join(';'));
    }
    const tot = type === 'expense' ? a.mExp : a.mInc;
    lines.push(['Σύνολο', ...tot.map(csvNum), csvNum(tot.reduce((x, y) => x + y, 0))].join(';'));
    lines.push('');
  }
  saveText(lines.join('\r\n'), `HomeFlow-${year}.csv`, 'csv');
}
