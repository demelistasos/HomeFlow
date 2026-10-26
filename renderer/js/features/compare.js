'use strict';
// HomeFlow · Σύγκριση με πέρσι
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= σύγκριση με πέρσι =======================
function lastYearMonth(year, month) {
  const arr = monthlyExpensesFor(year - 1);
  return arr && arr[month - 1] ? arr[month - 1] : null;
}
function pctChange(now_, before) { if (!before) return null; return Math.round((now_ - before) / before * 100); }
function compareLine(year, month, tE, ytdE) {
  const ly = lastYearMonth(year, month);
  const arr = monthlyExpensesFor(year - 1);
  const lyYtd = arr ? arr.slice(0, month).reduce((a, b) => a + (b || 0), 0) : 0;
  if (!ly && !lyYtd) return '';
  const chip = (p) => p == null ? '' : `<b class="${p > 0 ? 'exp' : 'inc'}">${p > 0 ? '▲ +' + p : '▼ −' + Math.abs(p)}%</b>`;
  return `<div class="cmp">📆 Πέρσι τον ${MONTHS[month - 1].replace(/ς$/, '')} βγήκαν <b class="num">${eur(ly || 0)}</b>${tE ? ` · φέτος ${chip(pctChange(tE, ly))}` : ''}
    ${lyYtd ? `<span class="cmp-sep">·</span> Ιανουάριος–${MONTHS[month - 1]} ${year - 1}: <b class="num">${eur0(lyYtd)}</b>, φέτος <b class="num">${eur0(ytdE)}</b> ${chip(pctChange(ytdE, lyYtd))}` : ''}</div>`;
}
function catLastYearAvg(cid, year) { const t = categoryYearTotal(cid, year - 1); return t ? t / 12 : null; }
