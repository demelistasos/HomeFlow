'use strict';
// HomeFlow · Εικονίδια
// Ένα δικό μας σετ εικονιδίων (γραμμή 1,9, στρογγυλές άκρες), ίδιο σε Windows και Mac.
// Αντικαθιστά αυτόματα τα emoji ΤΗΣ ΕΦΑΡΜΟΓΗΣ (μενού, καρτέλες, κουμπιά, τίτλοι).
// Τα emoji των κατηγοριών (που διαλέγει ο χρήστης) ΔΕΝ αλλάζουν.

const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.75" cy="6.5" r="1.1" class="f"/><circle cx="4.75" cy="12" r="1.1" class="f"/><circle cx="4.75" cy="17.5" r="1.1" class="f"/>',
  key: '<circle cx="8" cy="15.5" r="4.5"/><path d="m11.3 12.2 8.7-8.7M16.5 7l2.5 2.5M14 9.5l2 2"/>',
  wallet: '<path d="M19 7.5V6a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20H19a2 2 0 0 0 2-2v-2.5"/><path d="M3 6.5A2.5 2.5 0 0 0 5.5 9H19a2 2 0 0 1 2 2v1"/><path d="M21 12h-4.5a2 2 0 0 0 0 4H21z"/>',
  repeat: '<path d="m17 2.5 3.5 3.5L17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13"/><path d="m7 21.5-3.5-3.5L7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
  landmark: '<path d="M3 20.5h18M4.5 17.5h15"/><path d="M6 17.5v-7M10 17.5v-7M14 17.5v-7M18 17.5v-7"/><path d="M3 10.5 12 4l9 6.5z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.3a5 5 0 0 1 5.5 4.9"/>',
  car: '<path d="M4 15.5 5.7 10a2 2 0 0 1 1.9-1.5h8.8a2 2 0 0 1 1.9 1.5l1.7 5.5"/><path d="M3 15.5h18v2.5a1 1 0 0 1-1 1h-1.5M5.5 19H4a1 1 0 0 1-1-1v-2.5"/><circle cx="8" cy="19" r="1.8"/><circle cx="16" cy="19" r="1.8"/><path d="M6 8.5 7 5.5h10l1 3"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12C12 7.5 8.5 4.5 4 4.5c0 4.5 3.5 7.5 8 7.5z"/><path d="M12 14.5c0-4 3-7 7.5-7 0 4-3 7-7.5 7z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="1" class="f"/><circle cx="12" cy="14.5" r="1" class="f"/><circle cx="15.5" cy="14.5" r="1" class="f"/>',
  trend: '<path d="M3 17.5 9 11.5l4 4 7.5-8"/><path d="M15 7.5h5.5V13"/>',
  gear: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.5"/><circle cx="12" cy="16.8" r="1" class="f"/>',
  chart: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="6" width="3.2" height="12" rx="1"/><rect x="15.8" y="13.5" width="3.2" height="4.5" rx="1"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>',
  shield: '<path d="M12 3.5 19.5 6v5.8c0 4.5-3.1 7.6-7.5 8.7-4.4-1.1-7.5-4.2-7.5-8.7V6z"/><path d="m9 12 2 2 4-4"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.7-7.7"/><path d="M14.7 6.3 17.5 3.5a4 4 0 0 0-5.3 5.3"/><path d="m9 16 -4.5 4.5"/>',
  lifebuoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18"/>',
  clip: '<path d="m20.5 11.5-8.3 8.3a5 5 0 0 1-7-7l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>',
  download: '<path d="M12 3.5v11.5M7.5 10.5 12 15l4.5-4.5"/><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  door: '<path d="M3.5 20.5h17"/><path d="M6 20.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16"/><circle cx="14.5" cy="12" r="1" class="f"/>',
  drop: '<path d="M12 3.5s6.5 6.8 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 10.3 12 3.5 12 3.5z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  file: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z"/><path d="M14 3.5v5h5M9 13h6M9 16.5h4"/>',
  folder: '<path d="M3.5 7A2 2 0 0 1 5.5 5h3.8l2 2.2h7.2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  box: '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  receipt: '<path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 4.5V3.5h6v1"/><path d="m8.5 13 2.3 2.3L15.5 10.5"/>',
  bolt: '<path d="M13.5 2.5 4.5 14h6.5l-1 7.5 9-11.5h-6.5z"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.5 3.5v5h-5"/>',
  bank: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M6.5 14.5h4"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.6a4.5 4.5 0 0 1-.5 8.9z"/>',
  alert: '<path d="M10.3 4.2 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17.2" r="1" class="f"/>',
  bell: '<path d="M6 16.5v-5a6 6 0 0 1 12 0v5l1.8 2H4.2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6"/>',
  archive: '<rect x="3" y="4" width="18" height="4.5" rx="1.5"/><path d="M5 8.5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10M10 12.5h4"/>',
  usb: '<path d="M8.5 9V4.5h7V9"/><rect x="6.5" y="9" width="11" height="12" rx="2.5"/><path d="M10.5 6.5v.01M13.5 6.5v.01"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/>',
  type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 1.6-2.1-.5-1.3.3-2.7 1.8-2.7H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7.2 16.7 3.5 12 3.5z"/><circle cx="7.5" cy="11.5" r="1.2" class="f"/><circle cx="10.5" cy="7.5" r="1.2" class="f"/><circle cx="15" cy="7.8" r="1.2" class="f"/>',
  save: '<path d="M5.5 3.5h10.8l4.2 4.2v10.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z"/><path d="M7.5 3.5v5h8v-5M7.5 20.5v-6h9v6"/>',
  exchange: '<path d="M4 8.5h15l-3.5-3.5M20 15.5H5l3.5 3.5"/>',
  flag: '<path d="M5 21V4M5 4.5h11.5l-2 4 2 4H5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-4.8-4.8L6 19.5"/>',
  scale: '<path d="M12 3.5v17M7 20.5h10M4.5 7h15"/><path d="M4.5 7 2 13a2.6 2.6 0 0 0 5 0zM19.5 7 17 13a2.6 2.6 0 0 0 5 0z"/>',
  hand: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V14a6.5 6.5 0 0 1-12.2 3.1L3 13.5a1.5 1.5 0 0 1 2.5-1.6L8 14"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
  hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5"/>',
  pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  check: '<path d="m4.5 12.5 4.5 4.5L19.5 6.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  pencil: '<path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="m13.5 6.5 3 3"/>',
  trash: '<path d="M4 6.5h16M9 6.5V4.5h6v2M6.5 6.5l.9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.6"/><path d="M10 10.5v6M14 10.5v6"/>',
  sparkles: '<path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.5l-1.6-5.3L5 10.6 10.4 9z"/><path d="M19 15.5v4M17 17.5h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8"/>',
  undo: '<path d="M9 14.5 4 9.5l5-5"/><path d="M4 9.5h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  alarm: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M4 5.5 6.5 3M20 5.5 17.5 3"/>',
  minus: '<path d="M5 12h14"/>'
};
// Τα emoji της εφαρμογής → εικονίδιο
const EMOJI_IC = {
  '🏠': 'home', '📋': 'list', '🔑': 'key', '💰': 'wallet', '🔁': 'repeat', '🏛': 'landmark', '🤝': 'users', '🚗': 'car', '🌱': 'sprout',
  '📅': 'calendar', '🗓': 'calendar', '📆': 'calendar', '📈': 'trend', '⚙': 'gear', '🔍': 'search', '🔎': 'search', '❓': 'help', '📊': 'chart',
  '💶': 'cash', '💵': 'cash', '🔒': 'lock', '🛡': 'shield', '🔧': 'wrench', '🛟': 'lifebuoy', '📎': 'clip', '⬇': 'download', '🚪': 'door',
  '💧': 'drop', '📄': 'file', '📝': 'file', '📂': 'folder', '📁': 'folder', '📦': 'box', '🧾': 'receipt', '📌': 'clipboard', '⚡': 'bolt',
  '🔄': 'refresh', '🏦': 'bank', '☁': 'cloud', '⚠': 'alert', '🔔': 'bell', '📒': 'book', '🗄': 'archive', '🔌': 'usb', '🌙': 'moon',
  '☀': 'sun', '🖥': 'monitor', '🔠': 'type', '🎨': 'palette', '💾': 'save', '💱': 'exchange', '🏁': 'flag', '🖼': 'image', '⚖': 'scale',
  '👋': 'hand', '🌍': 'globe', '🕘': 'clock', '⏳': 'hourglass', '📍': 'pin', '✎': 'pencil', '🗑': 'trash', '✕': 'x', '✗': 'x', '✓': 'check', '🎉': 'sparkles', '✨': 'sparkles',
  '⌨': 'keyboard', '👪': 'users', '↩': 'undo', '⏰': 'alarm', '➕': 'plus', '➖': 'minus', '❔': 'help'
};
const icSvg = name => `<svg class="ic-svg ic-${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
const EMOJI_RE = new RegExp('(' + Object.keys(EMOJI_IC).sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')️?', 'g');
// Πού ΔΕΝ μπαίνουν εικονίδια: επιλογή εικονιδίου κατηγορίας και πεδία κειμένου
const IC_SKIP = '.cat-btn, .emoji-grid, .ic-btn, input, textarea, select, [data-noicon]';
// Στις «θέσεις εικονιδίου» μιας γραμμής (π.χ. υπενθυμίσεις, αναζήτηση) μπορεί να εμφανίζεται και
// το emoji μιας κατηγορίας. Αυτό μένει emoji, για να ταιριάζει παντού με την κατηγορία του.
const IC_SLOT = '.ic, .p-ic, .pal-ic, .cal-e';
function catEmojis() {
  try { return new Set((DB && DB.categories || []).map(c => String(c.icon || '').replace(/️/g, ''))); } catch { return new Set(); }
}
function decorateIcons(root) {
  if (!root || root.nodeType !== 1 && root.nodeType !== 3) return;
  const el = root.nodeType === 3 ? root.parentElement : root;
  if (!el) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (EMOJI_RE.lastIndex = 0, EMOJI_RE.test(n.nodeValue)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (!nodes.length) return;
  const cats = catEmojis();
  for (const n of nodes) {
    const p = n.parentElement;
    if (!p || p.closest(IC_SKIP)) continue;
    const slot = !!p.closest(IC_SLOT);
    const frag = document.createDocumentFragment();
    let last = 0, changed = false; const s = n.nodeValue; EMOJI_RE.lastIndex = 0; let m;
    while ((m = EMOJI_RE.exec(s))) {
      if (slot && cats.has(m[1])) continue;
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      const t = document.createElement('template'); t.innerHTML = icSvg(EMOJI_IC[m[1]]); frag.appendChild(t.content.firstChild);
      last = m.index + m[0].length; changed = true;
    }
    if (!changed) continue;
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    n.replaceWith(frag);
  }
}
// Κάθε φορά που αλλάζει κάτι στην οθόνη, τα νέα emoji γίνονται εικονίδια
const icObserver = new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) decorateIcons(n); });
icObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', () => decorateIcons(document.body));
if (document.body) decorateIcons(document.body);
