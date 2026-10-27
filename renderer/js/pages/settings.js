'use strict';
// HomeFlow · Σελίδα «Ρυθμίσεις»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Ρυθμίσεις ----------
function settingsPage() {
  const s = DB.settings;
  const info = ui.info || {};
  const catTable = type => {
    const cats = DB.categories.filter(c => c.type === type).sort((a, b) => a.order - b.order);
    const counts = {};
    for (const t of DB.transactions) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    return `<table class="data cat-table"><thead><tr><th style="width:4.2rem"></th><th>Όνομα</th>${type === 'expense' ? '<th style="width:8rem">Πρόβλεψη €/χρόνο</th><th style="width:5.5rem;text-align:center">Έκτακτο</th>' : ''}<th style="width:5.5rem;text-align:center">Κρυφή</th><th style="width:6.2rem">Σειρά</th><th style="width:6.8rem"></th></tr></thead><tbody>
      ${cats.map((c, i) => `<tr style="cursor:default${c.archived ? ';opacity:.55' : ''}">
        <td><button class="ic-btn" data-action="pick-icon" data-id="${esc(c.id)}">${esc(c.icon)}</button></td>
        <td><input type="text" data-cat-field="name" data-id="${esc(c.id)}" value="${esc(c.name)}"></td>
        ${type === 'expense' ? `<td><input type="number" min="0" step="1" data-cat-field="budget" data-id="${esc(c.id)}" value="${c.budget || ''}" placeholder="—"></td>
        <td style="text-align:center"><input type="checkbox" class="big-check" style="width:1.4rem;height:1.4rem" data-cat-field="extra" data-id="${esc(c.id)}" ${c.extra ? 'checked' : ''}></td>` : ''}
        <td style="text-align:center"><input type="checkbox" style="width:1.4rem;height:1.4rem" data-cat-field="archived" data-id="${esc(c.id)}" ${c.archived ? 'checked' : ''}></td>
        <td><button class="btn small" data-action="cat-up" data-id="${esc(c.id)}" ${i === 0 ? 'disabled' : ''}>▲</button> <button class="btn small" data-action="cat-down" data-id="${esc(c.id)}" ${i === cats.length - 1 ? 'disabled' : ''}>▼</button></td>
        <td>${counts[c.id] ? `<span class="muted" style="font-size:.85rem">${counts[c.id]} κιν.</span>` : `<button class="btn small danger" data-action="cat-delete" data-id="${esc(c.id)}" title="Διαγραφή">🗑 Σβήσιμο</button>`}</td>
      </tr>`).join('')}</tbody></table>
      <button class="btn" style="margin-top:.7rem" data-action="cat-add" data-type="${type}">+ Νέα κατηγορία ${type === 'expense' ? 'εξόδων' : 'εσόδων'}</button>`;
  };
  return `
  <div class="page-head"><h1>Ρυθμίσεις</h1></div>
  ${(() => { const [t, b] = tabBar('settings', [{ k: 'general', icon: '🎨', label: 'Εμφάνιση & πρόσωπα' }, { k: 'exp', icon: '📂', label: 'Κατηγορίες εξόδων' }, { k: 'inc', icon: '💶', label: 'Κατηγορίες εσόδων' }, { k: 'data', icon: '💾', label: 'Τα δεδομένα μου' }, { k: 'version', icon: '🔄', label: 'Έκδοση' }], 'general'); ui._setTab = t; return b; })()}

  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🎨 Εμφάνιση</h2>
    <div class="theme-pick">${[['light', '☀️ Φωτεινή', ['#EEF4F7', '#ffffff', '#0B7A8A']], ['dark', '🌙 Σκούρα', ['#0E1A29', '#162537', '#3CC3D2']], ['auto', '🖥️ Αυτόματα', ['#EEF4F7', '#0E1A29', '#0B7A8A']]].map(([k, l, c]) => `<button class="${themePref() === k ? 'sel' : ''}" data-action="theme" data-v="${k}"><span class="sw" style="background:${c[0]}"><i style="background:${c[1]}"></i><i style="background:${c[2]}"></i></span>${l}</button>`).join('')}</div>
    <div class="hint muted" style="margin-top:.6rem">«Αυτόματα»: φωτεινή τη μέρα και σκούρα όταν ο υπολογιστής είναι σε σκούρα λειτουργία.</div>
  </div>
  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>👋 Πώς να σας λέει;</h2>
    <p class="muted" style="margin-top:-.4rem">Το όνομα στον χαιρετισμό της αρχικής οθόνης («Καλημέρα, …»). Αφήστε το κενό για χαιρετισμό χωρίς όνομα.</p>
    <input type="text" id="call-me" value="${esc(DB.settings.callMe != null ? DB.settings.callMe : ((DB.settings.persons || [])[0] || '').replace(/ος$/, 'ο').replace(/ης$/, 'η').replace(/ας$/, 'α'))}" placeholder="π.χ. Νίκο" style="width:18rem;border:2px solid var(--line-2);border-radius:14px;padding:.6rem .9rem;background:var(--paper);font-size:1.1rem">
  </div>
  ${pinPanel()}
  ${shortcutsPanel()}
  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>🔠 Μέγεθος γραμμάτων</h2>
    <div class="chips">${FONT_SCALES.map(f => `<button class="chip ${s.fontScale === f.v ? 'sel' : ''}" data-action="font" data-v="${f.v}" style="font-size:${f.v}rem">${f.l}</button>`).join('')}</div>
    <label class="check" style="margin-top:.9rem"><input type="checkbox" id="auto-fit" ${s.autoFit !== false ? 'checked' : ''}> Αυτόματη προσαρμογή στο μέγεθος της οθόνης</label>
    <div class="hint muted" style="margin-top:.3rem">Σε μεγάλη οθόνη τα γράμματα μεγαλώνουν, σε μικρό laptop μικραίνουν λίγο ώστε να χωράνε όλα. Σε στενό παράθυρο το μενού γίνεται εικονίδια.</div>
  </div>

  <div class="panel set-section ${ui._setTab === 'exp' ? '' : 'hidden'}">
    <h2>📂 Κατηγορίες εξόδων</h2>
    <p class="muted" style="margin-top:-.4rem">«Πρόβλεψη» είναι πόσα υπολογίζουμε να ξοδέψουμε τη χρονιά (φαίνεται στη σελίδα «Η χρονιά»). «Έκτακτο» σημαίνει ότι δεν μετράει στα «έξοδα χωρίς έκτακτα». Οι κρυφές κατηγορίες δεν εμφανίζονται στη νέα καταχώρηση.</p>
    ${catTable('expense')}
  </div>
  <div class="panel set-section ${ui._setTab === 'inc' ? '' : 'hidden'}">
    <h2>💶 Κατηγορίες εσόδων</h2>
    ${catTable('income')}
  </div>

  <div class="panel set-section ${ui._setTab === 'general' ? '' : 'hidden'}">
    <h2>👪 Πρόσωπα</h2>
    <p class="muted" style="margin-top:-.4rem">Ποιοι εμφανίζονται στο «Ποιος;» της καταχώρησης. Χωρίστε με κόμμα.</p>
    <input type="text" id="persons" value="${esc(s.persons.join(', '))}" style="width:100%;border:2px solid var(--line-2);border-radius:14px;padding:.6rem .9rem;background:var(--paper)">
  </div>

  <div class="panel set-section ${ui._setTab === 'data' ? '' : 'hidden'}">
    <h2>💾 Τα δεδομένα μου</h2>
    ${store.native ? `<p style="margin-top:0">Όλα αποθηκεύονται αυτόματα σε αυτό το αρχείο. Κάθε μέρα κρατιέται και ένα αντίγραφο ασφαλείας στον ίδιο φάκελο.</p>
    <div class="path">${esc(info.path || '')}</div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem">
      <button class="btn" data-action="open-folder">📂 Άνοιγμα φακέλου</button>
      <button class="btn" data-action="choose-folder">📁 Αλλαγή φακέλου (π.χ. OneDrive)</button>
      <button class="btn" data-action="backup">🛟 Αντίγραφο ασφαλείας τώρα</button>
      <button class="btn" data-action="restore">↩️ Άνοιγμα / επαναφορά αρχείου…</button>
      <button class="btn" data-action="export-csv-all">📊 Όλες οι κινήσεις για Excel</button>
    </div>` : '<p class="muted">Δοκιμαστική λειτουργία στον browser: τα δεδομένα μένουν μόνο σε αυτόν τον browser.</p><button class="btn" data-action="restore">↩️ Άνοιγμα αρχείου…</button>'}
    ${s.importNote ? `<p class="muted" style="margin-bottom:0">Εισαγωγή από ${esc(s.importedFrom || 'Excel')}. ${esc(s.importNote)}</p>` : ''}
  </div>

  ${backupPanel()}

  ${monthClosePanel()}

  <div class="panel set-section ${ui._setTab === 'version' ? '' : 'hidden'}">
    <h2>🔄 Έκδοση</h2>
    <p style="margin-top:0">HomeFlow έκδοση <b>${esc(info.version || '—')}</b>. Όταν βγαίνει νέα έκδοση, εμφανίζεται ειδοποίηση πάνω πάνω. Η ενημέρωση γίνεται <b>μόνο όταν πατήσετε «Ενημέρωση τώρα»</b>: το HomeFlow κατεβάζει τη νέα έκδοση, κλείνει και ξανανοίγει μόνο του. Τα στοιχεία σας δεν αλλάζουν.</p>
    <button class="btn" data-action="check-updates">Έλεγχος για νέα έκδοση</button>
    ${store.native ? '<button class="btn ghost" data-action="update-log">📝 Ημερολόγιο ενημερώσεων</button>' : ''}
    <span id="upd-msg" class="muted" style="margin-left:.8rem"></span>
  </div>`;
}
