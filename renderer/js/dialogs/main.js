'use strict';
// HomeFlow · Παράθυρα: πάγια, ενοικιαστές, λογαριασμοί (και ο κεντρικός «διανομέας» παραθύρων)
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- παράθυρα για πάγια και ενοικιαστές ----------
let dlg = null;
function catGrid(type, sel, action) {
  const usage = usageCount(type);
  const cats = activeCats(type).slice();
  if (sel && !cats.some(c => c.id === sel)) { const c = catById(sel); if (c) cats.push(c); }
  cats.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.order - b.order);
  return `<div class="cat-grid">${cats.map(c => `<button class="cat-btn ${c.id === sel ? 'sel' : ''}" data-action="${action}" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>`;
}
function chipsHtml(values, sel, action, emptyLabel) {
  return `<div class="chips">${values.map(v => `<button class="chip ${sel === v ? 'sel' : ''}" data-action="${action}" data-v="${esc(v)}">${v === '' ? emptyLabel : esc(v)}</button>`).join('')}</div>`;
}
function openRecDialog(type, r) {
  dlg = r ? { kind: 'rec', id: r.id, type: r.type, amountStr: numFmt.format(r.amount).replace(/\./g, ''), categoryId: r.categoryId, note: r.note, day: r.day, every: r.every, from: r.from, person: r.person, method: r.method, until: r.until || '', totalStr: r.total ? String(r.total) : '', variable: !!r.variable, error: '' }
    : { kind: 'rec', id: null, type, amountStr: '', categoryId: '', note: '', day: new Date().getDate(), every: 1, from: curYM(), person: '', method: '', until: '', totalStr: '', variable: false, error: '' };
  renderDlg();
  setTimeout(() => { const a = $('#d-amount'); if (a) a.focus(); }, 30);
}
function openTenantDialog(t) {
  dlg = t ? { kind: 'tenant', id: t.id, name: t.name, property: t.property, rentStr: numFmt.format(currentRent(t)).replace(/\./g, ''), shareStr: String(shareOf(t)), start: t.start, openingStr: t.opening ? numFmt.format(t.opening).replace(/\./g, '') : '', dueDay: t.dueDay || 1, note: t.note, end: t.end || '', leaseEnd: t.leaseEnd || '', adjust: t.adjust || '', error: '' }
    : { kind: 'tenant', id: null, name: '', property: '', rentStr: '', shareStr: '100', start: curYM(), openingStr: '', dueDay: 1, note: '', end: '', leaseEnd: '', adjust: '', error: '' };
  renderDlg();
  setTimeout(() => { const a = $('#d-name'); if (a) a.focus(); }, 30);
}
function syncDlg() {
  if (!dlg) return;
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (dlg.kind === 'rec') {
    if (v('d-amount') !== undefined) dlg.amountStr = v('d-amount');
    if (v('d-note') !== undefined) dlg.note = v('d-note').trim();
    if (v('d-day') !== undefined) dlg.day = Math.min(31, Math.max(1, +v('d-day') || 1));
    if (v('d-from')) dlg.from = v('d-from');
    if (v('d-until') !== undefined) dlg.until = v('d-until');
    if (v('d-total') !== undefined) dlg.totalStr = v('d-total').trim();
    { const vc = $('#d-variable'); if (vc) dlg.variable = vc.checked; }
  } else {
    for (const [id, k] of [['d-name', 'name'], ['d-prop', 'property'], ['d-rent', 'rentStr'], ['d-share', 'shareStr'], ['d-opening', 'openingStr'], ['d-tnote', 'note']]) if (v(id) !== undefined) dlg[k] = v(id).trim();
    if (v('d-start')) dlg.start = v('d-start');
    if (v('d-due') !== undefined) dlg.dueDay = Math.min(31, Math.max(1, +v('d-due') || 1));
    if (v('d-end') !== undefined) dlg.end = v('d-end');
    if (v('d-lease') !== undefined) dlg.leaseEnd = v('d-lease');
    if (v('d-adjust') !== undefined) dlg.adjust = v('d-adjust');
  }
}
function balDiffHint(a, amt) {
  const lb = lastBal(a);
  if (!lb || amt === null || isNaN(amt)) return '';
  const d = amt - lb.balance;
  if (Math.abs(d) < 0.005) return 'Ίδιο με πριν.';
  return `${d > 0 ? 'Αύξηση' : 'Μείωση'} <b class="${d > 0 ? 'inc' : 'exp'}">${money(Math.abs(d), a.currency)}</b> από την προηγούμενη φορά.`;
}
function syncMoney() {
  if (!dlg) return;
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (v('d-amount') !== undefined) dlg.amountStr = v('d-amount');
  if (v('d-date')) dlg.date = v('d-date');
  if (v('d-bank') !== undefined) dlg.bank = v('d-bank').trim();
  if (v('d-accname') !== undefined) dlg.name = v('d-accname').trim();
  if (v('d-owner') !== undefined) dlg.owner = v('d-owner').trim();
  if (v('d-maturity') !== undefined) dlg.maturity = v('d-maturity');
  const ar = $('#d-archived'); if (ar) dlg.archived = ar.checked;
}
function saveMoneyDlg() {
  syncMoney();
  const d = dlg;
  const fail = msg => { d.error = msg; renderDlg(); };
  if (d.kind === 'bal') {
    const a = DB.accounts.find(x => x.id === d.id);
    const amt = parseAmount(d.amountStr);
    if (amt === null || isNaN(amt)) return fail('Γράψτε το υπόλοιπο.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return fail('Η ημερομηνία δεν είναι σωστή.');
    const before = a.history.slice();
    a.history = a.history.filter(h => h.date !== d.date);
    a.history.push({ date: d.date, balance: amt });
    a.history.sort((x, y) => x.date.localeCompare(y.date));
    dlg = null; renderDlg(); persist(); render();
    toast(`${a.bank ? a.bank + ' · ' : ''}${a.name}: ${money(amt, a.currency)}`, () => { a.history = before; persist(); render(); });
    return;
  }
  if (!d.name && !d.bank) return fail('Γράψτε τράπεζα ή όνομα λογαριασμού.');
  if (d.id) {
    const a = DB.accounts.find(x => x.id === d.id);
    Object.assign(a, { bank: d.bank, name: d.name, owner: d.owner, currency: d.currency, kind: d.kind2, archived: !!d.archived, maturity: d.kind2 === 'deposit' ? (d.maturity || '') : '' });
  } else {
    const amt = d.amountStr ? parseAmount(d.amountStr) : 0;
    if (isNaN(amt)) return fail('Το υπόλοιπο δεν είναι σωστό ποσό.');
    DB.accounts.push({ id: 'a' + uid(), bank: d.bank, name: d.name, owner: d.owner, currency: d.currency, kind: d.kind2, archived: false, maturity: d.kind2 === 'deposit' ? (d.maturity || '') : '',
      order: DB.accounts.length, history: [{ date: todayStr(), balance: amt || 0 }] });
  }
  dlg = null; renderDlg(); persist(); render();
  toast(d.id ? 'Ο λογαριασμός αποθηκεύτηκε.' : 'Νέος λογαριασμός.');
}
function syncLeave() { const el = $('#d-end'); if (dlg && dlg.kind === 'leave' && el && el.value) dlg.end = el.value; }
function renderDlg() {
  const root = $('#modal-root');
  if (!dlg) { root.innerHTML = ''; return; }
  const d = dlg;
  let title, head, body;
  const r2 = renderUpdDlg(d) || renderPinDlg(d) || renderPolDlg(d) || renderDayDlg(d) || renderHelpDlg(d) || renderCloseDlg(d) || renderDlg2(d);
  if (r2) { ({ title, head, body } = r2); }
  else if (d.kind === 'rec') {
    const isExp = d.type === 'expense';
    head = isExp ? 'expense' : 'income';
    title = (d.id ? 'Αλλαγή πάγιου ' : 'Νέο πάγιο ') + (isExp ? 'εξόδου' : 'εσόδου');
    const amt = parseAmount(d.amountStr);
    body = `
      <div class="field"><label for="d-amount">Πόσα χρήματα κάθε φορά;</label>
        <div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">€</span><span id="d-calc" class="amount-calc">${calcHint(d.amountStr, amt)}</span></div></div>
      <label class="check"><input type="checkbox" id="d-variable" ${d.variable ? 'checked' : ''}> Το ποσό αλλάζει κάθε φορά (π.χ. ΔΕΗ). Θα ρωτάει πόσο ήταν όταν πατάτε «✓ Έγινε».</label>
      <div class="field"><div class="flabel">Για τι;</div>${catGrid(d.type, d.categoryId, 'dlg-cat')}</div>
      <div class="field"><label for="d-note">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-note" type="text" style="width:100%" value="${esc(d.note)}" placeholder="π.χ. δόση δανείου"></div>
      <div class="row">
        <div class="field"><div class="flabel">Πόσο συχνά;</div>
          <div class="chips">${[[1, 'Κάθε μήνα'], [2, 'Κάθε 2 μήνες'], [3, 'Κάθε 3 μήνες'], [6, 'Κάθε 6 μήνες'], [12, 'Μία φορά τον χρόνο']].map(([n, l]) => `<button class="chip ${d.every === n ? 'sel' : ''}" data-action="dlg-every" data-v="${n}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-day">Ποια μέρα του μήνα;</label><input id="d-day" type="number" min="1" max="31" value="${d.day}" style="width:7rem"></div>
        <div class="field"><label for="d-from">Από ποιον μήνα;</label><input id="d-from" type="month" value="${esc(d.from)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-until">Τελειώνει; Τελευταίος μήνας <span class="muted" style="font-weight:500">(αν έχει τέλος)</span></label>
          <div style="display:flex;gap:.6rem;align-items:center"><input id="d-until" type="month" value="${esc(d.until)}">${d.until ? '<button class="btn small ghost" data-action="dlg-clear-until">✕ Χωρίς τέλος</button>' : ''}</div></div>
        <div class="field"><label for="d-total">Αν είναι δόσεις: πόσες όλες μαζί;</label><input id="d-total" type="number" min="1" max="600" value="${esc(d.totalStr)}" style="width:7rem" placeholder="—">
          <div class="hint">Τότε φαίνεται «δόση 80 από 100».</div></div>
      </div>
      <div class="row">
        ${(DB.settings.persons || []).length ? `<div class="field"><div class="flabel">Ποιος;</div>${chipsHtml(['', ...DB.settings.persons], d.person, 'dlg-person', 'Όλοι / —')}</div>` : ''}
        <div class="field"><div class="flabel">Πώς;</div>${chipsHtml(['', ...(DB.settings.methods || [])], d.method, 'dlg-method', '—')}</div>
      </div>`;
  } else if (d.kind === 'bal') {
    const a = DB.accounts.find(x => x.id === d.id);
    const lb = lastBal(a);
    const amt = parseAmount(d.amountStr);
    head = 'neutral';
    title = `Νέο υπόλοιπο: ${esc(a.bank ? a.bank + ' · ' : '')}${esc(a.name)}`;
    body = `
      ${lb ? `<div style="font-size:1.1rem">Τελευταίο υπόλοιπο: <b>${money(lb.balance, a.currency)}</b> στις ${shortDate(lb.date)}</div>` : ''}
      <div class="field"><label for="d-amount">Πόσα έχει τώρα ο λογαριασμός;</label>
        <div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">${curSym(a.currency)}</span></div>
        <div id="d-baldiff" class="amount-calc" style="margin-top:.4rem">${balDiffHint(a, amt)}</div></div>
      <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>`;
  } else if (d.kind === 'acc') {
    head = 'neutral';
    title = d.id ? 'Στοιχεία λογαριασμού' : 'Νέος λογαριασμός';
    const banks = [...new Set(DB.accounts.map(a => a.bank).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
    const owners = [...new Set([...DB.accounts.map(a => a.owner), ...(DB.settings.persons || [])].filter(Boolean))];
    const a = d.id ? DB.accounts.find(x => x.id === d.id) : null;
    body = `
      <div class="row">
        <div class="field"><label for="d-bank">Τράπεζα</label><input id="d-bank" type="text" style="width:100%" value="${esc(d.bank)}" placeholder="π.χ. ΕΤΕ">
          ${banks.length ? `<div class="chips" style="margin-top:.4rem">${banks.map(b => `<button class="chip ${d.bank === b ? 'sel' : ''}" data-action="dlg-bank" data-v="${esc(b)}">${esc(b)}</button>`).join('')}</div>` : ''}</div>
        <div class="field"><label for="d-accname">Όνομα ή αριθμός λογαριασμού</label><input id="d-accname" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. 795 ή Μισθοδοσία"></div>
      </div>
      <div class="field"><label for="d-owner">Ποιανού;</label><input id="d-owner" type="text" style="width:100%" value="${esc(d.owner)}">
        ${owners.length ? `<div class="chips" style="margin-top:.4rem">${owners.map(o => `<button class="chip ${d.owner === o ? 'sel' : ''}" data-action="dlg-owner" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}</div>
      <div class="row">
        <div class="field"><div class="flabel">Νόμισμα</div><div class="chips"><button class="chip ${d.currency === 'EUR' ? 'sel' : ''}" data-action="dlg-cur" data-v="EUR">€ Ευρώ</button><button class="chip ${d.currency === 'USD' ? 'sel' : ''}" data-action="dlg-cur" data-v="USD">$ Δολάρια</button></div></div>
        ${d.id ? '' : `<div class="field"><label for="d-amount">Υπόλοιπο σήμερα</label><div class="amount-wrap"><input id="d-amount" class="num" style="width:12rem" inputmode="decimal" value="${esc(d.amountStr)}" placeholder="0,00"><span style="font-weight:700">${curSym(d.currency)}</span></div></div>`}
      </div>
      <div class="field"><div class="flabel">Είδος</div><div class="chips">${KINDS.map(([k, l, i]) => `<button class="chip ${d.kind2 === k ? 'sel' : ''}" data-action="dlg-kind" data-v="${k}">${i} ${l}</button>`).join('')}</div></div>
      ${d.kind2 === 'deposit' ? `<div class="field"><label for="d-maturity">Πότε λήγει η προθεσμιακή;</label><div style="display:flex;gap:.6rem;align-items:center"><input id="d-maturity" type="date" value="${esc(d.maturity || '')}">${d.maturity ? '<button class="btn small" data-action="dlg-clear-maturity">✕ Χωρίς ημερομηνία</button>' : ''}</div><div class="hint">Θα σας θυμίσει μία εβδομάδα πριν, για να αποφασίσετε αν θα την ανανεώσετε.</div></div>` : ''}
      ${a ? `<div class="field"><div class="flabel">Ιστορικό υπολοίπων</div>
        <table class="data" style="max-width:32rem"><tbody>${a.history.slice().reverse().map((h, i) => `<tr style="cursor:default"><td>${shortDate(h.date)}</td><td class="r num"><b>${money(h.balance, a.currency)}</b></td><td style="width:3rem">${a.history.length > 1 ? `<button class="btn small ghost" data-action="acc-hist-del" data-i="${a.history.length - 1 - i}" title="Σβήσιμο">🗑</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <label class="check"><input type="checkbox" id="d-archived" ${d.archived ? 'checked' : ''}> Ο λογαριασμός έκλεισε (να μη μετράει στα σύνολα)</label>` : ''}`;
  } else if (d.kind === 'leave') {
    const t = tenantById(d.id);
    head = 'neutral';
    title = `🚪 Ξενοικιάστηκε: ${esc(t.name)}`;
    body = `
      <p style="margin:0;font-size:1.1rem">Ποιος είναι ο <b>τελευταίος μήνας</b> που χρεώνεται ενοίκιο; Από τον επόμενο μήνα το ακίνητο${t.property ? ` (${esc(t.property)})` : ''} φαίνεται ξενοίκιαστο και δεν γράφεται άλλη οφειλή.</p>
      <div class="chips">
        <button class="chip ${d.end === addMonths(curYM(), -1) ? 'sel' : ''}" data-action="dlg-end" data-v="${addMonths(curYM(), -1)}">Ο προηγούμενος μήνας (${ymLabel(addMonths(curYM(), -1))})</button>
        <button class="chip ${d.end === curYM() ? 'sel' : ''}" data-action="dlg-end" data-v="${curYM()}">Αυτός ο μήνας (${ymLabel(curYM())})</button>
      </div>
      <div class="field"><label for="d-end">ή διαλέξτε μήνα</label><input id="d-end" type="month" value="${esc(d.end)}"></div>
      ${(() => { const b = tenantLedger({ ...t, end: d.end || t.end }).balance; return b > 0.005 ? `<div class="notice" style="margin:0">Με αυτόν τον μήνα, ο ${esc(t.name)} θα χρωστάει <b>${eur(b)}</b>. Η οφειλή μένει στην καρτέλα του, ώσπου να εξοφληθεί.</div>` : ''; })()}`;
  } else {
    head = 'neutral';
    title = d.id ? 'Στοιχεία ενοικιαστή' : 'Νέος ενοικιαστής';
    body = `
      <div class="row">
        <div class="field"><label for="d-name">Όνομα ενοικιαστή</label><input id="d-name" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. Παπαδόπουλος"></div>
        <div class="field"><label for="d-prop">Ποιο ακίνητο;</label><input id="d-prop" type="text" style="width:100%" value="${esc(d.property)}" placeholder="π.χ. Τρίπολη – κατάστημα"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-rent">Ενοίκιο τον μήνα</label>
          <div class="amount-wrap"><input id="d-rent" class="amount-input num" style="font-size:1.8rem!important;width:12rem" inputmode="decimal" value="${esc(d.rentStr)}" placeholder="0,00"><span class="amount-eur" style="font-size:1.8rem">€</span></div>
          ${d.id ? '<div class="hint">Αν αλλάξει το ενοίκιο, το νέο μετράει από αυτόν τον μήνα. Οι παλιοί μήνες μένουν όπως ήταν.</div>' : ''}</div>
        <div class="field"><label for="d-due">Πληρώνει συνήθως στις</label><div style="display:flex;align-items:center;gap:.6rem"><input id="d-due" type="number" min="1" max="31" value="${d.dueDay}" style="width:6rem"> <span>του μήνα</span></div></div>
      </div>
      <div class="field"><label for="d-share">Πόσο από το ενοίκιο είναι δικό μας;</label>
        <div style="display:flex;align-items:center;gap:.6rem"><input id="d-share" type="number" min="1" max="100" value="${esc(d.shareStr)}" style="width:6rem"> <span>%</span>
        <button class="chip ${d.shareStr === '100' ? 'sel' : ''}" data-action="dlg-share" data-v="100">Όλο (100%)</button><button class="chip ${d.shareStr === '50' ? 'sel' : ''}" data-action="dlg-share" data-v="50">Μισό (50%)</button></div>
        <div class="hint">Αν το ακίνητο είναι μισό δικό μας, στα έσοδα μπαίνει μόνο το μισό από κάθε πληρωμή. Η οφειλή του ενοικιαστή μετριέται πάντα με όλο το ενοίκιο.</div></div>
      <div class="row">
        <div class="field"><label for="d-start">Από ποιον μήνα μετράμε;</label><input id="d-start" type="month" value="${esc(d.start)}"></div>
        <div class="field"><label for="d-opening">Χρωστούσε ήδη από πριν;</label>
          <div class="amount-wrap"><input id="d-opening" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.openingStr)}" placeholder="0"><span style="font-weight:700">€</span></div>
          <div class="hint">Αν δεν χρωστάει, αφήστε το κενό.</div></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-lease">Λήξη συμβολαίου <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-lease" type="date" value="${esc(d.leaseEnd)}"></div>
        <div class="field"><label for="d-adjust">Επόμενη αναπροσαρμογή ενοικίου <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-adjust" type="date" value="${esc(d.adjust)}"></div>
      </div>
      <div class="hint" style="margin-top:-.6rem">Θα σας θυμίσει έναν μήνα πριν.</div>
      <div class="field"><label for="d-tnote">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-tnote" type="text" style="width:100%" value="${esc(d.note)}"></div>
      ${d.id ? `<div class="field"><label for="d-end">Αν έφυγε: τελευταίος μήνας που χρεώνεται</label><div style="display:flex;gap:.6rem;align-items:center"><input id="d-end" type="month" value="${esc(d.end)}">${d.end ? '<button class="btn small ghost" data-action="dlg-clear-end">✕ Δεν έφυγε</button>' : ''}</div></div>` : ''}`;
  }
  root.innerHTML = `
  <div class="modal-back" data-action="dlg-back">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head ${head}"><h2>${title}</h2><button class="btn small" data-action="dlg-close">✕</button></div>
      <div class="modal-body">${body}
        ${d.error ? `<div class="notice" style="margin:0;border-color:var(--exp-line);background:var(--exp-soft);color:var(--exp)"><b>${esc(d.error)}</b></div>` : ''}</div>
      <div class="modal-foot">
        ${d.kind === 'tenant' && d.id ? '<button class="btn danger" data-action="tenant-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'tax' && d.id ? '<button class="btn danger" data-action="tax-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pentry' && d.eid ? '<button class="btn danger" data-action="pentry-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'service' && d.sid ? '<button class="btn danger" data-action="service-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'person' && d.id ? '<button class="btn danger" data-action="person-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'car' && d.id ? '<button class="btn danger" data-action="car-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pbill' && d.id ? '<button class="btn danger" data-action="pb-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pol' && d.id ? '<button class="btn danger" data-action="pol-delete">🗑 Διαγραφή</button>' : ''}
        <div class="spacer"></div>
        ${d.kind === 'mclose' ? `<button class="btn" data-action="mclose-pdf">📄 Άνοιγμα PDF</button>${store.native ? '<button class="btn" data-action="mclose-folder">📂 Φάκελος</button>' : ''}` : ''}
        ${d.kind === 'day' || d.kind === 'help' || d.kind === 'mclose' ? '<button class="btn big primary" style="width:auto;padding:0 2.2rem" data-action="dlg-close">Κλείσιμο</button>' : `<button class="btn" data-action="dlg-close">Ακύρωση</button>
        <button class="btn big primary" style="width:auto;padding:0 2.2rem" data-action="dlg-save">${d.kind === 'pin' && d.step === 'code' ? '✓ Εντάξει' : d.kind === 'upd' ? '⬇️ Ενημέρωση τώρα' : '✓ Αποθήκευση'}</button>`}
      </div>
    </div>
  </div>`;
}
function saveDlg() {
  if (dlg.kind === 'upd') { saveUpdDlg(); return; }
  if (dlg.kind === 'pin') { savePinDlg(); return; }
  if (dlg.kind === 'ask') { saveAsk(); return; }
  if (dlg.kind === 'pol' || dlg.kind === 'polpay') { savePolDlg(); return; }
  if (dlg.kind === 'day' || dlg.kind === 'help' || dlg.kind === 'mclose') { dlg = null; renderDlg(); return; }
  if (['taxpay', 'tax', 'person', 'pentry', 'km', 'service', 'car', 'water', 'fieldpay', 'pset', 'pbill'].includes(dlg.kind)) { saveDlg2(); return; }
  if (dlg.kind === 'bal' || dlg.kind === 'acc') return saveMoneyDlg();
  if (dlg.kind === 'leave') {
    syncLeave();
    const t = tenantById(dlg.id);
    if (!/^\d{4}-\d{2}$/.test(dlg.end)) { dlg.error = 'Διαλέξτε μήνα.'; renderDlg(); return; }
    if (dlg.end < t.start) { dlg.error = `Ο μήνας είναι πριν από την αρχή (${ymLabel(t.start)}).`; renderDlg(); return; }
    t.end = dlg.end;
    dlg = null; renderDlg(); persist(); render();
    toast(`${t.name}: ξενοικιάστηκε (τελευταίος μήνας ${ymLabel(t.end)}).`);
    return;
  }
  syncDlg();
  const d = dlg;
  const fail = msg => { d.error = msg; renderDlg(); };
  if (d.kind === 'rec') {
    const amt = parseAmount(d.amountStr);
    if (amt === null || isNaN(amt) || amt <= 0) return fail('Γράψτε ένα ποσό μεγαλύτερο από 0.');
    if (!d.categoryId) return fail('Διαλέξτε για τι είναι.');
    if (!/^\d{4}-\d{2}$/.test(d.from)) return fail('Διαλέξτε από ποιον μήνα.');
    if (d.until && d.until < d.from) return fail('Ο τελευταίος μήνας είναι πριν από την αρχή.');
    const total = d.totalStr ? parseInt(d.totalStr, 10) : null;
    if (d.totalStr && !(total >= 1)) return fail('Οι δόσεις πρέπει να είναι αριθμός.');
    if (total && !d.until) return fail('Για τις δόσεις, διαλέξτε και τον μήνα της τελευταίας δόσης.');
    const fields = { type: d.type, amount: amt, categoryId: d.categoryId, note: d.note, day: d.day, every: d.every, from: d.from, person: d.person, method: d.method, until: d.until || '', total: total || null, variable: !!d.variable };
    if (d.id) {
      const r = DB.recurring.find(x => x.id === d.id);
      Object.assign(r, fields);
      // οι προγραμματισμένες (όχι οι πληρωμένες) ξαναφτιάχνονται με τα νέα στοιχεία
      DB.transactions = DB.transactions.filter(t => !(t.recurringId === r.id && t.planned));
    } else {
      DB.recurring.push({ id: 'r' + uid(), active: true, skip: [], ...fields });
    }
    generateRecurring();
    dlg = null; renderDlg(); persist(); render();
    toast(d.id ? 'Το πάγιο άλλαξε.' : `Νέο πάγιο: ${eur(amt)} – ${catName(fields.categoryId)}`);
  } else {
    if (!d.name) return fail('Γράψτε το όνομα του ενοικιαστή.');
    const rent = parseAmount(d.rentStr);
    if (rent === null || isNaN(rent) || rent < 0) return fail('Γράψτε το ενοίκιο τον μήνα.');
    const opening = d.openingStr ? parseAmount(d.openingStr) : 0;
    if (isNaN(opening)) return fail('Το «χρωστούσε από πριν» δεν είναι σωστό ποσό.');
    if (!/^\d{4}-\d{2}$/.test(d.start)) return fail('Διαλέξτε από ποιον μήνα μετράμε.');
    if (d.end && d.end < d.start) return fail('Ο μήνας που έφυγε είναι πριν από την αρχή.');
    const share = Math.round(+String(d.shareStr).replace(',', '.'));
    if (!(share >= 1 && share <= 100)) return fail('Το «πόσο είναι δικό μας» πρέπει να είναι από 1 ως 100%.');
    if (d.id) {
      const t = tenantById(d.id);
      const oldStart = t.start;
      const oldShare = shareOf(t);
      Object.assign(t, { name: d.name, property: d.property, start: d.start, opening: opening || 0, dueDay: d.dueDay, note: d.note, end: d.end || '', share, leaseEnd: d.leaseEnd || '', adjust: d.adjust || '' });
      if (oldShare !== share) for (const x of DB.transactions) if (x.tenantId === t.id) { const full = paidOf(x); x.amount = round2(full * share / 100); if (share === 100) delete x.rentAmount; else x.rentAmount = full; }
      if (Math.abs(currentRent(t) - rent) > 0.005 || oldStart !== d.start) {
        const from = curYM() <= t.start ? t.start : curYM();
        t.rents = (t.rents || []).filter(r => r.from < from && r.from >= t.start);
        t.rents.push({ from, amount: rent });
        if (!t.rents.some(r => r.from <= t.start)) t.rents[0].from = t.start;
      }
    } else {
      DB.tenants.push({ id: 't' + uid(), name: d.name, property: d.property, rents: [{ from: d.start, amount: rent }], start: d.start, end: '', opening: opening || 0, dueDay: d.dueDay, note: d.note, active: true, share, leaseEnd: d.leaseEnd || '', adjust: d.adjust || '' });
      rentCatId();
    }
    dlg = null; renderDlg(); persist(); render();
    toast(d.id ? 'Τα στοιχεία αποθηκεύτηκαν.' : `Νέος ενοικιαστής: ${d.name}`);
  }
}
