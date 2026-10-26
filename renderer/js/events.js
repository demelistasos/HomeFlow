'use strict';
// HomeFlow · Συμβάντα: κλικ, πληκτρολόγιο, αλλαγές πεδίων
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ======================= συμβάντα =======================
document.addEventListener('click', ev => {
  if (locked) { const el = ev.target.closest('[data-action]'); if (el && el.dataset.action.startsWith('lock-') && actions[el.dataset.action]) actions[el.dataset.action](el, ev); return; }
  const nav = ev.target.closest('#nav button');
  if (nav) { if (!DB) return; ui.page = nav.dataset.page; ui.tenantId = null; ui.personId = null; ui.carId = null; if (ui.page === 'year') ui.yearView = ui.year; if (ui.page === 'list') Object.assign(ui.list, { year: ui.year, month: ui.month }); render(); $('.main').scrollTop = 0; return; }
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if ((a === 'new-expense' || a === 'new-income') && !DB) return;
  if (actions[a]) actions[a](el, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'd-amount' && dlg) {
    dlg.amountStr = t.value; const c = $('#d-calc'); if (c) c.innerHTML = calcHint(t.value, parseAmount(t.value));
    const bd = $('#d-baldiff'); if (bd && dlg.kind === 'bal') bd.innerHTML = balDiffHint(DB.accounts.find(x => x.id === dlg.id), parseAmount(t.value));
    return;
  }
  if (t.id === 'pal-q' && pal) { pal.q = t.value; pal.sel = 0; renderPal(true); return; }
  if (dlg && dlg.kind === 'pbill' && /^d-p(kwh|energy|fees|r0|r1)$/.test(t.id)) { syncDlg2(); const pv = $('#d-ppreview'); if (pv) pv.innerHTML = powerPreview(dlg); return; }
  if (t.id === 'fm-amount' && form) {
    form.amountStr = t.value; const c = $('#fm-calc'); if (c) c.innerHTML = calcHint(t.value, parseAmount(t.value));
    const sh = $('#fm-share'); if (sh) sh.innerHTML = shareHint(form, parseAmount(t.value));
  } else if (t.id === 'f-q') { ui.list.q = t.value; ui.list.limit = 200; ui._focusSearch = true; render(); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'f-year') { ui.list.year = +t.value; render(); }
  else if (t.id === 'f-month') { ui.list.month = +t.value; render(); }
  else if (t.id === 'f-type') { ui.list.type = t.value; ui.list.cat = ''; render(); }
  else if (t.id === 'f-cat') { ui.list.cat = t.value; render(); }
  else if (t.id === 'year-pick') { ui.yearView = +t.value; render(); }
  else if (t.id === 'fm-date' && form) { syncFormInputs(); renderForm(); }
  else if (t.id === 'd-end' && dlg && dlg.kind === 'leave') { syncLeave(); renderDlg(); }
  else if (t.id === 'auto-fit') { DB.settings.autoFit = t.checked; applyFont(); persist(); render(); }
  else if (t.id === 'call-me') { DB.settings.callMe = t.value.trim(); persist(); toast(DB.settings.callMe ? `Θα σας λέει «${DB.settings.callMe}».` : 'Χαιρετισμός χωρίς όνομα.'); }
  else if (t.id === 'pin-autolock' && DB.settings.pin) { DB.settings.pin.autoLock = t.checked; persist(); toast(t.checked ? 'Θα κλειδώνει μετά από 15 λεπτά χωρίς χρήση.' : 'Δεν θα κλειδώνει μόνο του.'); }
  else if (t.id === 'persons') { DB.settings.persons = t.value.split(',').map(s => s.trim()).filter(Boolean); persist(); toast('Τα πρόσωπα αποθηκεύτηκαν.'); }
  else if (t.dataset.catField) {
    const c = catById(t.dataset.id); if (!c) return;
    const k = t.dataset.catField;
    if (k === 'name') { if (t.value.trim()) c.name = t.value.trim(); }
    else if (k === 'budget') c.budget = t.value ? Math.max(0, +t.value) : null;
    else c[k] = t.checked;
    persist(); if (k !== 'name' && k !== 'budget') render();
  }
});
document.addEventListener('keydown', ev => {
  if (locked) {
    if (lockState.mode === 'pin' && /^[0-9]$/.test(ev.key)) { ev.preventDefault(); lockKey(ev.key); }
    else if (lockState.mode === 'pin' && ev.key === 'Backspace') { ev.preventDefault(); lockKey('⌫'); }
    else if (lockState.mode === 'code' && ev.key === 'Enter') { ev.preventDefault(); actions['lock-recover'](); }
    return;
  }
  if (pal) {
    const n = (pal.res || []).length;
    if (ev.key === 'Escape') { ev.preventDefault(); pal = null; renderPal(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); pal.sel = Math.min(n - 1, pal.sel + 1); renderPal(true); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); pal.sel = Math.max(0, pal.sel - 1); renderPal(true); }
    else if (ev.key === 'Enter') { ev.preventDefault(); const r = pal.res && pal.res[pal.sel]; if (r) r.run(); }
    return;
  }
  if (ev.key === 'F1' && DB && !form) { ev.preventDefault(); openHelp(); return; }
  const mod = ev.ctrlKey || ev.metaKey;
  if (mod && !ev.altKey && DB) {
    const c = ev.code;
    if (c === 'KeyK' || c === 'KeyF') { ev.preventDefault(); if (!form) openSearch(); return; }
    if (!dlg && !form) {
      if (c === 'KeyE') { ev.preventDefault(); openForm('expense'); return; }
      if (c === 'KeyI') { ev.preventDefault(); openForm('income'); return; }
      if (c === 'KeyP') { ev.preventDefault(); exportSummary(); return; }
      const dg = /^Digit(\d)$/.exec(c);
      if (dg) { ev.preventDefault(); const pg = dg[1] === '0' ? 'settings' : NAV_ORDER[+dg[1] - 1]; if (pg) goTo(pg); return; }
    }
  }
  if (dlg) {
    if (ev.key === 'Escape') { ev.preventDefault(); dlg = null; renderDlg(); }
    else if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); saveDlg(); }
    return;
  }
  if (form) {
    if (ev.key === 'Escape') { ev.preventDefault(); if (confirmCloseForm()) { form = null; renderForm(); } }
    else if (ev.key === 'Enter' && ev.target.tagName !== 'BUTTON') { ev.preventDefault(); saveForm(); }
    return;
  }
  if (ev.key === 'Escape' && $('#modal-root').innerHTML) { $('#modal-root').innerHTML = ''; return; }
  if (!DB || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
  if (ev.key === '/') { ev.preventDefault(); openSearch(); return; }
  if (ui.page === 'home' && ev.key === 'ArrowLeft') actions['month-prev']();
  if (ui.page === 'home' && ev.key === 'ArrowRight') actions['month-next']();
});
