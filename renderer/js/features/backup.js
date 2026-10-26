'use strict';
// HomeFlow · Δεύτερο αντίγραφο σε cloud και USB
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= αντίγραφα σε cloud και USB =======================
function agoText(iso) {
  if (!iso) return 'ποτέ';
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  const t = new Date(iso);
  const hm = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
  return d <= 0 && t.toDateString() === new Date().toDateString() ? `σήμερα ${hm}` : d <= 1 ? `χθες ${hm}` : `πριν ${d} μέρες (${shortDate(iso.slice(0, 10))})`;
}
async function refreshBackup() { if (window.homeflow && window.homeflow.backupStatus) ui.backup = await window.homeflow.backupStatus(); }
function backupPanel() {
  if (!store.native) return '';
  const b = ui.backup || {};
  const row = (kind, icon, title, help, st) => `<div class="planned-row">
    <span class="p-ic">${icon}</span>
    <span class="p-nm"><b>${title}</b>
      <div class="muted" style="font-size:.92rem">${st ? `${esc(st.dir)}<br>Τελευταίο αντίγραφο: <b class="${st.last && Date.now() - new Date(st.last) < (kind === 'usb' ? 30 : 3) * 86400000 ? 'inc' : 'exp'}">${agoText(st.last)}</b>${!st.present ? ` · <span class="exp">${kind === 'usb' ? 'το USB δεν είναι συνδεδεμένο' : 'ο φάκελος δεν βρέθηκε'}</span>` : ''}` : help}</div></span>
    <span class="p-amt"></span>
    <span class="p-act">${st ? `<button class="btn small primary" data-action="bk-now" data-k="${kind}">🛟 Αντίγραφο τώρα</button><button class="btn small" data-action="bk-open" data-k="${kind}">📂 Άνοιγμα</button><button class="btn small" data-action="bk-choose" data-k="${kind}">Αλλαγή</button><button class="btn small danger" data-action="bk-remove" data-k="${kind}">Αφαίρεση</button>`
      : `<button class="btn small primary" data-action="bk-choose" data-k="${kind}">${kind === 'usb' ? 'Διαλέξτε το USB' : 'Διαλέξτε φάκελο'}</button>`}</span></div>`;
  return `<div class="panel set-section ${ui._setTab === 'data' ? '' : 'hidden'}">
    <h2>🛟 Δεύτερο αντίγραφο</h2>
    <p class="muted" style="margin-top:-.4rem">Τα αντίγραφα στον ίδιο υπολογιστή δεν βοηθούν αν χαλάσει ο δίσκος. Εδώ το HomeFlow κρατάει αντίγραφο και αλλού, μόνο του, σε κάθε αποθήκευση. Κρατιούνται τα αντίγραφα των τελευταίων 30 ημερών.</p>
    ${row('cloud', '☁️', 'Στο cloud (OneDrive ή Google Drive)', 'Διαλέξτε έναν φάκελο μέσα στο OneDrive ή στο Google Drive. Από εκεί τα αντίγραφα ανεβαίνουν μόνα τους στο internet.', b.cloud)}
    ${row('usb', '🔌', 'Σε USB', 'Βάλτε ένα USB στον υπολογιστή και διαλέξτε το. Όποτε είναι συνδεδεμένο, το HomeFlow γράφει αντίγραφο. Θα σας θυμίζει να το βάζετε μία φορά τον μήνα.', b.usb)}
  </div>`;
}
function backupReminders() {
  const out = [], b = ui.backup;
  if (!b || !store.native) return out;
  if (b.usb && (!b.usb.last || Date.now() - new Date(b.usb.last) > 30 * 86400000))
    out.push({ sort: 30, cls: 'wait', icon: '🔌', text: 'Αντίγραφο σε USB', sub: `τελευταίο: ${agoText(b.usb.last)}. Βάλτε το USB στον υπολογιστή.`, btn: '<button class="btn small" data-action="bk-now" data-k="usb">🛟 Αντίγραφο τώρα</button>' });
  if (b.cloud && (!b.cloud.present || !b.cloud.last || Date.now() - new Date(b.cloud.last) > 3 * 86400000))
    out.push({ sort: 29, cls: 'late', icon: '☁️', text: 'Το αντίγραφο στο cloud δεν γίνεται', sub: b.cloud.present ? `τελευταίο: ${agoText(b.cloud.last)}` : 'ο φάκελος δεν βρέθηκε · είναι ανοιχτό το OneDrive / Google Drive;', btn: '<button class="btn small" data-action="bk-now" data-k="cloud">🛟 Δοκιμή</button>' });
  if (!b.cloud && !b.usb && DB.transactions.length > 20)
    out.push({ sort: 40, cls: 'wait', icon: '🛟', text: 'Δεν υπάρχει δεύτερο αντίγραφο', sub: 'αν χαλάσει ο υπολογιστής, τα στοιχεία χάνονται', btn: '<button class="btn small" data-action="bk-setup">Ρύθμιση</button>' });
  return out;
}
const bkActions = {
  'bk-choose': async el => { const r = await window.homeflow.backupChoose(el.dataset.k); if (r.canceled) return; ui.backup = r.status; render(); toast(r.ok ? 'Έτοιμο: το αντίγραφο γράφτηκε.' : r.error); },
  'bk-now': async el => { if (!window.homeflow) return; const r = await window.homeflow.backupNow(el.dataset.k); ui.backup = r.status; render(); toast(r.ok ? 'Το αντίγραφο γράφτηκε ✓' : r.error); },
  'bk-open': el => window.homeflow.backupOpen(el.dataset.k),
  'bk-remove': async el => { if (!confirm('Να σταματήσουν τα αντίγραφα εκεί; (Όσα έχουν γραφτεί δεν σβήνονται.)')) return; ui.backup = await window.homeflow.backupRemove(el.dataset.k); render(); },
  'bk-setup': () => { ui.page = 'settings'; ui.tabs.settings = 'data'; render(); }
};
