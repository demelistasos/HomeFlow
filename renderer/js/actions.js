'use strict';
// HomeFlow · Όλες οι ενέργειες των κουμπιών (data-action)
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= ενέργειες =======================
const actions = {
  'search-open': () => openSearch(),
  'form-allcats': () => { if (!form) return; syncFormInputs(); form.allCats = !form.allCats; renderForm(); },
  'pal-close': (el, ev) => { if (ev && ev.target !== el) return; pal = null; renderPal(); },
  'pal-go': el => { const r = pal && pal.res && pal.res[+el.dataset.i]; if (r) r.run(); },
  ...bkActions,
  ...polActions,
  ...attActions,
  ...helpActions,
  ...pinActions,
  'new-expense': () => openForm('expense'),
  'new-income': () => openForm('income'),
  'month-prev': () => { ui.month--; if (ui.month < 1) { ui.month = 12; ui.year--; } render(); },
  'month-next': () => { ui.month++; if (ui.month > 12) { ui.month = 1; ui.year++; } render(); },
  'month-today': () => { ui.year = now.getFullYear(); ui.month = now.getMonth() + 1; render(); },
  'year-prev': () => { ui.yearView--; render(); },
  'year-next': () => { ui.yearView++; render(); },
  'goto-year': el => { ui.yearView = +el.dataset.year; ui.page = 'year'; render(); },
  'goto-list': el => {
    Object.assign(ui.list, { year: ui.year, month: ui.month, cat: el.dataset.cat || '', type: el.dataset.type || 'all', q: '', limit: 200 });
    ui.page = 'list'; render();
  },
  'goto-cell': el => {
    Object.assign(ui.list, { year: ui.yearView, month: +el.dataset.m, cat: el.dataset.cat, type: el.dataset.type, q: '', limit: 200 });
    ui.page = 'list'; render();
  },
  'clear-filters': () => { Object.assign(ui.list, { month: 0, cat: '', type: 'all', q: '', limit: 200 }); render(); },
  more: () => { ui.list.limit += 300; render(); },
  edit: el => { const t = DB.transactions.find(x => x.id === el.dataset.id); if (t) openForm(t.type, t); },
  'confirm-planned': el => {
    const t = DB.transactions.find(x => x.id === el.dataset.id); if (!t) return;
    const rec = t.recurringId && DB.recurring.find(r => r.id === t.recurringId);
    if (rec && rec.variable) {
      return ask({ title: `${catIcon(t.categoryId)} ${catName(t.categoryId)}: πόσο ήταν;`, label: 'Το ποσό αυτή τη φορά', numeric: true, value: numFmt.format(t.amount).replace(/\./g, ''),
        hint: `Το ${rec.note || 'ποσό'} αλλάζει κάθε φορά. Γράψτε όσο ήταν στον λογαριασμό.`,
        onOk: v => { const a = parseAmount(v); if (!a || isNaN(a) || a <= 0) return 'Γράψτε το ποσό.'; const before = { ...t }; t.amount = a; t.planned = false; const td = todayStr(); if (td.slice(0, 7) === t.date.slice(0, 7)) { t.date = td; t.dayKnown = true; } persist(); render(); toast(`Καταχωρήθηκε: ${eur(a)} – ${catName(t.categoryId)}`, () => { Object.assign(t, before); persist(); render(); }); } });
    }
    const before = { ...t };
    t.planned = false;
    const td = todayStr();
    if (td.slice(0, 7) === t.date.slice(0, 7)) { t.date = td; t.dayKnown = true; }
    persist(); render();
    toast(`Καταχωρήθηκε: ${eur(t.amount)} – ${catName(t.categoryId)}`, () => { Object.assign(t, before); persist(); render(); });
  },
  print: () => exportSummary(),
  'export-csv': () => exportTxXlsx(filteredList().slice().sort((a, b) => a.date.localeCompare(b.date)), `Κινήσεις ${ui.list.month ? MONTHS[ui.list.month - 1] + ' ' : ''}${ui.list.year || ''}`, `HomeFlow-κινήσεις-${ui.list.year || 'όλα'}${ui.list.month ? '-' + pad(ui.list.month) : ''}.xlsx`),
  'export-csv-all': () => exportTxXlsx(DB.transactions.slice().sort((a, b) => a.date.localeCompare(b.date)), 'Όλες οι κινήσεις', 'HomeFlow-όλες-οι-κινήσεις.xlsx'),
  'export-year': () => exportYear(ui.yearView),
  // φόρμα
  'modal-back': (el, ev) => { if (ev.target === el) { if (form) { if (confirmCloseForm()) { form = null; renderForm(); } } else $('#modal-root').innerHTML = ''; } },
  'form-close': () => { if (confirmCloseForm()) { form = null; renderForm(); } },
  'form-switch': () => { syncFormInputs(); form.type = form.type === 'expense' ? 'income' : 'expense'; form.categoryId = ''; form.error = ''; renderForm(); },
  'form-cat': el => { syncFormInputs(); form.categoryId = el.dataset.id; form.error = ''; if (!form.id && !form.accTouched) form.accountId = suggestAcc(form.categoryId); renderForm(); },
  'form-note': el => { syncFormInputs(); form.note = form.note === el.dataset.v ? '' : el.dataset.v; renderForm(); },
  'form-date': el => { syncFormInputs(); form.date = el.dataset.v; form.dayKnown = true; renderForm(); },
  'form-person': el => { syncFormInputs(); form.person = el.dataset.v; renderForm(); },
  'form-tenant': el => { syncFormInputs(); form.tenantId = form.tenantId === el.dataset.v ? '' : el.dataset.v; renderForm(); },
  // πάγια
  'rec-new': el => openRecDialog(el.dataset.type),
  'rec-edit': el => openRecDialog(null, DB.recurring.find(r => r.id === el.dataset.id)),
  'rec-stop': el => {
    const r = DB.recurring.find(x => x.id === el.dataset.id); if (!r) return;
    const pending = DB.transactions.filter(t => t.recurringId === r.id && t.planned);
    if (!confirm(`Να σταματήσει το πάγιο «${catName(r.categoryId)}»;${pending.length ? `\n\nΘα σβηστούν και ${pending.length} προγραμματισμένες που δεν έχουν γίνει ακόμα.` : ''}`)) return;
    r.active = false;
    DB.transactions = DB.transactions.filter(t => !(t.recurringId === r.id && t.planned));
    persist(); render(); toast('Το πάγιο σταμάτησε.');
  },
  'rec-resume': el => { const r = DB.recurring.find(x => x.id === el.dataset.id); if (!r) return; r.active = true; if (r.from < curYM()) r.from = curYM(); generateRecurring(); persist(); render(); toast('Το πάγιο συνεχίζει.'); },
  'rec-delete': el => {
    const r = DB.recurring.find(x => x.id === el.dataset.id); if (!r) return;
    if (!confirm(`Να διαγραφεί εντελώς το πάγιο «${catName(r.categoryId)}»; (Οι πληρωμές που έγιναν μένουν.)`)) return;
    DB.recurring = DB.recurring.filter(x => x.id !== r.id); persist(); render();
  },
  'dlg-close': () => { dlg = null; renderDlg(); },
  'dlg-back': (el, ev) => { if (ev.target === el) { dlg = null; renderDlg(); } },
  'dlg-save': () => saveDlg(),
  'dlg-cat': el => { syncDlg(); dlg.categoryId = el.dataset.id; dlg.error = ''; renderDlg(); },
  'dlg-clear-until': () => { syncDlg(); dlg.until = ''; dlg.totalStr = ''; renderDlg(); },
  'dlg-every': el => { syncDlg(); dlg.every = +el.dataset.v; renderDlg(); },
  'dlg-person': el => { syncDlg(); dlg.person = el.dataset.v; renderDlg(); },
  'dlg-method': el => { syncDlg(); dlg.method = el.dataset.v; renderDlg(); },
  'dlg-clear-end': () => { syncDlg(); dlg.end = ''; renderDlg(); },
  'dlg-share': el => { syncDlg(); dlg.shareStr = el.dataset.v; renderDlg(); },
  'dlg-end': el => { dlg.end = el.dataset.v; dlg.error = ''; renderDlg(); },
  // εφορία
  tab: el => {
    ui.tabs[el.dataset.page] = el.dataset.k;
    if (el.dataset.page === 'list') { ui.list.type = el.dataset.k; ui.list.cat = ''; ui.list.limit = 200; }
    render(); $('.main').scrollTop = 0;
  },
  'decl-prev': () => { ui.declYear = (ui.declYear || now.getFullYear()) - 1; render(); },
  'decl-next': () => { ui.declYear = (ui.declYear || now.getFullYear()) + 1; render(); },
  'water-new': () => { dlg = { kind: 'water', hoursStr: '2', date: todayStr(), error: '' }; renderDlg(); },
  'dlg-hours': el => { syncDlg2(); dlg.hoursStr = el.dataset.v; renderDlg(); },
  'water-del': el => { const f = fieldCfg(); const w = f.waterings.find(x => x.id === el.dataset.id); if (!w || !confirm(`Να σβηστεί το πότισμα της ${shortDate(w.date)};`)) return; f.waterings = f.waterings.filter(x => x !== w); persist(); render(); },
  'field-pay': () => {
    const y0 = now.getFullYear(); const prev = fieldYear(y0 - 1);
    const year = prev.hours && !prev.paid ? y0 - 1 : y0;
    const r = fieldYear(year);
    dlg = { kind: 'fieldpay', year, amountStr: r.hours && fieldRate() ? numFmt.format(Math.round(r.hours * fieldRate())).replace(/\./g, '') : '', date: todayStr(), addExpense: true, accountId: suggestAcc(fieldCatId()), error: '' }; renderDlg();
  },
  'dlg-fyear': el => { syncDlg2(); dlg.year = +el.dataset.v; const r = fieldYear(dlg.year); dlg.amountStr = r.hours && fieldRate() ? numFmt.format(Math.round(r.hours * fieldRate())).replace(/\./g, '') : ''; renderDlg(); },
  'pw-pick': el => { ui.powerId = el.dataset.id; render(); },
  'pw-add': () => { const c = newPowerCfg('ΔΕΗ ' + ((DB.powers || []).length + 1)); DB.powers.push(c); ui.powerId = c.id; persist(); render(); actions['pw-set'](); },
  'pw-del': () => { const c = powerCfg(); if (c.bills.length) { alert('Έχει λογαριασμούς. Σβήστε πρώτα τους λογαριασμούς του.'); return; } if (!confirm(`Να σβηστεί το «${c.name}»;`)) return; DB.powers = DB.powers.filter(p => p.id !== c.id); ui.powerId = null; dlg = null; renderDlg(); persist(); render(); },
  'pw-set': () => { const c = powerCfg(); const f = n => (n == null ? '' : numFmt.format(n).replace(/\./g, '').replace(/,00$/, ''));
    dlg = { kind: 'pset', name: c.name, totStr: f(c.totalM2), m2Str: f(c.meteredM2), meteredTenantId: c.meteredTenantId, restTenantId: c.restTenantId, restName: c.restName, gStr: String(c.georgeShare || 0), lastStr: f(c.lastReading), error: '' }; renderDlg(); },
  'pb-new': () => { const c = powerCfg(); const last = c.bills.slice().sort((a, b) => a.to.localeCompare(b.to)).pop();
    const r0 = last ? last.r1 : c.lastReading;
    dlg = { kind: 'pbill', id: null, from: last ? shiftDay(last.to, 1) : '', to: todayStr(), kwhStr: '', energyStr: '', feesStr: '', r0Str: r0 == null ? '' : String(r0).replace('.', ','), r1Str: '', error: '' }; renderDlg(); },
  'pb-edit': el => { const b = powerCfg().bills.find(x => x.id === el.dataset.id); const f = n => String(n).replace('.', ',');
    dlg = { kind: 'pbill', id: b.id, from: b.from, to: b.to, kwhStr: f(b.kwh), energyStr: f(b.energy), feesStr: f(b.fees), r0Str: f(b.r0), r1Str: f(b.r1), error: '' }; renderDlg(); },
  'pb-delete': () => { if (!confirm('Να σβηστεί αυτός ο λογαριασμός;')) return; const c = powerCfg(); c.bills = c.bills.filter(b => b.id !== dlg.id); dlg = null; renderDlg(); persist(); render(); },
  'pb-paid': el => { const b = powerCfg().bills.find(x => x.id === el.dataset.id); b[el.dataset.p].paid = true; b[el.dataset.p].paidDate = todayStr(); persist(); render(); toast(`${b[el.dataset.p].who}: τα έδωσε (${eur(b[el.dataset.p].amount)})`); },
  'pb-unpaid': el => { const b = powerCfg().bills.find(x => x.id === el.dataset.id); b[el.dataset.p].paid = false; persist(); render(); },
  'goto-page': el => { ui.page = el.dataset.page; render(); $('.main').scrollTop = 0; },
  'taxyear-prev': () => { ui.taxYear = (ui.taxYear || now.getFullYear()) - 1; render(); },
  'taxyear-next': () => { ui.taxYear = (ui.taxYear || now.getFullYear()) + 1; render(); },
  'tax-pay': el => { const t = DB.taxes.find(x => x.id === el.dataset.id); const k = +el.dataset.k; dlg = { kind: 'taxpay', tid: t.id, k, amountStr: numFmt.format(t.installments[k].amount).replace(/\./g, ''), date: todayStr(), addExpense: true, accountId: suggestAcc(taxCatId()), error: '' }; renderDlg(); },
  'tax-unpay': el => {
    const t = DB.taxes.find(x => x.id === el.dataset.id); const i = t.installments[+el.dataset.k];
    if (!confirm('Να ξαναγίνει «απλήρωτη» αυτή η δόση;' + (i.txId ? ' Θα σβηστεί και από τα έξοδα.' : ''))) return;
    if (i.txId) DB.transactions = DB.transactions.filter(x => x.id !== i.txId);
    Object.assign(i, { paid: false, paidDate: '', txId: '' }); persist(); render();
  },
  'tax-pay-overdue': () => {
    const list = taxInst().filter(x => !x.i.paid && x.i.due < todayStr());
    const total = list.reduce((a, x) => a + x.i.amount, 0);
    if (!confirm(`Να σημειωθούν ως πληρωμένες ${list.length} δόσεις (${eur(total)});\n\nΘα μπουν και στα έξοδα με σημερινή ημερομηνία. Αν έχουν ήδη γραφτεί στα έξοδα, πατήστε «Άκυρο» και σημειώστε τις μία-μία βγάζοντας το τσεκ.`)) return;
    for (const { t, i, k } of list) {
      const tx = { id: uid(), date: todayStr(), dayKnown: true, type: 'expense', amount: i.amount, categoryId: taxCatId(), note: `${t.name} (δόση ${k + 1}/${t.installments.length})`, person: t.person, method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString() };
      DB.transactions.push(tx); Object.assign(i, { paid: true, paidDate: todayStr(), txId: tx.id });
    }
    persist(); render(); toast(`${list.length} δόσεις πληρώθηκαν.`);
  },
  'tax-new': () => { dlg = { kind: 'tax', id: null, name: '', person: '', count: '1', amountStr: '', from: curYM(), year: ui.taxYear || now.getFullYear(), error: '' }; renderDlg(); },
  'tax-edit': el => { const t = DB.taxes.find(x => x.id === el.dataset.id); dlg = { kind: 'tax', id: t.id, name: t.name, person: t.person, year: t.year, error: '' }; renderDlg(); },
  'tax-delete': () => {
    const t = DB.taxes.find(x => x.id === dlg.id);
    if (!confirm(`Να διαγραφεί η οφειλή «${t.name} – ${t.person}»; (Ό,τι έχει μπει στα έξοδα μένει.)`)) return;
    DB.taxes = DB.taxes.filter(x => x.id !== t.id); dlg = null; renderDlg(); persist(); render();
  },
  'dlg-tname': el => { syncDlg2(); dlg.name = el.dataset.v; renderDlg(); },
  'dlg-tperson': el => { syncDlg2(); dlg.person = el.dataset.v; renderDlg(); },
  // οφειλές με άλλους
  'person-new': () => { dlg = { kind: 'person', id: null, name: '', note: '', error: '' }; renderDlg(); },
  'person-edit': el => { const p = DB.people.find(x => x.id === el.dataset.id); dlg = { kind: 'person', id: p.id, name: p.name, note: p.note, error: '' }; renderDlg(); },
  'person-open': el => { ui.personId = el.dataset.id; render(); $('.main').scrollTop = 0; },
  'person-back': () => { ui.personId = null; render(); },
  'person-delete': () => {
    const p = DB.people.find(x => x.id === dlg.id);
    if (!confirm(`Να διαγραφεί «${p.name}» μαζί με όλη την καρτέλα (${p.entries.length} κινήσεις);`)) return;
    DB.people = DB.people.filter(x => x.id !== p.id); ui.personId = null; dlg = null; renderDlg(); persist(); render();
  },
  'pentry-new': el => { dlg = { kind: 'pentry', pid: el.dataset.id, eid: null, dir: el.dataset.dir, amountStr: '', text: '', date: todayStr(), error: '' }; renderDlg(); setTimeout(() => { const a = $('#d-amount'); if (a) a.focus(); }, 30); },
  'pentry-edit': el => { const p = DB.people.find(x => x.id === el.dataset.id); const e = p.entries.find(x => x.id === el.dataset.e); dlg = { kind: 'pentry', pid: p.id, eid: e.id, dir: e.dir, amountStr: numFmt.format(e.amount).replace(/\./g, ''), text: e.text, date: e.date, error: '' }; renderDlg(); },
  'pentry-delete': () => { const p = DB.people.find(x => x.id === dlg.pid); if (!confirm('Να σβηστεί αυτή η κίνηση;')) return; p.entries = p.entries.filter(e => e.id !== dlg.eid); dlg = null; renderDlg(); persist(); render(); },
  'dlg-pdir': el => { syncDlg2(); dlg.dir = el.dataset.v; renderDlg(); },
  // αυτοκίνητα
  'tenant-goto': el => { const id = el.dataset.id; goTo('rent', { ui: { tenantId: id } }); if (el.dataset.pay) actions['tenant-pay']({ dataset: { id } }); },
  'car-new': () => { dlg = { kind: 'car', id: null, photo: '', name: '', brand: '', model: '', plate: '', year: '', color: '', type: '🚗', fuel: '', kteo: '', sold: false, error: '' }; renderDlg(); },
  'car-edit': el => { const c = DB.cars.find(x => x.id === el.dataset.id); dlg = { kind: 'car', id: c.id, photo: c.photo || '', name: c.name, brand: c.brand || '', model: c.model || '', plate: c.plate || '', year: c.year || '', color: c.color || '', type: c.type || '🚗', fuel: c.fuelCategoryId, kteo: c.kteo, sold: !!c.sold, error: '' }; renderDlg(); },
  'dlg-cphoto': async () => { syncDlg2(); const p = await pickPhoto(); if (p && dlg) { dlg.photo = p; renderDlg(); } },
  'dlg-cphoto-x': () => { syncDlg2(); dlg.photo = ''; renderDlg(); },
  'dlg-ctype': el => { syncDlg2(); dlg.type = el.dataset.v; renderDlg(); },
  'dlg-ccolor': el => { syncDlg2(); dlg.color = dlg.color === el.dataset.v ? '' : el.dataset.v; renderDlg(); },
  'car-open': el => { ui.carId = el.dataset.id; ui.page = 'cars'; render(); $('.main').scrollTop = 0; },
  'car-back': () => { ui.carId = null; render(); },
  'car-delete': () => { const c = DB.cars.find(x => x.id === dlg.id); if (!confirm(`Να διαγραφεί το «${c.name}» με όλο το ιστορικό του;`)) return; DB.cars = DB.cars.filter(x => x.id !== c.id); ui.carId = null; dlg = null; renderDlg(); persist(); render(); },
  'car-km': el => { const c = DB.cars.find(x => x.id === el.dataset.id); dlg = { kind: 'km', cid: c.id, kmStr: '', date: todayStr(), error: '' }; renderDlg(); setTimeout(() => { const a = $('#d-km'); if (a) a.focus(); }, 30); },
  'km-del': el => { const c = DB.cars.find(x => x.id === el.dataset.id); if (!confirm('Να σβηστεί αυτή η μέτρηση;')) return; c.km = c.km.filter(k => k.date !== el.dataset.d); persist(); render(); },
  'car-service': el => { const c = DB.cars.find(x => x.id === el.dataset.id); const cur = carKm(c); dlg = { kind: 'service', cid: c.id, sid: null, work: '', date: todayStr(), kmStr: cur ? String(cur.km) : '', nextStr: '', amountStr: '', addExpense: true, error: '' }; renderDlg(); },
  'service-edit': el => { const c = DB.cars.find(x => x.id === el.dataset.id); const sv = c.services.find(x => x.id === el.dataset.s); dlg = { kind: 'service', cid: c.id, sid: sv.id, work: sv.work, date: sv.date, kmStr: sv.km ? String(sv.km) : '', nextStr: sv.nextKm ? String(sv.nextKm) : '', error: '' }; renderDlg(); },
  'service-delete': () => { const c = DB.cars.find(x => x.id === dlg.cid); if (!confirm('Να σβηστεί αυτό το σέρβις;')) return; c.services = c.services.filter(x => x.id !== dlg.sid); dlg = null; renderDlg(); persist(); render(); },
  'dlg-work': el => { syncDlg2(); dlg.work = el.dataset.v; renderDlg(); },
  'dlg-next': el => { syncDlg2(); const km = parseInt(String(dlg.kmStr).replace(/\D/g, ''), 10) || 0; dlg.nextStr = String(km + +el.dataset.v); renderDlg(); },
  'acc-update': el => { const a = DB.accounts.find(x => x.id === el.dataset.id); const lb = lastBal(a); const back = !!(dlg && dlg.kind === 'accview'); dlg = { kind: 'bal', back, id: a.id, amountStr: lb ? numFmt.format(lb.balance).replace(/\./g, '') : '', date: todayStr(), error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-amount'); if (i) { i.focus(); i.select(); } }, 30); },
  'acc-new': () => { dlg = { kind: 'acc', id: null, bank: '', name: '', owner: '', currency: 'EUR', kind2: 'current', amountStr: '', archived: false, maturity: '', error: '' }; renderDlg(); },
  'acc-edit': el => { const a = DB.accounts.find(x => x.id === el.dataset.id); dlg = { kind: 'acc', id: a.id, bank: a.bank, name: a.name, owner: a.owner, currency: a.currency, kind2: a.kind, archived: a.archived, maturity: a.maturity || '', error: '' }; renderDlg(); },
  'acc-hist-del': el => {
    const a = DB.accounts.find(x => x.id === dlg.id); const i = +el.dataset.i; const h = a.history[i];
    if (!h || !confirm(`Να σβηστεί το υπόλοιπο ${money(h.balance, a.currency)} της ${shortDate(h.date)};`)) return;
    syncMoney(); a.history.splice(i, 1); persist(); renderDlg();
  },
  'dlg-bank': el => { syncMoney(); dlg.bank = el.dataset.v; renderDlg(); },
  'dlg-owner': el => { syncMoney(); dlg.owner = el.dataset.v; renderDlg(); },
  'dlg-cur': el => { syncMoney(); dlg.currency = el.dataset.v; renderDlg(); },
  'dlg-kind': el => { syncMoney(); dlg.kind2 = el.dataset.v; renderDlg(); },
  'dlg-clear-maturity': () => { syncMoney(); dlg.maturity = ''; renderDlg(); },
  'rate-edit': () => ask({ title: '💱 Ισοτιμία ευρώ – δολαρίου', label: '1 ευρώ = πόσα δολάρια;', numeric: true, value: String(DB.settings.usdPerEur || 1.16).replace('.', ','), hint: 'Π.χ. 1,16. Τη βρίσκετε σε οποιαδήποτε τράπεζα ή στο Google («ευρώ σε δολάριο»).',
    onOk: r => { const v = parseFloat(r.replace(',', '.')); if (!(v > 0.3 && v < 3)) return 'Η ισοτιμία δεν φαίνεται σωστή.'; DB.settings.usdPerEur = v; persist(); render(); toast(`Ισοτιμία: 1 € = ${String(v).replace('.', ',')} $`); } }),
  'tenant-leave': el => { dlg = { kind: 'leave', id: el.dataset.id, end: curYM(), error: '' }; renderDlg(); },
  'tenant-unleave': el => {
    const t = tenantById(el.dataset.id); if (!t) return;
    if (!confirm(`Ο/Η ${t.name} συνεχίζει να νοικιάζει; Θα ξαναμετράει ενοίκιο κάθε μήνα.`)) return;
    t.end = ''; persist(); render(); toast(`${t.name}: συνεχίζει.`);
  },
  // ενοίκια
  'tenant-new': () => openTenantDialog(null),
  'tenant-edit': el => openTenantDialog(tenantById(el.dataset.id)),
  'tenant-open': el => { ui.tenantId = el.dataset.id; ui.page = 'rent'; render(); $('.main').scrollTop = 0; },
  'tenant-back': () => { ui.tenantId = null; render(); },
  'tenant-pay': el => {
    const t = tenantById(el.dataset.id); if (!t) return;
    const st = tenantMonthStatus(t, curYM());
    const suggest = st.due > st.paid ? round2(st.due - st.paid) : currentRent(t);
    openForm('income', null, { categoryId: rentCatId(), tenantId: t.id, amountStr: suggest ? numFmt.format(suggest).replace(/\./g, '') : '', date: todayStr() });
  },
  'tenant-delete': () => {
    const t = tenantById(dlg.id); if (!t) return;
    const n = tenantPayments(t).length;
    if (!confirm(`Να διαγραφεί ο ενοικιαστής «${t.name}»;${n ? `\n\nΟι ${n} πληρωμές του μένουν στα έσοδα (χωρίς όνομα ενοικιαστή).` : ''}\n\nΑν απλώς έφυγε, καλύτερα συμπληρώστε «τελευταίος μήνας» αντί για διαγραφή.`)) return;
    DB.tenants = DB.tenants.filter(x => x.id !== t.id);
    for (const x of DB.transactions) if (x.tenantId === t.id) x.tenantId = '';
    dlg = null; renderDlg(); ui.tenantId = null; persist(); render();
  },
  'form-method': el => { syncFormInputs(); form.method = el.dataset.v; renderForm(); },
  'form-save': () => saveForm(),
  'form-delete': () => deleteFromForm(),
  // ρυθμίσεις
  font: el => { DB.settings.fontScale = +el.dataset.v; applyFont(); persist(); render(); },
  theme: el => { DB.settings.theme = el.dataset.v; applyTheme(); persist(); render(); },
  'pick-icon': el => iconPicker(el.dataset.id),
  'picker-close': () => { $('#modal-root').innerHTML = ''; },
  'picker-set': el => { const c = catById(el.dataset.id); c.icon = el.dataset.v; $('#modal-root').innerHTML = ''; persist(); render(); },
  'picker-own': el => { const v = ($('#emoji-own').value || '').trim(); if (!v || !/\p{Extended_Pictographic}/u.test(v)) { toast('Γράψτε ένα emoji.'); return; } const c = catById(el.dataset.id); c.icon = [...new Intl.Segmenter().segment(v)][0].segment; $('#modal-root').innerHTML = ''; persist(); render(); },
  'cat-up': el => moveCat(el.dataset.id, -1),
  'cat-down': el => moveCat(el.dataset.id, 1),
  'cat-add': el => {
    const type = el.dataset.type;
    ask({ title: type === 'expense' ? 'Νέα κατηγορία εξόδων' : 'Νέα κατηγορία εσόδων', label: 'Όνομα', onOk: name => {
      if (!name) return 'Γράψτε ένα όνομα.';
      const order = Math.max(0, ...DB.categories.map(c => c.order)) + 1;
      DB.categories.push({ id: 'c' + uid(), name, icon: type === 'expense' ? '📦' : '💶', type, color: PALETTE[order % PALETTE.length], budget: null, extra: false, archived: false, order });
      persist(); render(); toast(`Νέα κατηγορία: ${name}`);
    } });
  },
  'cat-delete': el => {
    const c = catById(el.dataset.id);
    if (!c || DB.transactions.some(t => t.categoryId === c.id)) return;
    if (!confirm(`Να διαγραφεί η κατηγορία «${c.name}»;`)) return;
    DB.categories = DB.categories.filter(x => x.id !== c.id); persist(); render();
  },
  'open-folder': () => window.homeflow.openFolder(),
  'choose-folder': async () => {
    const r = await window.homeflow.chooseFolder();
    if (r && r.changed) { await reload(); toast('Ο φάκελος άλλαξε. Τα δεδομένα είναι πλέον στο: ' + r.path); }
  },
  backup: () => saveText(JSON.stringify(DB, null, 1), `HomeFlow-αντίγραφο-${todayStr()}.json`, 'json'),
  restore: () => importFlow(true),
  'check-updates': async () => {
    const m = $('#upd-msg');
    if (!window.homeflow) { m.textContent = 'Μόνο στην εγκατεστημένη εφαρμογή.'; return; }
    m.textContent = 'Έλεγχος…'; updLater = false;
    const r = await window.homeflow.checkUpdates();
    if (r.status === 'dev') m.textContent = 'Δοκιμαστική λειτουργία – δεν ελέγχεται.';
    else if (r.status === 'error') m.textContent = 'Δεν έγινε έλεγχος (ίσως δεν υπάρχει ίντερνετ).';
  },
  'open-url': el => window.open(el.dataset.url, '_blank'),
  'welcome-fresh': () => { DB = defaultData(); persist(); render(); },
  'welcome-import': () => importFlow(false)
};
function confirmCloseForm() {
  syncFormInputs();
  if (form && !form.id && (form.amountStr || form.categoryId)) return confirm('Να κλείσει χωρίς αποθήκευση;');
  return true;
}
function moveCat(id, dir) {
  const c = catById(id);
  const list = DB.categories.filter(x => x.type === c.type).sort((a, b) => a.order - b.order);
  const i = list.indexOf(c), j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((x, k) => { x.order = k + (c.type === 'income' ? 100 : 0); });
  persist(); render();
}
async function importFlow(replacing) {
  let res;
  if (window.homeflow) res = await window.homeflow.importFile();
  else res = await new Promise(resolve => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return resolve(null); f.text().then(t => { try { resolve({ data: JSON.parse(t), name: f.name }); } catch (e) { resolve({ error: e.message }); } }); };
    inp.click();
  });
  if (!res) return;
  if (res.error || !validData(res.data)) { alert(res.error || 'Αυτό το αρχείο δεν είναι αρχείο HomeFlow.'); return; }
  const d = normalize(res.data);
  if (replacing && DB && !confirm(`Το αρχείο «${res.name}» έχει ${d.transactions.length} κινήσεις.\n\nΝα αντικαταστήσει ΟΛΑ τα τωρινά δεδομένα; (Τα τωρινά μένουν στα αντίγραφα ασφαλείας.)`)) return;
  if (DB && window.homeflow) await saveText(JSON.stringify(DB), `HomeFlow-πριν-την-επαναφορά-${todayStr()}.json`, 'json').catch(() => { });
  DB = d; generateRecurring(); applyFont(); await persist(); ui.page = 'home'; render();
  toast(`Φορτώθηκαν ${d.transactions.length} κινήσεις.`);
}
// Μέγεθος: η επιλογή του χρήστη × αυτόματη προσαρμογή στο μέγεθος του παραθύρου.
// Βάση: 1440×900 = 1. Μεγάλη οθόνη → μεγαλύτερα, μικρό laptop → λίγο μικρότερα (όχι κάτω από 0,85).
function screenFit() {
  if (DB && DB.settings.autoFit === false) return 1;
  const r = 0.5 * innerWidth / 1440 + 0.5 * innerHeight / 900;
  return Math.min(1.5, Math.max(0.85, r));
}
function applyFont() {
  const sc = ((DB && DB.settings.fontScale) || 1.15) * screenFit();
  const root = document.documentElement;
  root.style.setProperty('--scale', sc.toFixed(3));
  const px = 16 * sc, w = innerWidth / px, h = innerHeight / px;
  const set = (c, on) => root.classList.toggle(c, on);
  set('w-wide', w >= 64); set('w-m', w < 64); set('w-s', w < 50); set('w-xs', w < 34);
  set('h-m', h < 56); set('h-s', h < 48); set('h-xs', h < 40);
  applyTheme();
}
let fitTimer = null;
addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(applyFont, 80); });
// Εμφάνιση: φωτεινή, σκούρα ή αυτόματη (όπως ο υπολογιστής)
const darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function themePref() {
  let t = DB && DB.settings.theme;
  if (!t) { try { t = localStorage.getItem('homeflow-theme'); } catch (e) { t = null; } }
  return t === 'dark' || t === 'auto' ? t : 'light';
}
function applyTheme() {
  const t = themePref();
  const dark = t === 'dark' || (t === 'auto' && darkMQ && darkMQ.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try { localStorage.setItem('homeflow-theme', t); } catch (e) { /* τίποτα */ }
}
if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });
applyTheme();
{ const k = document.getElementById('search-kbd'); if (k && /Mac/i.test(navigator.platform || navigator.userAgent)) k.textContent = '⌘K'; }
