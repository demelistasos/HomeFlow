'use strict';
// HomeFlow · Σελίδα «Χωράφι»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

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
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
  <div class="h-hint" style="margin:-.6rem 0 1rem">Κάθε φορά που ποτίζετε, πατάτε «Πότισα» και γράφετε τις ώρες. Στο τέλος της σεζόν πατάτε «Πλήρωσα» και το ποσό μπαίνει στα έξοδα, στη δική του κατηγορία «${esc(catName(fieldCatId()))}».</div>
  <div class="cards">
    <div class="card bal"><div class="label">Ώρες πότισμα ${y}</div><div class="value num">${hrs(cur.hours)}</div><div class="sub">${cur.ws.length} ποτίσματα</div></div>
    <div class="card exp"><div class="label">Θα κοστίσει περίπου</div><div class="value exp num">${eur(est)}</div><div class="sub">${rate ? `με ${numFmt.format(rate)} € την ώρα (όσο πέρσι)` : 'Δεν υπάρχει προηγούμενη πληρωμή'}</div></div>
    <div class="card ${cur.paid ? 'inc' : cur.hours ? 'exp' : 'bal'}"><div class="label">Πληρωμή ${y}</div><div class="value num" style="font-size:1.5rem;color:${cur.paid ? 'var(--inc)' : 'var(--exp)'}">${cur.paid ? `✓ ${eur(cur.paid)}` : cur.hours ? 'Δεν πληρώθηκε ακόμα' : '—'}</div></div>
  </div>
  ${bar}
  ${tab === 'now' ? `<div class="panel">${cur.ws.length ? `<table class="data"><thead><tr><th>Ημερομηνία</th><th class="r">Ώρες</th><th class="r">Σύνολο ως τότε</th><th></th></tr></thead><tbody>${(() => { let run = 0; return cur.ws.map(w => { run += w.hours; return { w, run }; }).reverse().map(({ w, run }) => `<tr style="cursor:default"><td>${shortDate(w.date)}</td><td class="r num"><b>${hrs(w.hours)}</b></td><td class="r num muted">${hrs(run)}</td><td style="width:3rem"><button class="btn small ghost no-print" data-action="water-del" data-id="${w.id}" title="Σβήσιμο">🗑</button></td></tr>`).join(''); })()}</tbody></table>` : '<div class="empty">Κανένα πότισμα φέτος ακόμα.</div>'}</div>`
  : `<div class="panel"><table class="data"><thead><tr><th>Χρονιά</th><th class="r">Ποτίσματα</th><th class="r">Ώρες</th><th class="r">Πληρώσαμε</th><th class="r">€ την ώρα</th></tr></thead><tbody>${years.map(yy => { const r = fieldYear(yy); return `<tr style="cursor:default"><td><b>${yy}</b></td><td class="r num">${r.ws.length}</td><td class="r num">${hrs(r.hours)}</td><td class="r num">${r.paid ? eur(r.paid) : '<span class="exp">απλήρωτο</span>'}</td><td class="r num muted">${r.paid && r.hours ? numFmt.format(r.paid / r.hours) : ''}</td></tr>`; }).join('')}</tbody></table></div>`}`;
}
