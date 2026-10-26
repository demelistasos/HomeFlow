'use strict';
// HomeFlow · Σύνοψη μήνα σε PDF (μία σελίδα Α4, για αρχείο ή για τον λογιστή)
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// Για να μένει πάντα σε μία σελίδα: κάθε γραμμή πίνακα είναι μία σειρά (τα μεγάλα ονόματα
// κόβονται με «…») και μετράμε πόσο ύψος πιάνει κάθε κομμάτι. Αν δεν χωράνε όλα, πρώτα
// μικραίνουν λίγο τα γράμματα και μετά κρύβονται οι μικρότερες γραμμές με «και άλλοι N».
const RPT = {
  room: 236,                                  // mm για πίνακες (Α4 297 − περιθώρια 23 − κεφαλίδα/σύνολα 33 − υποσέλιδο 5 − περιθώριο ασφαλείας)
  row: { normal: 5.9, dense: 5.0 },           // mm ανά γραμμή πίνακα (μετρημένο: 5,8 και 4,9)
  h2: { normal: 8.6, dense: 7.6 },            // mm ανά τίτλο ενότητας
  min: { cats: 6, rent: 5, todo: 4 }          // ποτέ λιγότερες γραμμές από αυτές
};
const rptClean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// Πόσες γραμμές δείχνει κάθε κομμάτι (μαζί με τη γραμμή «και άλλοι») και αν θέλει πυκνά γράμματα
function rptLayout(nCats, nRent, nTodo) {
  const need = { cats: nCats, rent: nRent, todo: nTodo };
  const height = (k, mode) => {
    const r = RPT.row[mode];
    return (k.cats + 2) * r + (nRent ? (k.rent + 2) * r + RPT.h2[mode] : 0) + RPT.h2[mode] + Math.max(1, k.todo) * r;
  };
  for (const mode of ['normal', 'dense']) if (height(need, mode) <= RPT.room) return { dense: mode === 'dense', ...need };
  const k = { ...need };
  // κόβουμε μία γραμμή κάθε φορά από το μεγαλύτερο κομμάτι που μπορεί να μικρύνει
  while (height(k, 'dense') > RPT.room) {
    const can = Object.keys(k).filter(x => k[x] > RPT.min[x]);
    if (!can.length) break;
    const x = can.sort((a, b) => k[b] - k[a])[0];
    k[x]--;
  }
  return { dense: true, ...k };
}
// Κρατάει τις πρώτες γραμμές ώστε μαζί με τη γραμμή «και άλλοι» να είναι το πολύ max
const rptCut = (rows, max) => rows.length <= max ? { shown: rows, rest: [] } : { shown: rows.slice(0, max - 1), rest: rows.slice(max - 1) };

function rptCatList(list) {
  const by = {};
  for (const t of list) by[t.categoryId] = (by[t.categoryId] || 0) + t.amount;
  return Object.entries(by).map(([id, v]) => ({ name: catName(id), extra: !!(catById(id) || {}).extra, v: round2(v) })).sort((a, b) => b.v - a.v);
}
function rptCatTable(all, type, max) {
  const { shown, rest } = rptCut(all, max);
  const rows = rest.length ? shown.concat({ name: `Άλλες ${rest.length} κατηγορίες`, more: true, v: round2(rest.reduce((a, r) => a + r.v, 0)) }) : shown;
  const total = round2(all.reduce((a, r) => a + r.v, 0));
  const body = rows.length ? rows.map(r => `<tr><td class="${r.more ? 'none' : ''}">${esc(r.name)}${r.extra ? ' <i>(έκτακτο)</i>' : ''}</td><td class="r">${eur(r.v)}</td><td class="r p">${total ? Math.round(r.v / total * 100) + '%' : ''}</td></tr>`).join('')
    : `<tr><td colspan="3" class="none">Δεν υπάρχουν ${type === 'expense' ? 'έξοδα' : 'έσοδα'}.</td></tr>`;
  return `<table><colgroup><col><col class="w-amt"><col class="w-pc"></colgroup><thead><tr><th>${type === 'expense' ? 'Έξοδα' : 'Έσοδα'} ανά κατηγορία</th><th class="r">Ποσό</th><th class="r">%</th></tr></thead><tbody>${body}</tbody>
    <tfoot><tr><td>Σύνολο</td><td class="r">${eur(total)}</td><td></td></tr></tfoot></table>`;
}

function rptRentRows(s) {
  return DB.tenants.filter(t => tenantActiveIn(t, s) && tenantRent(t, s)).map(t => {
    const st = tenantMonthStatus(t, s), bal = tenantLedger(t).balance;
    const state = !st.due ? '—' : st.paid >= st.due - 0.005 ? 'Πλήρωσε' : st.paid > 0 ? 'Μερικώς' : 'Δεν πλήρωσε';
    return { t, st, bal, state, bad: state !== 'Πλήρωσε' && state !== '—' };
  });
}
function rptRent(s, rows, max) {
  if (!rows.length) return '';
  // πρώτα όσοι χρωστάνε (αυτοί ενδιαφέρουν), μετά οι υπόλοιποι
  const sorted = rows.slice().sort((a, b) => (b.bad - a.bad) || (b.bal - a.bal));
  const { shown, rest } = rows.length > max ? rptCut(sorted, max) : { shown: rows, rest: [] };
  const due = round2(rows.reduce((a, r) => a + r.st.due, 0)), paid = round2(rows.reduce((a, r) => a + r.st.paid, 0)), owed = round2(rows.reduce((a, r) => a + Math.max(0, r.bal), 0));
  const restOwed = round2(rest.reduce((a, r) => a + Math.max(0, r.bal), 0));
  return `<h2>Ενοίκια ${MONTHS[+s.slice(5) - 1].toLowerCase()}</h2>
  <table class="rent"><colgroup><col class="w-ten"><col><col class="w-amt"><col class="w-amt"><col class="w-st"><col class="w-amt"></colgroup>
  <thead><tr><th>Ενοικιαστής</th><th>Ακίνητο</th><th class="r">Ενοίκιο</th><th class="r">Πλήρωσε</th><th>Κατάσταση</th><th class="r">Χρωστάει όλα</th></tr></thead><tbody>
  ${shown.map(r => `<tr><td>${esc(r.t.name)}${shareOf(r.t) !== 100 ? ` <i>(${shareOf(r.t)}% δικό μας)</i>` : ''}</td><td>${esc(r.t.property || '')}</td><td class="r">${eur(r.st.due)}</td><td class="r">${eur(r.st.paid)}</td><td class="${r.bad ? 'bad' : 'ok'}">${r.state}</td><td class="r ${r.bal > 0.005 ? 'bad' : ''}">${r.bal > 0.005 ? eur(r.bal) : '—'}</td></tr>`).join('')}
  ${rest.length ? `<tr><td colspan="5" class="none">και άλλοι ${rest.length} ${rest.length === 1 ? 'ενοικιαστής' : 'ενοικιαστές'} (μετράνε στο σύνολο)</td><td class="r none">${restOwed ? eur(restOwed) : '—'}</td></tr>` : ''}
  </tbody><tfoot><tr><td colspan="2">Σύνολο</td><td class="r">${eur(due)}</td><td class="r">${eur(paid)}</td><td></td><td class="r">${owed ? eur(owed) : '—'}</td></tr></tfoot></table>`;
}

// Τι μένει ανοιχτό: δόσεις εφορίας, προγραμματισμένα του μήνα, υπενθυμίσεις
function rptTodoItems(year, month) {
  const s = ymOf(year, month), end = `${s}-${pad(new Date(year, month, 0).getDate())}`;
  const items = [];
  for (const t of DB.taxes) t.installments.forEach((i, k) => {
    if (!i.paid && i.due <= end) items.push({ sort: i.due, text: `${t.name}${t.person ? ' – ' + t.person : ''}: δόση ${k + 1}`, when: `${i.due < todayStr() ? 'έληξε ' : 'λήγει '}${shortDate(i.due)}`, amt: i.amount, late: i.due < todayStr() });
  });
  for (const t of txIn(year, month, { planned: true })) items.push({ sort: t.date, text: `${catName(t.categoryId)}${t.note ? ' – ' + t.note : ''} (${t.type === 'expense' ? 'έξοδο' : 'έσοδο'}, δεν έχει γίνει)`, when: shortDate(t.date), amt: t.amount, late: t.date < todayStr() });
  const seen = new Set(items.map(x => x.text));
  for (const r of reminders()) {
    // οι δόσεις της εφορίας είναι ήδη παραπάνω, μία-μία
    if (/data-action="tax-pay"|data-page="tax"/.test(r.btn || '')) continue;
    let text = rptClean(r.text), sub = rptClean(r.sub), when = '';
    if (seen.has(text)) continue;
    // στη στήλη της ημερομηνίας μόνο κάτι σύντομο· τα υπόλοιπα πάνε δίπλα στο κείμενο
    const d = sub.match(/\(([^()]*\d{4})\)\s*$/);
    if (d) { when = d[1]; sub = ''; } else if (sub.length <= 16) { when = sub; sub = ''; }
    items.push({ sort: '9', text: sub ? `${text} · ${sub}` : text, when, late: r.cls === 'late' });
  }
  return items.sort((a, b) => String(a.sort).localeCompare(String(b.sort)));
}
function rptTodo(items, max) {
  if (!items.length) return '<h2>Εκκρεμότητες</h2><p class="none">Καμία εκκρεμότητα.</p>';
  const { shown, rest } = rptCut(items, max);
  const restAmt = round2(rest.reduce((a, x) => a + (x.amt || 0), 0));
  return `<h2>Εκκρεμότητες</h2><table class="todo"><colgroup><col><col class="w-when"><col class="w-amt"></colgroup><tbody>${shown.map(x => `<tr><td><span class="${x.late ? 'bad' : 'dot'}">${x.late ? '●' : '○'}</span> ${esc(x.text)}</td><td class="${x.late ? 'bad' : ''}">${esc(x.when || '')}</td><td class="r">${x.amt ? eur(x.amt) : ''}</td></tr>`).join('')}
    ${rest.length ? `<tr><td colspan="2" class="none">και άλλες ${rest.length} εκκρεμότητες</td><td class="r none">${restAmt ? eur(restAmt) : ''}</td></tr>` : ''}</tbody></table>`;
}

function monthReportHtml(year, month, fontUrl) {
  const s = ymOf(year, month);
  const inc = txIn(year, month, { type: 'income' }), exp = txIn(year, month, { type: 'expense' });
  const tI = sum(inc), tE = sum(exp), bal = round2(tI - tE);
  const a = yearAgg(year);
  const yI = round2(a.mInc.slice(0, month).reduce((x, y) => x + y, 0)), yE = round2(a.mExp.slice(0, month).reduce((x, y) => x + y, 0));
  const extra = round2(exp.filter(t => (catById(t.categoryId) || {}).extra).reduce((x, t) => x + t.amount, 0));
  const cI = rptCatList(inc), cE = rptCatList(exp), rent = rptRentRows(s), todo = rptTodoItems(year, month);
  const L = rptLayout(Math.max(cI.length, cE.length, 1), rent.length + 0, todo.length);
  const css = `
  ${fontUrl ? `@font-face{font-family:"Commissioner";src:url("${fontUrl}");font-weight:100 900}` : ''}
  @page{size:A4;margin:12mm 13mm 11mm}
  *{box-sizing:border-box}
  html,body{margin:0;background:#fff}
  body{font-family:"Commissioner","Segoe UI",Arial,sans-serif;color:#10242b;font-size:9.6pt;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header{display:flex;align-items:flex-end;border-bottom:2.5px solid #0e7c86;padding-bottom:5px;margin-bottom:9px}
  header h1{margin:0;font-size:20pt;line-height:1.15;font-weight:700;letter-spacing:-.01em}
  header h1 span{color:#6b8790;font-weight:500}
  header .who{margin-left:auto;text-align:right;color:#4a6470;font-size:8.5pt;line-height:1.25}
  header .who b{color:#0e7c86;font-size:10.5pt}
  .tot{display:flex;gap:8px;margin-bottom:9px}
  .tot>div{flex:1;border:1px solid #d5e2e6;border-radius:7px;padding:5px 10px 6px;background:#f7fafb}
  .tot .l{font-size:8pt;color:#4a6470;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
  .tot .v{font-size:15pt;line-height:1.25;font-weight:700;font-variant-numeric:tabular-nums}
  .tot .s{font-size:7.8pt;color:#4a6470;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .inc{color:#1d7f4e}.exp{color:#c2412d}
  .cols{display:flex;gap:14px}.cols>div{flex:1;min-width:0}
  h2{font-size:10.5pt;line-height:1.2;margin:11px 0 3px;color:#0e7c86}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-variant-numeric:tabular-nums}
  th{font-size:8pt;text-align:left;color:#4a6470;font-weight:600;border-bottom:1.5px solid #9fb8bf;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  td{padding:2.2px 4px;border-bottom:1px solid #e6eef0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  tfoot td{font-weight:700;border-top:1.5px solid #9fb8bf;border-bottom:0}
  .r{text-align:right}.p{color:#6b8790}
  col.w-amt{width:7.4em}col.w-pc{width:3.9em}col.w-ten{width:30%}col.w-st{width:7.6em}col.w-when{width:10.5em}
  i{color:#6b8790;font-style:normal;font-size:8pt}
  .bad{color:#c2412d;font-weight:600}.ok{color:#1d7f4e}.dot{color:#6b8790}
  .none{color:#6b8790;font-style:italic}
  .todo td:nth-child(2){color:#4a6470}.todo td.bad:nth-child(2){color:#c2412d;font-weight:500}
  body.dense{font-size:8.6pt;line-height:1.25}
  body.dense td{padding:1.6px 4px}body.dense th{font-size:7.6pt}body.dense i{font-size:7.4pt}
  body.dense h2{font-size:10pt;margin:9px 0 2px}
  footer{position:fixed;bottom:0;left:0;right:0;font-size:7.5pt;line-height:1.3;color:#6b8790;display:flex;gap:12px;justify-content:space-between;border-top:1px solid #d5e2e6;padding-top:3px;background:#fff}
  footer span:last-child{white-space:nowrap}`;
  return `<!doctype html><html lang="el"><head><meta charset="utf-8"><title>HomeFlow ${MONTHS[month - 1]} ${year}</title><style>${css}</style></head><body${L.dense ? ' class="dense"' : ''}>
  <header><h1>${MONTHS[month - 1]} <span>${year}</span></h1><div class="who"><b>HomeFlow</b><br>Σύνοψη μήνα</div></header>
  <div class="tot">
    <div><div class="l">Μπήκαν</div><div class="v inc">${eur(tI)}</div><div class="s">από αρχή χρονιάς ${eur(yI)}</div></div>
    <div><div class="l">Βγήκαν</div><div class="v exp">${eur(tE)}</div><div class="s">${extra ? `έκτακτα ${eur(extra)} · ` : ''}από αρχή χρονιάς ${eur(yE)}</div></div>
    <div><div class="l">Έμειναν</div><div class="v ${bal < 0 ? 'exp' : 'inc'}">${bal < 0 ? '−' + eur(-bal) : eur(bal)}</div><div class="s">από αρχή χρονιάς ${eur(round2(yI - yE))}</div></div>
  </div>
  <div class="cols"><div>${rptCatTable(cI, 'income', L.cats)}</div><div>${rptCatTable(cE, 'expense', L.cats)}</div></div>
  ${rptRent(s, rent, L.rent)}
  ${rptTodo(todo, L.todo)}
  <footer><span>Τα προγραμματισμένα που δεν έχουν γίνει δεν μετράνε στα σύνολα. Εκκρεμότητες όπως ήταν στις ${shortDate(todayStr())}.</span><span>HomeFlow · ${shortDate(todayStr())}</span></footer>
  </body></html>`;
}

async function exportMonthPdf(year = ui.year, month = ui.month) {
  const name = `HomeFlow ${MONTHS[month - 1]} ${year}.pdf`;
  if (window.homeflow && window.homeflow.savePdf) {
    const r = await window.homeflow.savePdf(monthReportHtml(year, month, '__FONT__'), name);
    if (r && r.ok) toast('Αποθηκεύτηκε: ' + r.path);
    else if (r && r.error) toast(r.error);
    return;
  }
  // στον browser (δοκιμές): ανοίγει τη σελίδα για εκτύπωση
  window.__lastReport = monthReportHtml(year, month, 'fonts/Commissioner.ttf');
  const w = window.open('', '_blank');
  if (w) { w.document.write(window.__lastReport); w.document.close(); }
}
Object.assign(actions, { 'month-pdf': () => exportMonthPdf() });
