'use strict';
// HomeFlow · Κινήσεις λογαριασμών
// Κάθε λογαριασμός έχει:
//  • «υπόλοιπα» (a.history): ό,τι γράφει ο χρήστης με «Νέο υπόλοιπο» ή ήρθε από το Excel
//  • κινήσεις (a.moves): καταθέσεις, αναλήψεις, μεταφορές
//  • τα έσοδα/έξοδα που έχουν «Λογαριασμό» (t.accountId)
// Το τωρινό υπόλοιπο = τελευταίο γραμμένο υπόλοιπο + ό,τι κινήθηκε μετά από αυτό.
// Αν γραφτεί νέο υπόλοιπο, αυτό «μετράει» από εκεί και πέρα (π.χ. όταν βλέπετε το βιβλιάριο).
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

const ACC_KINDS_PAY = ['current', 'cash', 'deposit', 'other'];
const accLabel = a => (a ? `${a.bank ? a.bank + ' · ' : ''}${a.name}` : '');
const accById = id => (id ? DB.accounts.find(a => a.id === id) : null);
// Λογαριασμοί από/προς τους οποίους πληρώνουμε (σε ευρώ, ανοιχτοί)
const payAccounts = () => DB.accounts.filter(a => !a.archived && a.currency === 'EUR' && ACC_KINDS_PAY.includes(a.kind));

// Όλα όσα κίνησαν τον λογαριασμό (χωρίς τα γραμμένα υπόλοιπα)
function accEvents(a) {
  const ev = (a.moves || []).map(m => ({ date: m.date, created: m.created || '', amount: m.amount, text: m.text || '', kind: m.kind, move: m }));
  for (const t of DB.transactions) {
    if (t.accountId !== a.id || t.planned) continue;
    const v = typeof paidOf === 'function' ? paidOf(t) : t.amount;
    ev.push({ date: t.date, created: t.created || '', amount: t.type === 'expense' ? -v : v, text: `${catName(t.categoryId)}${t.note ? ' – ' + t.note : ''}`, kind: t.type, tx: t });
  }
  return ev;
}
const evKey = e => e.date + '|' + (e.created || '');
// Χρονολογική σειρά: γραμμένα υπόλοιπα και κινήσεις μαζί, με το υπόλοιπο μετά από κάθε γραμμή
function accTimeline(a) {
  const rows = [
    ...a.history.map(h => ({ date: h.date, created: h.at || '', snap: h })),
    ...accEvents(a)
  ].sort((x, y) => evKey(x).localeCompare(evKey(y)) || (x.snap ? -1 : 0) - (y.snap ? -1 : 0));
  let bal = 0, started = false;
  for (const r of rows) {
    if (r.snap) { bal = r.snap.balance; started = true; } else bal = round2(bal + r.amount);
    r.bal = bal; r.started = started;
  }
  return rows;
}
// Υπόλοιπο σε μια ημερομηνία (ή τώρα)
function accBalanceAt(a, date) {
  const rows = accTimeline(a).filter(r => !date || r.date <= date);
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  return { date: last.date, balance: last.bal };
}

// ---------- διάλογος: η καρτέλα του λογαριασμού ----------
function renderAccDlg(d) {
  if (d.kind === 'accview') {
    const a = DB.accounts.find(x => x.id === d.id);
    const rows = accTimeline(a).reverse();
    const lb = rows[0];
    const shown = rows.slice(0, d.limit || 60);
    return { head: 'neutral', title: `🏦 ${esc(accLabel(a))}`, body: `
      <div class="acc-head"><div><div class="label">Υπόλοιπο τώρα</div><div class="num acc-bal">${lb ? money(lb.bal, a.currency) : '—'}</div></div>
        <div class="acc-btns">
          <button class="btn income" data-action="acc-move" data-id="${a.id}" data-k="in">＋ Κατάθεση</button>
          <button class="btn expense" data-action="acc-move" data-id="${a.id}" data-k="out">− Ανάληψη</button>
          <button class="btn" data-action="acc-move" data-id="${a.id}" data-k="transfer">⇄ Μεταφορά</button>
          <button class="btn ghost" data-action="acc-update" data-id="${a.id}">✎ Νέο υπόλοιπο</button>
        </div></div>
      ${a.currency !== 'EUR' ? '<div class="hint">Τα έσοδα/έξοδα (σε €) δεν συνδέονται με λογαριασμούς σε δολάρια· εδώ γράφετε μόνο καταθέσεις, αναλήψεις και μεταφορές.</div>' : ''}
      ${rows.length ? `<table class="data acc-led"><thead><tr><th>Ημερομηνία</th><th>Τι</th><th class="r">Ποσό</th><th class="r">Υπόλοιπο</th><th></th></tr></thead><tbody>
        ${shown.map(r => r.snap
          ? `<tr class="acc-snap"><td>${shortDate(r.date)}</td><td colspan="2">📌 Γράφτηκε υπόλοιπο</td><td class="r num"><b>${money(r.bal, a.currency)}</b></td><td></td></tr>`
          : `<tr ${r.tx ? `data-action="acc-tx" data-tx="${r.tx.id}" title="Άνοιγμα της κίνησης"` : 'style="cursor:default"'}><td>${shortDate(r.date)}</td><td>${r.tx ? esc(catIcon(r.tx.categoryId)) + ' ' : r.kind === 'transfer' ? '⇄ ' : ''}${esc(r.text) || (r.amount > 0 ? 'Κατάθεση' : 'Ανάληψη')}</td>
             <td class="r num ${r.amount < 0 ? 'exp' : 'inc'}">${r.amount < 0 ? '−' : '+'}${money(Math.abs(r.amount), a.currency)}</td><td class="r num">${r.started ? money(r.bal, a.currency) : ''}</td>
             <td>${r.move ? `<button class="btn small ghost" data-action="acc-move-del" data-id="${a.id}" data-m="${r.move.id}" title="Σβήσιμο">🗑</button>` : ''}</td></tr>`).join('')}
      </tbody></table>${rows.length > shown.length ? `<button class="btn" data-action="acc-more">Παλαιότερα (${rows.length - shown.length})</button>` : ''}`
      : '<p class="muted">Δεν υπάρχουν ακόμα κινήσεις.</p>'}
      <div class="hint">Όταν γράφετε ένα έξοδο ή έσοδο, διαλέξτε «Από ποιον λογαριασμό» / «Σε ποιον λογαριασμό» και το υπόλοιπο αλλάζει μόνο του.
        Αν δείτε στο βιβλιάριο άλλο ποσό, πατήστε «✎ Νέο υπόλοιπο»: από εκεί και πέρα μετράει αυτό.</div>` };
  }
  if (d.kind === 'accmove') {
    const a = DB.accounts.find(x => x.id === d.id);
    const others = DB.accounts.filter(x => !x.archived && x.id !== a.id && x.currency === a.currency);
    const K = { in: ['Κατάθεση', 'income'], out: ['Ανάληψη', 'expense'], transfer: ['Μεταφορά', 'neutral'] };
    return { head: K[d.k][1], title: `${K[d.k][0]}: ${esc(accLabel(a))}`, body: `
      <div class="chips">${Object.entries(K).map(([k, [l]]) => `<button class="chip ${d.k === k ? 'sel' : ''}" data-action="accmove-k" data-v="${k}">${k === 'in' ? '＋' : k === 'out' ? '−' : '⇄'} ${l}</button>`).join('')}</div>
      <div class="field"><label for="d-amount">Πόσα;</label><div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">${curSym(a.currency)}</span></div></div>
      ${d.k === 'transfer' ? `<div class="field"><label for="d-to">Προς ποιον λογαριασμό;</label><select id="d-to" style="width:100%"><option value="">—</option>${others.map(o => `<option value="${o.id}" ${d.to === o.id ? 'selected' : ''}>${esc(accLabel(o))}</option>`).join('')}</select></div>` : ''}
      <div class="row">
        <div class="field"><label for="d-date">Πότε;</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
        <div class="field"><label for="d-mtext">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-mtext" type="text" style="width:100%" value="${esc(d.text)}" placeholder="${d.k === 'in' ? 'π.χ. κατάθεση μετρητών' : d.k === 'out' ? 'π.χ. ανάληψη από ATM' : 'π.χ. για την προθεσμιακή'}"></div>
      </div>
      <div class="hint">Οι καταθέσεις, αναλήψεις και μεταφορές αλλάζουν μόνο τα υπόλοιπα. Δεν μετράνε στα έσοδα και τα έξοδα του μήνα.</div>` };
  }
  return null;
}
function syncAccMove() {
  if (!dlg || dlg.kind !== 'accmove') return;
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (v('d-amount') !== undefined) dlg.amountStr = v('d-amount');
  if (v('d-date')) dlg.date = v('d-date');
  if (v('d-mtext') !== undefined) dlg.text = v('d-mtext').trim();
  if (v('d-to') !== undefined) dlg.to = v('d-to');
}
function saveAccMove() {
  syncAccMove();
  const d = dlg, a = DB.accounts.find(x => x.id === d.id);
  const fail = m => { d.error = m; renderDlg(); };
  const amt = parseAmount(d.amountStr);
  if (amt === null || isNaN(amt) || amt <= 0) return fail('Γράψτε ένα ποσό μεγαλύτερο από 0.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return fail('Η ημερομηνία δεν είναι σωστή.');
  const created = new Date().toISOString();
  const mk = (amount, text, pair) => ({ id: 'm' + uid(), date: d.date, amount, text, kind: d.k, created, ...(pair ? { pair } : {}) });
  const added = [];
  if (d.k === 'transfer') {
    const b = DB.accounts.find(x => x.id === d.to);
    if (!b) return fail('Διαλέξτε σε ποιον λογαριασμό πάνε τα χρήματα.');
    const pair = 'p' + uid();
    const m1 = mk(-amt, `Προς ${accLabel(b)}${d.text ? ' – ' + d.text : ''}`, pair), m2 = mk(amt, `Από ${accLabel(a)}${d.text ? ' – ' + d.text : ''}`, pair);
    (a.moves = a.moves || []).push(m1); (b.moves = b.moves || []).push(m2); added.push([a, m1], [b, m2]);
  } else {
    const m = mk(d.k === 'in' ? amt : -amt, d.text);
    (a.moves = a.moves || []).push(m); added.push([a, m]);
  }
  persist();
  dlg = { kind: 'accview', id: a.id, error: '' }; renderDlg(); render();
  toast(`${d.k === 'in' ? 'Κατάθεση' : d.k === 'out' ? 'Ανάληψη' : 'Μεταφορά'} ${money(amt, a.currency)}`, () => { for (const [x, m] of added) x.moves = x.moves.filter(y => y.id !== m.id); persist(); render(); if (dlg && dlg.kind === 'accview') renderDlg(); });
}
const accActions = {
  'acc-open': el => { dlg = { kind: 'accview', id: el.dataset.id, error: '' }; renderDlg(); },
  'acc-more': () => { dlg.limit = (dlg.limit || 60) + 200; renderDlg(); },
  'acc-move': el => { dlg = { kind: 'accmove', id: el.dataset.id, k: el.dataset.k, amountStr: '', date: todayStr(), text: '', to: '', error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-amount'); if (i) i.focus(); }, 30); },
  'accmove-k': el => { syncAccMove(); dlg.k = el.dataset.v; renderDlg(); },
  'acc-move-del': el => {
    const a = DB.accounts.find(x => x.id === el.dataset.id); const m = (a.moves || []).find(x => x.id === el.dataset.m);
    if (!m || !confirm(`Να σβηστεί η κίνηση ${money(Math.abs(m.amount), a.currency)} της ${shortDate(m.date)};${m.pair ? ' (Σβήνεται και από τον άλλο λογαριασμό της μεταφοράς.)' : ''}`)) return;
    for (const x of DB.accounts) if (x.moves) x.moves = x.moves.filter(y => y.id !== m.id && !(m.pair && y.pair === m.pair));
    persist(); renderDlg(); render();
  },
  'acc-tx': el => { const t = DB.transactions.find(x => x.id === el.dataset.tx); if (!t) return; dlg = null; renderDlg(); openForm(t.type, t); }
};

// ---------- επιλογή λογαριασμού (φόρμα εσόδου/εξόδου και άλλα παράθυρα) ----------
function accUsage() { const u = {}; for (const t of DB.transactions) if (t.accountId) u[t.accountId] = (u[t.accountId] || 0) + 1; return u; }
function accPicker(type, sel, action, selId) {
  const all = payAccounts();
  if (!all.length) return '';
  const u = accUsage();
  const top = all.slice().sort((x, y) => (u[y.id] || 0) - (u[x.id] || 0) || (x.order || 0) - (y.order || 0)).filter(a => u[a.id]).slice(0, 5);
  const cur = accById(sel);
  if (cur && !top.includes(cur)) top.push(cur);
  return `<div class="field acc-pick"><div class="flabel">${type === 'expense' ? '💳 Από ποιον λογαριασμό πληρώθηκε;' : '🏦 Σε ποιον λογαριασμό μπήκαν;'}</div>
    <div class="chips">${[null, ...top].map(a => `<button class="chip ${(a ? a.id : '') === (sel || '') ? 'sel' : ''}" data-action="${action}" data-v="${a ? a.id : ''}">${a ? esc(accLabel(a)) : 'Κανένας / δεν ξέρω'}</button>`).join('')}
      <select id="${selId}" aria-label="Άλλος λογαριασμός" style="border:2px solid var(--line-2);border-radius:99px;padding:.3rem .9rem;min-height:2.6rem;background:var(--paper);max-width:100%">
        <option value="">${top.length ? 'Άλλος λογαριασμός…' : 'Διαλέξτε λογαριασμό…'}</option>${all.map(a => `<option value="${a.id}" ${a.id === sel && !top.includes(a) ? 'selected' : ''}>${esc(accLabel(a))}${a.owner ? ' (' + esc(a.owner) + ')' : ''}</option>`).join('')}</select></div>
    ${cur ? `<div class="hint">Υπόλοιπο τώρα: <b>${money((accBalanceAt(cur) || {}).balance || 0, 'EUR')}</b></div>` : ''}</div>`;
}
Object.assign(actions, accActions, {
  'form-acc': el => { syncFormInputs(); form.accountId = el.dataset.v; form.accTouched = true; renderForm(); },
  'dlg-acc': el => { dlgSyncAll(); dlg.accountId = el.dataset.v; renderDlg(); }
});
// αλλαγή από τη λίστα «Άλλος λογαριασμός…»
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'fm-acc' && form) { syncFormInputs(); form.accountId = t.value; form.accTouched = true; renderForm(); }
  if (t.id === 'd-acc' && dlg) { dlgSyncAll(); dlg.accountId = t.value; renderDlg(); }
});
function dlgSyncAll() { if (dlg.kind === 'rec') syncDlg(); else syncDlg2(); }
// ο λογαριασμός που χρησιμοποιήθηκε τελευταία για μια κατηγορία προτείνεται την επόμενη φορά
function rememberAcc(cat, acc) { if (!cat) return; const m = DB.settings.accByCat = DB.settings.accByCat || {}; if (acc) m[cat] = acc; else delete m[cat]; }
const suggestAcc = cat => { const id = (DB.settings.accByCat || {})[cat]; return id && accById(id) && !accById(id).archived ? id : ''; };
