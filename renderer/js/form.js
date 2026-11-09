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
  const LIM = 6, few = !f.allCats && cats.length > LIM + 1;
  let shown = few ? cats.slice(0, LIM) : cats;
  if (few && f.categoryId && !shown.some(c => c.id === f.categoryId)) shown = [...shown.slice(0, LIM - 1), catById(f.categoryId)];
  const acc = f.accountId ? accById(f.accountId) : null;
  const dLbl = f.dayKnown === false ? MONTHS[+f.date.slice(5, 7) - 1] : f.date === today ? 'Σήμερα' : f.date === yest ? 'Χθες' : shortDate(f.date);
  const nAtt = (f.attachments || []).length;
  const pills = [
    ['📅', dLbl],
    ...(payAccounts().length ? [[f.type === 'expense' ? '💳' : '🏦', acc ? accLabel(acc) : 'Χωρίς λογαριασμό']] : []),
    ...(persons.length ? [['👤', f.person || 'Όλοι']] : []),
    ...(f.method ? [['🪙', f.method]] : []),
    ...(nAtt ? [['📎', String(nAtt)]] : []),
    ...(f.planned ? [['⏳', 'Δεν έγινε ακόμα']] : []),
    ...(f.makeRecurring ? [['🔁', 'Κάθε μήνα']] : [])
  ];
  $('#modal-root').innerHTML = `
  <div class="modal-back" data-action="modal-back">
    <div class="modal fm2 ${isExp ? 'is-exp' : 'is-inc'}" role="dialog" aria-modal="true">
      <div class="modal-head ${isExp ? 'expense' : 'income'}">
        <h2>${f.tenantId && isRentCat ? (f.id ? 'Αλλαγή πληρωμής ενοικίου' : 'Πληρωμή ενοικίου') : f.id ? (isExp ? 'Αλλαγή εξόδου' : 'Αλλαγή εσόδου') : (isExp ? 'Νέο έξοδο' : 'Νέο έσοδο')}${f.batchCount ? ` <span style="font-weight:500;font-size:.8em">· πέρασαν ${f.batchCount}</span>` : ''}</h2>
        ${f.id || f.tenantId ? '' : `<button class="btn small" data-action="form-switch">${isExp ? 'Είναι έσοδο;' : 'Είναι έξοδο;'}</button>`}
        <button class="btn small" data-action="form-close" title="Κλείσιμο (Esc)">✕</button>
      </div>
      <div class="modal-body">
        <div class="fm2-amount">
          <label for="fm-amount">Πόσα;</label>
          <div class="amount-wrap">
            <input id="fm-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(f.amountStr)}" placeholder="0" title="Μπορείτε να γράψετε και πρόσθεση, όπως στο Excel: 50+39+12,5">
            <span class="amount-eur">€</span>
          </div>
          <span id="fm-calc" class="amount-calc">${calcHint(f.amountStr, amt)}</span>
          <div id="fm-share" class="amount-calc">${shareHint(f, amt)}</div>
        </div>
        <div class="field">
          <div class="flabel">Για τι;</div>
          <div class="cat-grid">${shown.map(c => `<button class="cat-btn ${c.id === f.categoryId ? 'sel' : ''}" data-action="form-cat" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}${few ? `<button class="cat-btn more" data-action="form-allcats"><span class="ic">＋</span><span>Άλλο… <small>(${cats.length - shown.length})</small></span></button>` : ''}</div>
          ${!few && cats.length > LIM + 1 ? '<button class="linkish" data-action="form-allcats">▴ Μόνο οι συχνές</button>' : ''}
        </div>
        ${tenantsHere.length ? `<div class="field">
          <div class="flabel">Ποιος ενοικιαστής πλήρωσε;</div>
          <div class="chips">${tenantsHere.map(t => `<button class="chip ${f.tenantId === t.id ? 'sel' : ''}" data-action="form-tenant" data-v="${esc(t.id)}">🏠 ${esc(t.name)}${t.property ? ` <span style="font-weight:500">(${esc(t.property)})</span>` : ''}</button>`).join('')}</div>
        </div>` : ''}
        <div id="fm-covers">${coversField(f, amt)}</div>
        <div class="field fm2-note">
          <input id="fm-note" type="text" value="${esc(f.note)}" placeholder="✏️ Σημείωση (αν θέλετε) – π.χ. λαϊκή, φαρμακείο" aria-label="Σημείωση">
          ${notes.length ? `<div class="chips">${notes.slice(0, 4).map(n => `<button class="chip small ${n === f.note ? 'sel' : ''}" data-action="form-note" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
        </div>
        <button class="fm2-sum ${f.more ? 'open' : ''}" data-action="form-more" aria-expanded="${f.more ? 'true' : 'false'}">
          ${pills.map(([i, t]) => `<span class="pill"><span>${i}</span>${esc(t)}</span>`).join('')}
          <span class="fm2-more">${f.more ? 'Λιγότερα ▴' : 'Αλλαγή ▾'}</span>
        </button>
        ${f.more ? `<div class="fm2-details">
          <div class="field">
            <div class="flabel">📅 Πότε;</div>
            <div class="chips">
              <button class="chip ${f.dayKnown && f.date === today ? 'sel' : ''}" data-action="form-date" data-v="${today}">Σήμερα</button>
              <button class="chip ${f.dayKnown && f.date === yest ? 'sel' : ''}" data-action="form-date" data-v="${yest}">Χθες</button>
              <input id="fm-date" type="date" value="${esc(f.date)}" class="pill-input">
            </div>
            ${f.dayKnown === false ? `<div class="hint">Από το Excel: ξέρουμε μόνο τον μήνα (${MONTHS[+f.date.slice(5, 7) - 1]}).</div>` : ''}
          </div>
          ${accPicker(f.type, f.accountId, 'form-acc', 'fm-acc')}
          ${persons.length ? `<div class="field">
            <div class="flabel">👤 Ποιος;</div>
            <div class="chips">${['', ...persons].map(p => `<button class="chip ${f.person === p ? 'sel' : ''}" data-action="form-person" data-v="${esc(p)}">${p ? esc(p) : 'Όλοι / —'}</button>`).join('')}</div>
          </div>` : ''}
          ${methods.length ? `<div class="field">
            <div class="flabel">🪙 Πώς πληρώθηκε;</div>
            <div class="chips">${['', ...methods].map(m => `<button class="chip ${f.method === m ? 'sel' : ''}" data-action="form-method" data-v="${esc(m)}">${m ? esc(m) : '—'}</button>`).join('')}</div>
          </div>` : ''}
          <div class="field">${attBlock('form', null, f.attachments)}</div>
          <div class="field" style="display:flex;flex-direction:column;gap:.6rem">
            <label class="check"><input type="checkbox" id="fm-planned" ${f.planned ? 'checked' : ''}> ⏳ Δεν έχει γίνει ακόμα (προγραμματισμένο)</label>
            ${f.id || f.recurringId || f.tenantId ? '' : `<label class="check"><input type="checkbox" id="fm-recurring" ${f.makeRecurring ? 'checked' : ''}> 🔁 Να γίνεται κάθε μήνα (πάγιο)</label>`}
          </div>
        </div>` : ''}
        ${f.error ? `<div class="notice" style="margin:0;border-color:var(--exp-line);background:var(--exp-soft);color:var(--exp)"><b>${esc(f.error)}</b></div>` : ''}
      </div>
      ${f.askClose ? `<div class="ask-close"><b>Να κλείσει χωρίς αποθήκευση;</b> Ό,τι γράψατε θα χαθεί.<div class="spacer"></div>
        <button class="btn" data-action="form-close-no">Όχι, συνεχίζω</button><button class="btn danger" data-action="form-close-yes">Ναι, κλείσιμο</button></div>` : ''}
      <div class="modal-foot">
        ${f.id ? '<button class="btn danger" data-action="form-delete">🗑 Διαγραφή</button>' : `<button class="btn ghost" data-action="form-close">${f.batchCount ? 'Τέλος' : 'Ακύρωση'}</button>`}
        <div class="spacer"></div>
        ${f.id || f.tenantId ? '' : `<button class="btn" data-action="form-save-next" title="Αποθηκεύει και ανοίγει αμέσως νέα, με την ίδια ημερομηνία και λογαριασμό">＋ Και άλλο</button>`}
        <button class="btn big ${isExp ? 'expense' : 'income'}" style="width:auto;padding:0 2.4rem" data-action="form-save">✓ Αποθήκευση</button>
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
function saveForm(next) {
  syncFormInputs();
  const f = form;
  const amt = parseAmount(f.amountStr);
  if (amt === null || isNaN(amt) || amt <= 0) { f.error = 'Γράψτε ένα ποσό μεγαλύτερο από 0.'; renderForm(); $('#fm-amount').focus(); return; }
  if (!f.categoryId) { f.error = 'Διαλέξτε «Για τι;».'; renderForm(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { f.more = true; f.error = 'Η ημερομηνία δεν είναι σωστή.'; renderForm(); return; }
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
    ...(f.accountId ? { accountId: f.accountId } : {}),
    ...(isRent && f.tenantId && (f.covers || []).length > 1 && coverOptions(f, amt) ? { covers: f.covers } : {})
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
  const batch = (f.batchCount || 0) + 1;
  form = null; renderForm(); persist(); render();
  // «Αποθήκευση και επόμενο»: η φόρμα ξανανοίγει με την ίδια ημερομηνία, λογαριασμό, άτομο και τρόπο
  if (next) { openForm(rec.type, null, { date: rec.date, dayKnown: rec.dayKnown, accountId: f.accountId || '', accTouched: !!f.accTouched, person: rec.person, method: rec.method }); form.batchCount = batch; renderForm(); }
  toast(`${next || batch > 1 ? `${batch}η κίνηση · ` : ''}Αποθηκεύτηκε: ${eur(amt)} – ${catName(rec.categoryId)}${newRec ? ' (και έγινε πάγιο)' : ''}`, () => {
    DB.transactions = DB.transactions.filter(t => t.id !== rec.id && !(newRec && t.recurringId === newRec.id));
    if (newRec) DB.recurring = DB.recurring.filter(r => r.id !== newRec.id);
    persist(); render();
  });
}
function deleteFromForm() {
  const id = form.id;
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  if (!confirmBox(`Να διαγραφεί η κίνηση ${eur(t.amount)} – ${catName(t.categoryId)};`)) return;
  DB.transactions = DB.transactions.filter(x => x.id !== id);
  // αν ήταν από πάγιο, να μην ξαναφτιαχτεί αυτόν τον μήνα
  const r = t.recurringId && DB.recurring.find(x => x.id === t.recurringId);
  const ym = t.date.slice(0, 7);
  if (r && !(r.skip || []).includes(ym)) { r.skip = [...(r.skip || []), ym]; }
  form = null; renderForm(); persist(); render();
  toast('Η κίνηση διαγράφηκε.', () => { DB.transactions.push(t); if (r) r.skip = r.skip.filter(x => x !== ym); persist(); render(); });
}

// Πληρωμή ενοικίου για πολλούς μήνες: όταν το ποσό είναι πάνω από ένα ενοίκιο, ρωτάει για ποιους μήνες είναι
function coverOptions(f, amt) {
  const t = formTenant(f);
  if (!t || !amt || isNaN(amt)) return null;
  const s = f.date.slice(0, 7), due = tenantRent(t, s);
  if (!due || amt <= due + 0.005) return null;
  const n = Math.min(6, Math.max(2, Math.round(amt / due)));
  const span = (from, k) => Array.from({ length: k }, (_, i) => addMonths(from, i));
  const opts = [{ k: '', label: `Ενοίκιο ${MONTHS[+s.slice(5) - 1]} + έξτρα για παλιά οφειλή` }];
  const back = span(addMonths(s, -(n - 1)), n), fwd = span(s, n);
  const name = arr => arr.map(x => MONTHS[+x.slice(5) - 1]).join(' + ');
  opts.push({ k: back.join(','), label: name(back) });
  if (fwd.join(',') !== back.join(',')) opts.push({ k: fwd.join(','), label: name(fwd) + ' (προπληρωμή)' });
  return opts;
}
function coversField(f, amt) {
  const opts = coverOptions(f, amt);
  if (!opts) return '';
  const cur = (f.covers || []).join(',');
  return `<div class="field"><div class="flabel">📅 Το ποσό είναι πάνω από ένα ενοίκιο. Για ποιους μήνες είναι;</div>
    <div class="chips">${opts.map(o => `<button class="chip ${o.k === cur ? 'sel' : ''}" data-action="form-covers" data-v="${o.k}">${esc(o.label)}</button>`).join('')}</div>
    <div class="hint">Αν είναι για δύο μήνες, φαίνονται και οι δύο πληρωμένοι. Αν είναι ενοίκιο και κάτι παραπάνω για παλιά χρωστούμενα, διαλέξτε το πρώτο.</div></div>`;
}
