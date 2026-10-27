'use strict';
// HomeFlow · Ενημέρωση εφαρμογής (πάντα με ερώτηση)
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ενημερώσεις εφαρμογής: πάντα με ερώτηση, ποτέ αυτόματα
let updInfo = null, updLater = false;
function updBanner(html, cls) {
  const b = $('#update-banner'); if (!b) return;
  if (!html) { b.classList.add('hidden'); return; }
  b.className = 'update-banner' + (cls ? ' ' + cls : ''); b.innerHTML = html;
}
const UPD_WHY = {
  programfiles: 'Το HomeFlow είναι στον φάκελο «Program Files», όπου δεν μπορεί να γράψει μόνο του. Μεταφέρετέ το π.χ. στα Έγγραφα και η επόμενη ενημέρωση θα γίνει με ένα κλικ.',
  readonly: 'Ο φάκελος του HomeFlow δεν επιτρέπει αλλαγές, οπότε η ενημέρωση γίνεται με το χέρι.',
  translocated: 'Το Mac τρέχει το HomeFlow από προσωρινή θέση. Βάλτε το στις Εφαρμογές και ανοίξτε το από εκεί· η επόμενη ενημέρωση θα γίνει με ένα κλικ.',
  noassets: 'Η νέα έκδοση δεν έχει ακόμα αρχεία για αυτόματη ενημέρωση.',
  datainside: 'Τα στοιχεία σας είναι μέσα στον φάκελο του προγράμματος, οπότε η αυτόματη ενημέρωση δεν γίνεται (θα τα αντικαθιστούσε). Βάλτε το πρόγραμμα σε άλλον φάκελο, π.χ. «HomeFlow πρόγραμμα», ή αλλάξτε τον φάκελο των στοιχείων από τις Ρυθμίσεις.'
};
function showUpdate(s) {
  const m = $('#upd-msg');
  if (s.status === 'manual') {
    updInfo = s;
    if (m) m.innerHTML = `Υπάρχει νέα έκδοση <b>${esc(s.version)}</b>. ${s.canAuto ? '<button class="btn small primary" data-action="update-now">⬇️ Ενημέρωση τώρα</button>' : ''}`;
    if (updLater) return;
    if (s.canAuto) updBanner(`🎉 Υπάρχει νέα έκδοση <b>${esc(s.version)}</b> του HomeFlow. <button class="btn small primary" data-action="update-now">⬇️ Ενημέρωση τώρα</button> <button class="btn small" data-action="update-later">Αργότερα</button>`);
    else {
      const how = s.platform === 'darwin' ? 'Κατεβάστε το zip, ανοίξτε το και βάλτε το νέο HomeFlow στις Εφαρμογές στη θέση του παλιού.' : 'Κλείστε το HomeFlow, κατεβάστε το zip και βάλτε τον νέο φάκελο στη θέση του παλιού.';
      updBanner(`🎉 Υπάρχει νέα έκδοση ${esc(s.version)}. <button class="btn small" data-action="open-url" data-url="${esc(s.url)}">Κατέβασμα</button> <span style="font-weight:500">${how} Τα στοιχεία σας δεν χάνονται. ${UPD_WHY[s.reason] ? esc(UPD_WHY[s.reason]) : ''}</span> <button class="btn small" data-action="update-later">✕</button>`);
    }
    return;
  }
  const msg = {
    checking: 'Έλεγχος…', latest: 'Έχετε την πιο νέα έκδοση ✓', error: 'Δεν έγινε έλεγχος (ίσως δεν υπάρχει internet).',
    downloading: `⬇️ Κατεβαίνει η έκδοση ${s.version}…`, progress: `⬇️ Κατεβαίνει η έκδοση ${s.version}… <b>${s.percent || 0}%</b>`,
    verifying: '🔎 Έλεγχος ότι το αρχείο κατέβηκε σωστά…', installing: '📦 Ετοιμάζεται η νέα έκδοση…', restarting: '🔄 Το HomeFlow κλείνει και ξανανοίγει στη νέα έκδοση…'
  }[s.status];
  if (['downloading', 'progress', 'verifying', 'installing', 'restarting'].includes(s.status)) {
    updBanner(`${msg} <span style="font-weight:500">Μην κλείσετε τον υπολογιστή.</span>${s.status === 'progress' ? `<span class="upd-bar"><i style="width:${s.percent || 0}%"></i></span>` : ''}`);
    if (m) m.innerHTML = msg;
    return;
  }
  if (s.status === 'install-error') {
    updBanner(`⚠ Η ενημέρωση δεν έγινε: ${esc(s.message)} <span style="font-weight:500">Η τωρινή έκδοση συνεχίζει κανονικά και τα στοιχεία σας είναι εντάξει.</span> <button class="btn small" data-action="update-now">Δοκιμή ξανά</button> <button class="btn small" data-action="open-url" data-url="${esc(s.url || '')}">Κατέβασμα με το χέρι</button>`, 'bad');
    if (m) m.textContent = 'Η ενημέρωση δεν έγινε.';
    return;
  }
  if (m && msg) m.innerHTML = msg;
}
if (window.homeflow) window.homeflow.onUpdate(showUpdate);
const updActions = {
  'update-log': async () => { const r = await window.homeflow.openUpdateLog(); if (r && r.error) toast(r.error); },
  'update-later': () => { updLater = true; updBanner(''); },
  'update-now': () => {
    if (!updInfo || !updInfo.canAuto) return;
    dlg = { kind: 'upd', error: '' }; renderDlg();
  }
};
function renderUpdDlg(d) {
  if (d.kind !== 'upd') return null;
  return { head: 'neutral', title: `⬇️ Ενημέρωση στην έκδοση ${esc(updInfo.version)}`, body: `
    <p style="margin:0;font-size:1.15rem">Το HomeFlow θα κατεβάσει τη νέα έκδοση, θα <b>κλείσει</b> και θα <b>ξανανοίξει μόνο του</b> σε λίγα δευτερόλεπτα.</p>
    <ul style="margin:0;font-size:1.05rem;line-height:1.6">
      <li>Τα στοιχεία σας <b>δεν αλλάζουν</b>. Πριν από την ενημέρωση κρατιέται και αντίγραφο ασφαλείας.</li>
      <li>Αν κάτι δεν πάει καλά, μένει η τωρινή έκδοση.</li>
      ${DB && DB.settings.pin ? '<li>Μετά την επανεκκίνηση θα σας ζητήσει το PIN.</li>' : ''}
    </ul>` };
}
Object.assign(actions, updActions);
async function saveUpdDlg() {
  dlg = null; renderDlg();
  try { await persist(); } catch (e) { /* τίποτα */ }
  updBanner('⬇️ Ξεκινάει η ενημέρωση…');
  const r = await window.homeflow.installUpdate();
  if (r && !r.ok && r.error) toast(r.error);
}
async function checkJustUpdated() {
  if (!window.homeflow || !window.homeflow.justUpdated) return;
  const r = await window.homeflow.justUpdated();
  if (r && r.to) toast(`✓ Το HomeFlow ενημερώθηκε στην έκδοση ${r.to}.`);
  else if (r && r.failed) updBanner('⚠ Η τελευταία ενημέρωση δεν ολοκληρώθηκε και έμεινε η προηγούμενη έκδοση. Τα στοιχεία σας είναι εντάξει. Δοκιμάστε ξανά αργότερα ή κατεβάστε τη νέα έκδοση με το χέρι.', 'bad');
}
