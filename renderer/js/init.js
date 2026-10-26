'use strict';
// HomeFlow · Εκκίνηση: φόρτωμα δεδομένων
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

async function reload() {
  const res = await store.load();
  if (res && res.error) alert(res.error);
  DB = res && validData(res.data) ? normalize(res.data) : null;
  if (DB && generateRecurring()) persist();
  if (window.homeflow) { ui.info = await window.homeflow.info(); $('#brand-version').textContent = 'Έκδοση ' + ui.info.version; }
  await refreshBackup();
  checkJustUpdated();
  applyFont();
  if (DB && DB.settings.pin) { locked = true; renderLock(); }
  render();
}
reload();
// Κάθε ώρα: αν άλλαξε ο μήνας, να εμφανιστούν τα νέα πάγια
setInterval(() => { if (DB && !form && !dlg && generateRecurring()) { persist(); render(); } }, 60 * 60 * 1000);
