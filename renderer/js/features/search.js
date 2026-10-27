'use strict';
// HomeFlow · Αναζήτηση παντού (Ctrl+K) και συντομεύσεις
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= αναζήτηση παντού (Ctrl+K) =======================
const IS_MAC = /Mac/i.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? '⌘' : 'Ctrl';
const normS = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ς/g, 'σ');
// «Σκελετός» ήχου: ίδιος για ελληνικά και λατινικά (π.χ. «μαρια» = «maria»)
const GR2LAT = { α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'ks', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'i', φ: 'f', χ: 'h', ψ: 'ps', ω: 'o' };
const skel = s => normS(s).replace(/[α-ω]/g, c => GR2LAT[c] || c).replace(/ph/g, 'f').replace(/ch/g, 'h').replace(/[cq]/g, 'k').replace(/x/g, 'ks').replace(/[yu]/g, 'i').replace(/w/g, 'o').replace(/tz|dz|j/g, 'z').replace(/oi/g, 'o').replace(/([a-z])\1/g, '$1');
let pal = null; // { q, sel }
function goTo(page, opts = {}) {
  pal = null; renderPal();
  if (dlg) { dlg = null; renderDlg(); }
  ui.page = page; ui.tenantId = null; ui.personId = null; ui.carId = null;
  if (opts.tab) ui.tabs[opts.tab[0]] = opts.tab[1];
  Object.assign(ui, opts.ui || {});
  render(); $('.main').scrollTop = 0;
  if (opts.after) setTimeout(opts.after, 30);
}
const COMMANDS = [
  ['➖', 'Νέο έξοδο', 'καταχωρηση εξοδο πληρωμη', () => { pal = null; renderPal(); openForm('expense'); }, `${MOD}+E`],
  ['➕', 'Νέο έσοδο', 'καταχωρηση εσοδο', () => { pal = null; renderPal(); openForm('income'); }, `${MOD}+I`],
  ['🏠', 'Ο μήνας', 'αρχικη μηνας', () => goTo('home'), `${MOD}+1`],
  ['🔔', 'Να θυμηθώ', 'υπενθυμισεις εκκρεμοτητες', () => goTo('home', { tab: ['home', 'remind'] })],
  ['📌', 'Προγραμματισμένα', 'παγια εγινε', () => goTo('home', { tab: ['home', 'planned'] })],
  ['📋', 'Κινήσεις', 'λιστα ολες', () => goTo('list'), `${MOD}+2`],
  ['🔑', 'Ενοίκια', 'ενοικιαστες', () => goTo('rent'), `${MOD}+3`],
  ['⏳', 'Ενοίκια: δεν πλήρωσαν τον μήνα', 'ενοικια απληρωτα', () => goTo('rent', { tab: ['rent', 'unpaid'] })],
  ['💶', 'Ενοίκια: χρωστάνε', 'ενοικια οφειλη', () => goTo('rent', { tab: ['rent', 'owing'] })],
  ['🧾', 'Ενοίκια για τη δήλωση', 'εφορια δηλωση ενοικια', () => goTo('rent', { tab: ['rent', 'decl'] })],
  ['⚡', 'ΔΕΗ ισογείου', 'ρευμα υπομετρητησ λογαριασμοσ', () => goTo('rent', { tab: ['rent', 'power'] })],
  ['💰', 'Χρήματα', 'τραπεζεσ λογαριασμοι υπολοιπα', () => goTo('money'), `${MOD}+4`],
  ['🔁', 'Πάγια', 'επαναλαμβανομενα', () => goTo('recurring'), `${MOD}+5`],
  ['🏛️', 'Εφορία', 'φοροι ενφια δοσεισ', () => goTo('tax'), `${MOD}+6`],
  ['🤝', 'Οφειλές', 'οφειλεσ χρωστανε δανεικα', () => goTo('people'), `${MOD}+7`],
  ['🚗', 'Αυτοκίνητα', 'σερβισ χιλιομετρα κτεο', () => goTo('cars'), `${MOD}+8`],
  ['🌱', 'Χωράφι', 'ποτισμα', () => goTo('field'), `${MOD}+9`],
  ['💧', 'Πότισα (χωράφι)', 'ποτισμα ωρεσ', () => { goTo('field'); actions['water-new'](); }],
  ['🗓️', 'Ημερολόγιο πληρωμών', 'ημερολογιο πληρωμεσ μηνασ', () => goTo('home', { tab: ['home', 'cal'] })],
  ['🛡️', 'Ασφάλειες και τέλη κυκλοφορίας', 'ασφαλεια τελη κυκλοφοριασ', () => goTo('recurring', { tab: ['recurring', 'pol'] })],
  ['❓', 'Βοήθεια: Πώς κάνω…;', 'βοηθεια οδηγιεσ πωσ', () => openHelp(), 'F1'],
  ['📅', 'Η χρονιά', 'ετοσ πινακασ excel', () => goTo('year')],
  ['📈', 'Ιστορικό χρόνων', 'παλια χρονια', () => goTo('history')],
  ['📄', 'PDF μήνα (σύνοψη για αρχείο ή λογιστή)', 'εκτυπωση pdf συνοψη μηνα λογιστησ', () => { pal = null; renderPal(); exportMonthPdf(); }],
  ['📊', 'Συγκεντρωτικό Excel', 'εκτυπωση excel αρχειο', () => { pal = null; renderPal(); exportSummary(); }, `${MOD}+P`],
  ['⚙️', 'Ρυθμίσεις', 'ρυθμισεισ', () => goTo('settings', { tab: ['settings', 'general'] }), `${MOD}+0`],
  ['🌙', 'Σκούρα / φωτεινή εμφάνιση', 'dark mode σκουρο θεμα εμφανιση', () => goTo('settings', { tab: ['settings', 'general'] })],
  ['🔒', 'PIN στο άνοιγμα', 'κωδικοσ κλειδωμα pin', () => goTo('settings', { tab: ['settings', 'general'] })],
  ['🔠', 'Μέγεθος γραμμάτων', 'γραμματα μεγαλα', () => goTo('settings', { tab: ['settings', 'general'] })],
  ['🛟', 'Αντίγραφα ασφαλείας (cloud, USB)', 'backup αντιγραφο onedrive usb', () => goTo('settings', { tab: ['settings', 'data'] })],
  ['📂', 'Κατηγορίες εξόδων', 'κατηγοριεσ προβλεψη', () => goTo('settings', { tab: ['settings', 'exp'] })],
  ['🔄', 'Έλεγχος για νέα έκδοση', 'ενημερωση εκδοση', () => goTo('settings', { tab: ['settings', 'version'] })],
  ['➕', 'Νέος ενοικιαστής', 'ενοικιαστησ νεοσ', () => { goTo('rent'); openTenantDialog(null); }],
  ['➕', 'Νέα οφειλή στην εφορία', 'εφορια νεα', () => { goTo('tax'); actions['tax-new'](); }]
];
function searchAll(q) {
  const toks = normS(q).split(/\s+/).filter(Boolean);
  const sk = toks.map(skel);
  const qLat = /[a-z]/.test(normS(q)), qGr = /[α-ω]/.test(normS(q));
  const hit = text => {
    const h = normS(text); if (toks.every(t => h.includes(t))) return true;
    // ελληνικά ↔ λατινικά μόνο όταν το κείμενο έχει το «άλλο» αλφάβητο (π.χ. «μαρια» → Maria)
    if (!((qGr && /[a-z]/.test(h)) || (qLat && /[α-ω]/.test(h)))) return false;
    const hs = skel(text); return sk.every(t => t.length >= 3 && hs.includes(t));
  };
  const out = [];
  if (!toks.length) return COMMANDS.filter(c => ['Νέο έξοδο', 'Νέο έσοδο', 'Να θυμηθώ', 'Ημερολόγιο πληρωμών', 'Ενοίκια', 'Συγκεντρωτικό Excel', 'Βοήθεια: Πώς κάνω…;'].includes(c[1])).map(c => ({ group: 'Γρήγορα', icon: c[0], title: c[1], kbd: c[4], run: c[3] }));
  for (const c of COMMANDS) if (hit(c[1] + ' ' + c[2])) out.push({ group: 'Σελίδες και ενέργειες', icon: c[0], title: c[1], kbd: c[4], run: c[3] });
  for (const t of DB.tenants) if (hit(`${t.name} ${t.property} ενοικιαστησ ενοικιο`)) { const b = tenantLedger(t).balance; out.push({ group: 'Ενοικιαστές', icon: '🏠', title: t.name, sub: `${t.property || ''}${t.end && t.end < curYM() ? ' · έφυγε' : ''}`, amt: b > 0.005 ? `χρωστάει ${eur(b)}` : '✓', run: () => goTo('rent', { ui: { tenantId: t.id } }) }); }
  for (const p of DB.people) if (hit(`${p.name} ${p.note} οφειλη`)) out.push({ group: 'Οφειλές', icon: '🤝', title: p.name, amt: eur(Math.abs(personBalance(p))), run: () => goTo('people', { ui: { personId: p.id } }) });
  for (const p of (DB.policies || [])) if (hit(`${p.name} ${p.what} ${p.company} ${p.number} ασφαλεια τελη`)) out.push({ group: 'Ασφάλειες και τέλη', icon: polIcon(p), title: `${p.name}${p.what ? ' – ' + p.what : ''}`, sub: p.next ? `επόμενη ${shortDate(p.next)}` : '', amt: p.amount ? eur(p.amount) : '', run: () => goTo('recurring', { tab: ['recurring', 'pol'] }) });
  HELP.forEach((h, i) => { if (hit(`${h[1]} ${h[2].join(' ')} βοηθεια πωσ`)) out.push({ group: 'Βοήθεια', icon: '❓', title: h[1], run: () => openHelp(i) }); });
  for (const c of DB.cars) if (hit(`${c.name} ${c.brand || ''} ${c.model || ''} ${c.plate || ''} ${(c.plate || '').replace(/\s/g, '')} αυτοκινητο`)) out.push({ group: 'Αυτοκίνητα', icon: '🚗', title: c.name, sub: carKm(c) ? `${int0.format(carKm(c).km)} km` : '', run: () => goTo('cars', { ui: { carId: c.id } }) });
  for (const a of DB.accounts) if (!a.archived && hit(`${a.bank} ${a.name} ${a.owner} ${kindLabel(a.kind)[1]} λογαριασμοσ`)) { const lb = lastBal(a); out.push({ group: 'Λογαριασμοί', icon: kindLabel(a.kind)[2], title: `${a.bank ? a.bank + ' · ' : ''}${a.name}`, sub: a.owner, amt: lb ? money(lb.balance, a.currency) : '', run: () => goTo('money', { tab: ['money', a.kind], after: () => actions['acc-update']({ dataset: { id: a.id } }) }) }); }
  for (const t of DB.taxes) if (hit(`${t.name} ${t.person} εφορια`)) { const y = +((t.installments[0] || {}).due || String(now.getFullYear())).slice(0, 4); out.push({ group: 'Εφορία', icon: '🏛️', title: `${t.name} – ${t.person}`, sub: `${t.installments.filter(i => i.paid).length} από ${t.installments.length} πληρωμένες`, run: () => goTo('tax', { tab: ['tax', t.id], ui: { taxYear: y } }) }); }
  for (const c of DB.categories) if (!c.archived && hit(`${c.name} κατηγορια`)) out.push({ group: 'Κατηγορίες', icon: c.icon, title: c.name, sub: c.type === 'income' ? 'έσοδα' : 'έξοδα', amt: eur(sum(DB.transactions.filter(t => t.categoryId === c.id && yOf(t) === now.getFullYear() && !t.planned))) + ` (${now.getFullYear()})`, run: () => { Object.assign(ui.list, { year: now.getFullYear(), month: 0, cat: c.id, type: 'all', q: '', limit: 200 }); goTo('list', { tab: ['list', 'all'] }); } });
  // κινήσεις: κείμενο, κατηγορία, ποσό
  const txs = [];
  for (const t of DB.transactions) {
    const hay = `${catName(t.categoryId)} ${t.note} ${t.person} ${t.method} ${numFmt.format(t.amount)} ${String(t.amount).replace('.', ',')} ${dateLabel(t)} ${MONTHS[mOf(t) - 1]} ${(tenantById(t.tenantId) || {}).name || ''}`;
    if (hit(hay)) txs.push(t);
  }
  txs.sort((a, b) => b.date.localeCompare(a.date));
  for (const t of txs.slice(0, 40)) out.push({ group: `Κινήσεις (${txs.length})`, icon: catIcon(t.categoryId), title: `${catName(t.categoryId)}${t.note ? ' – ' + t.note : ''}`, sub: `${dateLabel(t)}${t.planned ? ' · προγραμματισμένο' : ''}`, amt: `<span class="${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</span>`, run: () => { pal = null; renderPal(); openForm(t.type, t); } });
  if (txs.length > 40) out.push({ group: `Κινήσεις (${txs.length})`, icon: '📋', title: `Όλες οι ${txs.length} κινήσεις με «${q}»`, run: () => { Object.assign(ui.list, { year: 0, month: 0, cat: '', type: 'all', q, limit: 200 }); goTo('list', { tab: ['list', 'all'] }); } });
  // Πρώτα οι ομάδες που έχουν κάτι με όνομα που ταιριάζει ακριβώς (π.χ. ο ενοικιαστής πριν από το «Νέος ενοικιαστής»)
  const nq = normS(q).trim();
  const score = r => { const t = normS(r.title); return t === nq ? 0 : t.startsWith(nq) ? 1 : t.includes(nq) ? 2 : 3; };
  const gBest = {};
  out.forEach(r => { gBest[r.group] = Math.min(gBest[r.group] == null ? 9 : gBest[r.group], score(r)); });
  const gOrder = [...new Set(out.map(r => r.group))];
  return out.map((r, i) => ({ r, i })).sort((a, b) => (gBest[a.r.group] - gBest[b.r.group]) || (gOrder.indexOf(a.r.group) - gOrder.indexOf(b.r.group)) || (score(a.r) - score(b.r)) || (a.i - b.i)).map(x => x.r);
}
function openSearch() { if (!DB || locked) return; if (form) return; if (dlg) { dlg = null; renderDlg(); } pal = { q: '', sel: 0 }; renderPal(); }
function renderPal(keepInput) {
  let root = $('#pal-root');
  if (!pal) { if (root) root.remove(); return; }
  if (!root) { root = document.createElement('div'); root.id = 'pal-root'; document.body.appendChild(root); }
  const res = searchAll(pal.q);
  pal.res = res; if (pal.sel >= res.length) pal.sel = Math.max(0, res.length - 1);
  let g = null;
  const list = res.length ? res.map((r, i) => `${r.group !== g ? `<div class="pal-group">${esc((g = r.group))}</div>` : ''}<button class="pal-item ${i === pal.sel ? 'sel' : ''}" data-action="pal-go" data-i="${i}"><span class="pal-ic">${esc(r.icon)}</span><span class="pal-t"><b>${esc(r.title)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${r.amt ? `<span class="pal-amt num">${r.amt}</span>` : ''}${r.kbd ? `<kbd>${r.kbd}</kbd>` : ''}</button>`).join('')
    : `<div class="empty" style="padding:1.2rem">Δεν βρέθηκε τίποτα για «${esc(pal.q)}».</div>`;
  if (keepInput && root.querySelector('.pal-list')) { root.querySelector('.pal-list').innerHTML = list; const s = root.querySelector('.pal-item.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); return; }
  root.innerHTML = `<div class="pal-back" data-action="pal-close"><div class="pal" role="dialog" aria-label="Αναζήτηση">
    <div class="pal-in"><span>🔍</span><input id="pal-q" type="search" autocomplete="off" placeholder="Αναζήτηση: ενοικιαστής, ΔΕΗ, 150, Maria, ρυθμίσεις…" value="${esc(pal.q)}"><kbd>Esc</kbd></div>
    <div class="pal-list">${list}</div>
    <div class="pal-foot">↑ ↓ για επιλογή · Enter για άνοιγμα · Esc για κλείσιμο · ${MOD}+K ανοίγει την αναζήτηση από παντού</div>
  </div></div>`;
  const i = $('#pal-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function shortcutsPanel() {
  const rows = [[`${MOD} + K`, 'Αναζήτηση παντού (ή το πλήκτρο /)'], [`${MOD} + E`, 'Νέο έξοδο'], [`${MOD} + I`, 'Νέο έσοδο'], [`${MOD} + P`, 'Συγκεντρωτικό Excel'],
    [`${MOD} + 1 … 9`, 'Οι σελίδες με τη σειρά του μενού'], [`${MOD} + 0`, 'Ρυθμίσεις'], ['F1', 'Βοήθεια: «Πώς κάνω…;»'], ['← →', 'Προηγούμενος / επόμενος μήνας (στον «Μήνα»)'], ['Enter', 'Αποθήκευση σε παράθυρο'], ['Esc', 'Κλείσιμο παραθύρου']];
  return `<div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>⌨️ Συντομεύσεις πληκτρολογίου</h2>
    <table class="data" style="max-width:40rem"><tbody>${rows.map(r => `<tr style="cursor:default"><td style="width:11rem"><kbd>${r[0]}</kbd></td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
  </div>`;
}
const NAV_ORDER = ['home', 'list', 'rent', 'money', 'recurring', 'tax', 'people', 'cars', 'field'];
