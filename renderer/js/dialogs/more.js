'use strict';
// HomeFlow · Παράθυρα: εφορία, οφειλές, αυτοκίνητα, χωράφι, ΔΕΗ
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- παράθυρα: εφορία, οφειλές, αυτοκίνητα ----------
function renderDlg2(d) {
  // επιστρέφει { title, head, body } ή null
  if (d.kind === 'taxpay') {
    const t = DB.taxes.find(x => x.id === d.tid); const i = t.installments[d.k];
    return { head: 'expense', title: `Πληρωμή: ${esc(t.name)} – ${esc(t.person)}`, body: `
      <div style="font-size:1.15rem">Δόση ${d.k + 1} από ${t.installments.length}, λήξη ${shortDate(i.due)}</div>
      <div class="field"><label for="d-amount">Ποσό</label><div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" value="${esc(d.amountStr)}"><span class="amount-eur">€</span></div></div>
      <div class="field"><label for="d-date">Πότε πληρώθηκε</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
      <label class="check"><input type="checkbox" id="d-addexp" ${d.addExpense ? 'checked' : ''}> Να μπει και στα έξοδα (${esc(catName(taxCatId()))})</label>
      ${d.addExpense ? accPicker('expense', d.accountId, 'dlg-acc', 'd-acc') : ''}
      <div class="hint">Βγάλτε το τσεκ αν η πληρωμή έχει ήδη γραφτεί στα έξοδα.</div>` };
  }
  if (d.kind === 'tax') {
    return { head: 'neutral', title: d.id ? 'Οφειλή στην εφορία' : 'Νέα οφειλή στην εφορία', body: `
      <div class="field"><label for="d-tname">Τι είναι;</label><input id="d-tname" type="text" style="width:100%" value="${esc(d.name)}">
        <div class="chips" style="margin-top:.4rem">${['ΕΝΦΙΑ ' + (d.year || now.getFullYear()), 'Φόρος εισοδήματος', 'Τέλη κυκλοφορίας'].map(n => `<button class="chip" data-action="dlg-tname" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>
      ${(DB.settings.persons || []).length ? `<div class="field"><div class="flabel">Ποιος;</div>${chipsHtml(DB.settings.persons, d.person, 'dlg-tperson', '')}</div>` : ''}
      ${d.id ? '' : `<div class="row">
        <div class="field"><label for="d-count">Πόσες δόσεις;</label><input id="d-count" type="number" min="1" max="24" value="${esc(d.count)}" style="width:7rem"></div>
        <div class="field"><label for="d-amount">Ποσό κάθε δόσης</label><div class="amount-wrap"><input id="d-amount" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.amountStr)}"><span style="font-weight:700">€</span></div></div>
        <div class="field"><label for="d-from">Πρώτη δόση (μήνας)</label><input id="d-from" type="month" value="${esc(d.from)}"></div></div>
        <div class="hint">Κάθε δόση λήγει την τελευταία μέρα του μήνα.</div>`}` };
  }
  if (d.kind === 'person') {
    return { head: 'neutral', title: d.id ? 'Στοιχεία' : 'Νέο πρόσωπο', body: `
      <div class="field"><label for="d-pname">Όνομα</label><input id="d-pname" type="text" style="width:100%" value="${esc(d.name)}"></div>
      <div class="field"><label for="d-pnote">Σημείωση</label><input id="d-pnote" type="text" style="width:100%" value="${esc(d.note)}"></div>` };
  }
  if (d.kind === 'pentry') {
    const p = DB.people.find(x => x.id === d.pid);
    return { head: d.dir === 'out' ? 'expense' : 'income', title: `${esc(p.name)}: ${d.dir === 'out' ? 'πληρώσαμε για αυτούς' : 'μας έδωσαν'}`, body: `
      <div class="chips"><button class="chip ${d.dir === 'out' ? 'sel' : ''}" data-action="dlg-pdir" data-v="out">− Πληρώσαμε εμείς για αυτούς</button><button class="chip ${d.dir === 'in' ? 'sel' : ''}" data-action="dlg-pdir" data-v="in">+ Μας έδωσαν χρήματα</button></div>
      <div class="field"><label for="d-amount">Ποσό</label><div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">€</span><span id="d-calc" class="amount-calc"></span></div></div>
      <div class="field"><label for="d-text">Για τι;</label><input id="d-text" type="text" style="width:100%" value="${esc(d.text)}" placeholder="π.χ. ΕΝΦΙΑ, ΔΕΗ, έστειλαν με τράπεζα"></div>
      <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>` };
  }
  if (d.kind === 'km') {
    const c = DB.cars.find(x => x.id === d.cid); const cur = carKm(c);
    return { head: 'neutral', title: `📍 Χιλιόμετρα: ${esc(c.name)}`, body: `
      ${cur ? `<div style="font-size:1.1rem">Τελευταία: <b>${int0.format(cur.km)} km</b> στις ${shortDate(cur.date)}</div>` : ''}
      <div class="field"><label for="d-km">Τι δείχνει ο μετρητής τώρα;</label><div class="amount-wrap"><input id="d-km" class="amount-input num" inputmode="numeric" value="${esc(d.kmStr)}"><span class="amount-eur">km</span></div></div>
      <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>` };
  }
  if (d.kind === 'service') {
    const c = DB.cars.find(x => x.id === d.cid);
    return { head: 'neutral', title: `🔧 ${d.sid ? 'Σέρβις' : 'Νέο σέρβις'}: ${esc(c.name)}`, body: `
      <div class="field"><label for="d-work">Τι έγινε;</label><input id="d-work" type="text" style="width:100%" value="${esc(d.work)}" placeholder="π.χ. λάδια, φίλτρα">
        <div class="chips" style="margin-top:.4rem">${['Λάδια και φίλτρα', 'Ελαστικά', 'Τακάκια', 'Μπαταρία', 'ΚΤΕΟ'].map(w => `<button class="chip" data-action="dlg-work" data-v="${w}">${w}</button>`).join('')}</div></div>
      <div class="row">
        <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
        <div class="field"><label for="d-km">Χιλιόμετρα τότε</label><input id="d-km" class="num" inputmode="numeric" style="width:10rem" value="${esc(d.kmStr)}"></div>
        <div class="field"><label for="d-next">Επόμενο σέρβις στα (km)</label><input id="d-next" class="num" inputmode="numeric" style="width:10rem" value="${esc(d.nextStr)}">
          <div class="chips" style="margin-top:.4rem">${[10000, 15000].map(n => `<button class="chip" data-action="dlg-next" data-v="${n}">+${int0.format(n)}</button>`).join('')}</div></div>
      </div>
      ${d.sid ? '' : `<div class="row"><div class="field"><label for="d-amount">Κόστος <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><div class="amount-wrap"><input id="d-amount" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.amountStr)}"><span style="font-weight:700">€</span></div>
        <label class="check" style="margin-top:.5rem"><input type="checkbox" id="d-addexp" ${d.addExpense ? 'checked' : ''}> Να μπει και στα έξοδα</label></div></div>`}` };
  }
  if (d.kind === 'water') {
    return { head: 'neutral', title: '💧 Πότισμα χωραφιού', body: `
      <div class="field"><label for="d-hours">Πόσες ώρες;</label><div class="amount-wrap"><input id="d-hours" class="amount-input num" inputmode="decimal" value="${esc(d.hoursStr)}"><span class="amount-eur">ώρες</span></div>
        <div class="chips" style="margin-top:.5rem">${['1', '1,5', '2', '2,5', '3'].map(h => `<button class="chip ${d.hoursStr === h ? 'sel' : ''}" data-action="dlg-hours" data-v="${h}">${h} ${h === '1' ? 'ώρα' : 'ώρες'}</button>`).join('')}</div></div>
      <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>` };
  }
  if (d.kind === 'fieldpay') {
    const r = fieldYear(d.year);
    return { head: 'expense', title: `💶 Πληρωμή ποτίσματος ${d.year}`, body: `
      <div style="font-size:1.15rem">${d.year}: <b>${hrs(r.hours)} ώρες</b> σε ${r.ws.length} ποτίσματα${r.paid ? ` · έχουν ήδη πληρωθεί ${eur(r.paid)}` : ''}</div>
      <div class="chips">${[now.getFullYear() - 1, now.getFullYear()].map(y => `<button class="chip ${d.year === y ? 'sel' : ''}" data-action="dlg-fyear" data-v="${y}">${y}</button>`).join('')}</div>
      <div class="field"><label for="d-amount">Πόσα πληρώσατε;</label><div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">€</span><span id="d-calc" class="amount-calc"></span></div></div>
      <div class="field"><label for="d-date">Πότε</label><input id="d-date" type="date" value="${esc(d.date)}"></div>
      <label class="check"><input type="checkbox" id="d-addexp" ${d.addExpense ? 'checked' : ''}> Να μπει και στα έξοδα (${esc(catName(fieldCatId()))})</label>
      ${d.addExpense ? accPicker('expense', d.accountId, 'dlg-acc', 'd-acc') : ''}` };
  }
  if (d.kind === 'pset') {
    const ts = DB.tenants.filter(t => !t.end || t.end >= curYM());
    const opt = (sel, none) => `<option value="">${none}</option>${ts.map(t => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}${t.property ? ' – ' + esc(t.property) : ''}</option>`).join('')}`;
    return { head: 'neutral', title: '⚙️ Μοίρασμα ΔΕΗ', body: `
      <div class="field"><label for="d-pwname">Όνομα</label><input id="d-pwname" type="text" style="width:100%" value="${esc(d.name)}"></div>
      <div class="row">
        <div class="field"><label for="d-pwtot">Όλα τα τετραγωνικά</label><input id="d-pwtot" class="num" inputmode="decimal" style="width:9rem" value="${esc(d.totStr)}"> τ.μ.</div>
        <div class="field"><label for="d-pwm2">Τετραγωνικά με υπομετρητή</label><input id="d-pwm2" class="num" inputmode="decimal" style="width:9rem" value="${esc(d.m2Str)}"> τ.μ.</div>
      </div>
      <div class="field"><label for="d-pwmt">Ποιος έχει τον υπομετρητή;</label><select id="d-pwmt" style="width:100%">${opt(d.meteredTenantId, '— κανείς —')}</select></div>
      <div class="field"><label for="d-pwrest">Ποιος νοικιάζει το υπόλοιπο (${esc(d.restName)});</label><select id="d-pwrest" style="width:100%">${opt(d.restTenantId, 'Ξενοίκιαστο: πληρώνουμε εμείς')}</select>
        <div class="hint">Όταν νοικιαστεί, διαλέξτε εδώ τον νέο ενοικιαστή (πρώτα προσθέστε τον στα Ενοίκια).</div></div>
      <div class="row">
        <div class="field"><label for="d-pwg">Όταν είναι ξενοίκιαστο, ο Γιώργος πληρώνει</label><input id="d-pwg" type="number" min="0" max="100" style="width:6rem" value="${esc(d.gStr)}"> %</div>
        <div class="field"><label for="d-pwr">Τελευταία ένδειξη υπομετρητή</label><input id="d-pwr" class="num" inputmode="decimal" style="width:9rem" value="${esc(d.lastStr)}"></div>
      </div>` };
  }
  if (d.kind === 'pbill') {
    const inp = (id, k, unit, w) => `<div class="amount-wrap"><input id="${id}" class="num" inputmode="decimal" style="width:${w || 9}rem;font-size:1.3rem" value="${esc(d[k])}"><span style="font-weight:700">${unit}</span></div>`;
    return { head: 'neutral', title: `⚡ ${d.id ? 'Λογαριασμός' : 'Νέος λογαριασμός'} ΔΕΗ`, body: `
      <div class="row">
        <div class="field"><label for="d-pfrom">Περίοδος από</label><input id="d-pfrom" type="date" value="${esc(d.from)}"></div>
        <div class="field"><label for="d-pto">έως</label><input id="d-pto" type="date" value="${esc(d.to)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-pkwh">Κατανάλωση (όλη)</label>${inp('d-pkwh', 'kwhStr', 'kWh')}</div>
        <div class="field"><label for="d-penergy">Αξία ρεύματος</label>${inp('d-penergy', 'energyStr', '€')}</div>
        <div class="field"><label for="d-pfees">Δημοτικά τέλη κ.λπ.</label>${inp('d-pfees', 'feesStr', '€')}</div>
      </div>
      <div class="row">
        <div class="field"><label for="d-pr0">Υπομετρητής: ένδειξη αρχή</label>${inp('d-pr0', 'r0Str', '')}</div>
        <div class="field"><label for="d-pr1">ένδειξη τέλος</label>${inp('d-pr1', 'r1Str', '')}</div>
      </div>
      <div id="d-ppreview" class="notice info" style="margin:0">${powerPreview(d)}</div>` };
  }
  if (d.kind === 'car') {
    const cats = DB.categories.filter(c => c.type === 'expense').sort((a, b) => a.name.localeCompare(b.name, 'el'));
    return { head: 'neutral', title: d.id ? 'Στοιχεία αυτοκινήτου' : 'Νέο αυτοκίνητο', body: `
      <div class="row">
        <div class="field"><label for="d-cbrand">Μάρκα</label><input id="d-cbrand" type="text" list="car-brands" autocomplete="off" style="width:100%" value="${esc(d.brand)}" placeholder="π.χ. Kia"><datalist id="car-brands">${CAR_BRANDS.map(b => `<option value="${esc(b)}">`).join('')}</datalist></div>
        <div class="field"><label for="d-cmodel">Μοντέλο</label><input id="d-cmodel" type="text" style="width:100%" value="${esc(d.model)}" placeholder="π.χ. XCeed"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-cname">Όνομα <span class="muted" style="font-weight:500">(πώς το λέτε· αν μείνει κενό: μάρκα και μοντέλο)</span></label><input id="d-cname" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. Το Kia του μπαμπά"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-cplate">Πινακίδα</label><input id="d-cplate" type="text" style="width:10rem;text-transform:uppercase" value="${esc(d.plate)}" placeholder="ΙΚΑ 1234"></div>
        <div class="field"><label for="d-cyear">Χρονολογία</label><input id="d-cyear" type="number" min="1950" max="2100" style="width:7rem" value="${esc(d.year)}" placeholder="2019"></div>
      </div>
      <div class="field"><div class="flabel">Φωτογραφία <span class="muted" style="font-weight:500">(προαιρετικά: του αυτοκινήτου ή ό,τι άλλο θέλετε)</span></div>
        <div style="display:flex;gap:.8rem;align-items:center;flex-wrap:wrap">${carBadge({ photo: d.photo, type: d.type, color: d.color }, true)}
          <button class="btn" data-action="dlg-cphoto">📷 ${d.photo ? 'Άλλη φωτογραφία' : 'Διάλεξε φωτογραφία'}</button>
          ${d.photo ? '<button class="btn ghost" data-action="dlg-cphoto-x">✕ Χωρίς φωτογραφία</button>' : ''}</div></div>
      <div class="field"><div class="flabel">Τι είναι;</div><div class="chips">${CAR_TYPES.map(([e, l]) => `<button class="chip ${(d.type || '🚗') === e ? 'sel' : ''}" data-action="dlg-ctype" data-v="${e}" data-noicon>${e} ${l}</button>`).join('')}</div></div>
      <div class="field"><div class="flabel">Χρώμα</div><div class="chips">${CAR_COLORS.map(([k, l, hex]) => `<button class="chip ${d.color === k ? 'sel' : ''}" data-action="dlg-ccolor" data-v="${k}"><span class="swatch" style="background:${hex}"></span>${l}</button>`).join('')}</div></div>
      <div class="row">
        <div class="field"><label for="d-fuel">Κατηγορία καυσίμων (για €/km)</label><select id="d-fuel" style="width:100%"><option value="">—</option>${cats.map(c => `<option value="${esc(c.id)}" ${d.fuel === c.id ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="d-kteo">Επόμενο ΚΤΕΟ</label><input id="d-kteo" type="date" value="${esc(d.kteo)}"></div>
      </div>
      ${d.id ? '' : '<div class="field"><label for="d-km">Χιλιόμετρα σήμερα</label><input id="d-km" class="num" inputmode="numeric" style="width:10rem" value=""></div>'}
      ${d.id ? `<label class="check"><input type="checkbox" id="d-sold" ${d.sold ? 'checked' : ''}> Το αυτοκίνητο πουλήθηκε / δεν το έχουμε πια</label>` : ''}` };
  }
  return null;
}
function syncDlg2() {
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  const c = id => { const el = $('#' + id); return el ? el.checked : undefined; };
  const d = dlg; if (!d) return;
  for (const [id, k] of [['d-amount', 'amountStr'], ['d-date', 'date'], ['d-tname', 'name'], ['d-count', 'count'], ['d-from', 'from'], ['d-pname', 'name'], ['d-pnote', 'note'],
    ['d-text', 'text'], ['d-km', 'kmStr'], ['d-work', 'work'], ['d-next', 'nextStr'], ['d-cname', 'name'], ['d-cbrand', 'brand'], ['d-cmodel', 'model'], ['d-cplate', 'plate'], ['d-cyear', 'year'], ['d-fuel', 'fuel'], ['d-kteo', 'kteo'], ['d-hours', 'hoursStr'],
    ['d-pwname', 'name'], ['d-pwtot', 'totStr'], ['d-pwm2', 'm2Str'], ['d-pwmt', 'meteredTenantId'], ['d-pwrest', 'restTenantId'], ['d-pwg', 'gStr'], ['d-pwr', 'lastStr'],
    ['d-pfrom', 'from'], ['d-pto', 'to'], ['d-pkwh', 'kwhStr'], ['d-penergy', 'energyStr'], ['d-pfees', 'feesStr'], ['d-pr0', 'r0Str'], ['d-pr1', 'r1Str']]) { const x = v(id); if (x !== undefined) d[k] = typeof x === 'string' ? x.trim() : x; }
  for (const [id, k] of [['d-addexp', 'addExpense'], ['d-sold', 'sold']]) { const x = c(id); if (x !== undefined) d[k] = x; }
}
function saveDlg2() {
  syncDlg2();
  const d = dlg;
  const fail = msg => { d.error = msg; renderDlg(); return true; };
  const done = msg => { dlg = null; renderDlg(); persist(); render(); if (msg) toast(msg); return true; };
  const intOf = s => { const n = parseInt(String(s || '').replace(/[.\s]/g, ''), 10); return isNaN(n) ? null : n; };
  if (d.kind === 'taxpay') {
    const t = DB.taxes.find(x => x.id === d.tid); const i = t.installments[d.k];
    const amt = parseAmount(d.amountStr);
    if (!amt || isNaN(amt)) return fail('Γράψτε το ποσό.');
    i.paid = true; i.paidDate = d.date; i.amount = amt;
    if (d.addExpense) {
      const tx = { id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: amt, categoryId: taxCatId(), note: `${t.name} (δόση ${d.k + 1}/${t.installments.length})`, person: t.person, method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString(), ...(d.accountId ? { accountId: d.accountId } : {}) };
      DB.transactions.push(tx); i.txId = tx.id;
    }
    return done(`Πληρώθηκε: ${t.name} – ${eur(amt)}`);
  }
  if (d.kind === 'tax') {
    if (!d.name) return fail('Γράψτε τι είναι (π.χ. ΕΝΦΙΑ).');
    if (d.id) { const t = DB.taxes.find(x => x.id === d.id); Object.assign(t, { name: d.name, person: d.person }); return done('Αποθηκεύτηκε.'); }
    const n = intOf(d.count), amt = parseAmount(d.amountStr);
    if (!n || n < 1) return fail('Γράψτε πόσες δόσεις.');
    if (!amt || isNaN(amt)) return fail('Γράψτε το ποσό κάθε δόσης.');
    if (!/^\d{4}-\d{2}$/.test(d.from)) return fail('Διαλέξτε τον μήνα της πρώτης δόσης.');
    const inst = []; for (let k = 0, s = d.from; k < n; k++, s = addMonths(s, 1)) inst.push({ due: `${s}-${pad(lastDay(s))}`, amount: amt, paid: false, paidDate: '', txId: '' });
    DB.taxes.push({ id: 'x' + uid(), name: d.name, person: d.person, kind: 'other', year: +d.from.slice(0, 4), installments: inst });
    return done(`Νέα οφειλή: ${d.name}, ${n} δόσεις`);
  }
  if (d.kind === 'person') {
    if (!d.name) return fail('Γράψτε όνομα.');
    if (d.id) Object.assign(DB.people.find(x => x.id === d.id), { name: d.name, note: d.note });
    else DB.people.push({ id: 'p' + uid(), name: d.name, note: d.note, entries: [] });
    return done('Αποθηκεύτηκε.');
  }
  if (d.kind === 'pentry') {
    const p = DB.people.find(x => x.id === d.pid);
    const amt = parseAmount(d.amountStr);
    if (!amt || isNaN(amt) || amt <= 0) return fail('Γράψτε το ποσό.');
    if (d.eid) Object.assign(p.entries.find(e => e.id === d.eid), { amount: amt, dir: d.dir, text: d.text, date: d.date });
    else p.entries.push({ id: 'e' + uid(), date: d.date, text: d.text, amount: amt, dir: d.dir });
    return done(`${p.name}: ${d.dir === 'out' ? 'πληρώσαμε' : 'μας έδωσαν'} ${eur(amt)}`);
  }
  if (d.kind === 'km') {
    const c = DB.cars.find(x => x.id === d.cid); const km = intOf(d.kmStr);
    if (!km) return fail('Γράψτε τα χιλιόμετρα.');
    const cur = carKm(c);
    if (cur && km < cur.km && d.date >= cur.date && !confirm(`Τα ${int0.format(km)} km είναι λιγότερα από τα προηγούμενα (${int0.format(cur.km)}). Σωστό;`)) return true;
    c.km = c.km.filter(x => x.date !== d.date); c.km.push({ date: d.date, km });
    return done(`${c.name}: ${int0.format(km)} km`);
  }
  if (d.kind === 'service') {
    const c = DB.cars.find(x => x.id === d.cid);
    if (!d.work) return fail('Γράψτε τι έγινε.');
    const km = intOf(d.kmStr), nx = intOf(d.nextStr);
    const rec = { date: d.date, km: km || 0, work: d.work, nextKm: nx && (!km || nx > km) ? nx : null };
    if (d.sid) Object.assign(c.services.find(s => s.id === d.sid), rec);
    else {
      const cost = d.amountStr ? parseAmount(d.amountStr) : null;
      if (cost !== null && isNaN(cost)) return fail('Το κόστος δεν είναι σωστό.');
      c.services.push({ id: 's' + uid(), ...rec, cost: cost || null });
      if (km && !c.km.some(x => x.date === d.date)) c.km.push({ date: d.date, km });
      if (cost && d.addExpense) {
        const cat = DB.categories.find(x => x.type === 'expense' && /αυτοκίν/i.test(x.name)) || catById(c.fuelCategoryId);
        if (cat) DB.transactions.push({ id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: cost, categoryId: cat.id, note: `${c.name}: ${d.work}`, person: '', method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString() });
      }
    }
    return done(`${c.name}: σέρβις αποθηκεύτηκε`);
  }
  if (d.kind === 'water') {
    const h = parseAmount(d.hoursStr);
    if (!h || isNaN(h) || h <= 0) return fail('Γράψτε πόσες ώρες.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return fail('Η ημερομηνία δεν είναι σωστή.');
    fieldCfg().waterings.push({ id: 'w' + uid(), date: d.date, hours: h });
    return done(`Πότισμα: ${hrs(h)} ώρες`);
  }
  if (d.kind === 'fieldpay') {
    const amt = parseAmount(d.amountStr);
    if (!amt || isNaN(amt) || amt <= 0) return fail('Γράψτε το ποσό.');
    const r = fieldYear(d.year);
    const pay = { id: 'f' + uid(), year: d.year, date: d.date, amount: amt, hours: r.hours, txId: '' };
    if (d.addExpense) {
      const tx = { id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: amt, categoryId: fieldCatId(), note: `Πότισμα ${d.year} (${hrs(r.hours)} ώρες)`, person: '', method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString(), ...(d.accountId ? { accountId: d.accountId } : {}) };
      DB.transactions.push(tx); pay.txId = tx.id;
    }
    fieldCfg().payments.push(pay);
    return done(`Πότισμα ${d.year}: πληρώθηκαν ${eur(amt)}`);
  }
  if (d.kind === 'pset') {
    const c = powerCfg();
    const tot = parseAmount(d.totStr), m2 = parseAmount(d.m2Str), g = parseInt(d.gStr || '0', 10);
    if (!tot || isNaN(tot) || !m2 || isNaN(m2) || m2 > tot) return fail('Ελέγξτε τα τετραγωνικά.');
    const last = d.lastStr ? parseAmount(d.lastStr) : null;
    Object.assign(c, { name: d.name || 'ΔΕΗ', totalM2: tot, meteredM2: m2, meteredTenantId: d.meteredTenantId || '', restTenantId: d.restTenantId || '', georgeShare: isNaN(g) ? 0 : Math.max(0, Math.min(100, g)), lastReading: last === null || isNaN(last) ? null : last });
    return done('Αποθηκεύτηκε.');
  }
  if (d.kind === 'pbill') {
    const c = powerCfg();
    const x = { kwh: parseAmount(d.kwhStr), energy: parseAmount(d.energyStr), fees: parseAmount(d.feesStr), r0: parseAmount(d.r0Str), r1: parseAmount(d.r1Str) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.from) || !/^\d{4}-\d{2}-\d{2}$/.test(d.to) || d.to < d.from) return fail('Ελέγξτε τις ημερομηνίες της περιόδου.');
    if ([x.kwh, x.energy, x.fees, x.r0, x.r1].some(v => v === null || isNaN(v))) return fail('Συμπληρώστε όλα τα νούμερα.');
    if (x.r1 < x.r0) return fail('Η ένδειξη στο τέλος είναι μικρότερη από την αρχή.');
    const k = powerCalc(c, x);
    const old = d.id ? c.bills.find(b => b.id === d.id) : null;
    const mt = c.meteredTenantId ? tenantById(c.meteredTenantId) : null, rt = c.restTenantId ? tenantById(c.restTenantId) : null;
    const rec = { from: d.from, to: d.to, kwh: x.kwh, energy: x.energy, fees: x.fees, r0: x.r0, r1: x.r1, sub: k.sub, total: k.total,
      metered: { who: old ? old.metered.who : (mt ? mt.name : c.meteredName), amount: k.metered, paid: old ? old.metered.paid : false },
      rest: { who: old ? old.rest.who : (rt ? rt.name : c.restName), tenant: old ? old.rest.tenant : !!rt, amount: k.rest, paid: old ? old.rest.paid : false } };
    if (old) Object.assign(old, rec); else c.bills.push({ id: 'b' + uid(), ...rec });
    if (c.lastReading == null || x.r1 > c.lastReading) c.lastReading = x.r1;
    return done(`ΔΕΗ: ${rec.metered.who} ${eur(k.metered)} · ${rec.rest.who} ${eur(k.rest)}`);
  }
  if (d.kind === 'car') {
    const brand = (d.brand || '').trim(), model = (d.model || '').trim();
    const name = (d.name || '').trim() || [brand, model].filter(Boolean).join(' ');
    if (!name) return fail('Γράψτε μάρκα και μοντέλο ή ένα όνομα.');
    const info = { name, brand, model, plate: (d.plate || '').trim().toUpperCase(), year: d.year ? String(d.year).trim() : '', color: d.color || '', type: d.type || '🚗', photo: d.photo || '', fuelCategoryId: d.fuel || '', kteo: d.kteo || '' };
    if (d.id) Object.assign(DB.cars.find(x => x.id === d.id), info, { sold: d.sold ? (DB.cars.find(x => x.id === d.id).sold || todayStr()) : '' });
    else { const km = intOf(d.kmStr); DB.cars.push({ id: 'c' + uid(), ...info, since: todayStr(), sold: '', km: km ? [{ date: todayStr(), km }] : [], services: [] }); }
    return done('Αποθηκεύτηκε.');
  }
  return false;
}
