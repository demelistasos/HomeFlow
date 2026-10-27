'use strict';
// HomeFlow · Κλείσιμο μήνα
// Όταν αλλάζει ο μήνας (την 1η ή την πρώτη φορά που ανοίγει η εφαρμογή μετά), η εφαρμογή:
//  1. φτιάχνει μόνη της το PDF του μήνα που έκλεισε και το βάζει στον φάκελο «Μηνιαίες συνόψεις»
//     (δίπλα στα δεδομένα, και στα δεύτερα αντίγραφα cloud / USB),
//  2. δείχνει ένα μήνυμα «Ο Σεπτέμβριος έκλεισε» με τα βασικά νούμερα.
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

const monthPdfName = s => `HomeFlow ${s} ${MONTHS[+s.slice(5) - 1]}.pdf`;
const hasDataUpTo = s => DB.transactions.some(t => !t.planned && t.date.slice(0, 7) <= s);

function closeSummary(s) {
  const y = +s.slice(0, 4), m = +s.slice(5);
  const tI = sum(txIn(y, m, { type: 'income' })), tE = sum(txIn(y, m, { type: 'expense' }));
  const p = addMonths(s, -1), pE = sum(txIn(+p.slice(0, 4), +p.slice(5), { type: 'expense' }));
  const by = {};
  for (const t of txIn(y, m, { type: 'expense' })) by[t.categoryId] = (by[t.categoryId] || 0) + t.amount;
  const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, v]) => ({ id, v: round2(v) }));
  const unpaid = DB.tenants.filter(t => tenantActiveIn(t, s) && tenantRent(t, s)).map(t => ({ t, st: tenantMonthStatus(t, s) })).filter(x => x.st.paid < x.st.due - 0.005);
  return { s, y, m, tI, tE, bal: round2(tI - tE), pE, top, unpaid };
}

let closeBusy = false;
// Ελέγχει αν έκλεισε μήνας που δεν έχει «κλείσει» ακόμα. Περιμένει να μην είναι ανοιχτό κάτι άλλο.
async function checkMonthClose({ force } = {}) {
  if (!DB || closeBusy) return;
  if (!force && DB.settings.monthClose === false) return;
  const prev = addMonths(curYM(), -1);
  const last = DB.settings.closedMonth || '';
  if (!force && last >= prev) return;
  if (locked || dlg || form || pal) { setTimeout(() => checkMonthClose({ force }), 5000); return; }
  if (!hasDataUpTo(prev)) { if (!force) { DB.settings.closedMonth = prev; persist(); } return; }
  closeBusy = true;
  try {
    // όσοι μήνες έμειναν πίσω (το πολύ 12), αλλά πάντα τουλάχιστον ο προηγούμενος
    const months = [];
    for (let s = last && !force ? addMonths(last, 1) : prev, g = 0; s <= prev && g < 12; s = addMonths(s, 1), g++) months.push(s);
    if (!months.length) months.push(prev);
    let saved = null;
    if (window.homeflow && window.homeflow.archiveMonth) {
      for (const s of months) {
        const r = await window.homeflow.archiveMonth(monthReportHtml(+s.slice(0, 4), +s.slice(5), '__FONT__'), monthPdfName(s));
        if (s === prev) saved = r;
      }
    } else window.__lastReport = monthReportHtml(+prev.slice(0, 4), +prev.slice(5), 'fonts/Commissioner.ttf');
    DB.settings.closedMonth = prev; persist();
    if (dlg || form) return; // στο μεταξύ άνοιξε κάτι άλλο: το PDF σώθηκε, το μήνυμα δεν χρειάζεται
    dlg = { kind: 'mclose', sum: closeSummary(prev), saved, more: months.length - 1 };
    renderDlg();
  } finally { closeBusy = false; }
}

function renderCloseDlg(d) {
  if (d.kind !== 'mclose') return null;
  const x = d.sum, name = MONTHS[x.m - 1];
  const diff = x.pE ? Math.round((x.tE - x.pE) / x.pE * 100) : null;
  const prevAcc = MONTHS[(x.m + 10) % 12].replace(/ς$/, '');
  const cmp = diff == null ? '' : diff > 3 ? `<span class="exp">▲ ${diff}% περισσότερα έξοδα</span> από τον ${prevAcc}` : diff < -3 ? `<span class="inc">▼ ${-diff}% λιγότερα έξοδα</span> από τον ${prevAcc}` : `Έξοδα περίπου ίδια με τον ${prevAcc}`;
  const where = d.saved && d.saved.ok ? `<div class="notice info" style="margin:0">📄 Η σύνοψη σε PDF αποθηκεύτηκε στον φάκελο <b>«Μηνιαίες συνόψεις»</b>${d.saved.copies && d.saved.copies.length ? ` και στο ${d.saved.copies.map(k => (k === 'usb' ? 'USB' : 'cloud')).join(' και στο ')}` : ''}.${d.more ? ` Μπήκαν και ${d.more} ακόμα μήνες που είχαν μείνει πίσω.` : ''}</div>`
    : d.saved && d.saved.error ? `<div class="notice" style="margin:0">⚠️ Το PDF δεν αποθηκεύτηκε: ${esc(d.saved.error)}</div>` : '';
  return { head: 'neutral', title: `🎉 Ο ${name} έκλεισε`, body: `
    <div class="mc-tot">
      <div><div class="label">Μπήκαν</div><div class="num inc">${eur(x.tI)}</div></div>
      <div><div class="label">Βγήκαν</div><div class="num exp">${eur(x.tE)}</div></div>
      <div><div class="label">Έμειναν</div><div class="num ${x.bal < 0 ? 'exp' : 'inc'}">${x.bal < 0 ? '−' + eur(-x.bal) : eur(x.bal)}</div></div>
    </div>
    ${cmp ? `<div style="font-size:1.1rem">${cmp}.</div>` : ''}
    ${x.top.length ? `<div><div class="flabel">Τα περισσότερα πήγαν σε</div>${x.top.map(t => `<div class="mc-row"><span>${esc(catIcon(t.id))} ${esc(catName(t.id))}</span><b class="num">${eur(t.v)}</b></div>`).join('')}</div>` : ''}
    ${x.unpaid.length ? `<div><div class="flabel">Δεν πλήρωσαν όλο το ενοίκιο</div>${x.unpaid.map(u => `<div class="mc-row"><span>🔑 ${esc(u.t.name)}</span><b class="num exp">${eur(round2(u.st.due - u.st.paid))}</b></div>`).join('')}</div>` : '<div class="inc" style="font-size:1.05rem">✓ Όλα τα ενοίκια του μήνα πληρώθηκαν.</div>'}
    ${where}` };
}
const closeActions = {
  'mclose-pdf': async () => { const d = dlg; if (d && d.saved && d.saved.ok) { const r = await window.homeflow.openMonthPdf(d.saved.file); if (r && r.error) toast(r.error); } else if (d) exportMonthPdf(d.sum.y, d.sum.m); },
  'mclose-folder': () => { if (window.homeflow && window.homeflow.openMonthPdf) window.homeflow.openMonthPdf(''); },
  'mclose-toggle': el => { DB.settings.monthClose = el.checked; persist(); toast(el.checked ? 'Το κλείσιμο μήνα είναι ενεργό.' : 'Το κλείσιμο μήνα σταμάτησε.'); },
  'mclose-now': () => checkMonthClose({ force: true })
};
Object.assign(actions, closeActions);

// Πίνακας στις Ρυθμίσεις → «Τα δεδομένα μου»
function monthClosePanel() {
  const s = DB.settings;
  return `<div class="panel set-section ${ui._setTab === 'data' ? '' : 'hidden'}">
    <h2>📅 Κλείσιμο μήνα</h2>
    <p style="margin-top:0">Την 1η κάθε μήνα (ή την πρώτη φορά που θα ανοίξει μετά) η εφαρμογή δείχνει πώς πήγε ο μήνας που έκλεισε και <b>αποθηκεύει μόνη της τη σύνοψή του σε PDF</b>${store.native ? ', στον φάκελο «Μηνιαίες συνόψεις» δίπλα στα δεδομένα και στα αντίγραφα (cloud / USB)' : ''}. Έτσι μαζεύεται αρχείο χωρίς κόπο.</p>
    <label class="check"><input type="checkbox" data-action="mclose-toggle" ${s.monthClose === false ? '' : 'checked'}> Να γίνεται αυτόματα</label>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem">
      ${store.native ? '<button class="btn" data-action="mclose-folder">📂 Οι μηνιαίες συνόψεις</button>' : ''}
      <button class="btn" data-action="mclose-now">📄 Κλείσιμο του ${MONTHS[+addMonths(curYM(), -1).slice(5) - 1].replace(/ς$/, '')} τώρα</button>
    </div>
    ${s.closedMonth ? `<p class="muted" style="margin-bottom:0">Τελευταίος μήνας που έκλεισε: ${MONTHS[+s.closedMonth.slice(5) - 1]} ${s.closedMonth.slice(0, 4)}.</p>` : ''}
  </div>`;
}
