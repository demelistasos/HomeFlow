'use strict';
// HomeFlow · Σελίδα «Εφορία»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Εφορία ----------
const taxInst = () => DB.taxes.flatMap(t => t.installments.map((i, k) => ({ t, i, k })));
function taxCatId() {
  let id = DB.settings.taxCategoryId;
  if (id && catById(id)) return id;
  let c = DB.categories.find(x => x.type === 'expense' && /εφορ/i.test(x.name));
  if (!c) { c = { id: 'c' + uid(), name: 'Εφορία', icon: '🏛️', type: 'expense', color: '#b91c1c', budget: null, extra: false, archived: false, order: 98 }; DB.categories.push(c); }
  DB.settings.taxCategoryId = c.id;
  return c.id;
}
function taxPage() {
  const year = ui.taxYear || now.getFullYear();
  const list = taxInst().filter(x => +x.i.due.slice(0, 4) === year);
  const paid = round2(list.filter(x => x.i.paid).reduce((a, x) => a + x.i.amount, 0));
  const left = round2(list.filter(x => !x.i.paid).reduce((a, x) => a + x.i.amount, 0));
  const overdue = list.filter(x => !x.i.paid && x.i.due < todayStr());
  const next = list.filter(x => !x.i.paid).sort((a, b) => a.i.due.localeCompare(b.i.due)).slice(0, 6);
  const spent = sum(DB.transactions.filter(t => t.type === 'expense' && !t.planned && yOf(t) === year && t.categoryId === taxCatId()));
  const obligations = DB.taxes.filter(t => t.installments.some(i => +i.due.slice(0, 4) === year));
  const instRow = (t, i, k) => {
    const late = !i.paid && i.due < todayStr();
    return `<tr style="cursor:default"><td>${k + 1}</td><td>${shortDate(i.due)}</td><td class="r num"><b>${eur(i.amount)}</b></td>
      <td>${i.paid ? `<span class="status" style="${STATUS_STYLE.ok}">✓ Πληρώθηκε${i.paidDate ? ' ' + shortDate(i.paidDate) : ''}</span>` : late ? `<span class="status" style="${STATUS_STYLE.late}">Έληξε</span>` : `<span class="status" style="${STATUS_STYLE.wait}">Θα πληρωθεί</span>`}</td>
      <td style="text-align:right">${i.paid ? `<button class="btn small ghost" data-action="tax-unpay" data-id="${t.id}" data-k="${k}">↩ Αναίρεση</button>` : `<button class="btn small primary" data-action="tax-pay" data-id="${t.id}" data-k="${k}">✓ Πλήρωσα</button>`}</td></tr>`;
  };
  return `
  <div class="page-head">
    <div class="month-nav"><button class="btn" data-action="taxyear-prev">◀</button><div class="month-title" style="min-width:11rem">Εφορία ${year}</div><button class="btn" data-action="taxyear-next">▶</button></div>
    <div class="spacer"></div>
    <button class="btn primary no-print" data-action="tax-new">+ Νέα οφειλή</button>
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button>
  </div>
  <div class="cards">
    <div class="card inc"><div class="label">Δόσεις που πληρώθηκαν</div><div class="value num">${eur(paid)}</div><div class="sub">Όλα τα έξοδα εφορίας ${year}: ${eur(spent)}</div></div>
    <div class="card exp"><div class="label">Μένουν να πληρωθούν</div><div class="value exp num">${eur(left)}</div></div>
    <div class="card ${overdue.length ? 'exp' : 'bal'}"><div class="label">Ληξιπρόθεσμες</div><div class="value num" style="color:${overdue.length ? 'var(--exp)' : 'var(--inc)'}">${overdue.length ? overdue.length : '0 ✓'}</div>
      ${overdue.length ? '<div class="sub"><button class="btn small no-print" data-action="tax-pay-overdue">✓ Πλήρωσα όλες τις ληξιπρόθεσμες</button></div>' : ''}</div>
  </div>
  ${(() => {
    const short = n => n.replace('Φόρος εισοδήματος', 'Φόρος εισοδ.').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+\d{4}$/, '').trim();
    const items = [{ k: 'next', icon: '📅', label: 'Επόμενες δόσεις', count: list.filter(x => !x.i.paid).length, alert: overdue.length > 0 },
      ...obligations.map(t => ({ k: t.id, icon: '🏛️', label: `${short(t.name)} – ${t.person}`, count: t.installments.filter(i => !i.paid && +i.due.slice(0, 4) === year).length, alert: t.installments.some(i => !i.paid && i.due < todayStr()) }))];
    const [tab, bar] = tabBar('tax', items, 'next');
    const showNext = tab === 'next';
    const showOb = obligations.filter(t => t.id === tab);
    return bar + (showNext ? (next.length ? `<div class="panel"><h2>📅 Επόμενες δόσεις</h2>${next.map(({ t, i, k }) => `<div class="planned-row">
    <span class="p-ic">🏛️</span><span class="p-nm"><b>${esc(t.name)}</b> – ${esc(t.person)}<div class="muted" style="font-size:.9rem">δόση ${k + 1} από ${t.installments.length} · λήγει ${shortDate(i.due)}</div></span>
    <span class="p-amt num exp">${eur(i.amount)}</span><span class="p-act"><button class="btn small primary" data-action="tax-pay" data-id="${t.id}" data-k="${k}">✓ Πλήρωσα</button></span></div>`).join('')}</div>` : (obligations.length ? '<div class="panel empty">Όλες οι δόσεις της χρονιάς πληρώθηκαν ✓</div>' : '')) : '') +
    (showNext && !obligations.length ? `<div class="panel empty">Δεν υπάρχουν δόσεις για το ${year}. Πατήστε «+ Νέα οφειλή» για να προσθέσετε π.χ. ΕΝΦΙΑ ή φόρο εισοδήματος.</div>` : '') +
    showOb.map(t => {
    const pd = t.installments.filter(i => i.paid).length;
    const rest = round2(t.installments.filter(i => !i.paid).reduce((a, i) => a + i.amount, 0));
    return `<div class="panel"><h2>🏛️ ${esc(t.name)} – ${esc(t.person)} <span class="muted">${pd} από ${t.installments.length} δόσεις πληρωμένες${rest ? ` · μένουν ${eur(rest)}` : ' · εξοφλήθηκε ✓'}</span>
      <span style="flex:1"></span><button class="btn small ghost no-print" data-action="tax-edit" data-id="${t.id}">✎</button></h2>
      <div class="track" style="height:.6rem;background:var(--track);border-radius:99px;overflow:hidden;margin-bottom:.8rem"><div style="height:100%;width:${pd / Math.max(1, t.installments.length) * 100}%;background:var(--inc)"></div></div>
      <table class="data"><thead><tr><th style="width:3rem">#</th><th>Λήξη</th><th class="r">Ποσό</th><th>Κατάσταση</th><th></th></tr></thead><tbody>${t.installments.map((i, k) => instRow(t, i, k)).join('')}</tbody></table></div>`;
  }).join('');
  })()}`;
}
