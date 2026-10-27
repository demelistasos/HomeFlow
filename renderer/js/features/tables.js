'use strict';
// HomeFlow · Φίλτρο και ταξινόμηση σε όλους τους πίνακες
// Κάθε πίνακας με αρκετές γραμμές παίρνει αυτόματα:
//  • κλικ στην επικεφαλίδα μιας στήλης → ταξινόμηση (▲ αύξουσα, ▼ φθίνουσα, ξανά κλικ → όπως ήταν)
//  • πεδίο «Φίλτρο…» που κρατάει μόνο τις γραμμές που περιέχουν αυτό που γράφετε
//  • λίστα επιλογής για στήλες όπως «Κατηγορία», «Ποιος», «Κατάσταση» κ.λπ.
// Οι επιλογές θυμούνται ανά σελίδα/καρτέλα όσο είναι ανοιχτή η εφαρμογή.
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

const TBL_MIN_ROWS = 3;
const TBL_PICK_COLS = /κατηγορ|είδος|ενοικιαστ|αυτοκίνητ|κατάσταση|ποιος|τρόπος|πηγή|ακίνητο|πρόσωπ|λογαριασμ|τράπεζ/i;
const tblState = new Map();
const TBL_MON = { ιαν: 1, φεβ: 2, μαρ: 3, απρ: 4, μαι: 5, μαϊ: 5, ιουν: 6, ιουλ: 7, αυγ: 8, σεπ: 9, οκτ: 10, νοε: 11, δεκ: 12 };

// Τιμή ενός κελιού για ταξινόμηση: αριθμός, ημερομηνία ή κείμενο
function tblValue(td) {
  if (!td) return { k: 3, v: '' };
  if (td.dataset.sort != null) { const n = Number(td.dataset.sort); return isNaN(n) ? { k: 2, v: td.dataset.sort } : { k: 0, v: n }; }
  const raw = td.textContent.replace(/\s+/g, ' ').trim();
  if (!raw || /^[·—–-]$/.test(raw)) return { k: 3, v: '' };
  const n = raw.replace(/[\s €%]|km|ώρες|ώρα/g, '').replace(/^[−–]/, '-');
  if (/^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$|^[+-]?\d+(,\d+)?$/.test(n)) return { k: 0, v: parseFloat(n.replace(/\./g, '').replace(',', '.')) };
  const s = normS(raw);
  let m = /(\d{1,2}) ([α-ω]{3})[α-ω]* (\d{4})/.exec(s);
  if (m && TBL_MON[m[2]]) return { k: 0, v: +m[3] * 10000 + TBL_MON[m[2]] * 100 + +m[1] };
  m = /^([α-ω]{3})[α-ω]* (\d{4})/.exec(s);
  if (m && TBL_MON[m[1]]) return { k: 0, v: +m[2] * 10000 + TBL_MON[m[1]] * 100 };
  m = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(raw);
  if (m) { const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : 0; return { k: 0, v: y * 10000 + +m[2] * 100 + +m[1] }; }
  m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(raw);
  if (m) return { k: 0, v: +m[1] * 10000 + +m[2] * 100 + +(m[3] || 0) };
  return { k: 2, v: s.replace(/^[^a-zα-ω0-9]+/, '') };
}
function tblCompare(a, b) {
  if (a.k !== b.k) return a.k - b.k;
  return a.k === 0 ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'el');
}
const tblCellText = td => (td ? td.textContent.replace(/\s+/g, ' ').trim() : '');

function tblKey(i) { return [ui.page, ui.tabs[ui.page] || '', ui.tenantId || ui.carId || ui.personId || '', ui._carTab || '', ui._setTab || '', i].join('|'); }

function enhanceTables(root) {
  const page = root || $('#page');
  if (!page) return;
  [...page.querySelectorAll('table.data, table.sheet')].forEach((tbl, i) => {
    if (tbl.dataset.tbl || tbl.closest('.modal') || tbl.classList.contains('cat-table')) return;
    const head = tbl.tHead && tbl.tHead.rows[0], body = tbl.tBodies[0];
    if (!head || !body || body.rows.length < TBL_MIN_ROWS) return;
    tbl.dataset.tbl = '1';
    const key = tblKey(i);
    const st = tblState.get(key) || { col: -1, dir: 0, q: '', pick: {} };
    tblState.set(key, st);
    // η αρχική σειρά, για να γυρνάει «όπως ήταν»
    [...body.rows].forEach((r, k) => { r.dataset.ord = k; });
    const ths = [...head.cells];
    // στήλες με λίστα επιλογής
    const picks = [];
    ths.forEach((th, c) => {
      if (!TBL_PICK_COLS.test(th.textContent)) return;
      const vals = [...new Set([...body.rows].filter(r => !tblPinned(r)).map(r => tblCellText(r.cells[c])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'el'));
      if (vals.length >= 2 && vals.length <= 60) picks.push({ c, label: th.textContent.trim(), vals });
    });
    const tools = document.createElement('div');
    tools.className = 'tbl-tools no-print';
    tools.innerHTML = `<label class="tbl-q"><span class="ui-ic">🔍</span><input type="search" placeholder="Φίλτρο…" value="${esc(st.q)}" aria-label="Φίλτρο πίνακα"></label>
      ${picks.map(p => `<select data-col="${p.c}" aria-label="${esc(p.label)}"><option value="">${esc(p.label)}: όλα</option>${p.vals.map(v => `<option ${st.pick[p.c] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`).join('')}
      <span class="tbl-count muted"></span>
      <button class="btn small ghost tbl-reset" type="button" hidden>✕ Καθαρισμός</button>`;
    const anchor = tbl.parentElement.classList.contains('sheet-wrap') ? tbl.parentElement : tbl;
    anchor.parentElement.insertBefore(tools, anchor);
    ths.forEach((th, c) => {
      if (!th.textContent.trim()) return;
      th.classList.add('sortable'); th.tabIndex = 0; th.title = 'Πατήστε για ταξινόμηση';
      const go = ev => { ev.preventDefault(); ev.stopPropagation(); if (st.col !== c) { st.col = c; st.dir = 1; } else st.dir = st.dir === 1 ? -1 : st.dir === -1 ? 0 : 1; if (!st.dir) st.col = -1; tblApply(tbl, st, tools); };
      th.addEventListener('click', go);
      th.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') go(ev); });
    });
    const q = tools.querySelector('input');
    q.addEventListener('input', () => { st.q = q.value; tblApply(tbl, st, tools); });
    q.addEventListener('keydown', ev => { if (ev.key === 'Escape' && q.value) { ev.stopPropagation(); q.value = ''; st.q = ''; tblApply(tbl, st, tools); } });
    tools.querySelectorAll('select').forEach(sel => sel.addEventListener('change', () => { if (sel.value) st.pick[sel.dataset.col] = sel.value; else delete st.pick[sel.dataset.col]; tblApply(tbl, st, tools); }));
    tools.querySelector('.tbl-reset').addEventListener('click', () => { st.q = ''; st.pick = {}; st.col = -1; st.dir = 0; q.value = ''; tools.querySelectorAll('select').forEach(s => { s.value = ''; }); tblApply(tbl, st, tools); });
    tblApply(tbl, st, tools);
  });
}
// Γραμμές που μένουν πάντα στη θέση τους (σύνολα, παλιό υπόλοιπο κ.λπ.)
const tblPinned = r => r.classList.contains('total') || [...r.cells].some(td => td.colSpan > 1);

function tblApply(tbl, st, tools) {
  const body = tbl.tBodies[0];
  const rows = [...body.rows];
  const normal = rows.filter(r => !tblPinned(r)), pinned = rows.filter(tblPinned);
  // ταξινόμηση
  let order = normal.slice().sort((a, b) => a.dataset.ord - b.dataset.ord);
  if (st.col >= 0 && st.dir) order = order.map(r => ({ r, v: tblValue(r.cells[st.col]) })).sort((a, b) => (a.v.k === 3) - (b.v.k === 3) || tblCompare(a.v, b.v) * st.dir || a.r.dataset.ord - b.r.dataset.ord).map(x => x.r);
  const frag = document.createDocumentFragment();
  if (st.col >= 0 && st.dir) { order.forEach(r => frag.appendChild(r)); pinned.forEach(r => frag.appendChild(r)); }
  else rows.sort((a, b) => a.dataset.ord - b.dataset.ord).forEach(r => frag.appendChild(r));
  body.appendChild(frag);
  // φίλτρο
  const toks = normS(st.q).split(/\s+/).filter(Boolean);
  const picks = Object.entries(st.pick);
  let shown = 0;
  for (const r of normal) {
    const txt = normS(r.textContent);
    const ok = toks.every(t => txt.includes(t)) && picks.every(([c, v]) => tblCellText(r.cells[+c]) === v);
    r.hidden = !ok; if (ok) shown++;
  }
  const filtered = toks.length || picks.length;
  for (const r of pinned) r.hidden = !!filtered && !r.classList.contains('total');
  // ενδείξεις
  [...tbl.tHead.rows[0].cells].forEach((th, c) => {
    th.classList.toggle('sorted', c === st.col && !!st.dir);
    th.dataset.dir = c === st.col ? (st.dir === 1 ? '▲' : st.dir === -1 ? '▼' : '') : '';
    th.setAttribute('aria-sort', c === st.col && st.dir ? (st.dir === 1 ? 'ascending' : 'descending') : 'none');
  });
  const foot = tbl.tFoot && tbl.tFoot.rows.length;
  tools.querySelector('.tbl-count').textContent = filtered ? `Εμφανίζονται ${shown} από ${normal.length}${foot || pinned.some(r => r.classList.contains('total')) ? ' · τα σύνολα είναι για όλες τις γραμμές' : ''}` : '';
  tools.querySelector('.tbl-reset').hidden = !(filtered || (st.col >= 0 && st.dir));
}

// Κάθε φορά που ξανασχεδιάζεται η σελίδα
const tblObserver = new MutationObserver(() => { if (!tblObserver.pending) { tblObserver.pending = true; requestAnimationFrame(() => { tblObserver.pending = false; enhanceTables(); }); } });
document.addEventListener('DOMContentLoaded', () => { const p = $('#page'); if (p) tblObserver.observe(p, { childList: true, subtree: true }); });
if ($('#page')) tblObserver.observe($('#page'), { childList: true, subtree: true });
