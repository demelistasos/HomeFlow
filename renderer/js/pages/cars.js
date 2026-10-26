'use strict';
// HomeFlow · Σελίδα «Αυτοκίνητα»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Αυτοκίνητα ----------
const carKm = c => (c.km.length ? c.km.slice().sort((a, b) => a.date.localeCompare(b.date)).pop() : null);
function carService(c) {
  const cur = carKm(c);
  const withNext = c.services.filter(s => s.nextKm).sort((a, b) => a.date.localeCompare(b.date)).pop();
  if (!withNext || !cur) return null;
  return { next: withNext.nextKm, left: withNext.nextKm - cur.km, last: withNext };
}
function carYearKm(c, year) {
  const log = c.km.slice().sort((a, b) => a.date.localeCompare(b.date));
  const before = log.filter(x => x.date < `${year}-01-01`).pop() || log.find(x => x.date.slice(0, 4) === String(year));
  const after = log.filter(x => x.date.slice(0, 4) === String(year)).pop();
  return before && after ? after.km - before.km : 0;
}
function carsPage() {
  const c0 = ui.carId && DB.cars.find(x => x.id === ui.carId);
  const year = now.getFullYear();
  if (c0) {
    const c = c0;
    const sv = c.services.slice().sort((a, b) => b.date.localeCompare(a.date));
    const log = c.km.slice().sort((a, b) => b.date.localeCompare(a.date));
    return `
    <div class="page-head"><button class="btn no-print" data-action="car-back">◀ Όλα</button><h1>🚗 ${esc(c.name)}</h1><div class="spacer"></div>
      <button class="btn primary no-print" data-action="car-km" data-id="${c.id}">📍 Χιλιόμετρα</button>
      <button class="btn no-print" data-action="car-service" data-id="${c.id}">🔧 Σέρβις</button>
      <button class="btn no-print" data-action="car-edit" data-id="${c.id}">✎</button>
      <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
    ${(() => { const [t, b] = tabBar('car', [{ k: 'service', icon: '🔧', label: 'Σέρβις και επισκευές', count: sv.length }, { k: 'km', icon: '📍', label: 'Χιλιόμετρα', count: log.length }, { k: 'docs', icon: '📎', label: 'Έγγραφα', count: (c.attachments || []).length }], 'service'); ui._carTab = t; return b; })()}
    ${ui._carTab === 'docs' ? `<div class="panel"><h2>📎 Έγγραφα <span class="muted">άδεια, ασφαλιστήριο, ΚΤΕΟ, αποδείξεις</span></h2>${attBlock('car', c.id, c.attachments)}${!store.native ? '<div class="muted">Τα συνημμένα λειτουργούν μόνο στην εφαρμογή.</div>' : ''}</div>` : ''}
    <div>
      ${ui._carTab !== 'service' ? '' : `<div class="panel"><h2>🔧 Σέρβις και επισκευές</h2>
        ${sv.length ? `<table class="data"><thead><tr><th>Ημερομηνία</th><th class="r">Χλμ</th><th>Τι έγινε</th><th class="r">Επόμενο</th></tr></thead><tbody>${sv.map(s => `<tr data-action="service-edit" data-id="${c.id}" data-s="${s.id}"><td>${shortDate(s.date)}</td><td class="r num">${s.km ? int0.format(s.km) : ''}</td><td>${esc(s.work)}${s.cost ? ` <span class="muted">(${eur(s.cost)})</span>` : ''}</td><td class="r num">${s.nextKm ? int0.format(s.nextKm) : ''}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Κανένα σέρβις ακόμα.</div>'}</div>`}
      ${ui._carTab !== 'km' ? '' : `<div class="panel"><h2>📍 Χιλιόμετρα</h2>
        ${log.length ? `<table class="data"><tbody>${log.map((k, i) => `<tr style="cursor:default"><td>${shortDate(k.date)}</td><td class="r num"><b>${int0.format(k.km)}</b></td><td class="r muted num">${log[i + 1] ? '+' + int0.format(k.km - log[i + 1].km) : ''}</td><td style="width:3rem"><button class="btn small ghost" data-action="km-del" data-id="${c.id}" data-d="${k.date}" title="Σβήσιμο">🗑</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Δεν έχουν γραφτεί χιλιόμετρα.</div>'}</div>`}
    </div>`;
  }
  const card = c => {
    const cur = carKm(c), st = carService(c);
    const ykm = carYearKm(c, year);
    const fuel = c.fuelCategoryId ? sum(DB.transactions.filter(t => t.categoryId === c.fuelCategoryId && yOf(t) === year && !t.planned)) : 0;
    const per = ykm ? fuel / ykm : 0;
    const stTxt = !st ? '<span class="muted">Δεν υπάρχει επόμενο σέρβις</span>' : st.left < 0 ? `<span class="exp"><b>Έχει περάσει το σέρβις</b> (ήταν στα ${int0.format(st.next)} km)</span>` : st.left < 1500 ? `<span style="color:var(--warn)"><b>Σέρβις σύντομα:</b> σε ${int0.format(st.left)} km</span>` : `<span class="inc">Επόμενο σέρβις σε ${int0.format(st.left)} km</span>`;
    return `<div class="card tenant-card">
      <div style="display:flex;gap:.8rem;align-items:flex-start"><div style="flex:1"><div class="tenant-name">🚗 ${esc(c.name)}</div>
        <div class="muted">${cur ? `<b>${int0.format(cur.km)} km</b> (${shortDate(cur.date)})` : 'Χωρίς χιλιόμετρα'}${c.sold ? ' · πουλήθηκε' : ''}</div></div></div>
      <div style="margin:.7rem 0 .3rem;font-size:1.1rem">${stTxt}</div>
      <div class="muted" style="font-size:.95rem">${year}: ${int0.format(ykm)} km${fuel ? ` · καύσιμα ${eur(fuel)}${per ? ` · ${numFmt.format(per)} €/km` : ''}` : ''}${c.kteo ? ` · ΚΤΕΟ ${shortDate(c.kteo)}` : ''}</div>
      <div style="display:flex;gap:.6rem;margin-top:.9rem;flex-wrap:wrap">
        <button class="btn primary" data-action="car-km" data-id="${c.id}">📍 Χιλιόμετρα</button>
        <button class="btn" data-action="car-service" data-id="${c.id}">🔧 Σέρβις</button>
        <button class="btn" data-action="car-open" data-id="${c.id}">📒 Καρτέλα</button></div></div>`;
  };
  const active = DB.cars.filter(c => !c.sold), sold = DB.cars.filter(c => c.sold);
  return `
  <div class="page-head"><h1>Αυτοκίνητα</h1><div class="spacer"></div><button class="btn primary no-print" data-action="car-new">+ Νέο αυτοκίνητο</button></div>
  <div class="h-hint" style="margin:-.6rem 0 1rem">Γράφετε τα χιλιόμετρα μία φορά τον μήνα (ή όποτε θέλετε) και κάθε σέρβις με το πότε είναι το επόμενο. Η εφαρμογή θυμίζει στον «Μήνα» όταν πλησιάζει.</div>
  ${active.length ? `<div class="tenant-grid">${active.map(card).join('')}</div>` : '<div class="panel empty">Κανένα αυτοκίνητο ακόμα.</div>'}
  ${sold.length ? `<h2 style="margin-top:1.6rem">Παλιά</h2><div class="tenant-grid">${sold.map(card).join('')}</div>` : ''}`;
}
