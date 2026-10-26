'use strict';
// HomeFlow · Κεντρικό σχεδίασμα σελίδας και οθόνη καλωσορίσματος
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= σελίδες =======================
function render() {
  document.querySelectorAll('#nav button').forEach(b => { b.classList.toggle('active', b.dataset.page === ui.page); const i = NAV_ORDER.indexOf(b.dataset.page); if (!b.title) b.title = i >= 0 ? `${MOD}+${i + 1}` : b.dataset.page === 'settings' ? `${MOD}+0` : ''; });
  const page = $('#page');
  if (!DB) { page.innerHTML = welcomePage(); return; }
  if (locked) { page.innerHTML = ''; renderLock(); return; }
  const fn = { home: homePage, list: listPage, rent: rentPage, money: moneyPage, recurring: recurringPage, tax: taxPage, people: peoplePage, cars: carsPage, field: fieldPage, year: yearPage, history: historyPage, settings: settingsPage }[ui.page];
  page.innerHTML = fn();
  if (ui.page === 'list') { const q = $('#f-q'); if (q && ui._focusSearch) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); ui._focusSearch = false; } }
}

function welcomePage() {
  return `
  <div class="page-head"><h1>Καλώς ήρθατε στο HomeFlow</h1></div>
  <div class="panel" style="max-width:46rem">
    <p style="font-size:1.15rem;margin-top:0">Εδώ θα γράφετε τα έσοδα και τα έξοδα του σπιτιού. Πώς θέλετε να ξεκινήσετε;</p>
    <div style="display:flex;flex-direction:column;gap:.8rem">
      <button class="btn big primary" data-action="welcome-import">📂 Άνοιγμα αρχείου HomeFlow (τα στοιχεία από το Excel)</button>
      <button class="btn big" data-action="welcome-fresh">✨ Ξεκινάω από την αρχή</button>
    </div>
  </div>`;
}
