'use strict';
// HomeFlow · Ημερολόγιο πληρωμών
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= ημερολόγιο πληρωμών =======================
function calEvents(year, month) {
  const s = ymOf(year, month), ev = {};
  const add = (date, e) => { if (!date || date.slice(0, 7) !== s) return; const d = +date.slice(8, 10) || 1; (ev[d] = ev[d] || []).push(e); };
  const td = todayStr();
  for (const t of DB.transactions.filter(t => t.planned && t.date.slice(0, 7) === s))
    add(t.dayKnown === false ? `${s}-01` : t.date, { icon: catIcon(t.categoryId), text: catName(t.categoryId), amt: t.amount, type: t.type, cls: t.date < td ? 'late' : 'wait', btn: `<button class="btn small primary" data-action="confirm-planned" data-id="${t.id}">✓ Έγινε</button>`, sort: 2 });
  for (const { t, i, k } of taxInst()) add(i.due, { icon: '🏛️', text: `${t.name} – ${t.person} (δόση ${k + 1})`, amt: i.amount, type: 'expense', cls: i.paid ? 'ok' : i.due < td ? 'late' : 'wait', btn: i.paid ? '' : `<button class="btn small primary" data-action="tax-pay" data-id="${t.id}" data-k="${k}">✓ Πλήρωσα</button>`, sort: 1 });
  for (const t of DB.tenants) if (tenantActiveIn(t, s)) {
    const st = tenantMonthStatus(t, s);
    add(`${s}-${pad(Math.min(t.dueDay || 1, lastDay(s)))}`, { icon: '🔑', text: `Ενοίκιο ${t.name}`, amt: st.due, type: 'income', cls: st.cls === 'ok' ? 'ok' : st.cls, btn: st.cls === 'ok' ? '' : `<button class="btn small income" data-action="tenant-pay" data-id="${t.id}">💶 Πλήρωσε</button>`, sort: 3 });
    if (t.leaseEnd) add(t.leaseEnd, { icon: '📄', text: `${t.name}: λήγει το συμβόλαιο`, cls: 'wait', sort: 5 });
    if (t.adjust) add(t.adjust, { icon: '📈', text: `${t.name}: αναπροσαρμογή ενοικίου`, cls: 'wait', sort: 5 });
  }
  for (const c of DB.cars) if (!c.sold && c.kteo) add(c.kteo, { icon: '🚗', text: `${c.name}: ΚΤΕΟ`, cls: c.kteo < td ? 'late' : 'wait', sort: 4 });
  for (const a of DB.accounts) if (!a.archived && a.maturity) add(a.maturity, { icon: '🔒', text: `Λήγει προθεσμιακή ${a.bank} · ${a.name}`, cls: 'wait', btn: `<button class="btn small" data-action="acc-edit" data-id="${a.id}">⚙</button>`, sort: 4 });
  for (const p of (DB.policies || [])) add(p.next, { icon: polIcon(p), text: `${p.name}${p.what ? ' – ' + p.what : ''}`, amt: p.amount, type: 'expense', cls: p.next < td ? 'late' : 'wait', btn: `<button class="btn small primary" data-action="pol-pay" data-id="${p.id}">✓ Πληρώθηκε</button>`, sort: 1 });
  for (const d in ev) ev[d].sort((a, b) => a.sort - b.sort);
  return ev;
}
const CAL_CLS = { ok: 'c-ok', late: 'c-late', wait: 'c-wait', part: 'c-wait' };
function calPanel(year, month) {
  const ev = calEvents(year, month), s = ymOf(year, month);
  const first = new Date(year, month - 1, 1).getDay(); // 0=Κυρ
  const lead = (first + 6) % 7, days = lastDay(s), td = todayStr();
  let outE = 0, inE = 0;
  for (const d in ev) for (const e of ev[d]) if (e.amt && e.cls !== 'ok') { if (e.type === 'income') inE += e.amt; else outE += e.amt; }
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<div class="cal-c empty"></div>');
  for (let d = 1; d <= days; d++) {
    const list = ev[d] || [], ds = `${s}-${pad(d)}`;
    cells.push(`<div class="cal-c ${ds === td ? 'today' : ''} ${list.length ? 'has' : ''}" ${list.length ? `data-action="cal-day" data-d="${d}"` : ''}>
      <div class="cal-d">${d}</div>
      ${list.slice(0, 3).map(e => `<div class="cal-e ${CAL_CLS[e.cls] || ''}"><span>${e.icon}</span><span class="cal-t">${esc(e.text)}</span></div>`).join('')}
      ${list.length > 3 ? `<div class="cal-more">+ ${list.length - 3} ακόμα</div>` : ''}</div>`);
  }
  return `<div class="panel">
    <h2>🗓️ Ημερολόγιο πληρωμών <span class="muted">${MONTHS[month - 1]} ${year}</span></h2>
    <div class="h-hint">Πατήστε μια μέρα για να δείτε τι έχει και να το σημειώσετε. <span class="cal-key c-late">έληξε</span> <span class="cal-key c-wait">έρχεται</span> <span class="cal-key c-ok">έγινε</span></div>
    <div class="cal">${['Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ', 'Κυρ'].map(w => `<div class="cal-h">${w}</div>`).join('')}${cells.join('')}</div>
    <div class="cal-sum">Μένουν να πληρωθούν τον μήνα: <b class="exp num">${eur(outE)}</b> · να εισπραχθούν: <b class="inc num">${eur(inE)}</b></div>
  </div>`;
}
function renderDayDlg(d) {
  if (d.kind !== 'day') return null;
  const list = calEvents(d.y, d.m)[d.d] || [];
  const dt = new Date(d.y, d.m - 1, d.d);
  return { head: 'neutral', title: `🗓️ ${WEEKDAYS[dt.getDay()]} ${d.d} ${MONTHS[d.m - 1]}`, body: list.length ? list.map(e => `<div class="planned-row"><span class="p-ic">${e.icon}</span><span class="p-nm"><b>${esc(e.text)}</b><div style="font-size:.9rem" class="${e.cls === 'late' ? 'exp' : e.cls === 'ok' ? 'inc' : 'muted'}">${e.cls === 'late' ? 'έληξε / δεν έγινε' : e.cls === 'ok' ? '✓ έγινε' : 'έρχεται'}</div></span><span class="p-amt num ${e.type === 'income' ? 'inc' : 'exp'}">${e.amt ? eur(e.amt) : ''}</span><span class="p-act">${e.btn || ''}</span></div>`).join('') : '<div class="empty">Τίποτα αυτή τη μέρα.</div>' };
}
