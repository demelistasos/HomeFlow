'use strict';
// HomeFlow · Λογική δεδομένων: μήνες, πάγια, ενοίκια, ερωτήματα, κατάσταση οθόνης
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= μήνες (μορφή «2026-10») =======================
const ymOf = (y, m) => `${y}-${pad(m)}`;
const curYM = () => todayStr().slice(0, 7);
function addMonths(s, n) { let y = +s.slice(0, 4), m = +s.slice(5, 7) + n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return ymOf(y, m); }
function monthsBetween(a, b) { return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)); }
const ymLabel = s => `${MONTHS[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
const lastDay = s => new Date(+s.slice(0, 4), +s.slice(5, 7), 0).getDate();

// ======================= πάγια =======================
function recurringDue(r, s) {
  if (!r.active) return false;
  const d = monthsBetween(r.from, s);
  if (d < 0 || (r.until && s > r.until)) return false;
  return d % (r.every || 1) === 0;
}
function nextDue(r) {
  let s = curYM() > r.from ? curYM() : r.from;
  for (let i = 0; i < 36; i++, s = addMonths(s, 1)) if (recurringDue(r, s)) return s;
  return null;
}
function freqText(r) {
  const e = r.every || 1;
  const f = e === 1 ? 'Κάθε μήνα' : e === 12 ? 'Μία φορά τον χρόνο' : `Κάθε ${e} μήνες`;
  return `${f}, στις ${r.day || 1} του μήνα`;
}
// Δόσεις με τέλος: «δόση 80 από 100». Η τελευταία δόση είναι ο μήνας «until».
function instNo(r, s) {
  if (!r.total || !r.until) return null;
  const n = r.total - Math.round(monthsBetween(s, r.until) / (r.every || 1));
  return n >= 1 && n <= r.total ? n : null;
}
const recEnded = r => !!(r.until && r.until < curYM());
// Φτιάχνει τις «προγραμματισμένες» κινήσεις των παγίων ως τον επόμενο μήνα
function generateRecurring() {
  const horizon = addMonths(curYM(), 1);
  const have = new Set(DB.transactions.filter(t => t.recurringId).map(t => t.recurringId + '|' + t.date.slice(0, 7)));
  let added = 0;
  for (const r of DB.recurring) {
    if (!r.active) continue;
    for (let s = r.from, g = 0; s <= horizon && g < 400; s = addMonths(s, 1), g++) {
      if (!recurringDue(r, s) || (r.skip || []).includes(s) || have.has(r.id + '|' + s)) continue;
      DB.transactions.push({
        id: uid(), date: `${s}-${pad(Math.min(r.day || 1, lastDay(s)))}`, dayKnown: true, type: r.type, amount: r.amount,
        categoryId: r.categoryId, note: (r.note || '') + (instNo(r, s) ? `${r.note ? ' ' : ''}(δόση ${instNo(r, s)}/${r.total})` : ''), person: r.person || '', method: r.method || '', planned: true,
        recurringId: r.id, tenantId: '', source: 'recurring', created: new Date().toISOString(), ...(r.accountId ? { accountId: r.accountId } : {})
      });
      have.add(r.id + '|' + s); added++;
    }
  }
  return added;
}

// ======================= ενοίκια =======================
function rentCatId() {
  let id = DB.settings.rentCategoryId;
  if (id && catById(id)) return id;
  let c = DB.categories.find(x => x.type === 'income' && /ενοίκ/i.test(x.name));
  if (!c) {
    c = { id: 'c' + uid(), name: 'Ενοίκια', icon: '🔑', type: 'income', color: '#65a30d', budget: null, extra: false, archived: false, order: 199 };
    DB.categories.push(c);
  }
  DB.settings.rentCategoryId = c.id;
  return c.id;
}
const tenantById = id => DB.tenants.find(t => t.id === id);
function tenantRent(t, s) {
  let amt = 0;
  for (const r of (t.rents || []).slice().sort((a, b) => a.from.localeCompare(b.from))) if (r.from <= s) amt = r.amount;
  return amt;
}
const currentRent = t => tenantRent(t, curYM() < t.start ? t.start : curYM());
const tenantActiveIn = (t, s) => s >= t.start && (!t.end || s <= t.end);
const tenantPayments = t => DB.transactions.filter(x => x.tenantId === t.id && x.type === 'income' && !x.planned).sort((a, b) => a.date.localeCompare(b.date));
// Πόσα έδωσε ο ενοικιαστής (όλο το ποσό). Στα έσοδα μπαίνει μόνο το δικό μας μερίδιο.
const paidOf = x => (x.rentAmount != null ? x.rentAmount : x.amount);
const sumPaid = arr => round2(arr.reduce((a, x) => a + paidOf(x), 0));
const shareOf = t => (t && t.share != null ? +t.share : 100);
// Καρτέλα: για κάθε μήνα ενοίκιο, πληρωμές και τι χρωστάει
function tenantLedger(t) {
  const pays = tenantPayments(t);
  const upto = t.end && t.end < curYM() ? t.end : curYM();
  const rows = [];
  let bal = +t.opening || 0;
  const early = pays.filter(p => p.date.slice(0, 7) < t.start);
  bal -= sumPaid(early);
  for (let s = t.start, g = 0; s <= upto && g < 600; s = addMonths(s, 1), g++) {
    const due = tenantRent(t, s);
    const mp = pays.filter(p => p.date.slice(0, 7) === s);
    const paid = sumPaid(mp);
    bal = round2(bal + due - paid);
    rows.push({ s, due, paid, pays: mp, bal });
  }
  const later = pays.filter(p => p.date.slice(0, 7) > upto);
  if (later.length) { bal = round2(bal - sumPaid(later)); }
  return { rows, balance: round2(bal), early, later };
}
// Τι από την πληρωμή του μήνα πήγε στο ενοίκιο του μήνα και τι «έξτρα» για παλιά οφειλή
const splitPaid = (due, paid) => ({ rent: round2(Math.min(paid, due)), extra: round2(Math.max(0, paid - due)) });
function tenantYearSplit(t, year) {
  let contract = 0, rent = 0, extra = 0;
  for (const r of tenantLedger(t).rows) if (+r.s.slice(0, 4) === year) { const x = splitPaid(r.due, r.paid); contract += r.due; rent += x.rent; extra += x.extra; }
  return { contract: round2(contract), rent: round2(rent), extra: round2(extra) };
}
function tenantMonthStatus(t, s) {
  const due = tenantRent(t, s);
  const paid = sumPaid(tenantPayments(t).filter(p => p.date.slice(0, 7) === s));
  if (!due) return { due, paid, cls: 'ok', text: 'Χωρίς ενοίκιο' };
  if (paid >= due - 0.005) return { due, paid, cls: 'ok', text: '✓ Πλήρωσε' };
  if (paid > 0) return { due, paid, cls: 'part', text: `Μερικώς: ${eur(paid)} από ${eur(due)}` };
  const late = s < curYM() || (s === curYM() && new Date().getDate() > (t.dueDay || 1) + 5);
  return { due, paid, cls: late ? 'late' : 'wait', text: late ? '✗ Δεν πλήρωσε' : 'Δεν πλήρωσε ακόμα' };
}
const validData = d => d && typeof d === 'object' && Array.isArray(d.categories) && Array.isArray(d.transactions);

// ======================= κατάσταση οθόνης =======================
const now = new Date();
const ui = {
  page: 'home',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  list: { year: now.getFullYear(), month: now.getMonth() + 1, type: 'all', cat: '', q: '', limit: 200 },
  yearView: now.getFullYear(),
  info: null,
  tabs: {}
};
// Καρτέλες (tabs): η μπάρα μένει πάντα ορατή πάνω πάνω
function tabBar(page, items, def) {
  const cur = items.some(i => i.k === ui.tabs[page]) ? ui.tabs[page] : (def || items[0].k);
  const html = `<div class="tabs no-print" role="tablist">${items.map(i => `<button class="tab ${i.k === cur ? 'sel' : ''}" role="tab" data-action="tab" data-page="${page}" data-k="${esc(i.k)}">${i.icon ? `<span class="tab-ic">${i.icon}</span>` : ''}${esc(i.label)}${i.count ? ` <span class="tab-count ${i.alert ? 'alert' : ''}">${i.count}</span>` : ''}</button>`).join('')}</div>`;
  return [cur, html];
}
let form = null;      // ανοιχτή φόρμα καταχώρησης
let toastTimer = null;

// ======================= δεδομένα: ερωτήματα =======================
const catById = id => DB.categories.find(c => c.id === id);
const catName = id => (catById(id) || { name: '(άγνωστη)' }).name;
const catIcon = id => (catById(id) || { icon: '❔' }).icon;
const activeCats = type => DB.categories.filter(c => c.type === type && !c.archived).sort((a, b) => a.order - b.order);

function txIn(year, month, { type, planned = false } = {}) {
  return DB.transactions.filter(t => yOf(t) === year && (!month || mOf(t) === month) && (!type || t.type === type) && (planned === null || !!t.planned === planned));
}
const sum = arr => round2(arr.reduce((a, t) => a + t.amount, 0));
const yearsWithTx = () => [...new Set(DB.transactions.map(yOf))].sort();

function yearAgg(year) {
  const a = { exp: {}, inc: {}, expPl: {}, incPl: {}, mExp: Array(12).fill(0), mInc: Array(12).fill(0), mExpNoExtra: Array(12).fill(0) };
  for (const t of DB.transactions) {
    if (yOf(t) !== year) continue;
    const m = mOf(t) - 1;
    const key = (t.type === 'expense' ? 'exp' : 'inc') + (t.planned ? 'Pl' : '');
    (a[key][t.categoryId] = a[key][t.categoryId] || Array(12).fill(0))[m] += t.amount;
    if (t.planned) continue;
    if (t.type === 'expense') {
      a.mExp[m] += t.amount;
      const c = catById(t.categoryId);
      if (!(c && c.extra)) a.mExpNoExtra[m] += t.amount;
    } else a.mInc[m] += t.amount;
  }
  return a;
}
// Σύνολο κατηγορίας για άλλη χρονιά: από κινήσεις ή από το ιστορικό του Excel
function categoryYearTotal(cid, year) {
  const list = DB.transactions.filter(t => yOf(t) === year && t.categoryId === cid && !t.planned);
  if (list.length) return sum(list);
  const h = DB.history[String(year)];
  if (h && h.categories && h.categories[cid] != null) return h.categories[cid];
  return null;
}
function monthlyExpensesFor(year) {
  if (DB.transactions.some(t => yOf(t) === year && t.type === 'expense' && !t.planned)) return yearAgg(year).mExp;
  const h = DB.history[String(year)];
  return h && h.monthlyExpenses ? h.monthlyExpenses : null;
}
function usageCount(type) {
  const since = shiftDay(todayStr(), -365);
  const c = {};
  for (const t of DB.transactions) if (t.type === type && t.date >= since) c[t.categoryId] = (c[t.categoryId] || 0) + 1;
  return c;
}
function frequentNotes(cid, max = 8) {
  const c = {};
  for (const t of DB.transactions) if (t.categoryId === cid && t.note) { const k = t.note.trim(); if (k && k.length < 40) c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, max).map(e => e[0]);
}
