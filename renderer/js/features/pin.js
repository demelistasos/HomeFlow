'use strict';
// HomeFlow · PIN στο άνοιγμα και οθόνη κλειδώματος
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= PIN στο άνοιγμα =======================
// Το PIN κλειδώνει την οθόνη. Δεν κρυπτογραφεί το αρχείο.
let locked = false;
let lockState = { digits: '', error: '', mode: 'pin', code: '' };
const hexOf = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function pinHash(pin, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return hexOf(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 150000 }, key, 256));
}
const newSalt = () => hexOf(crypto.getRandomValues(new Uint8Array(16)));
async function checkPin(pin) { const p = DB.settings.pin; return !!p && await pinHash(pin, p.salt) === p.hash; }
async function checkRecovery(code) { const p = DB.settings.pin; return !!p && await pinHash(code.replace(/\D/g, ''), p.rsalt) === p.rhash; }
function renderLock() {
  let root = $('#lock-root');
  if (!locked) { if (root) root.remove(); return; }
  if (!root) { root = document.createElement('div'); root.id = 'lock-root'; document.body.appendChild(root); }
  const s = lockState;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  root.innerHTML = `<div class="lock">
    <img src="logo.svg" alt="" class="lock-logo">
    <h1>HomeFlow</h1>
    ${s.mode === 'pin' ? `<p>Γράψτε το PIN σας</p>
      <div class="pin-dots ${s.error ? 'bad' : ''}">${[0, 1, 2, 3].map(i => `<i class="${i < s.digits.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="lock-msg">${esc(s.error)}</div>
      <div class="keypad">${keys.map(k => k ? `<button class="key" data-action="lock-key" data-v="${k}">${k}</button>` : '<span></span>').join('')}</div>
      <button class="btn small" data-action="lock-forgot">Ξέχασα το PIN</button>`
    : `<p>Γράψτε τον κωδικό επαναφοράς<br><span class="muted" style="font-size:.95rem">(τον 8ψήφιο κωδικό που γράψατε σε χαρτί όταν βάλατε το PIN)</span></p>
      <input id="lock-code" class="amount-input num" style="width:16rem;text-align:center" inputmode="numeric" maxlength="9" value="${esc(s.code)}">
      <div class="lock-msg">${esc(s.error)}</div>
      <div style="display:flex;gap:.6rem"><button class="btn" data-action="lock-back">◀ Πίσω</button><button class="btn primary" data-action="lock-recover">Ξεκλείδωμα</button></div>`}
  </div>`;
  if (s.mode === 'code') setTimeout(() => { const i = $('#lock-code'); if (i) i.focus(); }, 30);
}
async function lockKey(k) {
  const s = lockState;
  if (k === '⌫') { s.digits = s.digits.slice(0, -1); s.error = ''; renderLock(); return; }
  if (s.digits.length >= 4) return;
  s.digits += k; s.error = ''; renderLock();
  if (s.digits.length === 4) {
    if (await checkPin(s.digits)) { locked = false; lockState = { digits: '', error: '', mode: 'pin', code: '' }; renderLock(); render(); }
    else { s.error = 'Λάθος PIN. Δοκιμάστε ξανά.'; s.digits = ''; renderLock(); }
  }
}
function lockNow() { if (DB && DB.settings.pin) { locked = true; dlg = null; form = null; renderDlg(); renderForm(); renderLock(); } }
let lastActivity = Date.now();
['mousemove', 'keydown', 'click', 'wheel'].forEach(e => document.addEventListener(e, () => { lastActivity = Date.now(); }, { passive: true, capture: true }));
setInterval(() => { if (!locked && DB && DB.settings.pin && DB.settings.pin.autoLock && Date.now() - lastActivity > 15 * 60 * 1000) lockNow(); }, 30 * 1000);
function pinPanel() {
  const p = DB.settings.pin;
  return `<div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🔒 PIN στο άνοιγμα</h2>
    ${p ? `<p style="margin-top:-.3rem">Το HomeFlow ζητάει <b>PIN</b> κάθε φορά που ανοίγει.</p>
      <label class="check"><input type="checkbox" id="pin-autolock" ${p.autoLock ? 'checked' : ''}> Να κλειδώνει και όταν δεν το χρησιμοποιείτε για 15 λεπτά</label>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem"><button class="btn" data-action="pin-lock">🔒 Κλείδωμα τώρα</button><button class="btn" data-action="pin-set">Αλλαγή PIN</button><button class="btn danger" data-action="pin-off">Αφαίρεση PIN</button></div>`
    : `<p style="margin-top:-.3rem" class="muted">Αν το βάλετε, το HomeFlow θα ζητάει έναν 4ψήφιο αριθμό κάθε φορά που ανοίγει, ώστε να μη βλέπει κανείς άλλος τα οικονομικά σας.</p>
      <button class="btn primary" data-action="pin-set">🔒 Βάλτε PIN</button>`}
  </div>`;
}
// Απλό παράθυρο με ένα πεδίο (αντί για prompt(), που δεν λειτουργεί στην εφαρμογή)
function ask({ title, label, value = '', password = false, numeric = false, hint = '', onOk }) {
  dlg = { kind: 'ask', title, label, value, password, numeric, hint, onOk, error: '' }; renderDlg();
  setTimeout(() => { const i = $('#d-ask'); if (i) { i.focus(); i.select(); } }, 30);
}
async function saveAsk() {
  const d = dlg; const v = ($('#d-ask') || {}).value || '';
  const err = await d.onOk(v.trim());
  if (err) { d.value = v; d.error = err; renderDlg(); return; }
  if (dlg === d) { dlg = null; renderDlg(); }
}
function renderPinDlg(d) {
  if (d.kind === 'ask') return { head: 'neutral', title: esc(d.title), body: `<div class="field"><label for="d-ask">${esc(d.label)}</label>
    <input id="d-ask" ${d.password ? 'type="password"' : 'type="text"'} ${d.numeric ? 'inputmode="numeric" class="amount-input num" style="width:12rem;text-align:center"' : 'style="width:100%;font-size:1.2rem"'} value="${esc(d.value)}">
    ${d.hint ? `<div class="hint">${esc(d.hint)}</div>` : ''}</div>` };
  if (d.kind !== 'pin') return null;
  if (d.step === 'code') return { head: 'neutral', title: '🔒 Γράψτε αυτόν τον κωδικό σε χαρτί', body: `
    <p style="margin:0;font-size:1.1rem">Αν ξεχάσετε το PIN, με αυτόν τον κωδικό ξεκλειδώνει το HomeFlow. Γράψτε τον και φυλάξτε τον κάπου σίγουρο.</p>
    <div style="font-size:2.6rem;font-weight:800;letter-spacing:.12em;text-align:center;padding:1rem;border-radius:20px;background:var(--brand-soft);color:var(--brand)" class="num">${d.code.slice(0, 4)} ${d.code.slice(4)}</div>
    <label class="check"><input type="checkbox" id="d-wrote"> Τον έγραψα σε χαρτί</label>` };
  return { head: 'neutral', title: DB.settings.pin ? '🔒 Αλλαγή PIN' : '🔒 Νέο PIN', body: `
    ${DB.settings.pin ? `<div class="field"><label for="d-pold">Το τωρινό PIN</label><input id="d-pold" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.old)}"></div>` : ''}
    <div class="row">
      <div class="field"><label for="d-p1">Νέο PIN (4 αριθμοί)</label><input id="d-p1" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.p1)}"></div>
      <div class="field"><label for="d-p2">Ξανά το ίδιο</label><input id="d-p2" class="amount-input num" style="width:10rem;text-align:center" type="password" inputmode="numeric" maxlength="4" value="${esc(d.p2)}"></div>
    </div>
    <div class="hint muted">Διαλέξτε κάτι που θυμάστε, όχι 1234 ή 0000.</div>` };
}
async function savePinDlg() {
  const d = dlg; const v = id => { const e = $('#' + id); return e ? e.value.trim() : ''; };
  const fail = m => { d.error = m; renderDlg(); };
  if (d.step === 'code') {
    if (!$('#d-wrote') || !$('#d-wrote').checked) return fail('Τσεκάρετε «Τον έγραψα σε χαρτί» για να συνεχίσετε.');
    dlg = null; renderDlg(); toast('Το PIN μπήκε. Θα το ζητάει κάθε φορά που ανοίγει το HomeFlow.'); return;
  }
  d.old = v('d-pold'); d.p1 = v('d-p1'); d.p2 = v('d-p2');
  if (DB.settings.pin && !(await checkPin(d.old))) return fail('Το τωρινό PIN δεν είναι σωστό.');
  if (!/^\d{4}$/.test(d.p1)) return fail('Το PIN πρέπει να είναι 4 αριθμοί.');
  if (d.p1 !== d.p2) return fail('Τα δύο PIN δεν είναι ίδια.');
  if (['0000', '1234', '1111', '4321'].includes(d.p1)) return fail('Αυτό το PIN είναι πολύ εύκολο. Διαλέξτε άλλο.');
  const salt = newSalt(), rsalt = newSalt();
  const code = Array.from(crypto.getRandomValues(new Uint32Array(8)), x => x % 10).join('');
  DB.settings.pin = { salt, hash: await pinHash(d.p1, salt), rsalt, rhash: await pinHash(code, rsalt), autoLock: DB.settings.pin ? !!DB.settings.pin.autoLock : true };
  persist(); render();
  dlg = { kind: 'pin', step: 'code', code, error: '' }; renderDlg();
}
const pinActions = {
  'pin-set': () => { dlg = { kind: 'pin', step: 'set', old: '', p1: '', p2: '', error: '' }; renderDlg(); setTimeout(() => { const i = $('#d-pold') || $('#d-p1'); if (i) i.focus(); }, 30); },
  'pin-off': () => ask({ title: '🔒 Αφαίρεση PIN', label: 'Για να αφαιρεθεί το PIN, γράψτε το τωρινό PIN', password: true, numeric: true,
    onOk: async p => { if (!(await checkPin(p))) return 'Λάθος PIN.'; delete DB.settings.pin; persist(); render(); toast('Το PIN αφαιρέθηκε.'); } }),
  'pin-lock': () => lockNow(),
  'lock-key': el => lockKey(el.dataset.v),
  'lock-forgot': () => { lockState = { digits: '', error: '', mode: 'code', code: '' }; renderLock(); },
  'lock-back': () => { lockState = { digits: '', error: '', mode: 'pin', code: '' }; renderLock(); },
  'lock-recover': async () => {
    const code = ($('#lock-code') || {}).value || '';
    if (await checkRecovery(code)) { delete DB.settings.pin; persist(); locked = false; renderLock(); render(); toast('Ξεκλειδώθηκε. Το PIN αφαιρέθηκε. Βάλτε νέο από τις Ρυθμίσεις.'); }
    else { lockState.error = 'Ο κωδικός δεν είναι σωστός.'; lockState.code = code; renderLock(); }
  }
};
