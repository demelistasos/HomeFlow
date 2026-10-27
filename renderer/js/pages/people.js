'use strict';
// HomeFlow · Σελίδα «Οφειλές»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Οφειλές με άλλους ----------
function personBalance(p) { return round2(p.entries.reduce((a, e) => a + (e.dir === 'out' ? e.amount : -e.amount), 0)); }
function personBalText(b) {
  if (b > 0.005) return `<span class="exp">Μας χρωστάνε <b class="num">${eur(b)}</b></span>`;
  if (b < -0.005) return `<span class="inc">Τους χρωστάμε <b class="num">${eur(-b)}</b></span>`;
  return '<span class="inc"><b>Εντάξει ✓</b></span>';
}
function peoplePage() {
  const p = ui.personId && DB.people.find(x => x.id === ui.personId);
  if (p) {
    const es = p.entries.slice().sort((a, b) => a.date.localeCompare(b.date));
    let run = 0; const rows = es.map(e => { run = round2(run + (e.dir === 'out' ? e.amount : -e.amount)); return { e, run }; }).reverse();
    return `
    <div class="page-head"><button class="btn no-print" data-action="person-back">◀ Όλοι</button><h1>🤝 ${esc(p.name)}</h1><div class="spacer"></div>
      <button class="btn expense no-print" data-action="pentry-new" data-id="${p.id}" data-dir="out">− Πληρώσαμε για αυτούς</button>
      <button class="btn income no-print" data-action="pentry-new" data-id="${p.id}" data-dir="in">+ Μας έδωσαν</button>
      <button class="btn no-print" data-action="person-edit" data-id="${p.id}">✎</button>
      <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
    <div class="cards" style="grid-template-columns:1fr 2fr"><div class="card bal"><div class="label">Σήμερα</div><div class="value" style="font-size:1.6rem;margin-top:.4rem">${personBalText(personBalance(p))}</div></div>
      <div class="card"><div class="label">Σημείωση</div><div style="margin-top:.4rem">${esc(p.note || '—')}</div></div></div>
    <div class="sheet-wrap"><table class="data"><thead><tr><th>Ημερομηνία</th><th>Τι</th><th class="r">Πληρώσαμε εμείς</th><th class="r">Μας έδωσαν</th><th class="r">Υπόλοιπο</th></tr></thead>
      <tbody>${rows.map(({ e, run }) => `<tr data-action="pentry-edit" data-id="${p.id}" data-e="${e.id}"><td>${shortDate(e.date)}</td><td>${esc(e.text)}</td>
        <td class="r num exp">${e.dir === 'out' ? eur(e.amount) : ''}</td><td class="r num inc">${e.dir === 'in' ? eur(e.amount) : ''}</td>
        <td class="r num"><b class="${run > 0 ? 'exp' : 'inc'}">${run < 0 ? '−' : ''}${eur(Math.abs(run))}</b></td></tr>`).join('')}</tbody></table></div>`;
  }
  return `
  <div class="page-head"><h1>Οφειλές με άλλους</h1><div class="spacer"></div><button class="btn primary no-print" data-action="person-new">+ Νέο πρόσωπο</button></div>
  <div class="notice info">Για ανθρώπους που πληρώνουμε κάτι για λογαριασμό τους, ή που μας δίνουν χρήματα. Η εφαρμογή κρατάει ποιος χρωστάει σε ποιον. Αυτά <b>δεν</b> μετράνε στα έξοδα και τα έσοδα του σπιτιού.</div>
  ${DB.people.length ? `<div class="tenant-grid">${DB.people.map(p => { const last = p.entries.slice().sort((a, b) => b.date.localeCompare(a.date))[0]; return `<div class="card tenant-card">
    <div class="tenant-name">🤝 ${esc(p.name)}</div><div class="muted">${esc(p.note || '')}</div>
    <div class="tenant-bal">${personBalText(personBalance(p))}</div>
    <div class="muted" style="font-size:.95rem">${last ? `Τελευταίο: ${esc(last.text)} – ${eur(last.amount)} (${shortDate(last.date)})` : 'Καμία κίνηση ακόμα.'}</div>
    <div style="display:flex;gap:.6rem;margin-top:.9rem;flex-wrap:wrap">
      <button class="btn expense" data-action="pentry-new" data-id="${p.id}" data-dir="out">− Πληρώσαμε</button>
      <button class="btn income" data-action="pentry-new" data-id="${p.id}" data-dir="in">+ Μας έδωσαν</button>
      <button class="btn" data-action="person-open" data-id="${p.id}">📒 Καρτέλα</button></div></div>`; }).join('')}</div>` : '<div class="panel empty">Κανένα πρόσωπο ακόμα.</div>'}
  ${tenantDebtsPanel()}`;
}

// Ενοικιαστές που χρωστάνε: μόνο για να φαίνονται μαζί με τις άλλες οφειλές.
// Η οφειλή υπολογίζεται στα «Ενοίκια» (ενοίκιο συμβολαίου − πληρωμές) και οι πληρωμές γράφονται εκεί.
function tenantDebtsPanel() {
  const y = now.getFullYear();
  const list = DB.tenants.map(t => ({ t, bal: tenantLedger(t).balance, sp: tenantYearSplit(t, y) })).filter(x => x.bal > 0.005).sort((a, b) => b.bal - a.bal);
  const tot = round2(list.reduce((a, x) => a + x.bal, 0));
  return `<h2 style="margin-top:1.6rem">🔑 Ενοικιαστές που χρωστάνε ${list.length ? `<span class="muted">${eur(tot)}</span>` : ''}</h2>
  <div class="h-hint" style="margin:-.4rem 0 .9rem">Υπολογίζονται μόνα τους από τα «Ενοίκια». Τις πληρωμές τις γράφετε εκεί, με το «💶 Πλήρωσε» του ενοικιαστή.</div>
  ${list.length ? `<div class="tenant-grid">${list.map(({ t, bal, sp }) => `<div class="card tenant-card">
    <div class="tenant-name">🔑 ${esc(t.name)}</div><div class="muted">${esc(t.property || '')}</div>
    <div class="tenant-bal"><span class="exp">Χρωστάει <b class="num">${eur(bal)}</b></span></div>
    <div class="muted" style="font-size:.95rem">${sp.extra ? `Φέτος έδωσε <b>${eur(sp.extra)}</b> έξτρα για την οφειλή.` : 'Φέτος δεν έχει δώσει έξτρα για την οφειλή.'}${t.opening ? ` Παλιό υπόλοιπο: ${eur(t.opening)}.` : ''}</div>
    <div style="display:flex;gap:.6rem;margin-top:.9rem;flex-wrap:wrap">
      <button class="btn income" data-action="tenant-goto" data-id="${t.id}" data-pay="1">💶 Πλήρωσε</button>
      <button class="btn" data-action="tenant-goto" data-id="${t.id}">📒 Καρτέλα</button></div></div>`).join('')}</div>` : '<div class="panel empty">Κανένας ενοικιαστής δεν χρωστάει ✓</div>'}`;
}
