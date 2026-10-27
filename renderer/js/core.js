'use strict';
/* HomeFlow – η εφαρμογή (χωρίς εξωτερικές βιβλιοθήκες) */

// ======================= σταθερές =======================
const MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
const MONTHS_SHORT = ['Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'];
const WEEKDAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const EMOJI_GROUPS = [
  ['Σπίτι και λογαριασμοί', '🏠 🏡 🏢 🏘️ 🏗️ 🏚️ 🔑 🗝️ 💡 💧 🔥 ⚡ 🔌 📞 📱 📺 📡 🌐 💻 🖨️ 🛋️ 🛏️ 🚿 🛁 🧺 🧹 🧽 🧴 🪴 🧯 🔨 🪛 🔧 🪚 🎨 🧱 🪟 🚪'.split(' ')],
  ['Φαγητό και σούπερ μάρκετ', '🛒 🧺 🥬 🥦 🍅 🥕 🍎 🍊 🍇 🍉 🥩 🍗 🐟 🦐 🥚 🥛 🧀 🧈 🍞 🥐 🍝 🍕 🍔 🥙 🍽️ ☕ 🍷 🍺 🥤 🍰 🍫 🍦 🫒 🍯 🧂'.split(' ')],
  ['Αυτοκίνητα και μετακινήσεις', '🚗 🚙 🚕 🚐 🛻 🚚 🚛 🏎️ 🚓 🚑 🚌 🏍️ 🛵 🚲 🛴 ⛽ 🔋 🅿️ 🛣️ 🚦 🚧 🛞 🚘 ✈️ 🚆 🚇 🚢 ⛴️ 🚖 🧳'.split(' ')],
  ['Υγεία', '💊 🩺 🦷 👓 🏥 💉 🩹 🧪 🩻 ❤️ 🧠 👂 🦴 ♿ 🧘 🏋️ 🏃 🚭'.split(' ')],
  ['Οικογένεια και πρόσωπα', '👶 👧 👦 👩 👨 👵 👴 👨‍👩‍👦 👪 💑 🤝 🙏 🎂 🎁 🎉 💐 💍 ⛪ 🕯️'.split(' ')],
  ['Ρούχα και προσωπικά', '👕 👖 👗 👔 🧥 👟 👞 👠 👜 🎒 💄 💇 💅 ⌚ 💍 🕶️ 🧣 🧤'.split(' ')],
  ['Ελεύθερος χρόνος', '⚽ 🏀 🎾 🎭 🎬 🎵 🎤 📚 📖 🎮 🎲 🎣 🏖️ ⛰️ 🏕️ 🗺️ 🏨 🎡 🎟️ 📷 🎸 ♟️'.split(' ')],
  ['Ζώα και φύση', '🐶 🐱 🐦 🐟 🐴 🐔 🐝 🌳 🌱 🌾 🌻 🌷 🍀 🍇 🫒 🍋 🚜 💦'.split(' ')],
  ['Χρήματα και χαρτιά', '💶 💵 💰 🪙 💳 🏦 🏛️ 🧾 📄 📃 📑 📊 📈 📉 💼 🗂️ 📁 🖋️ ✉️ 📮 📦 🛡️ ⚖️ 🔒 🎓 🏫 📝 🖊️'.split(' ')],
  ['Διάφορα', '🛍️ 🎀 ⭐ ✨ 🔔 📌 🏷️ ♻️ 🧸 🪑 🕰️ 🔭 ➕ ❓ ❤️ 💙 💚 💛 🧡 💜 🖤 🤍'.split(' ')]
];
// Όλα μαζί (για όσα χρειάζονται απλή λίστα)
const EMOJIS = [...new Set(EMOJI_GROUPS.flatMap(g => g[1]))];
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

// Σύντομη ημερομηνία για πίνακες: «Πέμ 1/10» (το έτος φαίνεται ήδη στα φίλτρα)
function tableDate(t) {
  if (t.dayKnown === false) return `${MONTHS[mOf(t) - 1]}`;
  const d = new Date(t.date + 'T12:00:00');
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()}/${d.getMonth() + 1}${yOf(t) !== ui.list.year ? '/' + String(yOf(t)).slice(2) : ''}`;
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
    policies: [],
    history: {}
  };
}
// Μία φορά: πάγια λογαριασμών που επαναλαμβάνονται (από το Excel του 2026)
function addBillRecurring(d) {
  d.settings.migrations = d.settings.migrations || [];
  if (d.settings.migrations.includes('bills-2026')) return;
  d.settings.migrations.push('bills-2026');
  const has = id => d.categories.some(c => c.id === id);
  const mk = (id, cat, amount, from, every, note, variable) => ({ id, type: 'expense', categoryId: cat, amount, day: 1, every, note, person: '', method: '', active: true, skip: [], from, until: '', total: null, variable });
  const add = [
    has('e25') && mk('r_dei', 'e25', 150, '2026-09', 1, 'λογαριασμός', true),
    has('e26') && mk('r_ote', 'e26', 34.88, '2026-09', 1, '', false),
    has('e27') && mk('r_eydap', 'e27', 75, '2026-11', 4, 'λογαριασμός', true),
    has('e29') && mk('r_koin', 'e29', 100, '2026-09', 1, '2 × 50 €', true)
  ].filter(r => r && !d.recurring.some(x => x.id === r.id || (x.categoryId === r.categoryId && x.active)));
  d.recurring.push(...add);
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
  d.cars = (d.cars || []).map(c => Object.assign({ name: '', brand: '', model: '', plate: '', year: '', color: '', type: '🚗', since: '', fuelCategoryId: '', sold: '', kteo: '', km: [], services: [] }, c));
  d.field = Object.assign({ waterings: [], payments: [], categoryId: '' }, d.field || {});
  // Το χωράφι έχει τη δική του κατηγορία εξόδων (για να φαίνεται χωριστά στα έξοδα και στο Excel)
  if (!d.field.categoryId || !d.categories.some(c => c.id === d.field.categoryId)) {
    let c = d.categories.find(x => x.type === 'expense' && /χωράφ/i.test(x.name));
    if (!c) { c = { id: 'c_field', name: 'Χωράφι – πότισμα', icon: '🌳', type: 'expense', color: '#65a30d', budget: null, extra: false, archived: false, order: d.categories.length }; d.categories.push(c); }
    d.field.categoryId = c.id;
  }
  d.policies = (d.policies || []).map(p => Object.assign({ kind: 'other', name: '', what: '', company: '', number: '', amount: 0, every: 12, next: '', categoryId: '', attachments: [], history: [] }, p));
  if (d.power) d.power.bills = d.power.bills || [];
  d.history = d.history || {};
  addBillRecurring(d);
  return d;
}
