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
    history: {}
  };
}
function normalize(d) {
  d.settings = Object.assign({ persons: [], methods: ['Μετρητά', 'Τράπεζα', 'Κάρτα'], fontScale: 1.15 }, d.settings || {});
  d.categories = (d.categories || []).map((c, i) => Object.assign({ color: PALETTE[i % PALETTE.length], budget: null, extra: false, archived: false, order: i }, c));
  d.transactions = (d.transactions || []).filter(t => t && t.date && t.categoryId).map(t => Object.assign({ note: '', person: '', method: '', planned: false, dayKnown: true }, t, { amount: +t.amount || 0 }));
  d.history = d.history || {};
  return d;
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
  const fn = { home: homePage, list: listPage, year: yearPage, history: historyPage, settings: settingsPage }[ui.page];
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
      ${plannedTx.length ? `<div class="panel">
        <h2>📌 Προγραμματισμένα <span class="muted">${plannedTx.length}</span></h2>
        <div class="h-hint">Πληρωμές που περιμένουμε. Πατήστε «Έγινε» όταν γίνουν.</div>
        ${plannedTx.map(t => `<div class="planned-row">
          <span class="p-ic">${esc(catIcon(t.categoryId))}</span>
          <span class="p-nm"><b>${esc(catName(t.categoryId))}</b>${t.note ? `<div class="muted" style="font-size:.9rem">${esc(t.note)}</div>` : ''}</span>
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
  const sub = [dateLabel(t), t.person, t.method].filter(Boolean).map(esc).join(' · ');
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
      const hay = [catName(t.categoryId), t.note, t.person, t.method, numFmt.format(t.amount), String(t.amount)].join(' ').toLowerCase();
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
      <td>${esc(t.person)}</td><td>${esc(t.method)}</td>
      <td class="r num ${t.type === 'income' ? 'inc' : 'exp'}" style="font-weight:700">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</td></tr>`).join('')}</tbody>
  </table></div>
  ${rows.length > shown.length ? `<div style="text-align:center;margin-top:1rem"><button class="btn" data-action="more">Δείτε περισσότερες (${rows.length - shown.length} ακόμα)</button></div>` : ''}`
    : '<div class="panel empty">Δεν βρέθηκαν κινήσεις με αυτά τα φίλτρα.</div>'}`;
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
    <p style="margin-top:0">HomeFlow έκδοση <b>${esc(info.version || '—')}</b>. Οι νέες εκδόσεις κατεβαίνουν μόνες τους.</p>
    <button class="btn" data-action="check-updates">Έλεγχος για νέα έκδοση</button>
    <span id="upd-msg" class="muted" style="margin-left:.8rem"></span>
  </div>`;
}

// ======================= φόρμα καταχώρησης =======================
function openForm(type, tx) {
  const base = tx ? { ...tx, amountStr: numFmt.format(tx.amount).replace(/\./g, '') } : {
    id: null, type, amountStr: '', categoryId: '', note: '', date: defaultDateFor(), dayKnown: true,
    person: '', method: '', planned: false, repeat: false
  };
  form = { ...base, repeat: false, error: '' };
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
  $('#modal-root').innerHTML = `
  <div class="modal-back" data-action="modal-back">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head ${isExp ? 'expense' : 'income'}">
        <h2>${f.id ? (isExp ? 'Αλλαγή εξόδου' : 'Αλλαγή εσόδου') : (isExp ? 'Νέο έξοδο' : 'Νέο έσοδο')}</h2>
        ${f.id ? '' : `<button class="btn small" data-action="form-switch">${isExp ? 'Είναι έσοδο;' : 'Είναι έξοδο;'}</button>`}
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
          <div class="hint">Μπορείτε να γράψετε και πρόσθεση, όπως στο Excel: <b>50+39+12,5</b></div>
        </div>
        <div class="field">
          <div class="flabel">2. Για τι;</div>
          <div class="cat-grid">${cats.map(c => `<button class="cat-btn ${c.id === f.categoryId ? 'sel' : ''}" data-action="form-cat" data-id="${esc(c.id)}"><span class="ic">${esc(c.icon)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>
        </div>
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
            ${f.id ? '' : `<label class="check"><input type="checkbox" id="fm-repeat" ${f.repeat ? 'checked' : ''}> Επανάληψη κάθε μήνα ως τον Δεκέμβριο</label>`}
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
  const r = $('#fm-repeat'); if (r) form.repeat = r.checked;
}
function saveForm() {
  syncFormInputs();
  const f = form;
  const amt = parseAmount(f.amountStr);
  if (amt === null || isNaN(amt) || amt <= 0) { f.error = 'Γράψτε ένα ποσό μεγαλύτερο από 0.'; renderForm(); $('#fm-amount').focus(); return; }
  if (!f.categoryId) { f.error = 'Διαλέξτε για τι είναι («2. Για τι;»).'; renderForm(); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { f.error = 'Η ημερομηνία δεν είναι σωστή.'; renderForm(); return; }
  const rec = {
    id: f.id || uid(), date: f.date, dayKnown: f.dayKnown !== false, type: f.type, amount: amt, categoryId: f.categoryId,
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
  if (f.repeat) {
    const y = +f.date.slice(0, 4), m = +f.date.slice(5, 7), d = +f.date.slice(8, 10);
    for (let mm = m + 1; mm <= 12; mm++) {
      const last = new Date(y, mm, 0).getDate();
      const r = { ...rec, id: uid(), date: `${y}-${pad(mm)}-${pad(Math.min(d, last))}`, planned: true, created: new Date().toISOString() };
      DB.transactions.push(r); added.push(r);
    }
  }
  form = null; renderForm(); persist(); render();
  const ids = new Set(added.map(t => t.id));
  toast(`Αποθηκεύτηκε: ${eur(amt)} – ${catName(rec.categoryId)}${added.length > 1 ? ` (και ${added.length - 1} μήνες ακόμα)` : ''}`, () => {
    DB.transactions = DB.transactions.filter(t => !ids.has(t.id)); persist(); render();
  });
}
function deleteFromForm() {
  const id = form.id;
  const t = DB.transactions.find(x => x.id === id);
  if (!t) return;
  if (!confirm(`Να διαγραφεί η κίνηση ${eur(t.amount)} – ${catName(t.categoryId)};`)) return;
  DB.transactions = DB.transactions.filter(x => x.id !== id);
  form = null; renderForm(); persist(); render();
  toast('Η κίνηση διαγράφηκε.', () => { DB.transactions.push(t); persist(); render(); });
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
  'install-update': () => window.homeflow.installUpdate(),
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
  DB = d; applyFont(); await persist(); ui.page = 'home'; render();
  toast(`Φορτώθηκαν ${d.transactions.length} κινήσεις.`);
}
function applyFont() { document.documentElement.style.setProperty('--scale', (DB && DB.settings.fontScale) || 1.15); }

// ======================= συμβάντα =======================
document.addEventListener('click', ev => {
  const nav = ev.target.closest('#nav button');
  if (nav) { if (!DB) return; ui.page = nav.dataset.page; if (ui.page === 'year') ui.yearView = ui.year; if (ui.page === 'list') Object.assign(ui.list, { year: ui.year, month: ui.month }); render(); $('.main').scrollTop = 0; return; }
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if ((a === 'new-expense' || a === 'new-income') && !DB) return;
  if (actions[a]) actions[a](el, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'fm-amount' && form) {
    form.amountStr = t.value; const c = $('#fm-calc'); if (c) c.innerHTML = calcHint(t.value, parseAmount(t.value));
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
    if (s.status === 'ready') {
      b.innerHTML = `🎉 Νέα έκδοση ${esc(s.version)} είναι έτοιμη. <button class="btn small" data-action="install-update">Επανεκκίνηση τώρα</button> <span style="font-weight:500">(ή θα μπει μόνη της στο επόμενο κλείσιμο)</span>`;
      b.classList.remove('hidden');
    }
    if (m) m.textContent = { checking: 'Έλεγχος…', latest: 'Έχετε την πιο νέα έκδοση ✓', downloading: 'Κατεβαίνει νέα έκδοση…', progress: `Κατέβασμα ${s.percent || 0}%…`, ready: `Η έκδοση ${s.version} είναι έτοιμη.`, error: 'Δεν έγινε έλεγχος (ίσως δεν υπάρχει ίντερνετ).' }[s.status] || '';
  });
}

async function reload() {
  const res = await store.load();
  if (res && res.error) alert(res.error);
  DB = res && validData(res.data) ? normalize(res.data) : null;
  if (window.homeflow) { ui.info = await window.homeflow.info(); $('#brand-version').textContent = 'Έκδοση ' + ui.info.version; }
  applyFont();
  render();
}
reload();
