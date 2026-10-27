'use strict';
// HomeFlow · Σελίδα «Ενοίκια» και καρτέλα ενοικιαστή
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Ενοίκια ----------
const STATUS_STYLE = {
  ok: 'background:var(--inc-soft);color:var(--inc)',
  part: 'background:var(--warn-soft);color:var(--warn)',
  wait: 'background:var(--soft);color:var(--ink-2)',
  late: 'background:var(--exp-soft);color:var(--exp)'
};
const statusChip = st => `<span class="status" style="${STATUS_STYLE[st.cls]}">${esc(st.text)}</span>`;
function balanceText(b) {
  if (b > 0.005) return `<span class="exp">Χρωστάει <b class="num">${eur(b)}</b></span>`;
  if (b < -0.005) return `<span class="inc">Έχει δώσει παραπάνω <b class="num">${eur(-b)}</b></span>`;
  return '<span class="inc"><b>Εντάξει ✓</b></span>';
}
function homeRentPanel(s) {
  const ts = DB.tenants.filter(t => tenantActiveIn(t, s));
  if (!ts.length) return '';
  return `<div class="panel">
    <h2>🔑 Ενοίκια του μήνα</h2>
    ${ts.map(t => { const st = tenantMonthStatus(t, s); return `<div class="planned-row">
      <span class="p-ic">🏠</span>
      <span class="p-nm"><b>${esc(t.name)}</b><div class="muted" style="font-size:.9rem">${esc(t.property || '')}${t.property ? ' · ' : ''}${eur(st.due)}/μήνα</div></span>
      <span class="p-amt">${statusChip(st)}</span>
      <span class="p-act"><button class="btn small" data-action="tenant-open" data-id="${t.id}">Καρτέλα</button>${st.cls !== 'ok' ? `<button class="btn small income" data-action="tenant-pay" data-id="${t.id}">💶 Πλήρωσε</button>` : ''}</span>
    </div>`; }).join('')}
  </div>`;
}
function rentPage() {
  if (ui.tenantId && tenantById(ui.tenantId)) return tenantPage(tenantById(ui.tenantId));
  const s = curYM();
  const active = DB.tenants.filter(t => !t.end || t.end >= s);
  const gone = DB.tenants.filter(t => t.end && t.end < s);
  let expect = 0, got = 0, owed = 0, gotExtra = 0;
  for (const t of active) { if (tenantActiveIn(t, s)) { const st = tenantMonthStatus(t, s); expect += st.due; got += st.paid; gotExtra += splitPaid(st.due, st.paid).extra; } }
  for (const t of DB.tenants) { const b = tenantLedger(t).balance; if (b > 0) owed += b; }
  const card = t => {
    const st = tenantActiveIn(t, s) ? tenantMonthStatus(t, s) : null;
    const led = tenantLedger(t);
    const pays = tenantPayments(t);
    const last = pays[pays.length - 1];
    return `<div class="card tenant-card">
      <div style="display:flex;align-items:flex-start;gap:.8rem">
        <div style="flex:1">
          <div class="tenant-name">${esc(t.name)}</div>
          <div class="muted">${esc(t.property || '')}${t.property ? ' · ' : ''}Ενοίκιο <b>${eur(currentRent(t))}</b> τον μήνα</div>
        </div>
        ${st ? statusChip(st) : '<span class="status" style="' + STATUS_STYLE.wait + '">Έφυγε</span>'}
      </div>
      <div class="tenant-bal">${balanceText(led.balance)}</div>
      <div class="muted" style="font-size:.95rem">${last ? `Τελευταία πληρωμή: <b>${eur(paidOf(last))}</b> ${last.dayKnown === false ? 'τον' : 'στις'} ${esc(dateLabel(last))}` : 'Δεν έχει καταγραφεί πληρωμή.'}</div>
      ${shareOf(t) !== 100 ? `<div class="muted" style="font-size:.95rem">Δικό μας το ${shareOf(t)}%: ${eur(currentRent(t) * shareOf(t) / 100)} τον μήνα</div>` : ''}
      ${t.leaseEnd || t.adjust ? `<div class="muted" style="font-size:.95rem">${t.leaseEnd ? `📄 Συμβόλαιο ως <b class="${daysUntil(t.leaseEnd) <= 30 ? 'exp' : ''}">${shortDate(t.leaseEnd)}</b>` : ''}${t.leaseEnd && t.adjust ? ' · ' : ''}${t.adjust ? `📈 Αναπροσαρμογή <b class="${daysUntil(t.adjust) <= 30 ? 'exp' : ''}">${shortDate(t.adjust)}</b>` : ''}</div>` : ''}
      ${t.end && t.end < s ? `<div class="muted" style="font-size:.95rem">🚪 Έφυγε· τελευταίος μήνας ${ymLabel(t.end)}. Ξενοίκιαστο από ${ymLabel(addMonths(t.end, 1))}.</div>` : ''}
      <div style="display:flex;gap:.6rem;margin-top:.9rem;flex-wrap:wrap">
        ${t.end && t.end < s && led.balance <= 0.005 ? '' : `<button class="btn income" data-action="tenant-pay" data-id="${t.id}">💶 Πλήρωσε</button>`}
        <button class="btn" data-action="tenant-open" data-id="${t.id}">📒 Καρτέλα</button>
        ${t.end && t.end < s ? `<button class="btn ghost" data-action="tenant-unleave" data-id="${t.id}">↩ Δεν έφυγε</button>` : `<button class="btn ghost" data-action="tenant-leave" data-id="${t.id}">🚪 Ξενοικιάστηκε</button>`}
      </div>
    </div>`;
  };
  return `
  <div class="page-head"><h1>Ενοίκια</h1><div class="spacer"></div>
    <button class="btn primary no-print" data-action="tenant-new">+ Νέος ενοικιαστής</button>
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
  ${DB.tenants.length ? `
  <div class="cards">
    <div class="card bal"><div class="label">Ενοίκια ${MONTHS[+s.slice(5) - 1]}</div><div class="value num">${eur(expect)}</div><div class="sub">όσα πρέπει να μπουν αυτόν τον μήνα</div></div>
    <div class="card inc"><div class="label">Πληρώθηκαν ως τώρα</div><div class="value inc num">${eur(got)}</div><div class="sub">${gotExtra > 0.005 ? `ενοίκιο ${eur(got - gotExtra)} + <b>${eur(gotExtra)}</b> για παλιές οφειλές` : 'μέσα σε αυτόν τον μήνα'}</div></div>
    <div class="card exp"><div class="label">Χρωστάνε συνολικά</div><div class="value exp num">${eur(owed)}</div><div class="sub">μαζί με παλιές οφειλές</div></div>
  </div>
  ${(() => {
    const unpaid = active.filter(t => tenantActiveIn(t, s) && tenantMonthStatus(t, s).cls !== 'ok');
    const owing = DB.tenants.filter(t => tenantLedger(t).balance > 0.005);
    const [tab, bar] = tabBar('rent', [
      { k: 'all', icon: '🏠', label: 'Όλοι', count: active.length },
      { k: 'unpaid', icon: '⏳', label: 'Δεν πλήρωσαν τον μήνα', count: unpaid.length, alert: unpaid.length > 0 },
      { k: 'owing', icon: '💶', label: 'Χρωστάνε', count: owing.length, alert: owing.length > 0 },
      ...(gone.length ? [{ k: 'gone', icon: '🚪', label: 'Έφυγαν', count: gone.length }] : []),
      { k: 'decl', icon: '🧾', label: 'Για τη δήλωση' },
      (() => { const pc = powerOwedCount(); return { k: 'power', icon: '⚡', label: (DB.powers || []).length > 1 ? 'ΔΕΗ μοιράσματα' : ((DB.powers || [])[0] || {}).name || 'ΔΕΗ', count: pc, alert: pc > 0 }; })()
    ], 'all');
    if (tab === 'decl') return bar + declPanel();
    if (tab === 'power') return bar + powerPanel();
    const list = tab === 'unpaid' ? unpaid : tab === 'owing' ? owing : tab === 'gone' ? gone : active;
    return bar + (list.length ? `<div class="tenant-grid">${list.map(card).join('')}</div>` : '<div class="panel empty">Κανείς εδώ ✓</div>');
  })()}`
    : `<div class="panel" style="max-width:46rem"><p style="font-size:1.1rem;margin-top:0">Δεν έχετε βάλει ενοικιαστές ακόμα.</p><p class="muted">Για κάθε ενοικιαστή γράφετε το όνομα και το ενοίκιο. Μετά, κάθε φορά που πληρώνει, πατάτε «Πλήρωσε». Η εφαρμογή βρίσκει μόνη της ποιος χρωστάει και πόσα, και η πληρωμή μπαίνει αυτόματα στα έσοδα.</p><button class="btn big primary" style="width:auto;padding:0 2rem" data-action="tenant-new">+ Νέος ενοικιαστής</button></div>`}`;
}
function tenantPage(t) {
  const led = tenantLedger(t);
  const rows = led.rows.slice().reverse();
  return `
  <div class="page-head">
    <button class="btn no-print" data-action="tenant-back">◀ Όλοι οι ενοικιαστές</button>
    <h1>🏠 ${esc(t.name)}</h1>
    <div class="spacer"></div>
    <button class="btn income no-print" data-action="tenant-pay" data-id="${t.id}">💶 Πλήρωσε</button>
    <button class="btn no-print" data-action="tenant-edit" data-id="${t.id}">✎ Στοιχεία</button>
    ${t.end && t.end < curYM() ? `<button class="btn no-print" data-action="tenant-unleave" data-id="${t.id}">↩ Δεν έφυγε</button>` : `<button class="btn no-print" data-action="tenant-leave" data-id="${t.id}">🚪 Ξενοικιάστηκε</button>`}
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button>
  </div>
  <div class="cards">
    <div class="card ${led.balance > 0.005 ? 'exp' : 'inc'}"><div class="label">Σήμερα</div><div class="value num" style="font-size:1.6rem;margin-top:.4rem">${balanceText(led.balance)}</div></div>
    <div class="card bal"><div class="label">Ενοίκιο</div><div class="value num">${eur(currentRent(t))}</div><div class="sub">${esc(t.property || '')}${t.dueDay ? ` · πληρώνει στις ${t.dueDay} του μήνα` : ''}${shareOf(t) !== 100 ? `<br>Δικό μας το ${shareOf(t)}%: <b>${eur(currentRent(t) * shareOf(t) / 100)}</b>` : ''}</div></div>
    <div class="card"><div class="label">Από</div><div class="value" style="font-size:1.6rem">${ymLabel(t.start)}</div><div class="sub">${t.end ? 'Έφυγε: ' + ymLabel(t.end) : ''}${t.opening ? `${t.end ? ' · ' : ''}Παλιό υπόλοιπο: ${eur(t.opening)}` : ''}</div></div>
  </div>
  ${(() => { const y = now.getFullYear(), x = tenantYearSplit(t, y); return x.contract || x.extra ? `<div class="notice info"><b>${y}:</b> ενοίκια συμβολαίου ${eur(x.contract)} · πλήρωσε για ενοίκιο <b>${eur(x.rent)}</b>${x.extra ? ` · και <b>${eur(x.extra)}</b> έξτρα για παλιές οφειλές` : ''}. Στον λογιστή δίνετε τα ενοίκια του συμβολαίου (Ενοίκια › Για τη δήλωση).</div>` : ''; })()}
  ${t.note ? `<div class="notice">${esc(t.note)}</div>` : ''}
  ${store.native || (t.attachments || []).length ? `<div class="panel"><h2>📎 Έγγραφα <span class="muted">μισθωτήριο, αποδείξεις κ.λπ.</span></h2>${attBlock('tenant', t.id, t.attachments)}</div>` : ''}
  <div class="sheet-wrap"><table class="data">
    <thead><tr><th>Μήνας</th><th class="r">Ενοίκιο</th><th class="r">Πλήρωσε για ενοίκιο</th><th class="r">+ Για παλιά οφειλή</th><th>Πότε</th><th>Κατάσταση</th><th class="r">Χρωστάει</th></tr></thead>
    <tbody>${rows.map(r => { const st = tenantMonthStatus(t, r.s); return `<tr style="cursor:default">
      <td><b>${ymLabel(r.s)}</b></td>
      <td class="r num">${eur(r.due)}</td>
      ${(() => { const x = splitPaid(r.due, r.paid); return `<td class="r num inc">${r.paid ? eur(x.rent) : '<span class="muted">—</span>'}</td><td class="r num">${x.extra ? `<b>${eur(x.extra)}</b>` : '<span class="muted">—</span>'}</td>`; })()}
      <td>${r.pays.map(p => `<button class="chip" style="min-height:2.1rem;padding:.1rem .7rem;margin:.1rem" data-action="edit" data-id="${p.id}">${p.dayKnown === false ? '' : `${new Date(p.date + 'T12:00').getDate()}/${+p.date.slice(5, 7)} · `}${eur(paidOf(p))}</button>`).join('')}</td>
      <td>${statusChip(st)}</td>
      <td class="r num ${r.bal > 0.005 ? 'exp' : 'inc'}"><b>${r.bal < -0.005 ? '−' + eur(-r.bal) : eur(r.bal)}</b></td></tr>`; }).join('')}
      ${t.opening ? `<tr style="cursor:default"><td class="muted">Πριν τον ${ymLabel(t.start)}</td><td colspan="5" class="muted">Παλιό υπόλοιπο</td><td class="r num"><b>${eur(t.opening)}</b></td></tr>` : ''}
    </tbody></table></div>
  ${led.later.length ? `<p class="muted">Υπάρχουν και ${led.later.length} πληρωμές με μελλοντική ημερομηνία, που έχουν αφαιρεθεί ήδη από την οφειλή.</p>` : ''}`;
}
