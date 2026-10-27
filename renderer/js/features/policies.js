'use strict';
// HomeFlow · Ασφάλειες και τέλη
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= ασφάλειες και τέλη =======================
const POL_KINDS = [['home', '🏠', 'Ασφάλεια σπιτιού'], ['car', '🚗', 'Ασφάλεια αυτοκινήτου'], ['fee', '🧾', 'Τέλη κυκλοφορίας'], ['health', '🩺', 'Ασφάλεια υγείας / ζωής'], ['other', '🛡️', 'Άλλο']];
const polIcon = p => (POL_KINDS.find(k => k[0] === p.kind) || POL_KINDS[4])[1];
function polPanel() {
  const ps = (DB.policies || []).slice().sort((a, b) => (a.next || '9').localeCompare(b.next || '9'));
  const yearly = round2(ps.reduce((a, p) => a + (p.amount || 0) * 12 / (p.every || 12), 0));
  const row = p => { const dd = p.next ? daysUntil(p.next) : null; return `<div class="planned-row">
    <span class="p-ic">${polIcon(p)}</span>
    <span class="p-nm"><b>${esc(p.name)}</b>${p.what ? ` – ${esc(p.what)}` : ''}
      <div class="muted" style="font-size:.92rem">${[p.company, p.number ? 'αρ. ' + p.number : '', p.every === 12 ? 'μία φορά τον χρόνο' : p.every === 1 ? 'κάθε μήνα' : `κάθε ${p.every} μήνες`].filter(Boolean).map(esc).join(' · ')}</div>
      <div style="font-size:.95rem">${p.next ? `Επόμενη πληρωμή: <b class="${dd < 0 ? 'exp' : dd <= 30 ? 'warn-t' : ''}">${shortDate(p.next)}</b>${dd < 0 ? ' (έληξε)' : dd <= 30 ? ` (σε ${dd} μέρες)` : ''}` : '<span class="muted">Χωρίς ημερομηνία</span>'}</div>
      ${attBlock('policy', p.id, p.attachments)}</span>
    <span class="p-amt num exp">${p.amount ? eur(p.amount) : ''}</span>
    <span class="p-act"><button class="btn small" data-action="pol-edit" data-id="${p.id}">✎ Αλλαγή</button><button class="btn small primary" data-action="pol-pay" data-id="${p.id}">✓ Πληρώθηκε</button></span>
  </div>`; };
  return `<div class="panel">
    <div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;margin-bottom:.4rem"><h2 style="margin:0">🛡️ Ασφάλειες και τέλη</h2><div class="spacer" style="flex:1"></div><button class="btn primary no-print" data-action="pol-new">+ Νέα ασφάλεια / τέλος</button></div>
    <div class="h-hint" style="margin:0 0 .8rem">Γράψτε κάθε ασφάλεια και τα τέλη κυκλοφορίας με την ημερομηνία της επόμενης πληρωμής. Θα σας θυμίζει έναν μήνα πριν. Όταν πληρώσετε, πατήστε «✓ Πληρώθηκε»: μπαίνει στα έξοδα και η ημερομηνία πάει μόνη της στην επόμενη φορά.${ps.length ? ` Σύνολο τον χρόνο: <b class="num">${eur(yearly)}</b>.` : ''}</div>
    ${ps.length ? ps.map(row).join('') : '<div class="empty">Δεν έχετε γράψει ακόμα ασφάλειες ή τέλη. Πατήστε «+ Νέα ασφάλεια / τέλος».</div>'}
  </div>`;
}
function polDefaultCat(kind) {
  const find = re => (DB.categories.find(c => c.type === 'expense' && !c.archived && re.test(c.name)) || {}).id;
  return kind === 'car' || kind === 'fee' ? find(/αυτοκίν.*(σέρβις|τέλη)|τέλη/i) || find(/αυτοκίν/i) || '' : kind === 'health' ? find(/ασφάλει/i) || '' : find(/ασφάλει/i) || '';
}
function renderPolDlg(d) {
  if (d.kind === 'pol') {
    const cats = DB.categories.filter(c => c.type === 'expense' && !c.archived).sort((a, b) => a.name.localeCompare(b.name, 'el'));
    return { head: 'neutral', title: d.id ? '🛡️ Ασφάλεια / τέλος' : '🛡️ Νέα ασφάλεια / τέλος', body: `
      <div class="field"><div class="flabel">Τι είναι;</div><div class="chips">${POL_KINDS.map(([k, i, l]) => `<button class="chip ${d.pk === k ? 'sel' : ''}" data-action="dlg-pk" data-v="${k}">${i} ${l}</button>`).join('')}</div></div>
      <div class="row">
        <div class="field"><label for="d-polname">Όνομα</label><input id="d-polname" type="text" style="width:100%" value="${esc(d.name)}"></div>
        <div class="field"><label for="d-polwhat">Για ποιο; <span class="muted" style="font-weight:500">(π.χ. το αυτοκίνητο, το σπίτι, ένα πρόσωπο)</span></label><input id="d-polwhat" type="text" style="width:100%" value="${esc(d.what)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-polco">Εταιρεία <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-polco" type="text" style="width:100%" value="${esc(d.company)}"></div>
        <div class="field"><label for="d-polnum">Αριθμός συμβολαίου <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-polnum" type="text" style="width:100%" value="${esc(d.number)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-amount">Ποσό κάθε φορά</label><div class="amount-wrap"><input id="d-amount" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.amountStr)}"><span style="font-weight:700">€</span></div></div>
        <div class="field"><label for="d-polnext">Επόμενη πληρωμή</label><input id="d-polnext" type="date" value="${esc(d.next)}"></div>
      </div>
      <div class="field"><div class="flabel">Πόσο συχνά;</div><div class="chips">${[[12, 'Μία φορά τον χρόνο'], [6, 'Κάθε 6 μήνες'], [3, 'Κάθε 3 μήνες'], [1, 'Κάθε μήνα']].map(([n, l]) => `<button class="chip ${d.every === n ? 'sel' : ''}" data-action="dlg-pevery" data-v="${n}">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="d-polcat">Στα έξοδα μπαίνει στην κατηγορία</label><select id="d-polcat" style="width:100%"><option value="">—</option>${cats.map(c => `<option value="${esc(c.id)}" ${d.cat === c.id ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`).join('')}</select></div>` };
  }
  if (d.kind === 'polpay') {
    const p = DB.policies.find(x => x.id === d.pid);
    return { head: 'expense', title: `✓ Πληρωμή: ${esc(p.name)}${p.what ? ' – ' + esc(p.what) : ''}`, body: `
      <div class="field"><label for="d-amount">Ποσό</label><div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" value="${esc(d.amountStr)}"><span class="amount-eur">€</span></div></div>
      <div class="field"><label for="d-date">Πότε πληρώθηκε</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
      <label class="check"><input type="checkbox" id="d-addexp" ${d.addExpense ? 'checked' : ''}> Να μπει και στα έξοδα${p.categoryId ? ` (${esc(catName(p.categoryId))})` : ''}</label>
      <div class="hint">Η επόμενη πληρωμή θα γίνει <b>${p.next ? shortDate(nextPolDate(p)) : '—'}</b>.</div>` };
  }
  return null;
}
function nextPolDate(p) { if (!p.next) return ''; const d = new Date(p.next + 'T12:00'); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + (p.every || 12)); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function savePolDlg() {
  const d = dlg; const v = id => { const e = $('#' + id); return e ? e.value.trim() : ''; };
  const fail = m => { d.error = m; renderDlg(); };
  if (d.kind === 'pol') {
    Object.assign(d, { name: v('d-polname'), what: v('d-polwhat'), company: v('d-polco'), number: v('d-polnum'), amountStr: v('d-amount'), next: v('d-polnext'), cat: v('d-polcat') });
    if (!d.name) return fail('Γράψτε όνομα (π.χ. «Ασφάλεια αυτοκινήτου»).');
    const amt = d.amountStr ? parseAmount(d.amountStr) : null;
    if (d.amountStr && (amt === null || isNaN(amt))) return fail('Το ποσό δεν είναι σωστό.');
    DB.policies = DB.policies || [];
    const rec = { kind: d.pk, name: d.name, what: d.what, company: d.company, number: d.number, amount: amt || 0, every: d.every, next: d.next || '', categoryId: d.cat || '' };
    if (d.id) Object.assign(DB.policies.find(x => x.id === d.id), rec); else DB.policies.push({ id: 'pl' + uid(), attachments: [], ...rec });
    dlg = null; renderDlg(); persist(); render(); toast('Αποθηκεύτηκε.'); return;
  }
  if (d.kind === 'polpay') {
    const p = DB.policies.find(x => x.id === d.pid);
    d.amountStr = v('d-amount'); d.date = v('d-date'); d.addExpense = $('#d-addexp') ? $('#d-addexp').checked : false;
    const amt = parseAmount(d.amountStr);
    if (!amt || isNaN(amt)) return fail('Γράψτε το ποσό.');
    if (d.addExpense) {
      if (!p.categoryId) return fail('Η ασφάλεια δεν έχει κατηγορία εξόδων. Πατήστε «✎ Αλλαγή» και διαλέξτε κατηγορία, ή βγάλτε το τσεκ.');
      DB.transactions.push({ id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: amt, categoryId: p.categoryId, note: `${p.name}${p.what ? ' – ' + p.what : ''}`, person: '', method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString() });
    }
    p.history = p.history || []; p.history.push({ date: d.date, amount: amt });
    p.amount = amt; if (p.next) p.next = nextPolDate(p);
    dlg = null; renderDlg(); persist(); render(); toast(`Πληρώθηκε: ${p.name} – ${eur(amt)}${p.next ? ` · επόμενη ${shortDate(p.next)}` : ''}`);
  }
}
const polActions = {
  'pol-new': () => { dlg = { kind: 'pol', id: null, pk: 'car', name: 'Ασφάλεια αυτοκινήτου', what: '', company: '', number: '', amountStr: '', next: '', every: 12, cat: polDefaultCat('car'), error: '' }; renderDlg(); },
  'pol-edit': el => { const p = DB.policies.find(x => x.id === el.dataset.id); dlg = { kind: 'pol', id: p.id, pk: p.kind, name: p.name, what: p.what, company: p.company, number: p.number, amountStr: p.amount ? numFmt.format(p.amount).replace(/\./g, '') : '', next: p.next, every: p.every || 12, cat: p.categoryId, error: '' }; renderDlg(); },
  'pol-pay': el => { const p = DB.policies.find(x => x.id === el.dataset.id); dlg = { kind: 'polpay', pid: p.id, amountStr: p.amount ? numFmt.format(p.amount).replace(/\./g, '') : '', date: todayStr(), addExpense: !!p.categoryId, error: '' }; renderDlg(); },
  'pol-delete': () => { if (!confirm('Να διαγραφεί αυτή η ασφάλεια / τέλος; (Ό,τι έχει μπει στα έξοδα μένει.)')) return; DB.policies = DB.policies.filter(p => p.id !== dlg.id); dlg = null; renderDlg(); persist(); render(); },
  'dlg-pk': el => { const v = id => { const e = $('#' + id); return e ? e.value.trim() : ''; }; const k = el.dataset.v; const old = POL_KINDS.find(x => x[0] === dlg.pk); Object.assign(dlg, { what: v('d-polwhat'), company: v('d-polco'), number: v('d-polnum'), amountStr: v('d-amount'), next: v('d-polnext') });
    const nm = v('d-polname'); dlg.name = !nm || (old && nm === old[2]) ? (POL_KINDS.find(x => x[0] === k) || [])[2] : nm; dlg.pk = k; dlg.cat = polDefaultCat(k) || dlg.cat; if (k === 'fee') dlg.every = 12; renderDlg(); },
  'dlg-pevery': el => { const v = id => { const e = $('#' + id); return e ? e.value.trim() : ''; }; Object.assign(dlg, { name: v('d-polname'), what: v('d-polwhat'), company: v('d-polco'), number: v('d-polnum'), amountStr: v('d-amount'), next: v('d-polnext'), cat: v('d-polcat') }); dlg.every = +el.dataset.v; renderDlg(); },
  'cal-day': el => { dlg = { kind: 'day', y: ui.year, m: ui.month, d: +el.dataset.d, error: '' }; renderDlg(); }
};
