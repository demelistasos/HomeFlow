'use strict';
// HomeFlow · «Να θυμηθώ»: όλες οι υπενθυμίσεις
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Να θυμηθώ (αρχική) ----------
function daysUntil(d) { return Math.round((new Date(d + 'T12:00') - new Date(todayStr() + 'T12:00')) / 86400000); }
function reminders() {
  const out = [];
  for (const t of DB.taxes) {
    const due = t.installments.map((i, k) => ({ i, k, dd: daysUntil(i.due) })).filter(x => !x.i.paid && x.dd <= 20);
    if (!due.length) continue;
    const late = due.filter(x => x.dd < 0);
    if (due.length === 1) {
      const { i, k, dd } = due[0];
      out.push({ sort: dd, cls: dd < 0 ? 'late' : 'wait', icon: '🏛️',
        text: `${esc(t.name)} – ${esc(t.person)}: <b>${eur(i.amount)}</b>`,
        sub: dd < 0 ? `έληξε ${shortDate(i.due)}` : dd === 0 ? 'λήγει σήμερα' : `λήγει σε ${dd} ${dd === 1 ? 'μέρα' : 'μέρες'} (${shortDate(i.due)})`,
        btn: `<button class="btn small primary" data-action="tax-pay" data-id="${t.id}" data-k="${k}">✓ Πλήρωσα</button>` });
    } else {
      const total = due.reduce((a, x) => a + x.i.amount, 0);
      out.push({ sort: due[0].dd, cls: late.length ? 'late' : 'wait', icon: '🏛️',
        text: `${esc(t.name)} – ${esc(t.person)}: <b>${due.length} δόσεις, ${eur(total)}</b>`,
        sub: late.length ? `${late.length} ${late.length === 1 ? 'έχει λήξει' : 'έχουν λήξει'} (η πρώτη ${shortDate(late[0].i.due)})` : `η πρώτη λήγει ${shortDate(due[0].i.due)}`,
        btn: `<button class="btn small" data-action="goto-page" data-page="tax">🏛️ Εφορία</button>` });
    }
  }
  for (const c of DB.cars.filter(c => !c.sold)) {
    const st = carService(c);
    if (st && st.left < 1500) out.push({ sort: st.left < 0 ? -50 : 5, cls: st.left < 0 ? 'late' : 'wait', icon: '🔧',
      text: `${esc(c.name)}: σέρβις στα <b>${int0.format(st.next)} km</b>`,
      sub: st.left < 0 ? `έχει περάσει κατά ${int0.format(-st.left)} km` : `σε ${int0.format(st.left)} km`,
      btn: `<button class="btn small" data-action="car-service" data-id="${c.id}">🔧 Έγινε</button>` });
    if (c.kteo) { const dd = daysUntil(c.kteo); if (dd <= 30) out.push({ sort: dd, cls: dd < 0 ? 'late' : 'wait', icon: '🚗', text: `${esc(c.name)}: ΚΤΕΟ`, sub: dd < 0 ? `έληξε ${shortDate(c.kteo)}` : `σε ${dd} μέρες (${shortDate(c.kteo)})`, btn: `<button class="btn small" data-action="car-edit" data-id="${c.id}">✎</button>` }); }
  }
  if (DB.field) {
    const y0 = now.getFullYear();
    for (const y of [y0 - 1, y0]) {
      const r = fieldYear(y);
      if (r.hours && !r.paid && (y < y0 || now.getMonth() >= 9)) out.push({ sort: 15, cls: 'wait', icon: '🌱', text: `Χωράφι: πότισμα ${y}, <b>${hrs(r.hours)} ώρες</b>`,
        sub: `απλήρωτο${fieldRate() ? ` · περίπου ${eur(r.hours * fieldRate())}` : ''}`, btn: `<button class="btn small" data-action="field-pay">💶 Πλήρωσα</button>` });
    }
  }
  for (const r of DB.recurring) {
    if (!r.active || !r.until || recEnded(r)) continue;
    const m = monthsBetween(curYM(), r.until);
    if (m <= 2) out.push({ sort: 10 + m, cls: 'wait', icon: '🏁', text: `${esc(catName(r.categoryId))}${r.note ? ' – ' + esc(r.note) : ''}: ${r.total ? 'τελευταία δόση' : 'τελευταία φορά'}`,
      sub: m === 0 ? `αυτόν τον μήνα (${ymLabel(r.until)})` : `τον ${ymLabel(r.until)}`, btn: `<button class="btn small" data-action="goto-page" data-page="recurring">🔁 Πάγια</button>` });
  }
  out.push(...backupReminders());
  // ασφάλειες και τέλη
  for (const p of (DB.policies || [])) if (p.next) { const dd = daysUntil(p.next); if (dd <= 30) out.push({ sort: dd, cls: dd < 0 ? 'late' : 'wait', icon: polIcon(p), text: `${esc(p.name)}${p.what ? ' – ' + esc(p.what) : ''}${p.amount ? `: <b>${eur(p.amount)}</b>` : ''}`, sub: dd < 0 ? `έληξε ${shortDate(p.next)}` : dd === 0 ? 'σήμερα' : `σε ${dd} μέρες (${shortDate(p.next)})`, btn: `<button class="btn small primary" data-action="pol-pay" data-id="${p.id}">✓ Πληρώθηκε</button>` }); }
  // προθεσμιακές που λήγουν
  for (const a of DB.accounts) if (!a.archived && a.maturity) { const dd = daysUntil(a.maturity); if (dd <= 7 && dd >= -15) out.push({ sort: dd, cls: dd < 0 ? 'late' : 'wait', icon: '🔒', text: `Προθεσμιακή ${esc(a.bank)} · ${esc(a.name)}`, sub: dd < 0 ? `έληξε ${shortDate(a.maturity)}` : dd === 0 ? 'λήγει σήμερα' : `λήγει σε ${dd} ${dd === 1 ? 'μέρα' : 'μέρες'} (${shortDate(a.maturity)})`, btn: `<button class="btn small" data-action="acc-edit" data-id="${a.id}">⚙ Νέα λήξη</button>` }); }
  // συμβόλαια και αναπροσαρμογές ενοικίων
  for (const t of DB.tenants) {
    if (t.end && t.end < curYM()) continue;
    for (const [k, label, icon] of [['leaseEnd', 'λήγει το συμβόλαιο', '📄'], ['adjust', 'αναπροσαρμογή ενοικίου', '📈']]) {
      if (!t[k]) continue; const dd = daysUntil(t[k]);
      if (dd <= 30 && dd >= -30) out.push({ sort: dd, cls: dd < 0 ? 'late' : 'wait', icon, text: `${esc(t.name)}: ${label}`, sub: dd < 0 ? `ήταν ${shortDate(t[k])}` : `σε ${dd} μέρες (${shortDate(t[k])})`, btn: `<button class="btn small" data-action="tenant-edit" data-id="${t.id}">✎ Στοιχεία</button>` });
    }
  }
  // κατηγορίες που πλησιάζουν ή ξεπερνούν την πρόβλεψη της χρονιάς
  {
    const y = now.getFullYear(), over = [];
    for (const c of DB.categories) if (c.type === 'expense' && c.budget > 0 && !c.archived) {
      const sp = sum(DB.transactions.filter(t => t.categoryId === c.id && yOf(t) === y && !t.planned));
      if (sp >= c.budget * 0.9) over.push({ c, sp, pct: Math.round(sp / c.budget * 100) });
    }
    over.sort((a, b) => b.pct - a.pct);
    if (over.length && over.length <= 3) for (const o of over) out.push({ sort: 45, cls: o.pct > 100 ? 'late' : 'wait', icon: o.c.icon, text: `${esc(o.c.name)}: ${o.pct > 100 ? 'πάνω από την πρόβλεψη' : `στο ${o.pct}% της πρόβλεψης`}`, sub: `${eur(o.sp)} από ${eur(o.c.budget)} για το ${y}`, btn: '<button class="btn small" data-action="goto-page" data-page="year">📅 Η χρονιά</button>' });
    else if (over.length) out.push({ sort: 45, cls: over.some(o => o.pct > 100) ? 'late' : 'wait', icon: '📊', text: `${over.length} κατηγορίες κοντά ή πάνω από την πρόβλεψη`, sub: over.slice(0, 4).map(o => `${o.c.name} ${o.pct}%`).join(' · ') + (over.length > 4 ? ' …' : ''), btn: '<button class="btn small" data-action="goto-page" data-page="year">📅 Η χρονιά</button>' });
  }
  // υπόλοιπα λογαριασμών πάνω από 2 μήνες παλιά
  const accs = DB.accounts.filter(a => !a.archived && a.history.length);
  if (accs.length) {
    const lastDate = accs.map(a => lastBal(a).date).sort().pop();
    const days = -daysUntil(lastDate);
    if (days > 60) out.push({ sort: 35, cls: 'wait', icon: '💰', text: 'Ενημερώστε τα υπόλοιπα των λογαριασμών', sub: `η τελευταία ενημέρωση ήταν ${shortDate(lastDate)}`, btn: '<button class="btn small" data-action="goto-page" data-page="money">💰 Χρήματα</button>' });
  }
  return out.sort((a, b) => a.sort - b.sort);
}
function remindersPanel() {
  const r = reminders();
  if (!r.length) return '';
  return `<div class="panel"><h2>🔔 Να θυμηθώ</h2>
    ${r.map(x => `<div class="planned-row"><span class="p-ic">${x.icon}</span><span class="p-nm">${x.text}<div style="font-size:.9rem" class="${x.cls === 'late' ? 'exp' : 'muted'}">${x.sub}</div></span><span class="p-amt"></span><span class="p-act">${x.btn}</span></div>`).join('')}
  </div>`;
}
