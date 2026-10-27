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
  $('#modal-root').innerHTML = `<div class="modal-back" data-action="modal-back"><div class="modal" style="width:min(44rem,96vw)">
    <div class="modal-head neutral"><h2>Εικόνα για «${esc(c.name)}»</h2><button class="btn small" data-action="picker-close">✕</button></div>
    <div class="modal-body">${EMOJI_GROUPS.map(([g, list]) => `<div class="emoji-group"><div class="flabel">${esc(g)}</div><div class="emoji-grid">${list.map(e => `<button class="${e === c.icon ? 'sel' : ''}" data-action="picker-set" data-id="${esc(catId)}" data-v="${e}">${e}</button>`).join('')}</div></div>`).join('')}
      <div class="emoji-group"><div class="flabel">Δεν το βρίσκετε; Γράψτε ή επικολλήστε δικό σας</div>
        <div style="display:flex;gap:.6rem;align-items:center"><input id="emoji-own" type="text" maxlength="12" style="width:6rem;font-size:1.4rem;text-align:center" value="">
        <button class="btn" data-action="picker-own" data-id="${esc(catId)}">✓ Αυτό</button>
        <span class="muted">Στα Windows: πλήκτρο Windows + τελεία (.)</span></div></div></div>
  </div></div>`;
}
