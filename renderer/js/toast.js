'use strict';
// HomeFlow · Μικρά μηνύματα (toast) και επιλογή εικόνας κατηγορίας
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

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
