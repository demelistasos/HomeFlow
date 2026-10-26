'use strict';
/* HomeFlow – η εφαρμογή (χωρίς εξωτερικές βιβλιοθήκες) */

// ======================= σταθερές =======================
const MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
const MONTHS_SHORT = ['Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'];
const WEEKDAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const EMOJIS = ['🛒', '🥬', '🥩', '🥛', '🍞', '🍽️', '☕', '🎁', '💡', '💧', '🔥', '📞', '📺', '🏢', '🏠', '🏡', '🏗️', '🔑', '🚗', '🚙', '⛽', '🔧', '🅿️', '🚌', '✈️', '⛰️', '🏖️', '💊', '🩺', '🦷', '👓', '🛡️', '🏛️', '📄', '📚', '🎓', '👶', '👨‍👩‍👦', '👕', '💇', '🐶', '🐱', '🎉', '⚽', '🎭', '🙏', '🪙', '💶', '💰', '🏦', '👴', '💼', '➕', '📦', '🛍️', '🧹', '🧾', '💳', '🌳', '❤️'];
const FONT_SCALES = [{ v: 1, l: 'Κανονικά' }, { v: 1.15, l: 'Μεγάλα' }, { v: 1.3, l: 'Πολύ μεγάλα' }];

const DEFAULT_CATEGORIES = [
  ['Σούπερ μάρκετ', '🛒', 'expense'], ['Λαϊκή', '🥬', 'expense'], ['ΔΕΗ', '💡', 'expense'], ['Νερό', '💧', 'expense'],
  ['Τηλέφωνο & ίντερνετ', '📞', 'expense'], ['Κοινόχρηστα', '🏢', 'expense'], ['Καύσιμα', '⛽', 'expense'],
  ['Αυτοκίνητο', '🚗', 'expense'], ['Γιατροί & φάρμακα', '💊', 'expense'], ['Έξοδοι', '🍽️', 'expense'],
  ['Δώρα', '🎁', 'expense'], ['Εφορία', '🏛️', 'expense'], ['Ασφάλειες', '🛡️', 'expense'], ['Διάφορα', '📦', 'expense'],
  ['Μισθός', '💼', 'income'], ['Σύνταξη', '👴', 'income'], ['Ενοίκια', '🔑', 'income'], ['Άλλα έσοδα', '💶', 'income']
];
const PALETTE = ['#0f766e', '#ca8a04', '#2563eb', '#16a34a', '#db2777', '#7c3aed', '#ea580c', '#b91c1c', '#0891b2', '#65a30d', '#9333ea', '#475569'];

// ======================= βοηθητικά =======================
const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eurFmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const eur0Fmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int0 = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 0 });
const eur = n => eurFmt.format(n || 0);
const eur0 = n => eur0Fmt.format(n || 0);
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function shiftDay(str, days) { const d = new Date(str + 'T12:00:00'); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
const yOf = t => +t.date.slice(0, 4);
const mOf = t => +t.date.slice(5, 7);
function dateLabel(t) {
  const y = yOf(t), m = mOf(t);
  if (t.dayKnown === false) return `${MONTHS[m - 1]} ${y}`;
  const d = new Date(t.date + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS_SHORT[m - 1]} ${y}`;
}

// Ποσό: δέχεται «45,50», «1.234,56» και αθροίσματα όπως «50+39+12,5»
function parseAmount(raw) {
  let s = String(raw || '').replace(/€/g, '').replace(/\s+/g, '');
  if (!s) return null;
  if (s.includes(',')) { if (s.includes('.')) s = s.replace(/\./g, ''); s = s.replace(/,/g, '.'); }
  if (!/^[0-9+\-*/().]+$/.test(s)) return NaN;
  const toks = s.match(/\d+(?:\.\d+)?|\.\d+|[-+*/()]/g);
  if (!toks || toks.join('') !== s) return NaN;
  let i = 0;
  const peek = () => toks[i];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = toks[i++]; const t = term(); v = op === '+' ? v + t : v - t; } return v; }
  function term() { let v = factor(); while (peek() === '*' || peek() === '/') { const op = toks[i++]; const f = factor(); v = op === '*' ? v * f : v / f; } return v; }
  function factor() {
    const t = toks[i++];
    if (t === undefined) throw new Error('end');
    if (t === '-') return -factor();
    if (t === '+') return factor();
    if (t === '(') { const v = expr(); if (toks[i++] !== ')') throw new Error(')'); return v; }
    const n = parseFloat(t); if (isNaN(n)) throw new Error('num'); return n;
  }
  try { const v = expr(); if (i !== toks.length || !isFinite(v)) return NaN; return round2(v); } catch { return NaN; }
}
const isFormula = raw => /[-+*/]/.test(String(raw || '').replace(/^\s*-/, ''));

// ======================= αποθήκευση =======================
const store = window.homeflow ? {
  native: true,
  load: () => window.homeflow.load(),
  save: text => window.homeflow.save(text)
} : {
  native: false,
  load: async () => { try { const s = localStorage.getItem('homeflow-data'); return { data: s ? JSON.parse(s) : null, path: 'browser' }; } catch { return { data: null }; } },
  save: async text => { try { localStorage.setItem('homeflow-data', text); } catch { } return { ok: true }; }
};

let DB = null;
let saveChain = Promise.resolve();
function persist() {
  DB.savedAt = new Date().toISOString();
  const text = JSON.stringify(DB);
  setSaveState('saving');
  saveChain = saveChain.then(() => store.save(text)).then(() => { setSaveState('ok'); return refreshBackup(); }).catch(e => { console.error(e); setSaveState('error'); });
  return saveChain;
}
function setSaveState(s) {
  const el = $('#save-state');
  if (!el) return;
  const b = ui.backup || {};
  const extra = b.cloud && b.cloud.last ? ' · ☁️' : '';
  el.textContent = s === 'saving' ? 'Αποθήκευση…' : s === 'error' ? '⚠ Πρόβλημα στην αποθήκευση!' : '✓ Όλα αποθηκευμένα' + extra;
  el.style.color = s === 'error' ? 'var(--exp)' : '';
}

function defaultData() {
  return {
    app: 'HomeFlow', version: 1,
    settings: { persons: [], methods: ['Μετρητά', 'Τράπεζα', 'Κάρτα'], fontScale: 1.15 },
    categories: DEFAULT_CATEGORIES.map(([name, icon, type], i) => ({ id: 'c' + uid(), name, icon, type, color: PALETTE[i % PALETTE.length], budget: null, extra: false, archived: false, order: i })),
    transactions: [],
    recurring: [],
    tenants: [],
    accounts: [],
    taxes: [],
    people: [],
    cars: [],
    history: {}
  };
}
function normalize(d) {
  d.settings = Object.assign({ persons: [], methods: ['Μετρητά', 'Τράπεζα', 'Κάρτα'], fontScale: 1.15 }, d.settings || {});
  d.categories = (d.categories || []).map((c, i) => Object.assign({ color: PALETTE[i % PALETTE.length], budget: null, extra: false, archived: false, order: i }, c));
  d.transactions = (d.transactions || []).filter(t => t && t.date && t.categoryId).map(t => Object.assign({ note: '', person: '', method: '', planned: false, dayKnown: true, tenantId: '', recurringId: '' }, t, { amount: +t.amount || 0 }));
  d.recurring = (d.recurring || []).map(r => Object.assign({ every: 1, day: 1, note: '', person: '', method: '', active: true, skip: [], until: '', total: null }, r));
  d.tenants = (d.tenants || []).map(t => Object.assign({ property: '', rents: [], opening: 0, end: '', dueDay: 1, note: '', active: true, share: 100 }, t));
  d.accounts = (d.accounts || []).map((a, i) => Object.assign({ bank: '', name: '', owner: '', currency: 'EUR', kind: 'current', archived: false, order: i, history: [] }, a));
  d.settings.usdPerEur = +d.settings.usdPerEur || 1.16;
  d.taxes = (d.taxes || []).map(t => Object.assign({ name: '', person: '', kind: 'other', installments: [] }, t));
  d.people = (d.people || []).map(p => Object.assign({ name: '', note: '', entries: [] }, p));
  d.cars = (d.cars || []).map(c => Object.assign({ name: '', since: '', fuelCategoryId: '', sold: '', kteo: '', km: [], services: [] }, c));
  d.field = Object.assign({ waterings: [], payments: [], categoryId: '' }, d.field || {});
  if (d.power) d.power.bills = d.power.bills || [];
  d.history = d.history || {};
  return d;
}

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
        recurringId: r.id, tenantId: '', source: 'recurring', created: new Date().toISOString()
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

// ======================= σελίδες =======================
function render() {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === ui.page));
  const page = $('#page');
  if (!DB) { page.innerHTML = welcomePage(); return; }
  if (locked) { page.innerHTML = ''; renderLock(); return; }
  const fn = { home: homePage, list: listPage, rent: rentPage, money: moneyPage, recurring: recurringPage, tax: taxPage, people: peoplePage, cars: carsPage, field: fieldPage, year: yearPage, history: historyPage, settings: settingsPage }[ui.page];
  page.innerHTML = fn();
  if (ui.page === 'list') { const q = $('#f-q'); if (q && ui._focusSearch) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); ui._focusSearch = false; } }
}

function welcomePage() {
  return `
  <div class="page-head"><h1>Καλώς ήρθατε στο HomeFlow</h1></div>
  <div class="panel" style="max-width:46rem">
    <p style="font-size:1.15rem;margin-top:0">Εδώ θα γράφετε τα έσοδα και τα έξοδα του σπιτιού. Πώς θέλετε να ξεκινήσετε;</p>
    <div style="display:flex;flex-direction:column;gap:.8rem">
      <button class="btn big primary" data-action="welcome-import">📂 Άνοιγμα αρχείου HomeFlow (τα στοιχεία από το Excel)</button>
      <button class="btn big" data-action="welcome-fresh">✨ Ξεκινάω από την αρχή</button>
    </div>
  </div>`;
}

// ---------- Ο μήνας ----------
function homePage() {
  const { year, month } = ui;
  const exp = txIn(year, month, { type: 'expense' });
  const inc = txIn(year, month, { type: 'income' });
  const plannedTx = txIn(year, month, { planned: true }).sort((a, b) => a.type.localeCompare(b.type) || b.amount - a.amount);
  const tE = sum(exp), tI = sum(inc), bal = round2(tI - tE);
  // από αρχή έτους
  let ytdE = 0, ytdI = 0;
  for (const t of DB.transactions) if (yOf(t) === year && mOf(t) <= month && !t.planned) { if (t.type === 'expense') ytdE += t.amount; else ytdI += t.amount; }
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  const byCat = {};
  for (const t of exp) byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount;
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  const bars = rows.map(([cid, v]) => {
    const c = catById(cid) || {};
    const pct = tE ? Math.round(v / tE * 100) : 0;
    return `<button class="bar-row" data-action="goto-list" data-cat="${esc(cid)}" data-type="expense">
      <span class="ic">${esc(c.icon || '❔')}</span>
      <span><span class="nm">${esc(c.name || '')}</span><div class="track"><div class="fill" style="width:${Math.max(2, v / max * 100)}%;background:${esc(c.color || '#888')}"></div></div></span>
      <span class="amt num">${eur(v)}<small>${pct}%</small></span></button>`;
  }).join('');

  const recent = [...exp, ...inc].sort((a, b) => (b.created || '').localeCompare(a.created || '') || b.date.localeCompare(a.date)).slice(0, 8);

  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Καλημέρα' : hr < 18 ? 'Καλό απόγευμα' : 'Καλησπέρα';
  const who = (DB.settings.persons || [])[0] || '';
  const voc = who.replace(/ος$/, 'ο').replace(/ης$/, 'η').replace(/ας$/, 'α');
  const msg = !tI && !tE ? (isCurrent ? 'Δεν έχει γραφτεί τίποτα αυτόν τον μήνα ακόμα.' : 'Δεν υπάρχουν κινήσεις αυτόν τον μήνα.')
    : bal < 0 ? `${isCurrent ? 'Αυτόν τον μήνα' : 'Εκείνο τον μήνα'} βγήκαν περισσότερα απ’ όσα μπήκαν.` : `${isCurrent ? 'Αυτόν τον μήνα' : 'Εκείνο τον μήνα'} έμειναν ${eur(bal)}.`;
  const tot = Math.max(tI, tE) || 1;
  return `
  <div class="hero">
    <h1>${MONTHS[month - 1]} <span class="yr">${year}</span></h1>
    <div class="spacer"></div>
    ${isCurrent ? '' : '<button class="btn no-print" data-action="month-today">Σήμερα</button>'}
    <button class="btn no-print" data-action="print" title="Εκτύπωση">🖨️</button>
    <div class="month-nav no-print">
      <button class="btn" data-action="month-prev" title="Προηγούμενος μήνας">‹</button>
      <button class="btn" data-action="month-next" title="Επόμενος μήνας">›</button>
    </div>
  </div>
  <div class="greet">${isCurrent ? `${hello}${voc ? ', ' + esc(voc) : ''}. ` : ''}${msg}</div>

  <div class="scale">
    <div><div class="k">Μπήκαν</div><div class="v inc num">${eur(tI)}</div><div class="s">από αρχή χρονιάς <b class="num">${eur(ytdI)}</b></div></div>
    <div><div class="k">Βγήκαν</div><div class="v exp num">${eur(tE)}</div><div class="s">από αρχή χρονιάς <b class="num">${eur(ytdE)}</b></div></div>
    <div><div class="k">Έμειναν</div><div class="v num" style="color:${bal < 0 ? 'var(--exp)' : 'var(--ink)'}">${bal < 0 ? '−' + eur(-bal) : eur(bal)}</div><div class="s">από αρχή χρονιάς <b class="num">${eur(ytdI - ytdE)}</b></div></div>
    ${tI || tE ? `<div class="meter" title="Πράσινο: μπήκαν · Κόκκινο: βγήκαν"><i style="flex:${tI / tot};background:var(--inc)"></i><i style="flex:${tE / tot};background:var(--exp)"></i></div>` : ''}
  </div>

  ${homeTabs()}`;

  function homeTabs() {
    const rem = isCurrent ? reminders() : [];
    const s = ymOf(year, month);
    const rentTs = DB.tenants.filter(t => tenantActiveIn(t, s));
    const rentOpen = rentTs.filter(t => tenantMonthStatus(t, s).cls !== 'ok').length;
    const items = [
      { k: 'spent', icon: '📊', label: 'Πού πήγαν' },
      ...(isCurrent ? [{ k: 'remind', icon: '🔔', label: 'Να θυμηθώ', count: rem.length, alert: rem.some(r => r.cls === 'late') }] : []),
      ...(rentTs.length ? [{ k: 'rent', icon: '🔑', label: 'Ενοίκια', count: rentOpen, alert: rentOpen > 0 }] : []),
      { k: 'planned', icon: '📌', label: 'Προγραμματισμένα', count: plannedTx.length },
      { k: 'recent', icon: '🕘', label: 'Τελευταίες' }
    ];
    const [tab, bar] = tabBar('home', items, 'spent');
    let body = '';
    if (tab === 'spent') body = `<div class="panel"><h2>Πού πήγαν τα χρήματα</h2>${bars ? '<div class="h-hint">Πατήστε μια κατηγορία για να δείτε τι περιέχει.</div>' : ''}${bars || '<div class="empty">Δεν υπάρχουν έξοδα αυτόν τον μήνα ακόμα.</div>'}</div>`;
    else if (tab === 'remind') body = remindersPanel() || '<div class="panel empty">Τίποτα να θυμηθείτε αυτή τη στιγμή ✓</div>';
    else if (tab === 'rent') body = homeRentPanel(s);
    else if (tab === 'planned') body = plannedTx.length ? `<div class="panel">
        <h2>📌 Προγραμματισμένα</h2>
        <div class="h-hint">Πληρωμές που περιμένουμε. Πατήστε «Έγινε» όταν γίνουν.</div>
        ${plannedTx.map(t => `<div class="planned-row">
          <span class="p-ic">${esc(catIcon(t.categoryId))}</span>
          <span class="p-nm"><b>${esc(catName(t.categoryId))}</b>${t.recurringId ? ' <span class="tag">🔁 πάγιο</span>' : ''}${t.note ? `<div class="muted" style="font-size:.9rem">${esc(t.note)}</div>` : ''}</span>
          <span class="p-amt num ${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</span>
          <span class="p-act"><button class="btn small" data-action="edit" data-id="${t.id}">✎ Αλλαγή</button><button class="btn small primary" data-action="confirm-planned" data-id="${t.id}">✓ Έγινε</button></span>
        </div>`).join('')}</div>` : '<div class="panel empty">Δεν υπάρχουν προγραμματισμένα αυτόν τον μήνα.</div>';
    else body = `<div class="panel"><h2>Τελευταίες καταχωρήσεις</h2>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>
          <button class="btn" style="margin-top:.6rem;width:100%" data-action="goto-list">Όλες οι κινήσεις του μήνα →</button>` : '<div class="empty">Τίποτα ακόμα. Πατήστε «Νέο έξοδο» αριστερά.</div>'}</div>`;
    return bar + body;
  }
}

function txRow(t) {
  const sign = t.type === 'income' ? '+' : '−';
  const tn = t.tenantId && tenantById(t.tenantId);
  const sub = [dateLabel(t), tn ? '🔑 ' + tn.name : '', t.person, t.method].filter(Boolean).map(esc).join(' · ');
  return `<button class="tx" data-action="edit" data-id="${t.id}">
    <span class="ic">${esc(catIcon(t.categoryId))}</span>
    <span><div class="t1">${esc(catName(t.categoryId))}${t.note ? ` <span class="muted" style="font-weight:500">— ${esc(t.note)}</span>` : ''}${t.planned ? '<span class="tag planned">προγραμματισμένο</span>' : ''}</div><div class="t2">${sub}</div></span>
    <span class="amt num ${t.type === 'income' ? 'inc' : 'exp'}">${sign} ${eur(t.amount)}</span></button>`;
}

// ---------- Κινήσεις ----------
function filteredList() {
  const f = ui.list;
  const q = f.q.trim().toLowerCase();
  return DB.transactions.filter(t => {
    if (f.year && yOf(t) !== f.year) return false;
    if (f.month && mOf(t) !== f.month) return false;
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.cat && t.categoryId !== f.cat) return false;
    if (q) {
      const hay = [catName(t.categoryId), t.note, t.person, t.method, t.tenantId && tenantById(t.tenantId) ? tenantById(t.tenantId).name : '', numFmt.format(t.amount), String(t.amount)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || (b.created || '').localeCompare(a.created || ''));
}
function listPage() {
  const f = ui.list;
  const years = [...new Set([...yearsWithTx(), now.getFullYear()])].sort((a, b) => b - a);
  const rows = filteredList();
  const real = rows.filter(t => !t.planned);
  const tE = sum(real.filter(t => t.type === 'expense')), tI = sum(real.filter(t => t.type === 'income'));
  const cats = DB.categories.filter(c => f.type === 'all' || c.type === f.type).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'el'));
  const shown = rows.slice(0, f.limit);
  return `
  <div class="page-head"><h1>Κινήσεις</h1><div class="spacer"></div>
    <button class="btn no-print" data-action="export-csv">📊 Αποθήκευση για Excel</button>
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button></div>
  ${(() => { ui.tabs.list = f.type; return tabBar('list', [{ k: 'all', icon: '📋', label: 'Όλες' }, { k: 'expense', icon: '−', label: 'Έξοδα' }, { k: 'income', icon: '+', label: 'Έσοδα' }], 'all')[1]; })()}
  <div class="filters no-print">
    <select id="f-year" title="Χρονιά">${years.map(y => `<option value="${y}" ${y === f.year ? 'selected' : ''}>${y}</option>`).join('')}<option value="0" ${!f.year ? 'selected' : ''}>Όλες οι χρονιές</option></select>
    <select id="f-month" title="Μήνας"><option value="0">Όλοι οι μήνες</option>${MONTHS.map((m, i) => `<option value="${i + 1}" ${f.month === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
    <select id="f-cat"><option value="">Όλες οι κατηγορίες</option>${cats.map(c => `<option value="${esc(c.id)}" ${f.cat === c.id ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`).join('')}</select>
    <input type="search" id="f-q" placeholder="🔍 Αναζήτηση (π.χ. λαϊκή, 50)" value="${esc(f.q)}">
    ${(f.cat || f.q || f.type !== 'all' || f.month) ? '<button class="btn ghost" data-action="clear-filters">✕ Καθαρισμός</button>' : ''}
  </div>
  <div class="cards">
    <div class="card inc"><div class="label">Έσοδα</div><div class="value inc num">${eur(tI)}</div></div>
    <div class="card exp"><div class="label">Έξοδα</div><div class="value exp num">${eur(tE)}</div></div>
    <div class="card bal"><div class="label">Κινήσεις που βρέθηκαν</div><div class="value num">${int0.format(rows.length)}</div></div>
  </div>
  ${rows.length ? `<div class="sheet-wrap"><table class="data">
    <thead><tr><th>Ημερομηνία</th><th>Κατηγορία</th><th>Σημείωση</th><th>Ποιος</th><th>Τρόπος</th><th class="r">Ποσό</th></tr></thead>
    <tbody>${shown.map(t => `<tr data-action="edit" data-id="${t.id}">
      <td>${esc(dateLabel(t))}</td>
      <td><span style="font-size:1.2rem">${esc(catIcon(t.categoryId))}</span> ${esc(catName(t.categoryId))}</td>
      <td>${esc(t.note)}${t.planned ? '<span class="tag planned">προγραμματισμένο</span>' : ''}</td>
      <td>${esc(t.tenantId && tenantById(t.tenantId) ? '🔑 ' + tenantById(t.tenantId).name : t.person)}</td><td>${esc(t.method)}</td>
      <td class="r num ${t.type === 'income' ? 'inc' : 'exp'}" style="font-weight:700">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</td></tr>`).join('')}</tbody>
  </table></div>
  ${rows.length > shown.length ? `<div style="text-align:center;margin-top:1rem"><button class="btn" data-action="more">Δείτε περισσότερες (${rows.length - shown.length} ακόμα)</button></div>` : ''}`
    : '<div class="panel empty">Δεν βρέθηκαν κινήσεις με αυτά τα φίλτρα.</div>'}`;
}

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
  let expect = 0, got = 0, owed = 0;
  for (const t of active) { if (tenantActiveIn(t, s)) { const st = tenantMonthStatus(t, s); expect += st.due; got += st.paid; } }
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
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button></div>
  ${DB.tenants.length ? `
  <div class="cards">
    <div class="card bal"><div class="label">Ενοίκια ${MONTHS[+s.slice(5) - 1]}</div><div class="value num">${eur(expect)}</div><div class="sub">όσα πρέπει να μπουν αυτόν τον μήνα</div></div>
    <div class="card inc"><div class="label">Πληρώθηκαν ως τώρα</div><div class="value inc num">${eur(got)}</div><div class="sub">μέσα σε αυτόν τον μήνα</div></div>
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
      (() => { const pc = DB.power ? DB.power.bills.filter(b => (b.metered.who && !b.metered.paid) || (b.rest.tenant && !b.rest.paid)).length : 0; return { k: 'power', icon: '⚡', label: DB.power ? DB.power.name : 'ΔΕΗ ισογείου', count: pc, alert: pc > 0 }; })()
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
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button>
  </div>
  <div class="cards">
    <div class="card ${led.balance > 0.005 ? 'exp' : 'inc'}"><div class="label">Σήμερα</div><div class="value num" style="font-size:1.6rem;margin-top:.4rem">${balanceText(led.balance)}</div></div>
    <div class="card bal"><div class="label">Ενοίκιο</div><div class="value num">${eur(currentRent(t))}</div><div class="sub">${esc(t.property || '')}${t.dueDay ? ` · πληρώνει στις ${t.dueDay} του μήνα` : ''}${shareOf(t) !== 100 ? `<br>Δικό μας το ${shareOf(t)}%: <b>${eur(currentRent(t) * shareOf(t) / 100)}</b>` : ''}</div></div>
    <div class="card"><div class="label">Από</div><div class="value" style="font-size:1.6rem">${ymLabel(t.start)}</div><div class="sub">${t.end ? 'Έφυγε: ' + ymLabel(t.end) : ''}${t.opening ? `${t.end ? ' · ' : ''}Παλιό υπόλοιπο: ${eur(t.opening)}` : ''}</div></div>
  </div>
  ${t.note ? `<div class="notice">${esc(t.note)}</div>` : ''}
  <div class="sheet-wrap"><table class="data">
    <thead><tr><th>Μήνας</th><th class="r">Ενοίκιο</th><th class="r">Πλήρωσε</th><th>Πότε</th><th>Κατάσταση</th><th class="r">Χρωστάει</th></tr></thead>
    <tbody>${rows.map(r => { const st = tenantMonthStatus(t, r.s); return `<tr style="cursor:default">
      <td><b>${ymLabel(r.s)}</b></td>
      <td class="r num">${eur(r.due)}</td>
      <td class="r num inc">${r.paid ? eur(r.paid) : '<span class="muted">—</span>'}</td>
      <td>${r.pays.map(p => `<button class="chip" style="min-height:2.1rem;padding:.1rem .7rem;margin:.1rem" data-action="edit" data-id="${p.id}">${p.dayKnown === false ? '' : `${new Date(p.date + 'T12:00').getDate()}/${+p.date.slice(5, 7)} · `}${eur(paidOf(p))}</button>`).join('')}</td>
      <td>${statusChip(st)}</td>
      <td class="r num ${r.bal > 0.005 ? 'exp' : 'inc'}"><b>${r.bal < -0.005 ? '−' + eur(-r.bal) : eur(r.bal)}</b></td></tr>`; }).join('')}
      ${t.opening ? `<tr style="cursor:default"><td class="muted">Πριν τον ${ymLabel(t.start)}</td><td colspan="4" class="muted">Παλιό υπόλοιπο</td><td class="r num"><b>${eur(t.opening)}</b></td></tr>` : ''}
    </tbody></table></div>
  ${led.later.length ? `<p class="muted">Υπάρχουν και ${led.later.length} πληρωμές με μελλοντική ημερομηνία, που έχουν αφαιρεθεί ήδη από την οφειλή.</p>` : ''}`;
}

// ---------- Χρήματα (λογαριασμοί) ----------
const KINDS = [
  ['current', 'Τρεχούμενοι λογαριασμοί', '🏦'], ['deposit', 'Προθεσμιακές', '🔒'], ['abroad', 'Λογαριασμοί στο εξωτερικό', '🌍'],
  ['funds', 'Αμοιβαία κεφάλαια', '📊'], ['stocks', 'Μετοχές', '📈'], ['cash', 'Μετρητά', '💵'], ['other', 'Άλλα', '📦']
];
const kindLabel = k => (KINDS.find(x => x[0] === k) || KINDS[KINDS.length - 1]);
const curSym = c => (c === 'USD' ? '$' : '€');
const usdFmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n, c) => (c === 'USD' ? usdFmt.format(n || 0) : eur(n));
const usd0Fmt = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const lastBal = a => (a.history.length ? a.history[a.history.length - 1] : null);
function balAt(a, date) { let b = null; for (const h of a.history) if (h.date <= date) b = h.balance; return b; }
const toEur = (n, c) => (c === 'USD' ? n / (DB.settings.usdPerEur || 1.16) : n);
function shortDate(d) { const x = new Date(d + 'T12:00'); return `${x.getDate()} ${MONTHS_SHORT[x.getMonth()]} ${x.getFullYear()}`; }
function moneyTotals(date) {
  const t = { EUR: 0, USD: 0 };
  for (const a of DB.accounts) { if (a.archived) continue; const b = date ? balAt(a, date) : (lastBal(a) || {}).balance; if (b != null) t[a.currency] += b; }
  t.all = t.EUR + toEur(t.USD, 'USD');
  return t;
}
function moneyChart() {
  // σύνολο σε € στο τέλος κάθε μήνα (τελευταίοι 12 μήνες με στοιχεία)
  const dates = DB.accounts.flatMap(a => a.history.map(h => h.date)).sort();
  if (!dates.length) return '';
  const pts = [];
  let s = dates[0].slice(0, 7);
  const end = curYM();
  for (let g = 0; s <= end && g < 240; s = addMonths(s, 1), g++) pts.push({ s, v: moneyTotals(`${s}-${pad(lastDay(s))}`).all });
  const show = pts.slice(-12);
  const W = 1000, H = 260, L = 70, B = 34, T = 14;
  const max = Math.max(1, ...show.map(p => p.v));
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / show.length;
  let svg = '';
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  show.forEach((p, k) => {
    const x = L + k * gw + gw * 0.18, bw = gw * 0.64;
    svg += `<rect x="${x}" y="${y(p.v)}" width="${bw}" height="${y(0) - y(p.v)}" rx="4" style="fill:var(--brand)"><title>${ymLabel(p.s)}: ${eur0(p.v)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="14" style="fill:var(--ink-2)">${MONTHS_SHORT[+p.s.slice(5) - 1]}${p.s.slice(5) === '01' ? " '" + p.s.slice(2, 4) : ''}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${svg}</svg>`;
}
function moneyPage() {
  const t = moneyTotals();
  const rate = DB.settings.usdPerEur || 1.16;
  const accs = DB.accounts.filter(a => !a.archived);
  const closed = DB.accounts.filter(a => a.archived);
  const lastUpd = accs.map(a => (lastBal(a) || {}).date).filter(Boolean).sort().pop();
  const yearStart = `${now.getFullYear()}-01-01`;
  const t0 = moneyTotals(yearStart);
  const byBank = {};
  for (const a of accs) { const b = (lastBal(a) || {}).balance || 0; const k = a.bank || kindLabel(a.kind)[1]; byBank[k] = (byBank[k] || 0) + toEur(b, a.currency); }
  const row = a => {
    const lb = lastBal(a);
    const prev = a.history.length > 1 ? a.history[a.history.length - 2] : null;
    const diff = lb && prev ? lb.balance - prev.balance : 0;
    return `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto auto">
      <span class="ic">${kindLabel(a.kind)[2]}</span>
      <span><div class="t1">${a.bank ? esc(a.bank) + ' · ' : ''}${esc(a.name)}</div>
        <div class="t2">${esc(a.owner || '')}${lb ? `${a.owner ? ' · ' : ''}ενημ. ${shortDate(lb.date)}` : ''}${prev && Math.abs(diff) > 0.005 ? ` · <span class="${diff < 0 ? 'exp' : 'inc'}">${diff > 0 ? '+' : '−'}${money(Math.abs(diff), a.currency)}</span> από πριν` : ''}</div></span>
      <span class="amt num">${lb ? money(lb.balance, a.currency) : '—'}</span>
      <span style="display:flex;gap:.4rem"><button class="btn small primary" data-action="acc-update" data-id="${a.id}">✎ Νέο υπόλοιπο</button><button class="btn small ghost" data-action="acc-edit" data-id="${a.id}" title="Στοιχεία λογαριασμού">⚙</button></span>
    </div>`;
  };
  const groupTabs = [];
  const groupHtml = {};
  KINDS.forEach(([k, label, icon]) => {
    const list = accs.filter(a => a.kind === k).sort((x, y) => (x.bank || '').localeCompare(y.bank || '', 'el') || x.order - y.order);
    if (!list.length) return;
    groupTabs.push({ k, icon, label: label.replace('Τρεχούμενοι λογαριασμοί', 'Τρεχούμενοι').replace('Λογαριασμοί στο εξωτερικό', 'Εξωτερικό').replace('Αμοιβαία κεφάλαια', 'Αμοιβαία'), count: list.length });
    const sub = { EUR: 0, USD: 0 };
    for (const a of list) sub[a.currency] += (lastBal(a) || {}).balance || 0;
    groupHtml[k] = `<div class="panel"><h2>${icon} ${label} <span class="muted">${[sub.EUR ? eur(sub.EUR) : '', sub.USD ? usdFmt.format(sub.USD) : ''].filter(Boolean).join(' + ')}</span></h2><div class="tx-list">${list.map(row).join('')}</div></div>`;
  });
  const [mtab, mbar] = tabBar('money', [{ k: 'summary', icon: '📊', label: 'Σύνοψη' }, ...groupTabs, ...(closed.length ? [{ k: 'closed', icon: '🗄', label: 'Κλειστοί', count: closed.length }] : [])], 'summary');
  const diffYear = t.all - t0.all;
  return `
  <div class="page-head"><h1>Χρήματα</h1><div class="spacer"></div>
    <button class="btn primary no-print" data-action="acc-new">+ Νέος λογαριασμός</button>
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button></div>
  ${accs.length ? `
  <div class="cards">
    <div class="card bal"><div class="label">Όλα μαζί σε ευρώ</div><div class="value num">${eur0(t.all)}</div><div class="sub">${t0.all ? `Από 1 Ιανουαρίου: <b class="${diffYear < 0 ? 'exp' : 'inc'}">${diffYear >= 0 ? '+' : '−'}${eur0(Math.abs(diffYear))}</b>` : ''}</div></div>
    <div class="card"><div class="label">Σε ευρώ</div><div class="value num">${eur0(t.EUR)}</div></div>
    <div class="card"><div class="label">Σε δολάρια</div><div class="value num">${usd0Fmt.format(t.USD)}</div>
      <div class="sub">Ισοτιμία: 1 € = ${String(rate).replace('.', ',')} $ <button class="btn small ghost no-print" data-action="rate-edit">✎ αλλαγή</button></div></div>
  </div>
  ${lastUpd ? `<div class="h-hint" style="margin:-.6rem 0 1rem">Τελευταία ενημέρωση υπολοίπου: ${shortDate(lastUpd)}. Για να γράψετε νέο υπόλοιπο, ανοίξτε την καρτέλα του λογαριασμού (π.χ. «Τρεχούμενοι») και πατήστε «✎ Νέο υπόλοιπο».</div>` : ''}
  ${mbar}
  ${mtab === 'summary' ? `<div class="panel"><h2>Όλα μαζί, μήνα με μήνα (σε €)</h2>${moneyChart()}</div>
  <div class="panel"><h2>Ανά τράπεζα (σε €)</h2>
      <div class="bars">${Object.entries(byBank).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar-row" style="cursor:default"><span class="ic">🏦</span><span><span class="nm">${esc(k)}</span><div class="track"><div class="fill" style="width:${Math.max(2, v / Math.max(...Object.values(byBank)) * 100)}%;background:var(--brand)"></div></div></span><span class="amt num">${eur0(v)}</span></div>`).join('')}</div></div>` : ''}
  ${groupHtml[mtab] || ''}
  ${mtab === 'closed' && closed.length ? `<div class="panel"><h2>🗄 Κλειστοί λογαριασμοί</h2><div class="tx-list">${closed.map(a => `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto"><span class="ic">🗄</span><span><div class="t1">${esc(a.bank)} · ${esc(a.name)}</div></span><button class="btn small" data-action="acc-edit" data-id="${a.id}">⚙</button></div>`).join('')}</div></div>` : ''}`
    : `<div class="panel" style="max-width:46rem"><p style="font-size:1.1rem;margin-top:0">Εδώ βλέπετε όλα τα χρήματα μαζί: λογαριασμούς, προθεσμιακές, μετρητά.</p><button class="btn big primary" style="width:auto;padding:0 2rem" data-action="acc-new">+ Νέος λογαριασμός</button></div>`}`;
}

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
  return out.sort((a, b) => a.sort - b.sort);
}
function remindersPanel() {
  const r = reminders();
  if (!r.length) return '';
  return `<div class="panel"><h2>🔔 Να θυμηθώ</h2>
    ${r.map(x => `<div class="planned-row"><span class="p-ic">${x.icon}</span><span class="p-nm">${x.text}<div style="font-size:.9rem" class="${x.cls === 'late' ? 'exp' : 'muted'}">${x.sub}</div></span><span class="p-amt"></span><span class="p-act">${x.btn}</span></div>`).join('')}
  </div>`;
}

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
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button>
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
      <button class="btn no-print" data-action="print">🖨️</button></div>
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
      <button class="btn" data-action="person-open" data-id="${p.id}">📒 Καρτέλα</button></div></div>`; }).join('')}</div>` : '<div class="panel empty">Κανένα πρόσωπο ακόμα.</div>'}`;
}

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
      <button class="btn no-print" data-action="print">🖨️</button></div>
    ${(() => { const [t, b] = tabBar('car', [{ k: 'service', icon: '🔧', label: 'Σέρβις και επισκευές', count: sv.length }, { k: 'km', icon: '📍', label: 'Χιλιόμετρα', count: log.length }], 'service'); ui._carTab = t; return b; })()}
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

// ---------- Ενοίκια: για τη φορολογική δήλωση ----------
function declRows(year) {
  const out = [];
  for (const t of DB.tenants) {
    let months = 0, contract = 0; const rents = new Set();
    for (let m = 1; m <= 12; m++) { const s = ymOf(year, m); if (tenantActiveIn(t, s)) { const r = tenantRent(t, s); if (r) { months++; contract += r; rents.add(r); } } }
    const received = sumPaid(tenantPayments(t).filter(p => yOf(p) === year));
    if (!months && !received) continue;
    const sh = shareOf(t);
    out.push({ t, months, rents: [...rents], contract: round2(contract), received, share: sh, ours: round2(contract * sh / 100), oursRec: round2(received * sh / 100) });
  }
  return out;
}
function declPanel() {
  const year = ui.declYear || now.getFullYear();
  const rows = declRows(year);
  const tot = k => round2(rows.reduce((a, r) => a + r[k], 0));
  return `<div class="panel">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.8rem">
      <h2 style="margin:0">🧾 Ενοίκια για τη δήλωση</h2><div class="spacer"></div>
      <div class="month-nav"><button class="btn no-print" data-action="decl-prev">◀</button><div class="month-title" style="min-width:6rem">${year}</div><button class="btn no-print" data-action="decl-next">▶</button></div>
    </div>
    ${rows.length ? `<div class="sheet-wrap"><table class="data">
      <thead><tr><th>Ενοικιαστής</th><th class="r">Ενοίκιο × μήνες</th><th class="r">Ενοίκια χρονιάς</th><th class="r">Δικό μας</th><th class="r">Εισπράχθηκαν</th></tr></thead>
      <tbody>${rows.map(r => `<tr style="cursor:default">
        <td><b>${esc(r.t.name)}</b><div class="muted" style="font-size:.9rem">${esc(r.t.property || '')}</div></td>
        <td class="r num">${r.months ? `${r.rents.map(x => eur(x)).join(' → <br>')} × ${r.months}` : '<span class="muted">δεν ήταν νοικιασμένο</span>'}</td>
        <td class="r num">${eur(r.contract)}</td>
        <td class="r num"><b>${eur(r.ours)}</b>${r.share !== 100 ? `<div class="muted" style="font-size:.9rem">το ${r.share}%</div>` : ''}</td>
        <td class="r num ${r.received + 0.005 < r.contract ? 'exp' : 'inc'}">${eur(r.received)}</td></tr>`).join('')}
        <tr style="cursor:default;border-top:3px solid var(--line)"><td><b>Σύνολο</b></td><td></td><td class="r num"><b>${eur(tot('contract'))}</b></td><td class="r num" style="font-size:1.2rem"><b>${eur(tot('ours'))}</b></td><td class="r num"><b>${eur(tot('received'))}</b></td></tr>
      </tbody></table></div>
      <p class="muted" style="margin-bottom:0">«Ενοίκια χρονιάς» = ενοίκιο × μήνες που ήταν νοικιασμένο, όπως το υπολογίζατε στο Excel. «Δικό μας ποσό» είναι αυτό που αναλογεί σε εμάς με το ποσοστό. Η τελευταία στήλη δείχνει τι πληρώθηκε πραγματικά μέσα στη χρονιά (κόκκινο αν πληρώθηκαν λιγότερα).</p>`
    : `<div class="empty">Δεν υπάρχουν ενοίκια για το ${year}.</div>`}
  </div>`;
}

// ---------- ΔΕΗ ισογείου: μοίρασμα λογαριασμού με υπομετρητή ----------
function powerCfg() {
  if (!DB.power) DB.power = { name: 'ΔΕΗ ισογείου', totalM2: 180, meteredM2: 65.36, meteredTenantId: '', meteredName: 'Πίσω (με υπομετρητή)', restTenantId: '', restName: 'Διαμέρισμα', georgeShare: 50, lastReading: null, bills: [] };
  return DB.power;
}
const pwWho = (tid, fallback) => { const t = tid && tenantById(tid); return t ? t.name : fallback; };
function powerCalc(c, x) {
  const kwh = +x.kwh || 0, energy = +x.energy || 0, fees = +x.fees || 0;
  const sub = x.r1 != null && x.r0 != null ? round2(x.r1 - x.r0) : 0;
  const total = round2(energy + fees);
  const perKwh = kwh ? energy / kwh : 0;
  const mEnergy = round2(sub * perKwh), mFees = round2(c.totalM2 ? fees * c.meteredM2 / c.totalM2 : 0);
  const metered = round2(mEnergy + mFees);
  return { kwh, energy, fees, total, sub, perKwh, mEnergy, mFees, metered, rest: round2(total - metered) };
}
function powerPanel() {
  const c = powerCfg();
  const bills = c.bills.slice().sort((a, b) => b.to.localeCompare(a.to));
  const owed = bills.reduce((a, b) => a + (b.metered.who && !b.metered.paid ? b.metered.amount : 0) + (b.rest.tenant && !b.rest.paid ? b.rest.amount : 0), 0);
  const row = b => `<tr style="cursor:default">
    <td><b>${shortDate(b.from)} – ${shortDate(b.to)}</b><div class="muted" style="font-size:.9rem">${int0.format(b.kwh)} kWh · υπομετρητής ${int0.format(b.sub)} kWh</div></td>
    <td class="r num"><b>${eur(b.total)}</b></td>
    <td>${b.metered.who ? `${esc(b.metered.who)}: <b class="num">${eur(b.metered.amount)}</b> ${b.metered.paid ? `<span class="status" style="${STATUS_STYLE.ok}">✓ Τα έδωσε</span> <button class="btn small ghost no-print" data-action="pb-unpaid" data-id="${b.id}" data-p="metered">↩</button>` : `<button class="btn small income no-print" data-action="pb-paid" data-id="${b.id}" data-p="metered">✓ Τα έδωσε</button>`}` : ''}</td>
    <td>${esc(b.rest.who)}: <b class="num">${eur(b.rest.amount)}</b> ${b.rest.tenant ? (b.rest.paid ? `<span class="status" style="${STATUS_STYLE.ok}">✓ Τα έδωσε</span> <button class="btn small ghost no-print" data-action="pb-unpaid" data-id="${b.id}" data-p="rest">↩</button>` : `<button class="btn small income no-print" data-action="pb-paid" data-id="${b.id}" data-p="rest">✓ Τα έδωσε</button>`) : `<div class="muted" style="font-size:.9rem">ξενοίκιαστο: εμείς${c.georgeShare ? ` · Γιώργος ${c.georgeShare}%: ${eur(b.rest.amount * c.georgeShare / 100)}` : ''}</div>`}</td>
    <td style="width:3rem"><button class="btn small ghost no-print" data-action="pb-edit" data-id="${b.id}" title="Αλλαγή">✎</button></td></tr>`;
  return `<div class="panel">
    <div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;margin-bottom:.6rem">
      <h2 style="margin:0">⚡ ${esc(c.name)}</h2><div class="spacer"></div>
      <button class="btn primary no-print" data-action="pb-new">+ Νέος λογαριασμός ΔΕΗ</button>
      <button class="btn no-print" data-action="pw-set">⚙️ Ρυθμίσεις</button>
    </div>
    <div class="muted" style="margin-bottom:.8rem">Ο λογαριασμός μοιράζεται έτσι:
      <b>${esc(pwWho(c.meteredTenantId, c.meteredName))}</b> πληρώνει όσες kWh δείχνει ο υπομετρητής × την τιμή της kWh, και δημοτικά τέλη για ${numFmt.format(c.meteredM2)} τ.μ. από τα ${numFmt.format(c.totalM2)}.
      Τα υπόλοιπα πάνε στο <b>${esc(c.restName)}</b>: ${c.restTenantId ? `τα πληρώνει ο/η <b>${esc(pwWho(c.restTenantId, ''))}</b>` : `είναι <b>ξενοίκιαστο</b>, τα πληρώνουμε εμείς${c.georgeShare ? ` (μισά με τον Γιώργο)` : ''}`}.</div>
    ${owed > 0.005 ? `<div class="notice" style="margin:0 0 .8rem">Χρωστάνε για ρεύμα: <b>${eur(owed)}</b></div>` : ''}
    ${bills.length ? `<div class="sheet-wrap"><table class="data"><thead><tr><th>Περίοδος</th><th class="r">Λογαριασμός</th><th>Υπομετρητής</th><th>Υπόλοιπο</th><th></th></tr></thead><tbody>${bills.map(row).join('')}</tbody></table></div>`
      : `<div class="empty">Δεν έχει γραφτεί λογαριασμός ακόμα. Όταν έρθει ο λογαριασμός της ΔΕΗ, πατήστε «+ Νέος λογαριασμός ΔΕΗ» και γράψτε τις kWh, την αξία ρεύματος, τα δημοτικά τέλη και την ένδειξη του υπομετρητή. Η εφαρμογή βγάζει μόνη της ποιος πληρώνει τι.</div>`}
  </div>`;
}
function powerPreview(d) {
  const c = powerCfg();
  const x = { kwh: parseAmount(d.kwhStr), energy: parseAmount(d.energyStr), fees: parseAmount(d.feesStr), r0: parseAmount(d.r0Str), r1: parseAmount(d.r1Str) };
  if ([x.kwh, x.energy, x.fees, x.r0, x.r1].some(v => v === null || isNaN(v))) return '<span class="muted">Συμπληρώστε όλα τα νούμερα για να δείτε το μοίρασμα.</span>';
  const k = powerCalc(c, x);
  return `Σύνολο λογαριασμού <b>${eur(k.total)}</b> · τιμή kWh ${numFmt.format(k.perKwh)} €<br>
    <b>${esc(pwWho(c.meteredTenantId, c.meteredName))}</b>: ${int0.format(k.sub)} kWh = ${eur(k.mEnergy)} + τέλη ${eur(k.mFees)} = <b class="exp">${eur(k.metered)}</b><br>
    <b>${esc(c.restTenantId ? pwWho(c.restTenantId, '') : c.restName + ' (εμείς)')}</b>: <b>${eur(k.rest)}</b>`;
}

// ---------- Χωράφι: ποτίσματα ----------
const hrsFmt = new Intl.NumberFormat('el-GR', { maximumFractionDigits: 2 });
const hrs = n => hrsFmt.format(n || 0);
function fieldCfg() {
  if (!DB.field) DB.field = { waterings: [], payments: [], categoryId: '' };
  return DB.field;
}
function fieldCatId() {
  const f = fieldCfg();
  if (f.categoryId && catById(f.categoryId)) return f.categoryId;
  let c = DB.categories.find(x => x.type === 'expense' && /χωράφ/i.test(x.name));
  if (!c) { c = { id: 'c' + uid(), name: 'Χωράφι – πότισμα', icon: '🌳', type: 'expense', color: '#65a30d', budget: null, extra: false, archived: false, order: 97 }; DB.categories.push(c); }
  f.categoryId = c.id; return c.id;
}
function fieldYear(y) {
  const f = fieldCfg();
  const ws = f.waterings.filter(w => +w.date.slice(0, 4) === y).sort((a, b) => a.date.localeCompare(b.date));
  const hours = round2(ws.reduce((a, w) => a + w.hours, 0));
  const pays = f.payments.filter(p => p.year === y);
  const paid = round2(pays.reduce((a, p) => a + p.amount, 0));
  return { y, ws, hours, pays, paid };
}
function fieldRate() {
  const f = fieldCfg();
  const p = f.payments.filter(p => p.amount && p.hours).sort((a, b) => a.year - b.year).pop();
  return p ? p.amount / p.hours : 0;
}
function fieldPage() {
  const f = fieldCfg();
  const y = now.getFullYear();
  const cur = fieldYear(y), rate = fieldRate();
  const est = round2(cur.hours * rate);
  const years = [...new Set([...f.waterings.map(w => +w.date.slice(0, 4)), ...f.payments.map(p => p.year)])].sort((a, b) => b - a);
  const [tab, bar] = tabBar('field', [{ k: 'now', icon: '💧', label: `Ποτίσματα ${y}`, count: cur.ws.length }, { k: 'years', icon: '📅', label: 'Όλες οι χρονιές', count: years.length }], 'now');
  return `
  <div class="page-head"><h1>🌱 Χωράφι</h1><div class="spacer"></div>
    <button class="btn primary no-print" data-action="water-new">💧 Πότισα</button>
    <button class="btn expense no-print" data-action="field-pay">💶 Πλήρωσα το πότισμα</button>
    <button class="btn no-print" data-action="print">🖨️</button></div>
  <div class="h-hint" style="margin:-.6rem 0 1rem">Κάθε φορά που ποτίζετε, πατάτε «Πότισα» και γράφετε τις ώρες. Στο τέλος της σεζόν πατάτε «Πλήρωσα» και το ποσό μπαίνει στα έξοδα.</div>
  <div class="cards">
    <div class="card bal"><div class="label">Ώρες πότισμα ${y}</div><div class="value num">${hrs(cur.hours)}</div><div class="sub">${cur.ws.length} ποτίσματα</div></div>
    <div class="card exp"><div class="label">Θα κοστίσει περίπου</div><div class="value exp num">${eur(est)}</div><div class="sub">${rate ? `με ${numFmt.format(rate)} € την ώρα (όσο πέρσι)` : 'Δεν υπάρχει προηγούμενη πληρωμή'}</div></div>
    <div class="card ${cur.paid ? 'inc' : cur.hours ? 'exp' : 'bal'}"><div class="label">Πληρωμή ${y}</div><div class="value num" style="font-size:1.5rem;color:${cur.paid ? 'var(--inc)' : 'var(--exp)'}">${cur.paid ? `✓ ${eur(cur.paid)}` : cur.hours ? 'Δεν πληρώθηκε ακόμα' : '—'}</div></div>
  </div>
  ${bar}
  ${tab === 'now' ? `<div class="panel">${cur.ws.length ? `<table class="data"><thead><tr><th>Ημερομηνία</th><th class="r">Ώρες</th><th class="r">Σύνολο ως τότε</th><th></th></tr></thead><tbody>${(() => { let run = 0; return cur.ws.map(w => { run += w.hours; return { w, run }; }).reverse().map(({ w, run }) => `<tr style="cursor:default"><td>${shortDate(w.date)}</td><td class="r num"><b>${hrs(w.hours)}</b></td><td class="r num muted">${hrs(run)}</td><td style="width:3rem"><button class="btn small ghost no-print" data-action="water-del" data-id="${w.id}" title="Σβήσιμο">🗑</button></td></tr>`).join(''); })()}</tbody></table>` : '<div class="empty">Κανένα πότισμα φέτος ακόμα.</div>'}</div>`
  : `<div class="panel"><table class="data"><thead><tr><th>Χρονιά</th><th class="r">Ποτίσματα</th><th class="r">Ώρες</th><th class="r">Πληρώσαμε</th><th class="r">€ την ώρα</th></tr></thead><tbody>${years.map(yy => { const r = fieldYear(yy); return `<tr style="cursor:default"><td><b>${yy}</b></td><td class="r num">${r.ws.length}</td><td class="r num">${hrs(r.hours)}</td><td class="r num">${r.paid ? eur(r.paid) : '<span class="exp">απλήρωτο</span>'}</td><td class="r num muted">${r.paid && r.hours ? numFmt.format(r.paid / r.hours) : ''}</td></tr>`; }).join('')}</tbody></table></div>`}`;
}

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
      <label class="check"><input type="checkbox" id="d-addexp" ${d.addExpense ? 'checked' : ''}> Να μπει και στα έξοδα (${esc(catName(fieldCatId()))})</label>` };
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
      <div class="field"><label for="d-cname">Όνομα</label><input id="d-cname" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. Kia XCeed"></div>
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
    ['d-text', 'text'], ['d-km', 'kmStr'], ['d-work', 'work'], ['d-next', 'nextStr'], ['d-cname', 'name'], ['d-fuel', 'fuel'], ['d-kteo', 'kteo'], ['d-hours', 'hoursStr'],
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
      const tx = { id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: amt, categoryId: taxCatId(), note: `${t.name} (δόση ${d.k + 1}/${t.installments.length})`, person: t.person, method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString() };
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
      const tx = { id: uid(), date: d.date, dayKnown: true, type: 'expense', amount: amt, categoryId: fieldCatId(), note: `Πότισμα ${d.year} (${hrs(r.hours)} ώρες)`, person: '', method: '', planned: false, tenantId: '', recurringId: '', source: 'app', created: new Date().toISOString() };
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
    if (!d.name) return fail('Γράψτε όνομα.');
    if (d.id) Object.assign(DB.cars.find(x => x.id === d.id), { name: d.name, fuelCategoryId: d.fuel || '', kteo: d.kteo || '', sold: d.sold ? (DB.cars.find(x => x.id === d.id).sold || todayStr()) : '' });
    else { const km = intOf(d.kmStr); DB.cars.push({ id: 'c' + uid(), name: d.name, since: todayStr(), fuelCategoryId: d.fuel || '', sold: '', kteo: d.kteo || '', km: km ? [{ date: todayStr(), km }] : [], services: [] }); }
    return done('Αποθηκεύτηκε.');
  }
  return false;
}

// ---------- Πάγια ----------
function recurringPage() {
  const row = r => {
    const nd = nextDue(r);
    return `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto auto">
      <span class="ic">${esc(catIcon(r.categoryId))}</span>
      <span><div class="t1">${esc(catName(r.categoryId))}${r.note ? ` <span class="muted" style="font-weight:500">— ${esc(r.note)}</span>` : ''}${!r.active ? ' <span class="tag">σταματημένο</span>' : ''}</div>
        <div class="t2">${esc(freqText(r))}${r.active && nd ? ` · επόμενο: <b>${ymLabel(nd)}</b>` : ''}${r.person ? ' · ' + esc(r.person) : ''}</div>
        ${r.until ? `<div class="t2">${recEnded(r) ? `<b class="inc">Τελείωσε ✓</b> (τελευταία ${r.total ? 'δόση' : 'φορά'}: ${ymLabel(r.until)})` : `${r.total && instNo(r, nd || curYM()) ? `Δόση <b>${instNo(r, nd || curYM())} από ${r.total}</b> · ` : ''}τελευταία ${r.total ? 'δόση' : 'φορά'}: <b>${ymLabel(r.until)}</b>${r.total ? ` · μένουν ${r.total - instNo(r, nd || curYM()) + 1} (${eur((r.total - instNo(r, nd || curYM()) + 1) * r.amount)})` : ''}`}</div>` : ''}</span>
      <span class="amt num ${r.type === 'income' ? 'inc' : 'exp'}">${r.type === 'income' ? '+' : '−'} ${eur(r.amount)}</span>
      <span style="display:flex;gap:.4rem">
        <button class="btn small" data-action="rec-edit" data-id="${r.id}">✎ Αλλαγή</button>
        ${r.active ? `<button class="btn small" data-action="rec-stop" data-id="${r.id}">Σταμάτημα</button>` : `<button class="btn small" data-action="rec-resume" data-id="${r.id}">▶ Συνέχεια</button><button class="btn small danger" data-action="rec-delete" data-id="${r.id}">🗑</button>`}
      </span></div>`;
  };
  const list = type => DB.recurring.filter(r => r.type === type).sort((a, b) => (b.active - a.active) || catName(a.categoryId).localeCompare(catName(b.categoryId), 'el'));
  const monthlyOut = round2(DB.recurring.filter(r => r.active && !recEnded(r) && r.type === 'expense').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const monthlyIn = round2(DB.recurring.filter(r => r.active && !recEnded(r) && r.type === 'income').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const exp = list('expense'), inc = list('income');
  return `
  <div class="page-head"><h1>Πάγια</h1><div class="spacer"></div>
    <button class="btn expense no-print" data-action="rec-new" data-type="expense">+ Πάγιο έξοδο</button>
    <button class="btn income no-print" data-action="rec-new" data-type="income">+ Πάγιο έσοδο</button></div>
  <div class="notice info">Πάγια είναι τα ποσά που επαναλαμβάνονται, όπως ΔΕΗ, τηλέφωνο, δόσεις, σύνταξη. Τα γράφετε μία φορά εδώ και κάθε μήνα εμφανίζονται μόνα τους στον «Μήνα», στα <b>📌 Προγραμματισμένα</b>, για να πατήσετε <b>«✓ Έγινε»</b>.</div>
  <div class="cards" style="grid-template-columns:repeat(2,1fr)">
    <div class="card exp"><div class="label">Πάγια έξοδα τον μήνα (περίπου)</div><div class="value exp num">${eur(monthlyOut)}</div></div>
    <div class="card inc"><div class="label">Πάγια έσοδα τον μήνα (περίπου)</div><div class="value inc num">${eur(monthlyIn)}</div></div>
  </div>
  ${(() => {
    const [tab, bar] = tabBar('recurring', [{ k: 'expense', icon: '−', label: 'Πάγια έξοδα', count: exp.length }, { k: 'income', icon: '+', label: 'Πάγια έσοδα', count: inc.length }], 'expense');
    const list = tab === 'income' ? inc : exp;
    return bar + `<div class="panel">${list.length ? `<div class="tx-list">${list.map(row).join('')}</div>` : '<div class="empty">Κανένα ακόμα.</div>'}</div>`;
  })()}`;
}

// ---------- παράθυρα για πάγια και ενοικιαστές ----------
let dlg = null;
function catGrid(type, sel, action) {
  const usage = usageCount(type);
  const cats = activeCats(type).slice();
  if (sel && !cats.some(c => c.id === sel)) { const c = catById(sel); if (c) cats.push(c); }
  cats.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.order - b.order);
  return `<div class="cat-grid">${cats.map(c => `<button class="cat-btn ${c.id === sel ? 'sel' : ''}" data-action="${action}" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>`;
}
function chipsHtml(values, sel, action, emptyLabel) {
  return `<div class="chips">${values.map(v => `<button class="chip ${sel === v ? 'sel' : ''}" data-action="${action}" data-v="${esc(v)}">${v === '' ? emptyLabel : esc(v)}</button>`).join('')}</div>`;
}
function openRecDialog(type, r) {
  dlg = r ? { kind: 'rec', id: r.id, type: r.type, amountStr: numFmt.format(r.amount).replace(/\./g, ''), categoryId: r.categoryId, note: r.note, day: r.day, every: r.every, from: r.from, person: r.person, method: r.method, until: r.until || '', totalStr: r.total ? String(r.total) : '', error: '' }
    : { kind: 'rec', id: null, type, amountStr: '', categoryId: '', note: '', day: new Date().getDate(), every: 1, from: curYM(), person: '', method: '', until: '', totalStr: '', error: '' };
  renderDlg();
  setTimeout(() => { const a = $('#d-amount'); if (a) a.focus(); }, 30);
}
function openTenantDialog(t) {
  dlg = t ? { kind: 'tenant', id: t.id, name: t.name, property: t.property, rentStr: numFmt.format(currentRent(t)).replace(/\./g, ''), shareStr: String(shareOf(t)), start: t.start, openingStr: t.opening ? numFmt.format(t.opening).replace(/\./g, '') : '', dueDay: t.dueDay || 1, note: t.note, end: t.end || '', error: '' }
    : { kind: 'tenant', id: null, name: '', property: '', rentStr: '', shareStr: '100', start: curYM(), openingStr: '', dueDay: 1, note: '', end: '', error: '' };
  renderDlg();
  setTimeout(() => { const a = $('#d-name'); if (a) a.focus(); }, 30);
}
function syncDlg() {
  if (!dlg) return;
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (dlg.kind === 'rec') {
    if (v('d-amount') !== undefined) dlg.amountStr = v('d-amount');
    if (v('d-note') !== undefined) dlg.note = v('d-note').trim();
    if (v('d-day') !== undefined) dlg.day = Math.min(31, Math.max(1, +v('d-day') || 1));
    if (v('d-from')) dlg.from = v('d-from');
    if (v('d-until') !== undefined) dlg.until = v('d-until');
    if (v('d-total') !== undefined) dlg.totalStr = v('d-total').trim();
  } else {
    for (const [id, k] of [['d-name', 'name'], ['d-prop', 'property'], ['d-rent', 'rentStr'], ['d-share', 'shareStr'], ['d-opening', 'openingStr'], ['d-tnote', 'note']]) if (v(id) !== undefined) dlg[k] = v(id).trim();
    if (v('d-start')) dlg.start = v('d-start');
    if (v('d-due') !== undefined) dlg.dueDay = Math.min(31, Math.max(1, +v('d-due') || 1));
    if (v('d-end') !== undefined) dlg.end = v('d-end');
  }
}
function balDiffHint(a, amt) {
  const lb = lastBal(a);
  if (!lb || amt === null || isNaN(amt)) return '';
  const d = amt - lb.balance;
  if (Math.abs(d) < 0.005) return 'Ίδιο με πριν.';
  return `${d > 0 ? 'Αύξηση' : 'Μείωση'} <b class="${d > 0 ? 'inc' : 'exp'}">${money(Math.abs(d), a.currency)}</b> από την προηγούμενη φορά.`;
}
function syncMoney() {
  if (!dlg) return;
  const v = id => { const el = $('#' + id); return el ? el.value : undefined; };
  if (v('d-amount') !== undefined) dlg.amountStr = v('d-amount');
  if (v('d-date')) dlg.date = v('d-date');
  if (v('d-bank') !== undefined) dlg.bank = v('d-bank').trim();
  if (v('d-accname') !== undefined) dlg.name = v('d-accname').trim();
  if (v('d-owner') !== undefined) dlg.owner = v('d-owner').trim();
  const ar = $('#d-archived'); if (ar) dlg.archived = ar.checked;
}
function saveMoneyDlg() {
  syncMoney();
  const d = dlg;
  const fail = msg => { d.error = msg; renderDlg(); };
  if (d.kind === 'bal') {
    const a = DB.accounts.find(x => x.id === d.id);
    const amt = parseAmount(d.amountStr);
    if (amt === null || isNaN(amt)) return fail('Γράψτε το υπόλοιπο.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return fail('Η ημερομηνία δεν είναι σωστή.');
    const before = a.history.slice();
    a.history = a.history.filter(h => h.date !== d.date);
    a.history.push({ date: d.date, balance: amt });
    a.history.sort((x, y) => x.date.localeCompare(y.date));
    dlg = null; renderDlg(); persist(); render();
    toast(`${a.bank ? a.bank + ' · ' : ''}${a.name}: ${money(amt, a.currency)}`, () => { a.history = before; persist(); render(); });
    return;
  }
  if (!d.name && !d.bank) return fail('Γράψτε τράπεζα ή όνομα λογαριασμού.');
  if (d.id) {
    const a = DB.accounts.find(x => x.id === d.id);
    Object.assign(a, { bank: d.bank, name: d.name, owner: d.owner, currency: d.currency, kind: d.kind2, archived: !!d.archived });
  } else {
    const amt = d.amountStr ? parseAmount(d.amountStr) : 0;
    if (isNaN(amt)) return fail('Το υπόλοιπο δεν είναι σωστό ποσό.');
    DB.accounts.push({ id: 'a' + uid(), bank: d.bank, name: d.name, owner: d.owner, currency: d.currency, kind: d.kind2, archived: false,
      order: DB.accounts.length, history: [{ date: todayStr(), balance: amt || 0 }] });
  }
  dlg = null; renderDlg(); persist(); render();
  toast(d.id ? 'Ο λογαριασμός αποθηκεύτηκε.' : 'Νέος λογαριασμός.');
}
function syncLeave() { const el = $('#d-end'); if (dlg && dlg.kind === 'leave' && el && el.value) dlg.end = el.value; }
function renderDlg() {
  const root = $('#modal-root');
  if (!dlg) { root.innerHTML = ''; return; }
  const d = dlg;
  let title, head, body;
  const r2 = renderPinDlg(d) || renderDlg2(d);
  if (r2) { ({ title, head, body } = r2); }
  else if (d.kind === 'rec') {
    const isExp = d.type === 'expense';
    head = isExp ? 'expense' : 'income';
    title = (d.id ? 'Αλλαγή πάγιου ' : 'Νέο πάγιο ') + (isExp ? 'εξόδου' : 'εσόδου');
    const amt = parseAmount(d.amountStr);
    body = `
      <div class="field"><label for="d-amount">Πόσα χρήματα κάθε φορά;</label>
        <div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">€</span><span id="d-calc" class="amount-calc">${calcHint(d.amountStr, amt)}</span></div></div>
      <div class="field"><div class="flabel">Για τι;</div>${catGrid(d.type, d.categoryId, 'dlg-cat')}</div>
      <div class="field"><label for="d-note">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-note" type="text" style="width:100%" value="${esc(d.note)}" placeholder="π.χ. δόση δανείου"></div>
      <div class="row">
        <div class="field"><div class="flabel">Πόσο συχνά;</div>
          <div class="chips">${[[1, 'Κάθε μήνα'], [2, 'Κάθε 2 μήνες'], [3, 'Κάθε 3 μήνες'], [6, 'Κάθε 6 μήνες'], [12, 'Μία φορά τον χρόνο']].map(([n, l]) => `<button class="chip ${d.every === n ? 'sel' : ''}" data-action="dlg-every" data-v="${n}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-day">Ποια μέρα του μήνα;</label><input id="d-day" type="number" min="1" max="31" value="${d.day}" style="width:7rem"></div>
        <div class="field"><label for="d-from">Από ποιον μήνα;</label><input id="d-from" type="month" value="${esc(d.from)}"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-until">Τελειώνει; Τελευταίος μήνας <span class="muted" style="font-weight:500">(αν έχει τέλος)</span></label>
          <div style="display:flex;gap:.6rem;align-items:center"><input id="d-until" type="month" value="${esc(d.until)}">${d.until ? '<button class="btn small ghost" data-action="dlg-clear-until">✕ Χωρίς τέλος</button>' : ''}</div></div>
        <div class="field"><label for="d-total">Αν είναι δόσεις: πόσες όλες μαζί;</label><input id="d-total" type="number" min="1" max="600" value="${esc(d.totalStr)}" style="width:7rem" placeholder="—">
          <div class="hint">Τότε φαίνεται «δόση 80 από 100».</div></div>
      </div>
      <div class="row">
        ${(DB.settings.persons || []).length ? `<div class="field"><div class="flabel">Ποιος;</div>${chipsHtml(['', ...DB.settings.persons], d.person, 'dlg-person', 'Όλοι / —')}</div>` : ''}
        <div class="field"><div class="flabel">Πώς;</div>${chipsHtml(['', ...(DB.settings.methods || [])], d.method, 'dlg-method', '—')}</div>
      </div>`;
  } else if (d.kind === 'bal') {
    const a = DB.accounts.find(x => x.id === d.id);
    const lb = lastBal(a);
    const amt = parseAmount(d.amountStr);
    head = 'neutral';
    title = `Νέο υπόλοιπο: ${esc(a.bank ? a.bank + ' · ' : '')}${esc(a.name)}`;
    body = `
      ${lb ? `<div style="font-size:1.1rem">Τελευταίο υπόλοιπο: <b>${money(lb.balance, a.currency)}</b> στις ${shortDate(lb.date)}</div>` : ''}
      <div class="field"><label for="d-amount">Πόσα έχει τώρα ο λογαριασμός;</label>
        <div class="amount-wrap"><input id="d-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(d.amountStr)}" placeholder="0,00"><span class="amount-eur">${curSym(a.currency)}</span></div>
        <div id="d-baldiff" class="amount-calc" style="margin-top:.4rem">${balDiffHint(a, amt)}</div></div>
      <div class="field"><label for="d-date">Ημερομηνία</label><input id="d-date" type="date" value="${esc(d.date)}"></div>`;
  } else if (d.kind === 'acc') {
    head = 'neutral';
    title = d.id ? 'Στοιχεία λογαριασμού' : 'Νέος λογαριασμός';
    const banks = [...new Set(DB.accounts.map(a => a.bank).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
    const owners = [...new Set([...DB.accounts.map(a => a.owner), ...(DB.settings.persons || [])].filter(Boolean))];
    const a = d.id ? DB.accounts.find(x => x.id === d.id) : null;
    body = `
      <div class="row">
        <div class="field"><label for="d-bank">Τράπεζα</label><input id="d-bank" type="text" style="width:100%" value="${esc(d.bank)}" placeholder="π.χ. ΕΤΕ">
          ${banks.length ? `<div class="chips" style="margin-top:.4rem">${banks.map(b => `<button class="chip ${d.bank === b ? 'sel' : ''}" data-action="dlg-bank" data-v="${esc(b)}">${esc(b)}</button>`).join('')}</div>` : ''}</div>
        <div class="field"><label for="d-accname">Όνομα ή αριθμός λογαριασμού</label><input id="d-accname" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. 795 ή Μισθοδοσία"></div>
      </div>
      <div class="field"><label for="d-owner">Ποιανού;</label><input id="d-owner" type="text" style="width:100%" value="${esc(d.owner)}">
        ${owners.length ? `<div class="chips" style="margin-top:.4rem">${owners.map(o => `<button class="chip ${d.owner === o ? 'sel' : ''}" data-action="dlg-owner" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}</div>
      <div class="row">
        <div class="field"><div class="flabel">Νόμισμα</div><div class="chips"><button class="chip ${d.currency === 'EUR' ? 'sel' : ''}" data-action="dlg-cur" data-v="EUR">€ Ευρώ</button><button class="chip ${d.currency === 'USD' ? 'sel' : ''}" data-action="dlg-cur" data-v="USD">$ Δολάρια</button></div></div>
        ${d.id ? '' : `<div class="field"><label for="d-amount">Υπόλοιπο σήμερα</label><div class="amount-wrap"><input id="d-amount" class="num" style="width:12rem" inputmode="decimal" value="${esc(d.amountStr)}" placeholder="0,00"><span style="font-weight:700">${curSym(d.currency)}</span></div></div>`}
      </div>
      <div class="field"><div class="flabel">Είδος</div><div class="chips">${KINDS.map(([k, l, i]) => `<button class="chip ${d.kind2 === k ? 'sel' : ''}" data-action="dlg-kind" data-v="${k}">${i} ${l}</button>`).join('')}</div></div>
      ${a ? `<div class="field"><div class="flabel">Ιστορικό υπολοίπων</div>
        <table class="data" style="max-width:32rem"><tbody>${a.history.slice().reverse().map((h, i) => `<tr style="cursor:default"><td>${shortDate(h.date)}</td><td class="r num"><b>${money(h.balance, a.currency)}</b></td><td style="width:3rem">${a.history.length > 1 ? `<button class="btn small ghost" data-action="acc-hist-del" data-i="${a.history.length - 1 - i}" title="Σβήσιμο">🗑</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <label class="check"><input type="checkbox" id="d-archived" ${d.archived ? 'checked' : ''}> Ο λογαριασμός έκλεισε (να μη μετράει στα σύνολα)</label>` : ''}`;
  } else if (d.kind === 'leave') {
    const t = tenantById(d.id);
    head = 'neutral';
    title = `🚪 Ξενοικιάστηκε: ${esc(t.name)}`;
    body = `
      <p style="margin:0;font-size:1.1rem">Ποιος είναι ο <b>τελευταίος μήνας</b> που χρεώνεται ενοίκιο; Από τον επόμενο μήνα το ακίνητο${t.property ? ` (${esc(t.property)})` : ''} φαίνεται ξενοίκιαστο και δεν γράφεται άλλη οφειλή.</p>
      <div class="chips">
        <button class="chip ${d.end === addMonths(curYM(), -1) ? 'sel' : ''}" data-action="dlg-end" data-v="${addMonths(curYM(), -1)}">Ο προηγούμενος μήνας (${ymLabel(addMonths(curYM(), -1))})</button>
        <button class="chip ${d.end === curYM() ? 'sel' : ''}" data-action="dlg-end" data-v="${curYM()}">Αυτός ο μήνας (${ymLabel(curYM())})</button>
      </div>
      <div class="field"><label for="d-end">ή διαλέξτε μήνα</label><input id="d-end" type="month" value="${esc(d.end)}"></div>
      ${(() => { const b = tenantLedger({ ...t, end: d.end || t.end }).balance; return b > 0.005 ? `<div class="notice" style="margin:0">Με αυτόν τον μήνα, ο ${esc(t.name)} θα χρωστάει <b>${eur(b)}</b>. Η οφειλή μένει στην καρτέλα του, ώσπου να εξοφληθεί.</div>` : ''; })()}`;
  } else {
    head = 'neutral';
    title = d.id ? 'Στοιχεία ενοικιαστή' : 'Νέος ενοικιαστής';
    body = `
      <div class="row">
        <div class="field"><label for="d-name">Όνομα ενοικιαστή</label><input id="d-name" type="text" style="width:100%" value="${esc(d.name)}" placeholder="π.χ. Παπαδόπουλος"></div>
        <div class="field"><label for="d-prop">Ποιο ακίνητο;</label><input id="d-prop" type="text" style="width:100%" value="${esc(d.property)}" placeholder="π.χ. Τρίπολη – κατάστημα"></div>
      </div>
      <div class="row">
        <div class="field"><label for="d-rent">Ενοίκιο τον μήνα</label>
          <div class="amount-wrap"><input id="d-rent" class="amount-input num" style="font-size:1.8rem!important;width:12rem" inputmode="decimal" value="${esc(d.rentStr)}" placeholder="0,00"><span class="amount-eur" style="font-size:1.8rem">€</span></div>
          ${d.id ? '<div class="hint">Αν αλλάξει το ενοίκιο, το νέο μετράει από αυτόν τον μήνα. Οι παλιοί μήνες μένουν όπως ήταν.</div>' : ''}</div>
        <div class="field"><label for="d-due">Πληρώνει συνήθως στις</label><div style="display:flex;align-items:center;gap:.6rem"><input id="d-due" type="number" min="1" max="31" value="${d.dueDay}" style="width:6rem"> <span>του μήνα</span></div></div>
      </div>
      <div class="field"><label for="d-share">Πόσο από το ενοίκιο είναι δικό μας;</label>
        <div style="display:flex;align-items:center;gap:.6rem"><input id="d-share" type="number" min="1" max="100" value="${esc(d.shareStr)}" style="width:6rem"> <span>%</span>
        <button class="chip ${d.shareStr === '100' ? 'sel' : ''}" data-action="dlg-share" data-v="100">Όλο (100%)</button><button class="chip ${d.shareStr === '50' ? 'sel' : ''}" data-action="dlg-share" data-v="50">Μισό (50%)</button></div>
        <div class="hint">Αν το ακίνητο είναι μισό δικό μας, στα έσοδα μπαίνει μόνο το μισό από κάθε πληρωμή. Η οφειλή του ενοικιαστή μετριέται πάντα με όλο το ενοίκιο.</div></div>
      <div class="row">
        <div class="field"><label for="d-start">Από ποιον μήνα μετράμε;</label><input id="d-start" type="month" value="${esc(d.start)}"></div>
        <div class="field"><label for="d-opening">Χρωστούσε ήδη από πριν;</label>
          <div class="amount-wrap"><input id="d-opening" class="num" style="width:10rem" inputmode="decimal" value="${esc(d.openingStr)}" placeholder="0"><span style="font-weight:700">€</span></div>
          <div class="hint">Αν δεν χρωστάει, αφήστε το κενό.</div></div>
      </div>
      <div class="field"><label for="d-tnote">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label><input id="d-tnote" type="text" style="width:100%" value="${esc(d.note)}"></div>
      ${d.id ? `<div class="field"><label for="d-end">Αν έφυγε: τελευταίος μήνας που χρεώνεται</label><div style="display:flex;gap:.6rem;align-items:center"><input id="d-end" type="month" value="${esc(d.end)}">${d.end ? '<button class="btn small ghost" data-action="dlg-clear-end">✕ Δεν έφυγε</button>' : ''}</div></div>` : ''}`;
  }
  root.innerHTML = `
  <div class="modal-back" data-action="dlg-back">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head ${head}"><h2>${title}</h2><button class="btn small" data-action="dlg-close">✕</button></div>
      <div class="modal-body">${body}
        ${d.error ? `<div class="notice" style="margin:0;border-color:var(--exp-line);background:var(--exp-soft);color:var(--exp)"><b>${esc(d.error)}</b></div>` : ''}</div>
      <div class="modal-foot">
        ${d.kind === 'tenant' && d.id ? '<button class="btn danger" data-action="tenant-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'tax' && d.id ? '<button class="btn danger" data-action="tax-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pentry' && d.eid ? '<button class="btn danger" data-action="pentry-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'service' && d.sid ? '<button class="btn danger" data-action="service-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'person' && d.id ? '<button class="btn danger" data-action="person-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'car' && d.id ? '<button class="btn danger" data-action="car-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pbill' && d.id ? '<button class="btn danger" data-action="pb-delete">🗑 Διαγραφή</button>' : ''}
        <div class="spacer"></div>
        <button class="btn" data-action="dlg-close">Ακύρωση</button>
        <button class="btn big primary" style="width:auto;padding:0 2.2rem" data-action="dlg-save">✓ Αποθήκευση</button>
      </div>
    </div>
  </div>`;
}
function saveDlg() {
  if (dlg.kind === 'pin') { savePinDlg(); return; }
  if (dlg.kind === 'ask') { saveAsk(); return; }
  if (['taxpay', 'tax', 'person', 'pentry', 'km', 'service', 'car', 'water', 'fieldpay', 'pset', 'pbill'].includes(dlg.kind)) { saveDlg2(); return; }
  if (dlg.kind === 'bal' || dlg.kind === 'acc') return saveMoneyDlg();
  if (dlg.kind === 'leave') {
    syncLeave();
    const t = tenantById(dlg.id);
    if (!/^\d{4}-\d{2}$/.test(dlg.end)) { dlg.error = 'Διαλέξτε μήνα.'; renderDlg(); return; }
    if (dlg.end < t.start) { dlg.error = `Ο μήνας είναι πριν από την αρχή (${ymLabel(t.start)}).`; renderDlg(); return; }
    t.end = dlg.end;
    dlg = null; renderDlg(); persist(); render();
    toast(`${t.name}: ξενοικιάστηκε (τελευταίος μήνας ${ymLabel(t.end)}).`);
    return;
  }
  syncDlg();
  const d = dlg;
  const fail = msg => { d.error = msg; renderDlg(); };
  if (d.kind === 'rec') {
    const amt = parseAmount(d.amountStr);
    if (amt === null || isNaN(amt) || amt <= 0) return fail('Γράψτε ένα ποσό μεγαλύτερο από 0.');
    if (!d.categoryId) return fail('Διαλέξτε για τι είναι.');
    if (!/^\d{4}-\d{2}$/.test(d.from)) return fail('Διαλέξτε από ποιον μήνα.');
    if (d.until && d.until < d.from) return fail('Ο τελευταίος μήνας είναι πριν από την αρχή.');
    const total = d.totalStr ? parseInt(d.totalStr, 10) : null;
    if (d.totalStr && !(total >= 1)) return fail('Οι δόσεις πρέπει να είναι αριθμός.');
    if (total && !d.until) return fail('Για τις δόσεις, διαλέξτε και τον μήνα της τελευταίας δόσης.');
    const fields = { type: d.type, amount: amt, categoryId: d.categoryId, note: d.note, day: d.day, every: d.every, from: d.from, person: d.person, method: d.method, until: d.until || '', total: total || null };
    if (d.id) {
      const r = DB.recurring.find(x => x.id === d.id);
      Object.assign(r, fields);
      // οι προγραμματισμένες (όχι οι πληρωμένες) ξαναφτιάχνονται με τα νέα στοιχεία
      DB.transactions = DB.transactions.filter(t => !(t.recurringId === r.id && t.planned));
    } else {
      DB.recurring.push({ id: 'r' + uid(), active: true, skip: [], ...fields });
    }
    generateRecurring();
    dlg = null; renderDlg(); persist(); render();
    toast(d.id ? 'Το πάγιο άλλαξε.' : `Νέο πάγιο: ${eur(amt)} – ${catName(fields.categoryId)}`);
  } else {
    if (!d.name) return fail('Γράψτε το όνομα του ενοικιαστή.');
    const rent = parseAmount(d.rentStr);
    if (rent === null || isNaN(rent) || rent < 0) return fail('Γράψτε το ενοίκιο τον μήνα.');
    const opening = d.openingStr ? parseAmount(d.openingStr) : 0;
    if (isNaN(opening)) return fail('Το «χρωστούσε από πριν» δεν είναι σωστό ποσό.');
    if (!/^\d{4}-\d{2}$/.test(d.start)) return fail('Διαλέξτε από ποιον μήνα μετράμε.');
    if (d.end && d.end < d.start) return fail('Ο μήνας που έφυγε είναι πριν από την αρχή.');
    const share = Math.round(+String(d.shareStr).replace(',', '.'));
    if (!(share >= 1 && share <= 100)) return fail('Το «πόσο είναι δικό μας» πρέπει να είναι από 1 ως 100%.');
    if (d.id) {
      const t = tenantById(d.id);
      const oldStart = t.start;
      const oldShare = shareOf(t);
      Object.assign(t, { name: d.name, property: d.property, start: d.start, opening: opening || 0, dueDay: d.dueDay, note: d.note, end: d.end || '', share });
      if (oldShare !== share) for (const x of DB.transactions) if (x.tenantId === t.id) { const full = paidOf(x); x.amount = round2(full * share / 100); if (share === 100) delete x.rentAmount; else x.rentAmount = full; }
      if (Math.abs(currentRent(t) - rent) > 0.005 || oldStart !== d.start) {
        const from = curYM() <= t.start ? t.start : curYM();
        t.rents = (t.rents || []).filter(r => r.from < from && r.from >= t.start);
        t.rents.push({ from, amount: rent });
        if (!t.rents.some(r => r.from <= t.start)) t.rents[0].from = t.start;
      }
    } else {
      DB.tenants.push({ id: 't' + uid(), name: d.name, property: d.property, rents: [{ from: d.start, amount: rent }], start: d.start, end: '', opening: opening || 0, dueDay: d.dueDay, note: d.note, active: true, share });
      rentCatId();
    }
    dlg = null; renderDlg(); persist(); render();
    toast(d.id ? 'Τα στοιχεία αποθηκεύτηκαν.' : `Νέος ενοικιαστής: ${d.name}`);
  }
}

// ---------- Η χρονιά ----------
function yearPage() {
  const year = ui.yearView;
  const a = yearAgg(year);
  const totE = round2(a.mExp.reduce((x, y) => x + y, 0));
  const totI = round2(a.mInc.reduce((x, y) => x + y, 0));
  const totNoExtra = round2(a.mExpNoExtra.reduce((x, y) => x + y, 0));
  const lastY = monthlyExpensesFor(year - 1);

  const sheet = (type) => {
    const cats = DB.categories.filter(c => c.type === type && (!c.archived || (a[type === 'expense' ? 'exp' : 'inc'][c.id]))).sort((x, y) => x.order - y.order);
    const data = type === 'expense' ? a.exp : a.inc;
    const pl = type === 'expense' ? a.expPl : a.incPl;
    const monthTot = type === 'expense' ? a.mExp : a.mInc;
    const grand = type === 'expense' ? totE : totI;
    const isExp = type === 'expense';
    const body = cats.map(c => {
      const arr = data[c.id] || Array(12).fill(0);
      const parr = pl[c.id] || Array(12).fill(0);
      const tot = round2(arr.reduce((x, y) => x + y, 0));
      const prev = isExp ? categoryYearTotal(c.id, year - 1) : null;
      const rem = isExp && c.budget ? round2(c.budget - tot) : null;
      return `<tr>
        <td class="cat">${esc(c.icon)} ${esc(c.name)}${c.extra ? ' <span class="tag">έκτακτο</span>' : ''}</td>
        ${arr.map((v, m) => `<td class="cell num" data-action="goto-cell" data-cat="${esc(c.id)}" data-m="${m + 1}" data-type="${type}">${v ? numFmt.format(v) : '<span class="zero">·</span>'}${parr[m] ? `<span class="pl" title="Προγραμματισμένα">+${numFmt.format(parr[m])}</span>` : ''}</td>`).join('')}
        <td class="tot num">${numFmt.format(tot)}</td>
        <td class="num muted">${grand ? Math.round(tot / grand * 100) + '%' : ''}</td>
        ${isExp ? `<td class="num muted">${prev != null ? numFmt.format(prev) : ''}</td>
        <td class="num">${c.budget ? numFmt.format(c.budget) : ''}</td>
        <td class="num ${rem == null ? '' : rem < 0 ? 'over' : 'ok'}">${rem == null ? '' : numFmt.format(rem)}</td>` : ''}
      </tr>`;
    }).join('');
    const prevTot = isExp ? (lastY ? round2(lastY.reduce((x, y) => x + y, 0)) : null) : null;
    const budTot = isExp ? round2(cats.reduce((x, c) => x + (c.budget || 0), 0)) : null;
    let foot = `<tr class="total"><td class="cat">Σύνολο ${isExp ? 'εξόδων' : 'εσόδων'}</td>${monthTot.map(v => `<td class="num">${numFmt.format(v)}</td>`).join('')}<td class="num">${numFmt.format(grand)}</td><td></td>
      ${isExp ? `<td class="num">${prevTot != null ? numFmt.format(prevTot) : ''}</td><td class="num">${budTot ? numFmt.format(budTot) : ''}</td><td class="num ${budTot && budTot - grand < 0 ? 'over' : ''}">${budTot ? numFmt.format(budTot - grand) : ''}</td>` : ''}</tr>`;
    if (isExp) foot += `<tr><td class="cat muted">Χωρίς τα έκτακτα</td>${a.mExpNoExtra.map(v => `<td class="num muted">${numFmt.format(v)}</td>`).join('')}<td class="num muted">${numFmt.format(totNoExtra)}</td><td></td><td></td><td></td><td></td></tr>`;
    return `<div class="sheet-wrap"><table class="sheet">
      <thead><tr><th class="cat">${isExp ? 'Έξοδα' : 'Έσοδα'}</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}<th>Σύνολο</th><th>%</th>${isExp ? `<th>${year - 1}</th><th>Πρόβλεψη</th><th>Υπόλοιπο</th>` : ''}</tr></thead>
      <tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
  };

  let cum = 0;
  const balRow = a.mInc.map((v, m) => { cum += v - a.mExp[m]; return cum; });
  return `
  <div class="page-head">
    <div class="month-nav">
      <button class="btn" data-action="year-prev">◀</button>
      <div class="month-title" style="min-width:9rem">Η χρονιά ${year}</div>
      <button class="btn" data-action="year-next">▶</button>
    </div>
    <div class="spacer"></div>
    <button class="btn no-print" data-action="export-year">📊 Για Excel</button>
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button>
  </div>
  <div class="cards four">
    <div class="card inc"><div class="label">Έσοδα ${year}</div><div class="value inc num">${eur0(totI)}</div></div>
    <div class="card exp"><div class="label">Έξοδα ${year}</div><div class="value exp num">${eur0(totE)}</div>${lastY ? `<div class="sub">${year - 1}: ${eur0(lastY.reduce((x, y) => x + y, 0))}</div>` : ''}</div>
    <div class="card bal"><div class="label">Διαφορά</div><div class="value num" style="color:${totI - totE < 0 ? 'var(--exp)' : 'var(--brand)'}">${eur0(totI - totE)}</div></div>
    <div class="card extra"><div class="label">Έξοδα χωρίς έκτακτα</div><div class="value num">${eur0(totNoExtra)}</div><div class="sub">Έκτακτα: ${eur0(totE - totNoExtra)}</div></div>
  </div>
  ${(() => { const [t, b] = tabBar('year', [{ k: 'exp', icon: '−', label: 'Έξοδα ανά κατηγορία' }, { k: 'inc', icon: '+', label: 'Έσοδα ανά κατηγορία' }, { k: 'chart', icon: '📊', label: 'Γράφημα μηνών' }, { k: 'bal', icon: '⚖️', label: 'Υπόλοιπο ανά μήνα' }], 'exp'); ui._yearTab = t; return b; })()}
  ${ui._yearTab !== 'chart' ? '' : `<div class="panel">
    <h2>Έσοδα και έξοδα ανά μήνα</h2>
    ${monthChart(a.mInc, a.mExp, lastY, year)}
  </div>`}
  ${ui._yearTab !== 'exp' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem;margin-bottom:.3rem">Έξοδα ανά κατηγορία</h2><div class="h-hint" style="margin:0 .2rem .7rem">Όπως στο Excel. Πατήστε ένα ποσό για να δείτε από τι αποτελείται.</div>
    ${sheet('expense')}
  </div>`}
  ${ui._yearTab !== 'inc' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem">Έσοδα ανά κατηγορία</h2>
    ${sheet('income')}</div>`}
  ${ui._yearTab !== 'bal' ? '' : `<div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem">Υπόλοιπο ανά μήνα</h2>
    <div class="sheet-wrap"><table class="sheet">
      <thead><tr><th class="cat">Υπόλοιπο</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="cat">Διαφορά μήνα</td>${a.mInc.map((v, m) => { const d = v - a.mExp[m]; return `<td class="num ${d < 0 ? 'over' : 'ok'}">${numFmt.format(d)}</td>`; }).join('')}</tr>
        <tr class="total"><td class="cat">Από αρχή χρονιάς</td>${balRow.map(v => `<td class="num ${v < 0 ? 'over' : ''}">${numFmt.format(v)}</td>`).join('')}</tr>
      </tbody></table></div>
  </div>`}`;
}

function monthChart(inc, exp, lastExp, year) {
  const W = 1000, H = 300, L = 60, B = 34, T = 14;
  const max = Math.max(1, ...inc, ...exp, ...(lastExp || [0]));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / 12;
  let g = '';
  for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  let bars = '';
  for (let m = 0; m < 12; m++) {
    const x = L + m * gw + gw * 0.14, bw = gw * 0.34;
    bars += `<rect x="${x}" y="${y(inc[m])}" width="${bw}" height="${y(0) - y(inc[m])}" rx="4" style="fill:var(--inc)"><title>Έσοδα ${MONTHS[m]}: ${eur(inc[m])}</title></rect>`;
    bars += `<rect x="${x + bw + 3}" y="${y(exp[m])}" width="${bw}" height="${y(0) - y(exp[m])}" rx="4" style="fill:var(--exp)"><title>Έξοδα ${MONTHS[m]}: ${eur(exp[m])}</title></rect>`;
    bars += `<text x="${L + m * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="15" style="fill:var(--ink-2)">${MONTHS_SHORT[m]}</text>`;
  }
  let line = '';
  if (lastExp) {
    const pts = lastExp.map((v, m) => `${L + m * gw + gw / 2},${y(v)}`).join(' ');
    line = `<polyline points="${pts}" fill="none" style="stroke:var(--ink-3)" stroke-width="2.5" stroke-dasharray="6 5"/>` + lastExp.map((v, m) => `<circle cx="${L + m * gw + gw / 2}" cy="${y(v)}" r="4" style="fill:var(--ink-3)"><title>Έξοδα ${MONTHS[m]} ${year - 1}: ${eur(v)}</title></circle>`).join('');
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Έσοδα και έξοδα ανά μήνα">${g}${bars}${line}</svg>
    <div class="legend"><span><i style="background:var(--inc)"></i>Έσοδα</span><span><i style="background:var(--exp)"></i>Έξοδα</span>${lastExp ? `<span><i style="background:var(--ink-3)"></i>Έξοδα ${year - 1}</span>` : ''}</div>`;
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function kfmt(v) { return v >= 1000 ? int0.format(v / 1000) + 'χ' : int0.format(v); }

// ---------- Ιστορικό ----------
function historyRows() {
  const ys = new Set([...Object.keys(DB.history).map(Number), ...yearsWithTx()]);
  return [...ys].sort((a, b) => a - b).map(y => {
    const tx = DB.transactions.filter(t => yOf(t) === y && !t.planned);
    const h = DB.history[String(y)] || {};
    const hasE = tx.some(t => t.type === 'expense'), hasI = tx.some(t => t.type === 'income');
    const e = hasE ? sum(tx.filter(t => t.type === 'expense')) : (h.expenses != null ? h.expenses : null);
    const i = hasI ? sum(tx.filter(t => t.type === 'income')) : (h.income != null ? h.income : null);
    return { y, e, i, src: hasE || hasI ? 'HomeFlow' : 'Excel' };
  });
}
function historyPage() {
  const rows = historyRows();
  const max = Math.max(1, ...rows.map(r => Math.max(r.e || 0, r.i || 0)));
  const W = 1000, H = 300, L = 60, B = 34, T = 14;
  const step = niceStep(max / 4), top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / Math.max(rows.length, 1);
  let svg = '';
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" style="fill:var(--ink-3)">${kfmt(v)}</text>`;
  rows.forEach((r, k) => {
    const x = L + k * gw + gw * 0.1, bw = gw * 0.38;
    if (r.i != null) svg += `<rect x="${x}" y="${y(r.i)}" width="${bw}" height="${y(0) - y(r.i)}" rx="3" style="fill:var(--inc)"><title>Έσοδα ${r.y}: ${eur(r.i)}</title></rect>`;
    if (r.e != null) svg += `<rect x="${x + bw + 2}" y="${y(r.e)}" width="${bw}" height="${y(0) - y(r.e)}" rx="3" style="fill:var(--exp)"><title>Έξοδα ${r.y}: ${eur(r.e)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="${rows.length > 16 ? 12 : 14}" style="fill:var(--ink-2)">${rows.length > 16 ? "'" + String(r.y).slice(2) : r.y}</text>`;
  });
  return `
  <div class="page-head"><h1>Ιστορικό χρόνων</h1><div class="spacer"></div><button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button></div>
  ${(() => { const [t, b] = tabBar('history', [{ k: 'table', icon: '📋', label: 'Πίνακας' }, { k: 'chart', icon: '📊', label: 'Γράφημα' }], 'table'); ui._histTab = t; return b; })()}
  <div class="panel ${ui._histTab === 'chart' ? '' : 'hidden'}">
    <h2>Έσοδα και έξοδα ανά χρονιά</h2>
    <svg class="chart" viewBox="0 0 ${W} ${H}">${svg}</svg>
    <div class="legend"><span><i style="background:var(--inc)"></i>Έσοδα</span><span><i style="background:var(--exp)"></i>Έξοδα</span></div>
  </div>
  <div class="sheet-wrap ${ui._histTab === 'table' ? '' : 'hidden'}"><table class="data">
    <thead><tr><th>Χρονιά</th><th class="r">Έσοδα</th><th class="r">Έξοδα</th><th class="r">Διαφορά</th><th>Πηγή</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r => `<tr data-action="goto-year" data-year="${r.y}">
      <td><b>${r.y}</b></td>
      <td class="r num inc">${r.i != null ? eur0(r.i) : '<span class="muted">—</span>'}</td>
      <td class="r num exp">${r.e != null ? eur0(r.e) : '<span class="muted">—</span>'}</td>
      <td class="r num">${r.i != null && r.e != null ? `<b style="color:${r.i - r.e < 0 ? 'var(--exp)' : 'var(--brand)'}">${eur0(r.i - r.e)}</b>` : ''}</td>
      <td class="muted">${r.src === 'Excel' ? 'Σύνολα από το παλιό Excel' : 'Καταχωρήσεις'}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="muted">«—» σημαίνει ότι το παλιό Excel δεν είχε αυτό το σύνολο για εκείνη τη χρονιά.</p>`;
}

// ---------- Ρυθμίσεις ----------
function settingsPage() {
  const s = DB.settings;
  const info = ui.info || {};
  const catTable = type => {
    const cats = DB.categories.filter(c => c.type === type).sort((a, b) => a.order - b.order);
    const counts = {};
    for (const t of DB.transactions) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    return `<table class="data cat-table"><thead><tr><th style="width:4.2rem"></th><th>Όνομα</th>${type === 'expense' ? '<th style="width:8rem">Πρόβλεψη €/χρόνο</th><th style="width:5.5rem;text-align:center">Έκτακτο</th>' : ''}<th style="width:5.5rem;text-align:center">Κρυφή</th><th style="width:6.2rem">Σειρά</th><th style="width:6.8rem"></th></tr></thead><tbody>
      ${cats.map((c, i) => `<tr style="cursor:default${c.archived ? ';opacity:.55' : ''}">
        <td><button class="ic-btn" data-action="pick-icon" data-id="${esc(c.id)}">${esc(c.icon)}</button></td>
        <td><input type="text" data-cat-field="name" data-id="${esc(c.id)}" value="${esc(c.name)}"></td>
        ${type === 'expense' ? `<td><input type="number" min="0" step="1" data-cat-field="budget" data-id="${esc(c.id)}" value="${c.budget || ''}" placeholder="—"></td>
        <td style="text-align:center"><input type="checkbox" class="big-check" style="width:1.4rem;height:1.4rem" data-cat-field="extra" data-id="${esc(c.id)}" ${c.extra ? 'checked' : ''}></td>` : ''}
        <td style="text-align:center"><input type="checkbox" style="width:1.4rem;height:1.4rem" data-cat-field="archived" data-id="${esc(c.id)}" ${c.archived ? 'checked' : ''}></td>
        <td><button class="btn small" data-action="cat-up" data-id="${esc(c.id)}" ${i === 0 ? 'disabled' : ''}>▲</button> <button class="btn small" data-action="cat-down" data-id="${esc(c.id)}" ${i === cats.length - 1 ? 'disabled' : ''}>▼</button></td>
        <td>${counts[c.id] ? `<span class="muted" style="font-size:.85rem">${counts[c.id]} κιν.</span>` : `<button class="btn small danger" data-action="cat-delete" data-id="${esc(c.id)}" title="Διαγραφή">🗑 Σβήσιμο</button>`}</td>
      </tr>`).join('')}</tbody></table>
      <button class="btn" style="margin-top:.7rem" data-action="cat-add" data-type="${type}">+ Νέα κατηγορία ${type === 'expense' ? 'εξόδων' : 'εσόδων'}</button>`;
  };
  return `
  <div class="page-head"><h1>Ρυθμίσεις</h1></div>
  ${(() => { const [t, b] = tabBar('settings', [{ k: 'general', icon: '🎨', label: 'Εμφάνιση & πρόσωπα' }, { k: 'exp', icon: '📂', label: 'Κατηγορίες εξόδων' }, { k: 'inc', icon: '💶', label: 'Κατηγορίες εσόδων' }, { k: 'data', icon: '💾', label: 'Τα δεδομένα μου' }, { k: 'version', icon: '🔄', label: 'Έκδοση' }], 'general'); ui._setTab = t; return b; })()}

  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🎨 Εμφάνιση</h2>
    <div class="theme-pick">${[['light', '☀️ Φωτεινή', ['#EEF4F7', '#ffffff', '#0B7A8A']], ['dark', '🌙 Σκούρα', ['#0E1A29', '#162537', '#3CC3D2']], ['auto', '🖥️ Αυτόματα', ['#EEF4F7', '#0E1A29', '#0B7A8A']]].map(([k, l, c]) => `<button class="${themePref() === k ? 'sel' : ''}" data-action="theme" data-v="${k}"><span class="sw" style="background:${c[0]}"><i style="background:${c[1]}"></i><i style="background:${c[2]}"></i></span>${l}</button>`).join('')}</div>
    <div class="hint muted" style="margin-top:.6rem">«Αυτόματα»: φωτεινή τη μέρα και σκούρα όταν ο υπολογιστής είναι σε σκούρα λειτουργία.</div>
  </div>
  ${pinPanel()}
  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🔠 Μέγεθος γραμμάτων</h2>
    <div class="chips">${FONT_SCALES.map(f => `<button class="chip ${s.fontScale === f.v ? 'sel' : ''}" data-action="font" data-v="${f.v}" style="font-size:${f.v}rem">${f.l}</button>`).join('')}</div>
  </div>

  <div class="panel set-section ${ui._setTab === 'exp' ? '' : 'hidden'}">
    <h2>📂 Κατηγορίες εξόδων</h2>
    <p class="muted" style="margin-top:-.4rem">«Πρόβλεψη» είναι πόσα υπολογίζουμε να ξοδέψουμε τη χρονιά (φαίνεται στη σελίδα «Η χρονιά»). «Έκτακτο» σημαίνει ότι δεν μετράει στα «έξοδα χωρίς έκτακτα». Οι κρυφές κατηγορίες δεν εμφανίζονται στη νέα καταχώρηση.</p>
    ${catTable('expense')}
  </div>
  <div class="panel set-section ${ui._setTab === 'inc' ? '' : 'hidden'}">
    <h2>💶 Κατηγορίες εσόδων</h2>
    ${catTable('income')}
  </div>

  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>👪 Πρόσωπα</h2>
    <p class="muted" style="margin-top:-.4rem">Ποιοι εμφανίζονται στο «Ποιος;» της καταχώρησης. Χωρίστε με κόμμα.</p>
    <input type="text" id="persons" value="${esc(s.persons.join(', '))}" style="width:100%;border:2px solid var(--line-2);border-radius:14px;padding:.6rem .9rem;background:var(--paper)">
  </div>

  <div class="panel set-section ${ui._setTab === 'data' ? '' : 'hidden'}">
    <h2>💾 Τα δεδομένα μου</h2>
    ${store.native ? `<p style="margin-top:0">Όλα αποθηκεύονται αυτόματα σε αυτό το αρχείο. Κάθε μέρα κρατιέται και ένα αντίγραφο ασφαλείας στον ίδιο φάκελο.</p>
    <div class="path">${esc(info.path || '')}</div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem">
      <button class="btn" data-action="open-folder">📂 Άνοιγμα φακέλου</button>
      <button class="btn" data-action="choose-folder">📁 Αλλαγή φακέλου (π.χ. OneDrive)</button>
      <button class="btn" data-action="backup">🛟 Αντίγραφο ασφαλείας τώρα</button>
      <button class="btn" data-action="restore">↩️ Άνοιγμα / επαναφορά αρχείου…</button>
      <button class="btn" data-action="export-csv-all">📊 Όλες οι κινήσεις για Excel</button>
    </div>` : '<p class="muted">Δοκιμαστική λειτουργία στον browser: τα δεδομένα μένουν μόνο σε αυτόν τον browser.</p><button class="btn" data-action="restore">↩️ Άνοιγμα αρχείου…</button>'}
    ${s.importNote ? `<p class="muted" style="margin-bottom:0">Εισαγωγή από ${esc(s.importedFrom || 'Excel')}. ${esc(s.importNote)}</p>` : ''}
  </div>

  ${backupPanel()}

  <div class="panel set-section ${ui._setTab === 'version' ? '' : 'hidden'}">
    <h2>🔄 Έκδοση</h2>
    <p style="margin-top:0">HomeFlow έκδοση <b>${esc(info.version || '—')}</b>. Όταν βγαίνει νέα έκδοση, εμφανίζεται ειδοποίηση πάνω πάνω με κουμπί «Κατέβασμα».</p>
    <button class="btn" data-action="check-updates">Έλεγχος για νέα έκδοση</button>
    <span id="upd-msg" class="muted" style="margin-left:.8rem"></span>
  </div>`;
}

// ======================= αντίγραφα σε cloud και USB =======================
function agoText(iso) {
  if (!iso) return 'ποτέ';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  const t = new Date(iso);
  const hm = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
  return d <= 0 && t.toDateString() === new Date().toDateString() ? `σήμερα ${hm}` : d <= 1 ? `χθες ${hm}` : `πριν ${d} μέρες (${shortDate(iso.slice(0, 10))})`;
}
async function refreshBackup() { if (window.homeflow && window.homeflow.backupStatus) ui.backup = await window.homeflow.backupStatus(); }
function backupPanel() {
  if (!store.native) return '';
  const b = ui.backup || {};
  const row = (kind, icon, title, help, st) => `<div class="planned-row">
    <span class="p-ic">${icon}</span>
    <span class="p-nm"><b>${title}</b>
      <div class="muted" style="font-size:.92rem">${st ? `${esc(st.dir)}<br>Τελευταίο αντίγραφο: <b class="${st.last && Date.now() - new Date(st.last) < (kind === 'usb' ? 30 : 3) * 86400000 ? 'inc' : 'exp'}">${agoText(st.last)}</b>${!st.present ? ` · <span class="exp">${kind === 'usb' ? 'το USB δεν είναι συνδεδεμένο' : 'ο φάκελος δεν βρέθηκε'}</span>` : ''}` : help}</div></span>
    <span class="p-amt"></span>
    <span class="p-act">${st ? `<button class="btn small primary" data-action="bk-now" data-k="${kind}">🛟 Αντίγραφο τώρα</button><button class="btn small" data-action="bk-open" data-k="${kind}">📂 Άνοιγμα</button><button class="btn small" data-action="bk-choose" data-k="${kind}">Αλλαγή</button><button class="btn small danger" data-action="bk-remove" data-k="${kind}">Αφαίρεση</button>`
      : `<button class="btn small primary" data-action="bk-choose" data-k="${kind}">${kind === 'usb' ? 'Διαλέξτε το USB' : 'Διαλέξτε φάκελο'}</button>`}</span></div>`;
  return `<div class="panel set-section ${ui._setTab === 'data' ? '' : 'hidden'}">
    <h2>🛟 Δεύτερο αντίγραφο</h2>
    <p class="muted" style="margin-top:-.4rem">Τα αντίγραφα στον ίδιο υπολογιστή δεν βοηθούν αν χαλάσει ο δίσκος. Εδώ το HomeFlow κρατάει αντίγραφο και αλλού, μόνο του, σε κάθε αποθήκευση. Κρατιούνται τα αντίγραφα των τελευταίων 30 ημερών.</p>
    ${row('cloud', '☁️', 'Στο cloud (OneDrive ή Google Drive)', 'Διαλέξτε έναν φάκελο μέσα στο OneDrive ή στο Google Drive. Από εκεί τα αντίγραφα ανεβαίνουν μόνα τους στο internet.', b.cloud)}
    ${row('usb', '🔌', 'Σε USB', 'Βάλτε ένα USB στον υπολογιστή και διαλέξτε το. Όποτε είναι συνδεδεμένο, το HomeFlow γράφει αντίγραφο. Θα σας θυμίζει να το βάζετε μία φορά τον μήνα.', b.usb)}
  </div>`;
}
function backupReminders() {
  const out = [], b = ui.backup;
  if (!b || !store.native) return out;
  if (b.usb && (!b.usb.last || Date.now() - new Date(b.usb.last) > 30 * 86400000))
    out.push({ sort: 30, cls: 'wait', icon: '🔌', text: 'Αντίγραφο σε USB', sub: `τελευταίο: ${agoText(b.usb.last)}. Βάλτε το USB στον υπολογιστή.`, btn: '<button class="btn small" data-action="bk-now" data-k="usb">🛟 Αντίγραφο τώρα</button>' });
  if (b.cloud && (!b.cloud.present || !b.cloud.last || Date.now() - new Date(b.cloud.last) > 3 * 86400000))
    out.push({ sort: 29, cls: 'late', icon: '☁️', text: 'Το αντίγραφο στο cloud δεν γίνεται', sub: b.cloud.present ? `τελευταίο: ${agoText(b.cloud.last)}` : 'ο φάκελος δεν βρέθηκε · είναι ανοιχτό το OneDrive / Google Drive;', btn: '<button class="btn small" data-action="bk-now" data-k="cloud">🛟 Δοκιμή</button>' });
  if (!b.cloud && !b.usb && DB.transactions.length > 20)
    out.push({ sort: 40, cls: 'wait', icon: '🛟', text: 'Δεν υπάρχει δεύτερο αντίγραφο', sub: 'αν χαλάσει ο υπολογιστής, τα στοιχεία χάνονται', btn: '<button class="btn small" data-action="bk-setup">Ρύθμιση</button>' });
  return out;
}
const bkActions = {
  'bk-choose': async el => { const r = await window.homeflow.backupChoose(el.dataset.k); if (r.canceled) return; ui.backup = r.status; render(); toast(r.ok ? 'Έτοιμο: το αντίγραφο γράφτηκε.' : r.error); },
  'bk-now': async el => { if (!window.homeflow) return; const r = await window.homeflow.backupNow(el.dataset.k); ui.backup = r.status; render(); toast(r.ok ? 'Το αντίγραφο γράφτηκε ✓' : r.error); },
  'bk-open': el => window.homeflow.backupOpen(el.dataset.k),
  'bk-remove': async el => { if (!confirm('Να σταματήσουν τα αντίγραφα εκεί; (Όσα έχουν γραφτεί δεν σβήνονται.)')) return; ui.backup = await window.homeflow.backupRemove(el.dataset.k); render(); },
  'bk-setup': () => { ui.page = 'settings'; ui.tabs.settings = 'data'; render(); }
};

// ======================= PIN στο άνοιγμα =======================
// Το PIN κλειδώνει την οθόνη. Δεν κρυπτογραφεί το αρχείο.
let locked = false;
let lockState = { digits: '', error: '', mode: 'pin', code: '' };
const hexOf = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function pinHash(pin, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return hexOf(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 150000 }, key, 256));
}
const newSalt = () => hexOf(crypto.getRandomValues(new Uint8Array(16)));
async function checkPin(pin) { const p = DB.settings.pin; return !!p && await pinHash(pin, p.salt) === p.hash; }
async function checkRecovery(code) { const p = DB.settings.pin; return !!p && await pinHash(code.replace(/\D/g, ''), p.rsalt) === p.rhash; }
function renderLock() {
  let root = $('#lock-root');
  if (!locked) { if (root) root.remove(); return; }
  if (!root) { root = document.createElement('div'); root.id = 'lock-root'; document.body.appendChild(root); }
  const s = lockState;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  root.innerHTML = `<div class="lock">
    <img src="logo.svg" alt="" class="lock-logo">
    <h1>HomeFlow</h1>
    ${s.mode === 'pin' ? `<p>Γράψτε το PIN σας</p>
      <div class="pin-dots ${s.error ? 'bad' : ''}">${[0, 1, 2, 3].map(i => `<i class="${i < s.digits.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="lock-msg">${esc(s.error)}</div>
      <div class="keypad">${keys.map(k => k ? `<button class="key" data-action="lock-key" data-v="${k}">${k}</button>` : '<span></span>').join('')}</div>
      <button class="btn small" data-action="lock-forgot">Ξέχασα το PIN</button>`
    : `<p>Γράψτε τον κωδικό επαναφοράς<br><span class="muted" style="font-size:.95rem">(τον 8ψήφιο κωδικό που γράψατε σε χαρτί όταν βάλατε το PIN)</span></p>
      <input id="lock-code" class="amount-input num" style="width:16rem;text-align:center" inputmode="numeric" maxlength="9" value="${esc(s.code)}">
      <div class="lock-msg">${esc(s.error)}</div>
      <div style="display:flex;gap:.6rem"><button class="btn" data-action="lock-back">◀ Πίσω</button><button class="btn primary" data-action="lock-recover">Ξεκλείδωμα</button></div>`}
  </div>`;
  if (s.mode === 'code') setTimeout(() => { const i = $('#lock-code'); if (i) i.focus(); }, 30);
}
async function lockKey(k) {
  const s = lockState;
  if (k === '⌫') { s.digits = s.digits.slice(0, -1); s.error = ''; renderLock(); return; }
  if (s.digits.length >= 4) return;
  s.digits += k; s.error = ''; renderLock();
  if (s.digits.length === 4) {
    if (await checkPin(s.digits)) { locked = false; lockState = { digits: '', error: '', mode: 'pin', code: '' }; renderLock(); render(); }
    else { s.error = 'Λάθος PIN. Δοκιμάστε ξανά.'; s.digits = ''; renderLock(); }
  }
}
function lockNow() { if (DB && DB.settings.pin) { locked = true; dlg = null; form = null; renderDlg(); renderForm(); renderLock(); } }
let lastActivity = Date.now();
['mousemove', 'keydown', 'click', 'wheel'].forEach(e => document.addEventListener(e, () => { lastActivity = Date.now(); }, { passive: true, capture: true }));
setInterval(() => { if (!locked && DB && DB.settings.pin && DB.settings.pin.autoLock && Date.now() - lastActivity > 15 * 60 * 1000) lockNow(); }, 30 * 1000);
function pinPanel() {
  const p = DB.settings.pin;
  return `<div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🔒 PIN στο άνοιγμα</h2>
    ${p ? `<p style="margin-top:-.3rem">Το HomeFlow ζητάει <b>PIN</b> κάθε φορά που ανοίγει.</p>
      <label class="check"><input type="checkbox" id="pin-autolock" ${p.autoLock ? 'checked' : ''}> Να κλειδώνει και όταν δεν το χρησιμοποιείτε για 15 λεπτά</label>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem"><button class="btn" data-action="pin-lock">🔒 Κλείδωμα τώρα</button><button class="btn" data-action="pin-set">Αλλαγή PIN</button><button class="btn danger" data-action="pin-off">Αφαίρεση PIN</button></div>`
    : `<p style="margin-top:-.3rem" class="muted">Αν το βάλετε, το HomeFlow θα ζητάει έναν 4ψήφιο αριθμό κάθε φορά που ανοίγει, ώστε να μη βλέπει κανείς άλλος τα οικονομικά σας.</p>
      <button class="btn primary" data-action="pin-set">🔒 Βάλτε PIN</button>`}
  </div>`;
}
// Απλό παράθυρο με ένα πεδίο (αντί για prompt(), που δεν λειτουργεί στην εφαρμογή)
function ask({ title, label, value = '', password = false, numeric = false, hint = '', onOk }) {
  dlg = { kind: 'ask', title, label, value, password, numeric, hint, onOk, error: '' }; renderDlg();
  setTimeout(() => { const i = $('#d-ask'); if (i) { i.focus(); i.select(); } }, 30);
}
async function saveAsk() {
  const d = dlg; const v = ($('#d-ask') || {}).value || '';
  const err = await d.onOk(v.trim());
  if (err) { d.value = v; d.error = err; renderDlg(); return; }
  if (dlg === d) { dlg = null; renderDlg(); }
}
function renderPinDlg(d) {
  if (d.kind === 'ask') return { head: 'neutral', title: esc(d.title), body: `<div class="field"><label for="d-ask">${esc(d.label)}</label>
    <input id="d-ask" ${d.password ? 'type="password"' : 'type="text"'} ${d.numeric ? 'inputmode="numeric" class="amount-input num" style="width:12rem;text-align:center"' : 'style="width:100%;font-size:1.2rem"'} value="${esc(d.value)}">
    ${d.hint ? `<div class="hint">${esc(d.hint)}</div>` : ''}</div>` };
  if (d.kind !== 'pin') return null;
  if (d.step === 'code') return { head: 'neutral', title: '🔒 Γράψτε αυτόν τον κωδικό σε χαρτί', body: `
    <p style="margin:0;font-size:1.1rem">Αν ξεχάσετε το PIN, με αυτόν τον κωδικό ξεκλειδώνει το HomeFlow. Γράψτε τον και φυλάξτε τον κάπου σίγουρο.</p>
    <div style="font-size:2.6rem;font-weight:800;letter-spacing:.12em;text-align:center;padding:1rem;border-radius:20px;background:var(--brand-soft);color:var(--brand)" class="num">${d.code.slice(0, 4)} ${d.code.slice(4)}</div>
    <label class="check"><input type="checkbox" id="d-wrote"> Τον έγραψα σε χαρτί</label>` };
  return { head: 'neutral', title: DB.settings.pin ? '🔒 Αλλαγή PIN' : '🔒 Νέο PIN', body: `
    ${DB.settings.pin ? `<div class="field"><label for="d-pold">Το τωρινό PIN</label><input id="d-pold" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.old)}"></div>` : ''}
    <div class="row">
      <div class="field"><label for="d-p1">Νέο PIN (4 αριθμοί)</label><input id="d-p1" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.p1)}"></div>
      <div class="field"><label for="d-p2">Ξανά το ίδιο</label><input id="d-p2" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.p2)}"></div>
    </div>
    <div class="hint muted">Διαλέξτε κάτι που θυμάστε, όχι 1234 ή 0000.</div>` };
}
async function savePinDlg() {
  const d = dlg; const v = id => { const e = $('#' + id); return e ? e.value.trim() : ''; };
  const fail = m => { d.error = m; renderDlg(); };
  if (d.step === 'code') {
    if (!$('#d-wrote') || !$('#d-wrote').checked) return fail('Τσεκάρετε «Τον έγραψα σε χαρτί» για να συνεχίσετε.');
    dlg = null; renderDlg(); toast('Το PIN μπήκε. Θα το ζητάει κάθε φορά που ανοίγει το HomeFlow.'); return;
  }
  d.old = v('d-pold'); d.p1 = v('d-p1'); d.p2 = v('d-p2');
  if (DB.settings.pin && !(await checkPin(d.old))) return fail('Το τωρινό PIN δεν είναι σωστό.');
  if (!/^\d{4}$/.test(d.p1)) return fail('Το PIN πρέπει να είναι 4 αριθμοί.');
  if (d.p1 !== d.p2) return fail('Τα δύο PIN δεν είναι ίδια.');
  if (['0000', '1234', '1111', '4321'].includes(d.p1)) return fail('Αυτό το PIN είναι πολύ εύκολο. Διαλέξτε άλλο.');
  const salt = newSalt(), rsalt = newSalt();
  const code = Array.from(crypto.getRandomValues(new Uint32Array(8)), x => x % 10).join('');
  DB.settings.pin = { salt, hash: await pinHash(d.p1, salt), rsalt, rhash: await pinHash(code, rsalt), autoLock: DB.settings.pin ? !!DB.settings.pin.autoLock : true };
  persist(); render();
  dlg = { kind: 'pin', step: 'code', code, error: '' }; renderDlg();
}
const pinActions = {
  'pin-set': () => { dlg = { kind: 'pin', step: 'set', old: '', p1: '', p2: '', error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-pold') || $('#d-p1'); if (i) i.focus(); }, 30); },
  'pin-off': () => ask({ title: '🔒 Αφαίρεση PIN', label: 'Για να αφαιρεθεί το PIN, γράψτε το τωρινό PIN', password: true, numeric: true,
    onOk: async p => { if (!(await checkPin(p))) return 'Λάθος PIN.'; delete DB.settings.pin; persist(); render(); toast('Το PIN αφαιρέθηκε.'); } }),
  'pin-lock': () => lockNow(),
  'lock-key': el => lockKey(el.dataset.v),
  'lock-forgot': () => { lockState = { digits: '', error: '', mode: 'code', code: '' }; renderLock(); },
  'lock-back': () => { lockState = { digits: '', error: '', mode: 'pin', code: '' }; renderLock(); },
  'lock-recover': async () => {
    const code = ($('#lock-code') || {}).value || '';
    if (await checkRecovery(code)) { delete DB.settings.pin; persist(); locked = false; renderLock(); render(); toast('Ξεκλειδώθηκε. Το PIN αφαιρέθηκε. Βάλτε νέο από τις Ρυθμίσεις.'); }
    else { lockState.error = 'Ο κωδικός δεν είναι σωστός.'; lockState.code = code; renderLock(); }
  }
};

// ======================= φόρμα καταχώρησης =======================
function openForm(type, tx, preset) {
  const base = tx ? { ...tx, amountStr: numFmt.format(paidOf(tx)).replace(/\./g, '') } : {
    id: null, type, amountStr: '', categoryId: '', note: '', date: defaultDateFor(), dayKnown: true,
    person: '', method: '', planned: false, tenantId: '', recurringId: '', ...(preset || {})
  };
  form = { ...base, makeRecurring: false, error: '' };
  renderForm();
  setTimeout(() => { const a = $('#fm-amount'); if (a) { a.focus(); a.select(); } }, 30);
}
function defaultDateFor() {
  // Αν βλέπουμε άλλον μήνα στην αρχική, προτείνουμε μέρα εκείνου του μήνα
  if (ui.page === 'home' && !(ui.year === now.getFullYear() && ui.month === now.getMonth() + 1)) return `${ui.year}-${pad(ui.month)}-01`;
  return todayStr();
}
function renderForm() {
  if (!form) { $('#modal-root').innerHTML = ''; return; }
  const f = form;
  const isExp = f.type === 'expense';
  const usage = usageCount(f.type);
  const cats = activeCats(f.type).slice();
  if (f.categoryId && !cats.some(c => c.id === f.categoryId)) { const c = catById(f.categoryId); if (c) cats.push(c); }
  cats.sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0) || a.order - b.order);
  const notes = f.categoryId ? frequentNotes(f.categoryId) : [];
  const amt = parseAmount(f.amountStr);
  const today = todayStr(), yest = shiftDay(today, -1);
  const persons = DB.settings.persons || [];
  const methods = DB.settings.methods || [];
  const isRentCat = f.type === 'income' && f.categoryId && DB.tenants.length && f.categoryId === rentCatId();
  const tenantsHere = isRentCat ? DB.tenants.filter(t => !t.end || t.end >= f.date.slice(0, 7) || t.id === f.tenantId) : [];
  $('#modal-root').innerHTML = `
  <div class="modal-back" data-action="modal-back">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head ${isExp ? 'expense' : 'income'}">
        <h2>${f.tenantId && isRentCat ? (f.id ? 'Αλλαγή πληρωμής ενοικίου' : 'Πληρωμή ενοικίου') : f.id ? (isExp ? 'Αλλαγή εξόδου' : 'Αλλαγή εσόδου') : (isExp ? 'Νέο έξοδο' : 'Νέο έσοδο')}</h2>
        ${f.id || f.tenantId ? '' : `<button class="btn small" data-action="form-switch">${isExp ? 'Είναι έσοδο;' : 'Είναι έξοδο;'}</button>`}
        <button class="btn small" data-action="form-close" title="Κλείσιμο (Esc)">✕</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="fm-amount">1. Πόσα χρήματα;</label>
          <div class="amount-wrap">
            <input id="fm-amount" class="amount-input num" inputmode="decimal" autocomplete="off" value="${esc(f.amountStr)}" placeholder="0,00">
            <span class="amount-eur">€</span>
            <span id="fm-calc" class="amount-calc">${calcHint(f.amountStr, amt)}</span>
          </div>
          <div id="fm-share" class="amount-calc" style="margin-top:.35rem">${shareHint(f, amt)}</div>
          <div class="hint">Μπορείτε να γράψετε και πρόσθεση, όπως στο Excel: <b>50+39+12,5</b></div>
        </div>
        <div class="field">
          <div class="flabel">2. Για τι;</div>
          <div class="cat-grid">${cats.map(c => `<button class="cat-btn ${c.id === f.categoryId ? 'sel' : ''}" data-action="form-cat" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>
        </div>
        ${tenantsHere.length ? `<div class="field">
          <div class="flabel">Ποιος ενοικιαστής πλήρωσε;</div>
          <div class="chips">${tenantsHere.map(t => `<button class="chip ${f.tenantId === t.id ? 'sel' : ''}" data-action="form-tenant" data-v="${esc(t.id)}">🏠 ${esc(t.name)}${t.property ? ` <span style="font-weight:500">(${esc(t.property)})</span>` : ''}</button>`).join('')}</div>
        </div>` : ''}
        <div class="field">
          <label for="fm-note">Σημείωση <span class="muted" style="font-weight:500">(προαιρετικά)</span></label>
          ${notes.length ? `<div class="chips" style="margin-bottom:.5rem">${notes.map(n => `<button class="chip ${n === f.note ? 'sel' : ''}" data-action="form-note" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
          <input id="fm-note" type="text" style="width:100%" value="${esc(f.note)}" placeholder="π.χ. λαϊκή, βενζίνη, φαρμακείο">
        </div>
        <div class="row">
          <div class="field">
            <div class="flabel">Πότε;</div>
            <div class="chips">
              <button class="chip ${f.dayKnown && f.date === today ? 'sel' : ''}" data-action="form-date" data-v="${today}">Σήμερα</button>
              <button class="chip ${f.dayKnown && f.date === yest ? 'sel' : ''}" data-action="form-date" data-v="${yest}">Χθες</button>
              <input id="fm-date" type="date" value="${esc(f.date)}" style="border:2px solid var(--line-2);border-radius:99px;padding:.3rem .9rem;min-height:2.6rem;background:var(--paper)">
            </div>
            ${f.dayKnown === false ? `<div class="hint">Από το Excel: ξέρουμε μόνο τον μήνα (${MONTHS[+f.date.slice(5, 7) - 1]}).</div>` : ''}
          </div>
          ${persons.length ? `<div class="field">
            <div class="flabel">Ποιος;</div>
            <div class="chips">${['', ...persons].map(p => `<button class="chip ${f.person === p ? 'sel' : ''}" data-action="form-person" data-v="${esc(p)}">${p ? esc(p) : 'Όλοι / —'}</button>`).join('')}</div>
          </div>` : ''}
        </div>
        <div class="row">
          <div class="field">
            <div class="flabel">Πώς;</div>
            <div class="chips">${['', ...methods].map(m => `<button class="chip ${f.method === m ? 'sel' : ''}" data-action="form-method" data-v="${esc(m)}">${m ? esc(m) : '—'}</button>`).join('')}</div>
          </div>
          <div class="field" style="display:flex;flex-direction:column;gap:.6rem;justify-content:flex-end">
            <label class="check"><input type="checkbox" id="fm-planned" ${f.planned ? 'checked' : ''}> Δεν έχει γίνει ακόμα (προγραμματισμένο)</label>
            ${f.id || f.recurringId || f.tenantId ? '' : `<label class="check"><input type="checkbox" id="fm-recurring" ${f.makeRecurring ? 'checked' : ''}> 🔁 Να γίνει πάγιο (κάθε μήνα)</label>`}
          </div>
        </div>
        ${f.error ? `<div class="notice" style="margin:0;border-color:var(--exp-line);background:var(--exp-soft);color:var(--exp)"><b>${esc(f.error)}</b></div>` : ''}
      </div>
      <div class="modal-foot">
        ${f.id ? '<button class="btn danger" data-action="form-delete">🗑 Διαγραφή</button>' : ''}
        <div class="spacer"></div>
        <button class="btn" data-action="form-close">Ακύρωση</button>
        <button class="btn big ${isExp ? 'expense' : 'income'}" style="width:auto;padding:0 2.2rem" data-action="form-save">✓ Αποθήκευση</button>
      </div>
    </div>
  </div>`;
}
function formTenant(f) { return f && f.type === 'income' && f.tenantId && DB.tenants.length && f.categoryId === rentCatId() ? tenantById(f.tenantId) : null; }
function shareHint(f, amt) {
  const t = formTenant(f);
  if (!t || shareOf(t) === 100) return '';
  const ours = amt && !isNaN(amt) ? eur(amt * shareOf(t) / 100) : '—';
  return `Γράψτε όσα έδωσε ο ενοικιαστής. Στα έσοδα μπαίνει το δικό μας ${shareOf(t)}%: <b>${ours}</b>`;
}
function calcHint(raw, amt) {
  if (!raw) return '';
  if (amt === null) return '';
  if (isNaN(amt)) return '<span class="amount-err">Δεν καταλαβαίνω το ποσό</span>';
  return isFormula(raw) ? `= ${eur(amt)}` : '';
}
function syncFormInputs() {
  if (!form) return;
  const a = $('#fm-amount'); if (a) form.amountStr = a.value;
  const n = $('#fm-note'); if (n) form.note = n.value.trim();
  const d = $('#fm-date'); if (d && d.value && d.value !== form.date) { form.date = d.value; form.dayKnown = true; }
  const p = $('#fm-planned'); if (p) form.planned = p.checked;
  const r = $('#fm-recurring'); if (r) form.makeRecurring = r.checked;
}
function saveForm() {
  syncFormInputs();
  const f = form;
  const amt = parseAmount(f.amountStr);
  if (amt === null || isNaN(amt) || amt <= 0) { f.error = 'Γράψτε ένα ποσό μεγαλύτερο από 0.'; renderForm(); $('#fm-amount').focus(); return; }
  if (!f.categoryId) { f.error = 'Διαλέξτε για τι είναι («2. Για τι;»).'; renderForm(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { f.error = 'Η ημερομηνία δεν είναι σωστή.'; renderForm(); return; }
  const isRent = f.type === 'income' && DB.tenants.length && f.categoryId === rentCatId();
  const ten = isRent && f.tenantId ? tenantById(f.tenantId) : null;
  const sh = ten ? shareOf(ten) : 100;
  const rec = {
    tenantId: isRent ? (f.tenantId || '') : '', recurringId: f.recurringId || '',
    ...(sh !== 100 ? { rentAmount: amt } : {}),
    id: f.id || uid(), date: f.date, dayKnown: f.dayKnown !== false, type: f.type, amount: sh !== 100 ? round2(amt * sh / 100) : amt, categoryId: f.categoryId,
    note: f.note || '', person: f.person || '', method: f.method || '', planned: !!f.planned,
    source: f.source || 'app', created: f.created || new Date().toISOString()
  };
  const added = [rec];
  if (f.id) {
    const i = DB.transactions.findIndex(t => t.id === f.id);
    const before = { ...DB.transactions[i] };
    DB.transactions[i] = rec;
    form = null; renderForm(); persist(); render();
    toast(`Αλλάχτηκε: ${eur(amt)} – ${catName(rec.categoryId)}`, () => { const j = DB.transactions.findIndex(t => t.id === before.id); if (j >= 0) DB.transactions[j] = before; persist(); render(); });
    return;
  }
  DB.transactions.push(rec);
  let newRec = null;
  if (f.makeRecurring) {
    newRec = { id: 'r' + uid(), type: rec.type, amount: amt, categoryId: rec.categoryId, note: rec.note, day: +rec.date.slice(8, 10), every: 1,
      from: rec.date.slice(0, 7), until: '', person: rec.person, method: rec.method, active: true, skip: [] };
    DB.recurring.push(newRec);
    rec.recurringId = newRec.id;
    generateRecurring();
  }
  form = null; renderForm(); persist(); render();
  toast(`Αποθηκεύτηκε: ${eur(amt)} – ${catName(rec.categoryId)}${newRec ? ' (και έγινε πάγιο)' : ''}`, () => {
    DB.transactions = DB.transactions.filter(t => t.id !== rec.id && !(newRec && t.recurringId === newRec.id));
    if (newRec) DB.recurring = DB.recurring.filter(r => r.id !== newRec.id);
    persist(); render();
  });
}
function deleteFromForm() {
  const id = form.id;
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  if (!confirm(`Να διαγραφεί η κίνηση ${eur(t.amount)} – ${catName(t.categoryId)};`)) return;
  DB.transactions = DB.transactions.filter(x => x.id !== id);
  // αν ήταν από πάγιο, να μην ξαναφτιαχτεί αυτόν τον μήνα
  const r = t.recurringId && DB.recurring.find(x => x.id === t.recurringId);
  const ym = t.date.slice(0, 7);
  if (r && !(r.skip || []).includes(ym)) { r.skip = [...(r.skip || []), ym]; }
  form = null; renderForm(); persist(); render();
  toast('Η κίνηση διαγράφηκε.', () => { DB.transactions.push(t); if (r) r.skip = r.skip.filter(x => x !== ym); persist(); render(); });
}

// ======================= μικρά παράθυρα =======================
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>✓ ${esc(msg)}</span>${undo ? '<button class="btn small" id="toast-undo">Αναίρεση</button>' : ''}`;
  el.classList.remove('hidden');
  if (undo) $('#toast-undo').onclick = () => { undo(); el.classList.add('hidden'); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 7000);
}
function iconPicker(catId) {
  const c = catById(catId);
  $('#modal-root').innerHTML = `<div class="modal-back" data-action="modal-back"><div class="modal" style="width:auto">
    <div class="modal-head neutral"><h2>Εικόνα για «${esc(c.name)}»</h2><button class="btn small" data-action="picker-close">✕</button></div>
    <div class="modal-body"><div class="emoji-grid">${EMOJIS.map(e => `<button data-action="picker-set" data-id="${esc(catId)}" data-v="${e}">${e}</button>`).join('')}</div></div>
  </div></div>`;
}

// ======================= εξαγωγή =======================
function csvCell(v) { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csvNum(n) { return String(round2(n)).replace('.', ','); }
async function saveText(text, name, kind) {
  if (window.homeflow) { const r = await window.homeflow.saveAs(text, name, kind); if (r && r.ok) toast('Αποθηκεύτηκε: ' + r.path); return; }
  const blob = new Blob([(kind === 'csv' ? '﻿' : '') + text], { type: kind === 'csv' ? 'text/csv' : 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
function exportTx(list, name) {
  const head = ['Ημερομηνία', 'Μήνας', 'Τύπος', 'Κατηγορία', 'Ποσό', 'Σημείωση', 'Ποιος', 'Τρόπος', 'Προγραμματισμένο'];
  const lines = [head.join(';')].concat(list.map(t => [
    t.dayKnown === false ? '' : t.date.split('-').reverse().join('/'), `${MONTHS[mOf(t) - 1]} ${yOf(t)}`,
    t.type === 'income' ? 'Έσοδο' : 'Έξοδο', catName(t.categoryId), csvNum(t.amount), t.note, t.person, t.method, t.planned ? 'Ναι' : ''
  ].map(csvCell).join(';')));
  saveText(lines.join('\r\n'), name, 'csv');
}
function exportYear(year) {
  const a = yearAgg(year);
  const lines = [['Κατηγορία', ...MONTHS, 'Σύνολο'].join(';')];
  for (const type of ['expense', 'income']) {
    lines.push(type === 'expense' ? 'ΕΞΟΔΑ' : 'ΕΣΟΔΑ');
    const data = type === 'expense' ? a.exp : a.inc;
    for (const c of DB.categories.filter(c => c.type === type).sort((x, y) => x.order - y.order)) {
      const arr = data[c.id]; if (!arr) continue;
      lines.push([csvCell(c.name), ...arr.map(csvNum), csvNum(arr.reduce((x, y) => x + y, 0))].join(';'));
    }
    const tot = type === 'expense' ? a.mExp : a.mInc;
    lines.push(['Σύνολο', ...tot.map(csvNum), csvNum(tot.reduce((x, y) => x + y, 0))].join(';'));
    lines.push('');
  }
  saveText(lines.join('\r\n'), `HomeFlow-${year}.csv`, 'csv');
}

// ======================= ενέργειες =======================
const actions = {
  ...bkActions,
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
    const before = { ...t };
    t.planned = false;
    const td = todayStr();
    if (td.slice(0, 7) === t.date.slice(0, 7)) { t.date = td; t.dayKnown = true; }
    persist(); render();
    toast(`Καταχωρήθηκε: ${eur(t.amount)} – ${catName(t.categoryId)}`, () => { Object.assign(t, before); persist(); render(); });
  },
  print: () => { if (window.homeflow) window.homeflow.print(); else window.print(); },
  'export-csv': () => exportTx(filteredList(), `HomeFlow-κινήσεις-${ui.list.year || 'όλα'}${ui.list.month ? '-' + pad(ui.list.month) : ''}.csv`),
  'export-csv-all': () => exportTx(DB.transactions.slice().sort((a, b) => a.date.localeCompare(b.date)), 'HomeFlow-όλες-οι-κινήσεις.csv'),
  'export-year': () => exportYear(ui.yearView),
  // φόρμα
  'modal-back': (el, ev) => { if (ev.target === el) { if (form) { if (confirmCloseForm()) { form = null; renderForm(); } } else $('#modal-root').innerHTML = ''; } },
  'form-close': () => { if (confirmCloseForm()) { form = null; renderForm(); } },
  'form-switch': () => { syncFormInputs(); form.type = form.type === 'expense' ? 'income' : 'expense'; form.categoryId = ''; form.error = ''; renderForm(); },
  'form-cat': el => { syncFormInputs(); form.categoryId = el.dataset.id; form.error = ''; renderForm(); },
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
    dlg = { kind: 'fieldpay', year, amountStr: r.hours && fieldRate() ? numFmt.format(Math.round(r.hours * fieldRate())).replace(/\./g, '') : '', date: todayStr(), addExpense: true, error: '' }; renderDlg();
  },
  'dlg-fyear': el => { syncDlg2(); dlg.year = +el.dataset.v; const r = fieldYear(dlg.year); dlg.amountStr = r.hours && fieldRate() ? numFmt.format(Math.round(r.hours * fieldRate())).replace(/\./g, '') : ''; renderDlg(); },
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
  'tax-pay': el => { const t = DB.taxes.find(x => x.id === el.dataset.id); const k = +el.dataset.k; dlg = { kind: 'taxpay', tid: t.id, k, amountStr: numFmt.format(t.installments[k].amount).replace(/\./g, ''), date: todayStr(), addExpense: true, error: '' }; renderDlg(); },
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
  'car-new': () => { dlg = { kind: 'car', id: null, name: '', fuel: '', kteo: '', sold: false, error: '' }; renderDlg(); },
  'car-edit': el => { const c = DB.cars.find(x => x.id === el.dataset.id); dlg = { kind: 'car', id: c.id, name: c.name, fuel: c.fuelCategoryId, kteo: c.kteo, sold: !!c.sold, error: '' }; renderDlg(); },
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
  'acc-update': el => { const a = DB.accounts.find(x => x.id === el.dataset.id); const lb = lastBal(a); dlg = { kind: 'bal', id: a.id, amountStr: lb ? numFmt.format(lb.balance).replace(/\./g, '') : '', date: todayStr(), error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-amount'); if (i) { i.focus(); i.select(); } }, 30); },
  'acc-new': () => { dlg = { kind: 'acc', id: null, bank: '', name: '', owner: '', currency: 'EUR', kind2: 'current', amountStr: '', archived: false, error: '' }; renderDlg(); },
  'acc-edit': el => { const a = DB.accounts.find(x => x.id === el.dataset.id); dlg = { kind: 'acc', id: a.id, bank: a.bank, name: a.name, owner: a.owner, currency: a.currency, kind2: a.kind, archived: a.archived, error: '' }; renderDlg(); },
  'acc-hist-del': el => {
    const a = DB.accounts.find(x => x.id === dlg.id); const i = +el.dataset.i; const h = a.history[i];
    if (!h || !confirm(`Να σβηστεί το υπόλοιπο ${money(h.balance, a.currency)} της ${shortDate(h.date)};`)) return;
    syncMoney(); a.history.splice(i, 1); persist(); renderDlg();
  },
  'dlg-bank': el => { syncMoney(); dlg.bank = el.dataset.v; renderDlg(); },
  'dlg-owner': el => { syncMoney(); dlg.owner = el.dataset.v; renderDlg(); },
  'dlg-cur': el => { syncMoney(); dlg.currency = el.dataset.v; renderDlg(); },
  'dlg-kind': el => { syncMoney(); dlg.kind2 = el.dataset.v; renderDlg(); },
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
    m.textContent = 'Έλεγχος…';
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
function applyFont() { document.documentElement.style.setProperty('--scale', (DB && DB.settings.fontScale) || 1.15); applyTheme(); }
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

// ======================= συμβάντα =======================
document.addEventListener('click', ev => {
  if (locked) { const el = ev.target.closest('[data-action]'); if (el && el.dataset.action.startsWith('lock-') && actions[el.dataset.action]) actions[el.dataset.action](el, ev); return; }
  const nav = ev.target.closest('#nav button');
  if (nav) { if (!DB) return; ui.page = nav.dataset.page; ui.tenantId = null; ui.personId = null; ui.carId = null; if (ui.page === 'year') ui.yearView = ui.year; if (ui.page === 'list') Object.assign(ui.list, { year: ui.year, month: ui.month }); render(); $('.main').scrollTop = 0; return; }
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if ((a === 'new-expense' || a === 'new-income') && !DB) return;
  if (actions[a]) actions[a](el, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'd-amount' && dlg) {
    dlg.amountStr = t.value; const c = $('#d-calc'); if (c) c.innerHTML = calcHint(t.value, parseAmount(t.value));
    const bd = $('#d-baldiff'); if (bd && dlg.kind === 'bal') bd.innerHTML = balDiffHint(DB.accounts.find(x => x.id === dlg.id), parseAmount(t.value));
    return;
  }
  if (dlg && dlg.kind === 'pbill' && /^d-p(kwh|energy|fees|r0|r1)$/.test(t.id)) { syncDlg2(); const pv = $('#d-ppreview'); if (pv) pv.innerHTML = powerPreview(dlg); return; }
  if (t.id === 'fm-amount' && form) {
    form.amountStr = t.value; const c = $('#fm-calc'); if (c) c.innerHTML = calcHint(t.value, parseAmount(t.value));
    const sh = $('#fm-share'); if (sh) sh.innerHTML = shareHint(form, parseAmount(t.value));
  } else if (t.id === 'f-q') { ui.list.q = t.value; ui.list.limit = 200; ui._focusSearch = true; render(); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'f-year') { ui.list.year = +t.value; render(); }
  else if (t.id === 'f-month') { ui.list.month = +t.value; render(); }
  else if (t.id === 'f-type') { ui.list.type = t.value; ui.list.cat = ''; render(); }
  else if (t.id === 'f-cat') { ui.list.cat = t.value; render(); }
  else if (t.id === 'year-pick') { ui.yearView = +t.value; render(); }
  else if (t.id === 'fm-date' && form) { syncFormInputs(); renderForm(); }
  else if (t.id === 'd-end' && dlg && dlg.kind === 'leave') { syncLeave(); renderDlg(); }
  else if (t.id === 'pin-autolock' && DB.settings.pin) { DB.settings.pin.autoLock = t.checked; persist(); toast(t.checked ? 'Θα κλειδώνει μετά από 15 λεπτά χωρίς χρήση.' : 'Δεν θα κλειδώνει μόνο του.'); }
  else if (t.id === 'persons') { DB.settings.persons = t.value.split(',').map(s => s.trim()).filter(Boolean); persist(); toast('Τα πρόσωπα αποθηκεύτηκαν.'); }
  else if (t.dataset.catField) {
    const c = catById(t.dataset.id); if (!c) return;
    const k = t.dataset.catField;
    if (k === 'name') { if (t.value.trim()) c.name = t.value.trim(); }
    else if (k === 'budget') c.budget = t.value ? Math.max(0, +t.value) : null;
    else c[k] = t.checked;
    persist(); if (k !== 'name' && k !== 'budget') render();
  }
});
document.addEventListener('keydown', ev => {
  if (locked) {
    if (lockState.mode === 'pin' && /^[0-9]$/.test(ev.key)) { ev.preventDefault(); lockKey(ev.key); }
    else if (lockState.mode === 'pin' && ev.key === 'Backspace') { ev.preventDefault(); lockKey('⌫'); }
    else if (lockState.mode === 'code' && ev.key === 'Enter') { ev.preventDefault(); actions['lock-recover'](); }
    return;
  }
  if (dlg) {
    if (ev.key === 'Escape') { ev.preventDefault(); dlg = null; renderDlg(); }
    else if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); saveDlg(); }
    return;
  }
  if (form) {
    if (ev.key === 'Escape') { ev.preventDefault(); if (confirmCloseForm()) { form = null; renderForm(); } }
    else if (ev.key === 'Enter' && ev.target.tagName !== 'BUTTON') { ev.preventDefault(); saveForm(); }
    return;
  }
  if (ev.key === 'Escape' && $('#modal-root').innerHTML) { $('#modal-root').innerHTML = ''; return; }
  if (!DB || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
  if (ui.page === 'home' && ev.key === 'ArrowLeft') actions['month-prev']();
  if (ui.page === 'home' && ev.key === 'ArrowRight') actions['month-next']();
});

// ενημερώσεις εφαρμογής
if (window.homeflow) {
  window.homeflow.onUpdate(s => {
    const b = $('#update-banner');
    const m = $('#upd-msg');
    if (s.status === 'manual') {
      const how = s.platform === 'darwin'
        ? 'Κατεβάστε το zip, ανοίξτε το και βάλτε το νέο HomeFlow στις Εφαρμογές στη θέση του παλιού.'
        : 'Κλείστε το HomeFlow, κατεβάστε το zip και βάλτε τον νέο φάκελο στη θέση του παλιού.';
      b.innerHTML = `🎉 Υπάρχει νέα έκδοση ${esc(s.version)}. <button class="btn small" data-action="open-url" data-url="${esc(s.url)}">Κατέβασμα</button> <span style="font-weight:500">${how} Τα στοιχεία σας δεν χάνονται.</span>`;
      b.classList.remove('hidden');
    }
    if (m) m.textContent = { manual: `Υπάρχει νέα έκδοση ${s.version}.`, checking: 'Έλεγχος…', latest: 'Έχετε την πιο νέα έκδοση ✓', downloading: 'Κατεβαίνει νέα έκδοση…', progress: `Κατέβασμα ${s.percent || 0}%…`, ready: `Η έκδοση ${s.version} είναι έτοιμη.`, error: 'Δεν έγινε έλεγχος (ίσως δεν υπάρχει ίντερνετ).' }[s.status] || '';
  });
}

async function reload() {
  const res = await store.load();
  if (res && res.error) alert(res.error);
  DB = res && validData(res.data) ? normalize(res.data) : null;
  if (DB && generateRecurring()) persist();
  if (window.homeflow) { ui.info = await window.homeflow.info(); $('#brand-version').textContent = 'Έκδοση ' + ui.info.version; }
  await refreshBackup();
  applyFont();
  if (DB && DB.settings.pin) { locked = true; renderLock(); }
  render();
}
reload();
// Κάθε ώρα: αν άλλαξε ο μήνας, να εμφανιστούν τα νέα πάγια
setInterval(() => { if (DB && !form && !dlg && generateRecurring()) { persist(); render(); } }, 60 * 60 * 1000);
