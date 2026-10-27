'use strict';
// HomeFlow · Συνημμένα αρχεία
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= συνημμένα αρχεία =======================
const ATT_ICON = n => /\.pdf$/i.test(n) ? '📄' : /\.(jpe?g|png|heic|gif|webp)$/i.test(n) ? '🖼️' : /\.(docx?|odt)$/i.test(n) ? '📝' : /\.(xlsx?|ods|csv)$/i.test(n) ? '📊' : '📎';
function attOwner(kind, id) { return kind === 'tenant' ? tenantById(id) : kind === 'car' ? DB.cars.find(c => c.id === id) : kind === 'policy' ? (DB.policies || []).find(p => p.id === id) : kind === 'person' ? DB.people.find(p => p.id === id) : kind === 'tx' ? DB.transactions.find(t => t.id === id) : null; }
function attBlock(kind, id, list) {
  list = list || [];
  if (!store.native && !list.length) return '';
  return `<div class="att no-print">${list.map(a => `<span class="att-chip"><button class="att-open" data-action="att-open" data-file="${esc(a.file)}" title="Άνοιγμα">${ATT_ICON(a.name)} ${esc(a.name)}</button><button class="att-x" data-action="att-del" data-kind="${kind}" data-id="${esc(id || '')}" data-file="${esc(a.file)}" title="Αφαίρεση">✕</button></span>`).join('')}
    ${store.native ? `<button class="btn small" data-action="att-add" data-kind="${kind}" data-id="${esc(id || '')}">📎 Επισύναψη αρχείου</button>` : ''}</div>`;
}
async function attPick(title) {
  if (!window.homeflow || !window.homeflow.attAdd) { toast('Τα συνημμένα λειτουργούν μόνο στην εφαρμογή.'); return []; }
  const r = await window.homeflow.attAdd(title);
  if (r && r.error) toast(r.error);
  return (r && r.files) || [];
}
const attActions = {
  'att-add': async el => {
    const kind = el.dataset.kind;
    if (kind === 'form') { if (!form) return; syncFormInputs(); const files = await attPick('Επιλέξτε αρχείο (π.χ. απόδειξη, λογαριασμός)'); if (!files.length) return; form.attachments = [...(form.attachments || []), ...files]; renderForm(); return; }
    const o = attOwner(kind, el.dataset.id); if (!o) return;
    const files = await attPick('Επιλέξτε αρχείο για επισύναψη'); if (!files.length) return;
    o.attachments = [...(o.attachments || []), ...files]; persist(); render(); toast(files.length === 1 ? `Επισυνάφθηκε: ${files[0].name}` : `Επισυνάφθηκαν ${files.length} αρχεία`);
  },
  'att-open': async el => { if (!window.homeflow) return; const r = await window.homeflow.attOpen(el.dataset.file); if (r && r.error) toast(r.error); },
  'att-del': async el => {
    const kind = el.dataset.kind, file = el.dataset.file;
    if (!confirmBox('Να αφαιρεθεί αυτό το αρχείο; (Θα πάει στον Κάδο ανακύκλωσης.)')) return;
    if (kind === 'form') { if (!form) return; syncFormInputs(); form.attachments = (form.attachments || []).filter(a => a.file !== file); renderForm(); }
    else { const o = attOwner(kind, el.dataset.id); if (o) { o.attachments = (o.attachments || []).filter(a => a.file !== file); persist(); render(); } }
    if (window.homeflow && window.homeflow.attRemove) window.homeflow.attRemove(file);
  }
};
