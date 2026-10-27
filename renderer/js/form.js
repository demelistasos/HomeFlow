'use strict';
// HomeFlow · Φόρμα καταχώρησης εσόδου / εξόδου
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= φόρμα καταχώρησης =======================
function openForm(type, tx, preset) {
  const base = tx ? { ...tx, amountStr: numFmt.format(paidOf(tx)).replace(/\./g, '') } : {
    id: null, type, amountStr: '', categoryId: '', note: '', date: defaultDateFor(), dayKnown: true,
    person: '', method: '', planned: false, tenantId: '', recurringId: '', accountId: '', ...(preset || {})
  };
  form = { ...base, makeRecurring: false, error: '' };
  renderForm();
  setTimeout(() => { const a = $('#fm-amount'); if (a) { a.focus(); a.select(); } }, 30);
}
function defaultDateFor() {
  // Αν βλέπουμε άλλον μήνα στην αρχική, προτείνουμε μέρα εκείνου του μήνα
  if (ui.page === 'home' && !(ui.year === now.getFullYear() && ui.month === now.getMonth() + 1)) return `${ui.year}-${pad(ui.month)}-01`;
  return todayStr();
}
function renderForm() {
  if (!form) { $('#modal-root').innerHTML = ''; return; }
  const f = form;
  const isExp = f.type === 'expense';
  const usage = usageCount(f.type);
  const cats = activeCats(f.type).slice();
  if (f.categoryId && !cats.some(c => c.id === f.categoryId)) { const c = catById(f.categoryId); if (c) cats.push(c); }
  cats.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.order - b.order);
  const notes = f.categoryId ? frequentNotes(f.categoryId) : [];
  const amt = parseAmount(f.amountStr);
  const today = todayStr(), yest = shiftDay(today, -1);
  const persons = DB.settings.persons || [];
  const methods = DB.settings.methods || [];
  const isRentCat = f.type === 'income' && f.categoryId && DB.tenants.length && f.categoryId === rentCatId();
  const tenantsHere = isRentCat ? DB.tenants.filter(t => !t.end || t.end >= f.date.slice(0, 7) || t.id === f.tenantId) : [];
  $('#modal-root').innerHTML = `
  <div class="modal-back" data-action="modal-back">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head ${isExp ? 'expense' : 'income'}">
        <h2>${f.tenantId && isRentCat ? (f.id ? 'Αλλαγή πληρωμής ενοικίου' : 'Πληρωμή ενοικίου') : f.id ? (isExp ? 'Αλλαγή εξόδου' : 'Αλλαγή εσόδου') : (isExp ? 'Νέο έξοδο' : 'Νέο έσοδο')}</h2>
        ${f.id || f.tenantId ? '' : `<button class="btn small" data-action="form-switch">${isExp ? 'Είναι έσοδο;' : 'Είναι έξοδο;'}</button>`}
        <button class="btn small" data-action="form-close" title="Κλείσιμο (Esc)">✕</button>
      </div>
      <div class="modal-body">
        <div class="row fm-top">
        <div class="field">
          <label for="fm-amount">1. Πόσα χρήματα;</label>
          <div class="amount-wrap">
            <input id="fm-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(f.amountStr)}" placeholder="0,00">
            <span class="amount-eur">€</span>
            <span id="fm-calc" class="amount-calc">${calcHint(f.amountStr, amt)}</span>
          </div>
          <div id="fm-share" class="amount-calc" style="margin-top:.35rem">${shareHint(f, amt)}</div>
          <div class="hint">Μπορείτε να γράψετε και πρόσθεση, όπως στο Excel: <b>50+39+12,5</b></div>
        </div>
        ${accPicker(f.type, f.accountId, 'form-acc', 'fm-acc')}
        </div>
        <div class="field">
          <div class="flabel">2. Για τι;</div>
          ${(() => { const LIM = 10; const few = !f.allCats && cats.length > LIM + 2; let shown = few ? cats.slice(0, LIM) : cats; if (few && f.categoryId && !shown.some(c => c.id === f.categoryId)) shown = [...shown, catById(f.categoryId)];
            return `<div class="cat-grid">${shown.map(c => `<button class="cat-btn ${c.id === f.categoryId ? 'sel' : ''}" data-action="form-cat" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>
            ${few ? `<button class="btn" style="margin-top:.55rem" data-action="form-allcats">▾ Όλες οι κατηγορίες (${cats.length})</button>` : (cats.length > LIM + 2 ? '<button class="btn small" style="margin-top:.55rem" data-action="form-allcats">▴ Μόνο οι συχνές</button>' : '')}`; })()}
        </div>
        ${tenantsHere.length ? `<div class="field">
          <div class="flabel">Ποιος ενοικιαστής πλήρωσε;</div>
          <div class="chips">${tenantsHere.map(t => `<button class="chip ${f.tenantId === t.id ? 'sel' : ''}" data-action="form-tenant" data-v="${esc(t.id)}">🏠 ${esc(t.name)}${t.property ? ` <span style="font-weight:500">(${esc(t.property)})</span>` : ''}</button>`).join('')}</div>
        </div>` : ''}
        <div class="field">
          <label for="fm-note">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label>
          ${notes.length ? `<div class="chips" style="margin-bottom:.5rem">${notes.map(n => `<button class="chip ${n === f.note ? 'sel' : ''}" data-action="form-note" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
          <input id="fm-note" type="text" style="width:100%" value="${esc(f.note)}" placeholder="π.χ. λαϊκή, βενζίνη, φαρμακείο">
          ${attBlock('form', null, f.attachments)}
        </div>
        <div class="row">
          <div class="field">
            <div class="flabel">Πότε;</div>
            <div class="chips">
              <button class="chip ${f.dayKnown && f.date === today ? 'sel' : ''}" data-action="form-date" data-v="${today}">Σήμερα</button>
              <button class="chip ${f.dayKnown && f.date === yest ? 'sel' : ''}" data-action="form-date" data-v="${yest}">Χθες</button>
              <input id="fm-date" type="date" value="${esc(f.date)}" style="border:2px solid var(--line-2);border-radius:99px;padding:.3rem .9rem;min-height:2.6rem;background:var(--paper)">
            </div>
            ${f.dayKnown === false ? `<div class="hint">Από το Excel: ξέρουμε μόνο τον μήνα (${MONTHS[+f.date.slice(5, 7) - 1]}).</div>` : ''}
          </div>
          ${persons.length ? `<div class="field">
            <div class="flabel">Ποιος;</div>
            <div class="chips">${['', ...persons].map(p => `<button class="chip ${f.person === p ? 'sel' : ''}" data-action="form-person" data-v="${esc(p)}">${p ? esc(p) : 'Όλοι / —'}</button>`).join('')}</div>
          </div>` : ''}
        </div>
        <div class="row">
          <div class="field">
            <div class="flabel">Πώς;</div>
            <div class="chips">${['', ...methods].map(m => `<button class="chip ${f.method === m ? 'sel' : ''}" data-action="form-method" data-v="${esc(m)}">${m ? esc(m) : '—'}</button>`).join('')}</div>
          </div>
          <div class="field" style="display:flex;flex-direction:column;gap:.6rem;justify-content:flex-end">
            <label class="check"><input type="checkbox" id="fm-planned" ${f.planned ? 'checked' : ''}> Δεν έχει γίνει ακόμα (προγραμματισμένο)</label>
            ${f.id || f.recurringId || f.tenantId ? '' : `<label class="check"><input type="checkbox" id="fm-recurring" ${f.makeRecurring ? 'checked' : ''}> 🔁 Να γίνει πάγιο (κάθε μήνα)</label>`}
          </div>
        </div>
        ${f.error ? `<div class="notice" style="margin:0;border-color:var(--exp-line);background:var(--exp-soft);color:var(--exp)"><b>${esc(f.error)}</b></div>` : ''}
      </div>
      <div class="modal-foot">
        ${f.id ? '<button class="btn danger" data-action="form-delete">🗑 Διαγραφή</button>' : ''}
        <div class="spacer"></div>
        <button class="btn" data-action="form-close">Ακύρωση</button>
        <button class="btn big ${isExp ? 'expense' : 'income'}" style="width:auto;padding:0 2.2rem" data-action="form-save">✓ Αποθήκευση</button>
      </div>
    </div>
  </div>`;
}
function formTenant(f) { return f && f.type === 'income' && f.tenantId && DB.tenants.length && f.categoryId === rentCatId() ? tenantById(f.tenantId) : null; }
function shareHint(f, amt) {
  const t = formTenant(f);
  if (!t || shareOf(t) === 100) return '';
  const ours = amt && !isNaN(amt) ? eur(amt * shareOf(t) / 100) : '—';
  return `Γράψτε όσα έδωσε ο ενοικιαστής. Στα έσοδα μπαίνει το δικό μας ${shareOf(t)}%: <b>${ours}</b>`;
}
function calcHint(raw, amt) {
  if (!raw) return '';
  if (amt === null) return '';
  if (isNaN(amt)) return '<span class="amount-err">Δεν καταλαβαίνω το ποσό</span>';
  return isFormula(raw) ? `= ${eur(amt)}` : '';
}
function syncFormInputs() {
  if (!form) return;
  const a = $('#fm-amount'); if (a) form.amountStr = a.value;
  const n = $('#fm-note'); if (n) form.note = n.value.trim();
  const d = $('#fm-date'); if (d && d.value && d.value !== form.date) { form.date = d.value; form.dayKnown = true; }
  const p = $('#fm-planned'); if (p) form.planned = p.checked;
  const r = $('#fm-recurring'); if (r) form.makeRecurring = r.checked;
}
function saveForm() {
  syncFormInputs();
  const f = form;
  const amt = parseAmount(f.amountStr);
  if (amt === null || isNaN(amt) || amt <= 0) { f.error = 'Γράψτε ένα ποσό μεγαλύτερο από 0.'; renderForm(); $('#fm-amount').focus(); return; }
  if (!f.categoryId) { f.error = 'Διαλέξτε για τι είναι («2. Για τι;»).'; renderForm(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { f.error = 'Η ημερομηνία δεν είναι σωστή.'; renderForm(); return; }
  const isRent = f.type === 'income' && DB.tenants.length && f.categoryId === rentCatId();
  const ten = isRent && f.tenantId ? tenantById(f.tenantId) : null;
  const sh = ten ? shareOf(ten) : 100;
  const rec = {
    tenantId: isRent ? (f.tenantId || '') : '', recurringId: f.recurringId || '',
    ...(sh !== 100 ? { rentAmount: amt } : {}),
    id: f.id || uid(), date: f.date, dayKnown: f.dayKnown !== false, type: f.type, amount: sh !== 100 ? round2(amt * sh / 100) : amt, categoryId: f.categoryId,
    note: f.note || '', person: f.person || '', method: f.method || '', planned: !!f.planned,
    source: f.source || 'app', created: f.created || new Date().toISOString(),
    ...((f.attachments || []).length ? { attachments: f.attachments } : {}),
    ...(f.accountId ? { accountId: f.accountId } : {})
  };
  if (!f.id || f.accTouched) rememberAcc(rec.categoryId, f.accountId || '');
  const added = [rec];
  if (f.id) {
    const i = DB.transactions.findIndex(t => t.id === f.id);
    const before = { ...DB.transactions[i] };
    DB.transactions[i] = rec;
    form = null; renderForm(); persist(); render();
    toast(`Αλλάχτηκε: ${eur(amt)} – ${catName(rec.categoryId)}`, () => { const j = DB.transactions.findIndex(t => t.id === before.id); if (j >= 0) DB.transactions[j] = before; persist(); render(); });
    return;
  }
  DB.transactions.push(rec);
  let newRec = null;
  if (f.makeRecurring) {
    newRec = { id: 'r' + uid(), type: rec.type, amount: amt, categoryId: rec.categoryId, note: rec.note, day: +rec.date.slice(8, 10), every: 1,
      from: rec.date.slice(0, 7), until: '', person: rec.person, method: rec.method, active: true, skip: [], ...(rec.accountId ? { accountId: rec.accountId } : {}) };
    DB.recurring.push(newRec);
    rec.recurringId = newRec.id;
    generateRecurring();
  }
  form = null; renderForm(); persist(); render();
  toast(`Αποθηκεύτηκε: ${eur(amt)} – ${catName(rec.categoryId)}${newRec ? ' (και έγινε πάγιο)' : ''}`, () => {
    DB.transactions = DB.transactions.filter(t => t.id !== rec.id && !(newRec && t.recurringId === newRec.id));
    if (newRec) DB.recurring = DB.recurring.filter(r => r.id !== newRec.id);
    persist(); render();
  });
}
function deleteFromForm() {
  const id = form.id;
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  if (!confirm(`Να διαγραφεί η κίνηση ${eur(t.amount)} – ${catName(t.categoryId)};`)) return;
  DB.transactions = DB.transactions.filter(x => x.id !== id);
  // αν ήταν από πάγιο, να μην ξαναφτιαχτεί αυτόν τον μήνα
  const r = t.recurringId && DB.recurring.find(x => x.id === t.recurringId);
  const ym = t.date.slice(0, 7);
  if (r && !(r.skip || []).includes(ym)) { r.skip = [...(r.skip || []), ym]; }
  form = null; renderForm(); persist(); render();
  toast('Η κίνηση διαγράφηκε.', () => { DB.transactions.push(t); if (r) r.skip = r.skip.filter(x => x !== ym); persist(); render(); });
}
