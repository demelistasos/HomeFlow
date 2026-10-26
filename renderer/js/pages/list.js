'use strict';
// HomeFlow · Σελίδα «Κινήσεις»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Κινήσεις ----------
function filteredList() {
  const f = ui.list;
  const qt = normS(f.q.trim()).split(/\s+/).filter(Boolean);
  return DB.transactions.filter(t => {
    if (f.year && yOf(t) !== f.year) return false;
    if (f.month && mOf(t) !== f.month) return false;
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.cat && t.categoryId !== f.cat) return false;
    if (qt.length) {
      const hay = normS([catName(t.categoryId), t.note, t.person, t.method, t.tenantId && tenantById(t.tenantId) ? tenantById(t.tenantId).name : '', numFmt.format(t.amount), String(t.amount).replace('.', ',')].join(' '));
      if (!qt.every(x => hay.includes(x))) return false;
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
    <button class="btn no-print" data-action="export-csv">📄 Μόνο αυτές οι κινήσεις</button>
    <button class="btn no-print" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button></div>
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
      <td style="white-space:nowrap">${esc(tableDate(t))}</td>
      <td><span style="font-size:1.2rem">${esc(catIcon(t.categoryId))}</span> ${esc(catName(t.categoryId))}</td>
      <td>${esc(t.note)}${t.planned ? '<span class="tag planned">προγραμματισμένο</span>' : ''}</td>
      <td>${esc(t.tenantId && tenantById(t.tenantId) ? '🔑 ' + tenantById(t.tenantId).name : t.person)}</td><td>${esc(t.method)}</td>
      <td class="r num ${t.type === 'income' ? 'inc' : 'exp'}" style="font-weight:700">${t.type === 'income' ? '+' : '−'} ${eur(t.amount)}</td></tr>`).join('')}</tbody>
  </table></div>
  ${rows.length > shown.length ? `<div style="text-align:center;margin-top:1rem"><button class="btn" data-action="more">Δείτε περισσότερες (${rows.length - shown.length} ακόμα)</button></div>` : ''}`
    : '<div class="panel empty">Δεν βρέθηκαν κινήσεις με αυτά τα φίλτρα.</div>'}`;
}
