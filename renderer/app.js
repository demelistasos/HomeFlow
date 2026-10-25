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
  saveChain = saveChain.then(() => store.save(text)).then(() => setSaveState('ok')).catch(e => { console.error(e); setSaveState('error'); });
  return saveChain;
}
function setSaveState(s) {
  const el = $('#save-state');
  if (!el) return;
  el.textContent = s === 'saving' ? 'Αποθήκευση…' : s === 'error' ? '⚠ Πρόβλημα στην αποθήκευση!' : '✓ Όλα αποθηκευμένα';
  el.style.color = s === 'error' ? '#ffb4a6' : '';
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
  d.recurring = (d.recurring || []).map(r => Object.assign({ every: 1, day: 1, note: '', person: '', method: '', active: true, skip: [], until: '' }, r));
  d.tenants = (d.tenants || []).map(t => Object.assign({ property: '', rents: [], opening: 0, end: '', dueDay: 1, note: '', active: true, share: 100 }, t));
  d.accounts = (d.accounts || []).map((a, i) => Object.assign({ bank: '', name: '', owner: '', currency: 'EUR', kind: 'current', archived: false, order: i, history: [] }, a));
  d.settings.usdPerEur = +d.settings.usdPerEur || 1.16;
  d.taxes = (d.taxes || []).map(t => Object.assign({ name: '', person: '', kind: 'other', installments: [] }, t));
  d.people = (d.people || []).map(p => Object.assign({ name: '', note: '', entries: [] }, p));
  d.cars = (d.cars || []).map(c => Object.assign({ name: '', since: '', fuelCategoryId: '', sold: '', kteo: '', km: [], services: [] }, c));
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
        categoryId: r.categoryId, note: r.note || '', person: r.person || '', method: r.method || '', planned: true,
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
  info: null
};
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
  const fn = { home: homePage, list: listPage, rent: rentPage, money: moneyPage, recurring: recurringPage, tax: taxPage, people: peoplePage, cars: carsPage, year: yearPage, history: historyPage, settings: settingsPage }[ui.page];
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

  return `
  <div class="page-head">
    <div class="month-nav">
      <button class="btn" data-action="month-prev" title="Προηγούμενος μήνας">◀</button>
      <div class="month-title">${MONTHS[month - 1]} ${year}</div>
      <button class="btn" data-action="month-next" title="Επόμενος μήνας">▶</button>
    </div>
    ${isCurrent ? '' : '<button class="btn" data-action="month-today">Τρέχων μήνας</button>'}
    <div class="spacer"></div>
    <button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button>
  </div>

  <div class="cards">
    <div class="card inc"><div class="label">Έσοδα του μήνα</div><div class="value inc num">${eur(tI)}</div><div class="sub">Από αρχή χρονιάς: <b class="num">${eur(ytdI)}</b></div></div>
    <div class="card exp"><div class="label">Έξοδα του μήνα</div><div class="value exp num">${eur(tE)}</div><div class="sub">Από αρχή χρονιάς: <b class="num">${eur(ytdE)}</b></div></div>
    <div class="card bal"><div class="label">Έμειναν (έσοδα − έξοδα)</div><div class="value num" style="color:${bal < 0 ? 'var(--exp)' : 'var(--brand)'}">${eur(bal)}</div><div class="sub">Από αρχή χρονιάς: <b class="num">${eur(ytdI - ytdE)}</b></div></div>
  </div>

  <div class="grid2">
    <div>
      <div class="panel">
        <h2>Πού πήγαν τα χρήματα</h2>${bars ? '<div class="h-hint">Πατήστε μια κατηγορία για να δείτε τι περιέχει.</div>' : ''}
        ${bars || '<div class="empty">Δεν υπάρχουν έξοδα αυτόν τον μήνα ακόμα.</div>'}
      </div>
    </div>
    <div>
      ${isCurrent ? remindersPanel() : ''}
      ${homeRentPanel(ymOf(year, month))}
      ${plannedTx.length ? `<div class="panel">
        <h2>📌 Προγραμματισμένα <span class="muted">${plannedTx.length}</span></h2>
        <div class="h-hint">Πληρωμές που περιμένουμε. Πατήστε «Έγινε» όταν γίνουν.</div>
        ${plannedTx.map(t => `<div class="planned-row">
          <span class="p-ic">${esc(catIcon(t.categoryId))}</span>
          <span class="p-nm"><b>${esc(catName(t.categoryId))}</b>${t.recurringId ? ' <span class="tag">🔁 πάγιο</span>' : ''}${t.note ? `<div class="muted" style="font-size:.9rem">${esc(t.note)}</div>` : ''}</span>
          <span class="p-amt num ${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</span>
          <span class="p-act"><button class="btn small" data-action="edit" data-id="${t.id}">✎ Αλλαγή</button><button class="btn small primary" data-action="confirm-planned" data-id="${t.id}">✓ Έγινε</button></span>
        </div>`).join('')}
      </div>` : ''}
      <div class="panel">
        <h2>Τελευταίες καταχωρήσεις</h2>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>
          <button class="btn" style="margin-top:.6rem;width:100%" data-action="goto-list">Όλες οι κινήσεις του μήνα →</button>` : '<div class="empty">Τίποτα ακόμα. Πατήστε «Νέο έξοδο» αριστερά.</div>'}
      </div>
    </div>
  </div>`;
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
  <div class="filters no-print">
    <select id="f-year" title="Χρονιά">${years.map(y => `<option value="${y}" ${y === f.year ? 'selected' : ''}>${y}</option>`).join('')}<option value="0" ${!f.year ? 'selected' : ''}>Όλες οι χρονιές</option></select>
    <select id="f-month" title="Μήνας"><option value="0">Όλοι οι μήνες</option>${MONTHS.map((m, i) => `<option value="${i + 1}" ${f.month === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
    <select id="f-type"><option value="all" ${f.type === 'all' ? 'selected' : ''}>Έσοδα και έξοδα</option><option value="expense" ${f.type === 'expense' ? 'selected' : ''}>Μόνο έξοδα</option><option value="income" ${f.type === 'income' ? 'selected' : ''}>Μόνο έσοδα</option></select>
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
  wait: 'background:#eef1f0;color:var(--ink-2)',
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
  <div class="tenant-grid">${active.map(card).join('')}</div>
  ${gone.length ? `<h2 style="margin-top:1.6rem">🚪 Έφυγαν <span class="muted" style="font-size:1rem;font-weight:500">(ξενοίκιαστα)</span></h2><div class="tenant-grid">${gone.map(card).join('')}</div>` : ''}`
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
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" stroke="#e7e3da"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" fill="#6f7a75">${kfmt(v)}</text>`;
  show.forEach((p, k) => {
    const x = L + k * gw + gw * 0.18, bw = gw * 0.64;
    svg += `<rect x="${x}" y="${y(p.v)}" width="${bw}" height="${y(0) - y(p.v)}" rx="4" fill="#0f4c47"><title>${ymLabel(p.s)}: ${eur0(p.v)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="14" fill="#4a5550">${MONTHS_SHORT[+p.s.slice(5) - 1]}${p.s.slice(5) === '01' ? " '" + p.s.slice(2, 4) : ''}</text>`;
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
  const groups = KINDS.map(([k, label, icon]) => {
    const list = accs.filter(a => a.kind === k).sort((x, y) => (x.bank || '').localeCompare(y.bank || '', 'el') || x.order - y.order);
    if (!list.length) return '';
    const sub = { EUR: 0, USD: 0 };
    for (const a of list) sub[a.currency] += (lastBal(a) || {}).balance || 0;
    return `<div class="panel"><h2>${icon} ${label} <span class="muted">${[sub.EUR ? eur(sub.EUR) : '', sub.USD ? usdFmt.format(sub.USD) : ''].filter(Boolean).join(' + ')}</span></h2><div class="tx-list">${list.map(row).join('')}</div></div>`;
  }).join('');
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
  ${lastUpd ? `<div class="h-hint" style="margin:-.6rem 0 1rem">Τελευταία ενημέρωση υπολοίπου: ${shortDate(lastUpd)}. Όταν δείτε κίνηση στην τράπεζα, πατήστε «✎ Νέο υπόλοιπο» στον λογαριασμό.</div>` : ''}
  <div class="panel"><h2>Όλα μαζί, μήνα με μήνα (σε €)</h2>${moneyChart()}</div>
  <div class="panel"><h2>Ανά τράπεζα (σε €)</h2>
      <div class="bars">${Object.entries(byBank).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar-row" style="cursor:default"><span class="ic">🏦</span><span><span class="nm">${esc(k)}</span><div class="track"><div class="fill" style="width:${Math.max(2, v / Math.max(...Object.values(byBank)) * 100)}%;background:var(--brand)"></div></div></span><span class="amt num">${eur0(v)}</span></div>`).join('')}</div></div>
  ${groups}
  ${closed.length ? `<div class="panel"><h2>🗄 Κλειστοί λογαριασμοί</h2><div class="tx-list">${closed.map(a => `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto"><span class="ic">🗄</span><span><div class="t1">${esc(a.bank)} · ${esc(a.name)}</div></span><button class="btn small" data-action="acc-edit" data-id="${a.id}">⚙</button></div>`).join('')}</div></div>` : ''}`
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
  return out.sort((a, b) => a.sort - b.sort);
}
function remindersPanel() {
  const r = reminders();
  if (!r.length) return '';
  return `<div class="panel" style="border-left:8px solid var(--gold)"><h2>🔔 Να θυμηθώ</h2>
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
  ${next.length ? `<div class="panel"><h2>📅 Επόμενες δόσεις</h2>${next.map(({ t, i, k }) => `<div class="planned-row">
    <span class="p-ic">🏛️</span><span class="p-nm"><b>${esc(t.name)}</b> – ${esc(t.person)}<div class="muted" style="font-size:.9rem">δόση ${k + 1} από ${t.installments.length} · λήγει ${shortDate(i.due)}</div></span>
    <span class="p-amt num exp">${eur(i.amount)}</span><span class="p-act"><button class="btn small primary" data-action="tax-pay" data-id="${t.id}" data-k="${k}">✓ Πλήρωσα</button></span></div>`).join('')}</div>` : ''}
  ${obligations.map(t => {
    const pd = t.installments.filter(i => i.paid).length;
    const rest = round2(t.installments.filter(i => !i.paid).reduce((a, i) => a + i.amount, 0));
    return `<div class="panel"><h2>🏛️ ${esc(t.name)} – ${esc(t.person)} <span class="muted">${pd} από ${t.installments.length} δόσεις πληρωμένες${rest ? ` · μένουν ${eur(rest)}` : ' · εξοφλήθηκε ✓'}</span>
      <span style="flex:1"></span><button class="btn small ghost no-print" data-action="tax-edit" data-id="${t.id}">✎</button></h2>
      <div class="track" style="height:.6rem;background:#efece5;border-radius:99px;overflow:hidden;margin-bottom:.8rem"><div style="height:100%;width:${pd / Math.max(1, t.installments.length) * 100}%;background:var(--inc)"></div></div>
      <table class="data"><thead><tr><th style="width:3rem">#</th><th>Λήξη</th><th class="r">Ποσό</th><th>Κατάσταση</th><th></th></tr></thead><tbody>${t.installments.map((i, k) => instRow(t, i, k)).join('')}</tbody></table></div>`;
  }).join('') || `<div class="panel empty">Δεν υπάρχουν δόσεις για το ${year}. Πατήστε «+ Νέα οφειλή» για να προσθέσετε π.χ. ΕΝΦΙΑ ή φόρο εισοδήματος.</div>`}`;
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
  <div class="notice" style="background:var(--brand-soft);border-color:#c5dcd8;color:var(--brand)">Για ανθρώπους που πληρώνουμε κάτι για λογαριασμό τους, ή που μας δίνουν χρήματα. Η εφαρμογή κρατάει ποιος χρωστάει σε ποιον. Αυτά <b>δεν</b> μετράνε στα έξοδα και τα έσοδα του σπιτιού.</div>
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
    <div class="grid2">
      <div class="panel"><h2>🔧 Σέρβις και επισκευές</h2>
        ${sv.length ? `<table class="data"><thead><tr><th>Ημερομηνία</th><th class="r">Χλμ</th><th>Τι έγινε</th><th class="r">Επόμενο</th></tr></thead><tbody>${sv.map(s => `<tr data-action="service-edit" data-id="${c.id}" data-s="${s.id}"><td>${shortDate(s.date)}</td><td class="r num">${s.km ? int0.format(s.km) : ''}</td><td>${esc(s.work)}${s.cost ? ` <span class="muted">(${eur(s.cost)})</span>` : ''}</td><td class="r num">${s.nextKm ? int0.format(s.nextKm) : ''}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Κανένα σέρβις ακόμα.</div>'}</div>
      <div class="panel"><h2>📍 Χιλιόμετρα</h2>
        ${log.length ? `<table class="data"><tbody>${log.map((k, i) => `<tr style="cursor:default"><td>${shortDate(k.date)}</td><td class="r num"><b>${int0.format(k.km)}</b></td><td class="r muted num">${log[i + 1] ? '+' + int0.format(k.km - log[i + 1].km) : ''}</td><td style="width:3rem"><button class="btn small ghost" data-action="km-del" data-id="${c.id}" data-d="${k.date}" title="Σβήσιμο">🗑</button></td></tr>`).join('')}</tbody></table>` : '<div class="empty">Δεν έχουν γραφτεί χιλιόμετρα.</div>'}</div>
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
    ['d-text', 'text'], ['d-km', 'kmStr'], ['d-work', 'work'], ['d-next', 'nextStr'], ['d-cname', 'name'], ['d-fuel', 'fuel'], ['d-kteo', 'kteo']]) { const x = v(id); if (x !== undefined) d[k] = typeof x === 'string' ? x.trim() : x; }
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
        <div class="t2">${esc(freqText(r))}${r.active && nd ? ` · επόμενο: <b>${ymLabel(nd)}</b>` : ''}${r.person ? ' · ' + esc(r.person) : ''}</div></span>
      <span class="amt num ${r.type === 'income' ? 'inc' : 'exp'}">${r.type === 'income' ? '+' : '−'} ${eur(r.amount)}</span>
      <span style="display:flex;gap:.4rem">
        <button class="btn small" data-action="rec-edit" data-id="${r.id}">✎ Αλλαγή</button>
        ${r.active ? `<button class="btn small" data-action="rec-stop" data-id="${r.id}">Σταμάτημα</button>` : `<button class="btn small" data-action="rec-resume" data-id="${r.id}">▶ Συνέχεια</button><button class="btn small danger" data-action="rec-delete" data-id="${r.id}">🗑</button>`}
      </span></div>`;
  };
  const list = type => DB.recurring.filter(r => r.type === type).sort((a, b) => (b.active - a.active) || catName(a.categoryId).localeCompare(catName(b.categoryId), 'el'));
  const monthlyOut = round2(DB.recurring.filter(r => r.active && r.type === 'expense').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const monthlyIn = round2(DB.recurring.filter(r => r.active && r.type === 'income').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const exp = list('expense'), inc = list('income');
  return `
  <div class="page-head"><h1>Πάγια</h1><div class="spacer"></div>
    <button class="btn expense no-print" data-action="rec-new" data-type="expense">+ Πάγιο έξοδο</button>
    <button class="btn income no-print" data-action="rec-new" data-type="income">+ Πάγιο έσοδο</button></div>
  <div class="notice" style="background:var(--brand-soft);border-color:#c5dcd8;color:var(--brand)">Πάγια είναι τα ποσά που επαναλαμβάνονται, όπως ΔΕΗ, τηλέφωνο, δόσεις, σύνταξη. Τα γράφετε μία φορά εδώ και κάθε μήνα εμφανίζονται μόνα τους στον «Μήνα», στα <b>📌 Προγραμματισμένα</b>, για να πατήσετε <b>«✓ Έγινε»</b>.</div>
  <div class="cards" style="grid-template-columns:repeat(2,1fr)">
    <div class="card exp"><div class="label">Πάγια έξοδα τον μήνα (περίπου)</div><div class="value exp num">${eur(monthlyOut)}</div></div>
    <div class="card inc"><div class="label">Πάγια έσοδα τον μήνα (περίπου)</div><div class="value inc num">${eur(monthlyIn)}</div></div>
  </div>
  <div class="panel"><h2>Πάγια έξοδα</h2>${exp.length ? `<div class="tx-list">${exp.map(row).join('')}</div>` : '<div class="empty">Κανένα ακόμα.</div>'}</div>
  <div class="panel"><h2>Πάγια έσοδα</h2>${inc.length ? `<div class="tx-list">${inc.map(row).join('')}</div>` : '<div class="empty">Κανένα ακόμα.</div>'}</div>`;
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
  dlg = r ? { kind: 'rec', id: r.id, type: r.type, amountStr: numFmt.format(r.amount).replace(/\./g, ''), categoryId: r.categoryId, note: r.note, day: r.day, every: r.every, from: r.from, person: r.person, method: r.method, error: '' }
    : { kind: 'rec', id: null, type, amountStr: '', categoryId: '', note: '', day: new Date().getDate(), every: 1, from: curYM(), person: '', method: '', error: '' };
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
  const r2 = renderDlg2(d);
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
        ${d.error ? `<div class="notice" style="margin:0;border-color:#e3b3a8;background:var(--exp-soft);color:var(--exp)"><b>${esc(d.error)}</b></div>` : ''}</div>
      <div class="modal-foot">
        ${d.kind === 'tenant' && d.id ? '<button class="btn danger" data-action="tenant-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'tax' && d.id ? '<button class="btn danger" data-action="tax-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'pentry' && d.eid ? '<button class="btn danger" data-action="pentry-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'service' && d.sid ? '<button class="btn danger" data-action="service-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'person' && d.id ? '<button class="btn danger" data-action="person-delete">🗑 Διαγραφή</button>' : ''}
        ${d.kind === 'car' && d.id ? '<button class="btn danger" data-action="car-delete">🗑 Διαγραφή</button>' : ''}
        <div class="spacer"></div>
        <button class="btn" data-action="dlg-close">Ακύρωση</button>
        <button class="btn big primary" style="width:auto;padding:0 2.2rem" data-action="dlg-save">✓ Αποθήκευση</button>
      </div>
    </div>
  </div>`;
}
function saveDlg() {
  if (['taxpay', 'tax', 'person', 'pentry', 'km', 'service', 'car'].includes(dlg.kind)) { saveDlg2(); return; }
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
    const fields = { type: d.type, amount: amt, categoryId: d.categoryId, note: d.note, day: d.day, every: d.every, from: d.from, person: d.person, method: d.method };
    if (d.id) {
      const r = DB.recurring.find(x => x.id === d.id);
      Object.assign(r, fields);
      // οι προγραμματισμένες (όχι οι πληρωμένες) ξαναφτιάχνονται με τα νέα στοιχεία
      DB.transactions = DB.transactions.filter(t => !(t.recurringId === r.id && t.planned));
    } else {
      DB.recurring.push({ id: 'r' + uid(), active: true, skip: [], until: '', ...fields });
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
  <div class="panel">
    <h2>Έσοδα και έξοδα ανά μήνα</h2>
    ${monthChart(a.mInc, a.mExp, lastY, year)}
  </div>
  <div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem;margin-bottom:.3rem">Έξοδα ανά κατηγορία</h2><div class="h-hint" style="margin:0 .2rem .7rem">Όπως στο Excel. Πατήστε ένα ποσό για να δείτε από τι αποτελείται.</div>
    ${sheet('expense')}
  </div>
  <div class="panel" style="padding:0;border:0;box-shadow:none;background:transparent">
    <h2 style="padding:0 .2rem">Έσοδα ανά κατηγορία</h2>
    ${sheet('income')}
    <div class="sheet-wrap" style="margin-top:1rem"><table class="sheet">
      <thead><tr><th class="cat">Υπόλοιπο</th>${MONTHS_SHORT.map(m => `<th>${m}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="cat">Διαφορά μήνα</td>${a.mInc.map((v, m) => { const d = v - a.mExp[m]; return `<td class="num ${d < 0 ? 'over' : 'ok'}">${numFmt.format(d)}</td>`; }).join('')}</tr>
        <tr class="total"><td class="cat">Από αρχή χρονιάς</td>${balRow.map(v => `<td class="num ${v < 0 ? 'over' : ''}">${numFmt.format(v)}</td>`).join('')}</tr>
      </tbody></table></div>
  </div>`;
}

function monthChart(inc, exp, lastExp, year) {
  const W = 1000, H = 300, L = 60, B = 34, T = 14;
  const max = Math.max(1, ...inc, ...exp, ...(lastExp || [0]));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = v => T + (H - T - B) * (1 - v / top);
  const gw = (W - L - 10) / 12;
  let g = '';
  for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" stroke="#e7e3da"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" fill="#6f7a75">${kfmt(v)}</text>`;
  let bars = '';
  for (let m = 0; m < 12; m++) {
    const x = L + m * gw + gw * 0.14, bw = gw * 0.34;
    bars += `<rect x="${x}" y="${y(inc[m])}" width="${bw}" height="${y(0) - y(inc[m])}" rx="4" fill="#17703a"><title>Έσοδα ${MONTHS[m]}: ${eur(inc[m])}</title></rect>`;
    bars += `<rect x="${x + bw + 3}" y="${y(exp[m])}" width="${bw}" height="${y(0) - y(exp[m])}" rx="4" fill="#b3361f"><title>Έξοδα ${MONTHS[m]}: ${eur(exp[m])}</title></rect>`;
    bars += `<text x="${L + m * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="15" fill="#4a5550">${MONTHS_SHORT[m]}</text>`;
  }
  let line = '';
  if (lastExp) {
    const pts = lastExp.map((v, m) => `${L + m * gw + gw / 2},${y(v)}`).join(' ');
    line = `<polyline points="${pts}" fill="none" stroke="#8a8f8c" stroke-width="2.5" stroke-dasharray="6 5"/>` + lastExp.map((v, m) => `<circle cx="${L + m * gw + gw / 2}" cy="${y(v)}" r="4" fill="#8a8f8c"><title>Έξοδα ${MONTHS[m]} ${year - 1}: ${eur(v)}</title></circle>`).join('');
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Έσοδα και έξοδα ανά μήνα">${g}${bars}${line}</svg>
    <div class="legend"><span><i style="background:#17703a"></i>Έσοδα</span><span><i style="background:#b3361f"></i>Έξοδα</span>${lastExp ? `<span><i style="background:#8a8f8c"></i>Έξοδα ${year - 1}</span>` : ''}</div>`;
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
  for (let v = 0; v <= top + 1e-6; v += step) svg += `<line x1="${L}" x2="${W - 5}" y1="${y(v)}" y2="${y(v)}" stroke="#e7e3da"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" fill="#6f7a75">${kfmt(v)}</text>`;
  rows.forEach((r, k) => {
    const x = L + k * gw + gw * 0.1, bw = gw * 0.38;
    if (r.i != null) svg += `<rect x="${x}" y="${y(r.i)}" width="${bw}" height="${y(0) - y(r.i)}" rx="3" fill="#17703a"><title>Έσοδα ${r.y}: ${eur(r.i)}</title></rect>`;
    if (r.e != null) svg += `<rect x="${x + bw + 2}" y="${y(r.e)}" width="${bw}" height="${y(0) - y(r.e)}" rx="3" fill="#b3361f"><title>Έξοδα ${r.y}: ${eur(r.e)}</title></rect>`;
    svg += `<text x="${L + k * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="${rows.length > 16 ? 12 : 14}" fill="#4a5550">${rows.length > 16 ? "'" + String(r.y).slice(2) : r.y}</text>`;
  });
  return `
  <div class="page-head"><h1>Ιστορικό χρόνων</h1><div class="spacer"></div><button class="btn no-print" data-action="print">🖨️ Εκτύπωση</button></div>
  <div class="panel">
    <h2>Έσοδα και έξοδα ανά χρονιά</h2>
    <svg class="chart" viewBox="0 0 ${W} ${H}">${svg}</svg>
    <div class="legend"><span><i style="background:#17703a"></i>Έσοδα</span><span><i style="background:#b3361f"></i>Έξοδα</span></div>
  </div>
  <div class="sheet-wrap"><table class="data">
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

  <div class="panel set-section">
    <h2>🔠 Μέγεθος γραμμάτων</h2>
    <div class="chips">${FONT_SCALES.map(f => `<button class="chip ${s.fontScale === f.v ? 'sel' : ''}" data-action="font" data-v="${f.v}" style="font-size:${f.v}rem">${f.l}</button>`).join('')}</div>
  </div>

  <div class="panel set-section">
    <h2>📂 Κατηγορίες εξόδων</h2>
    <p class="muted" style="margin-top:-.4rem">«Πρόβλεψη» είναι πόσα υπολογίζουμε να ξοδέψουμε τη χρονιά (φαίνεται στη σελίδα «Η χρονιά»). «Έκτακτο» σημαίνει ότι δεν μετράει στα «έξοδα χωρίς έκτακτα». Οι κρυφές κατηγορίες δεν εμφανίζονται στη νέα καταχώρηση.</p>
    ${catTable('expense')}
  </div>
  <div class="panel set-section">
    <h2>💶 Κατηγορίες εσόδων</h2>
    ${catTable('income')}
  </div>

  <div class="panel set-section">
    <h2>👪 Πρόσωπα</h2>
    <p class="muted" style="margin-top:-.4rem">Ποιοι εμφανίζονται στο «Ποιος;» της καταχώρησης. Χωρίστε με κόμμα.</p>
    <input type="text" id="persons" value="${esc(s.persons.join(', '))}" style="width:100%;border:2px solid var(--line-2);border-radius:10px;padding:.6rem .8rem">
  </div>

  <div class="panel set-section">
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

  <div class="panel set-section">
    <h2>🔄 Έκδοση</h2>
    <p style="margin-top:0">HomeFlow έκδοση <b>${esc(info.version || '—')}</b>. Όταν βγαίνει νέα έκδοση, εμφανίζεται ειδοποίηση πάνω πάνω με κουμπί «Κατέβασμα».</p>
    <button class="btn" data-action="check-updates">Έλεγχος για νέα έκδοση</button>
    <span id="upd-msg" class="muted" style="margin-left:.8rem"></span>
  </div>`;
}

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
              <input id="fm-date" type="date" value="${esc(f.date)}" style="border:2px solid var(--line-2);border-radius:99px;padding:.3rem .8rem;min-height:2.6rem">
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
        ${f.error ? `<div class="notice" style="margin:0;border-color:#e3b3a8;background:var(--exp-soft);color:var(--exp)"><b>${esc(f.error)}</b></div>` : ''}
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
  'dlg-every': el => { syncDlg(); dlg.every = +el.dataset.v; renderDlg(); },
  'dlg-person': el => { syncDlg(); dlg.person = el.dataset.v; renderDlg(); },
  'dlg-method': el => { syncDlg(); dlg.method = el.dataset.v; renderDlg(); },
  'dlg-clear-end': () => { syncDlg(); dlg.end = ''; renderDlg(); },
  'dlg-share': el => { syncDlg(); dlg.shareStr = el.dataset.v; renderDlg(); },
  'dlg-end': el => { dlg.end = el.dataset.v; dlg.error = ''; renderDlg(); },
  // εφορία
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
  'rate-edit': () => {
    const r = prompt('Ισοτιμία: 1 ευρώ = πόσα δολάρια; (π.χ. 1,16)', String(DB.settings.usdPerEur || 1.16).replace('.', ','));
    if (r === null) return;
    const v = parseFloat(r.replace(',', '.'));
    if (!(v > 0.3 && v < 3)) { alert('Η ισοτιμία δεν φαίνεται σωστή.'); return; }
    DB.settings.usdPerEur = v; persist(); render();
  },
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
  'pick-icon': el => iconPicker(el.dataset.id),
  'picker-close': () => { $('#modal-root').innerHTML = ''; },
  'picker-set': el => { const c = catById(el.dataset.id); c.icon = el.dataset.v; $('#modal-root').innerHTML = ''; persist(); render(); },
  'cat-up': el => moveCat(el.dataset.id, -1),
  'cat-down': el => moveCat(el.dataset.id, 1),
  'cat-add': el => {
    const type = el.dataset.type;
    const name = prompt(type === 'expense' ? 'Όνομα νέας κατηγορίας εξόδων:' : 'Όνομα νέας κατηγορίας εσόδων:');
    if (!name || !name.trim()) return;
    const order = Math.max(0, ...DB.categories.map(c => c.order)) + 1;
    DB.categories.push({ id: 'c' + uid(), name: name.trim(), icon: type === 'expense' ? '📦' : '💶', type, color: PALETTE[order % PALETTE.length], budget: null, extra: false, archived: false, order });
    persist(); render();
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
function applyFont() { document.documentElement.style.setProperty('--scale', (DB && DB.settings.fontScale) || 1.15); }

// ======================= συμβάντα =======================
document.addEventListener('click', ev => {
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
  applyFont();
  render();
}
reload();
// Κάθε ώρα: αν άλλαξε ο μήνας, να εμφανιστούν τα νέα πάγια
setInterval(() => { if (DB && !form && !dlg && generateRecurring()) { persist(); render(); } }, 60 * 60 * 1000);
