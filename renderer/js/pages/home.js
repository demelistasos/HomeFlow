'use strict';
// HomeFlow · Σελίδα «Ο μήνας»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Ο μήνας ----------
function homePage() {
  const { year, month } = ui;
  const exp = txIn(year, month, { type: 'expense' });
  const inc = txIn(year, month, { type: 'income' });
  const plannedTx = txIn(year, month, { planned: true }).sort((a, b) => a.type.localeCompare(b.type) || b.amount - a.amount);
  const tE = sum(exp), tI = sum(inc), bal = round2(tI - tE);
  // από αρχή έτους
  let ytdE = 0, ytdI = 0;
  for (const t of DB.transactions) if (yOf(t) === year && mOf(t) <= month && !t.planned) { if (t.type === 'expense') ytdE += t.amount; else ytdI += t.amount; }
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  const byCat = {};
  for (const t of exp) byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount;
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  const bars = rows.map(([cid, v]) => {
    const c = catById(cid) || {};
    const pct = tE ? Math.round(v / tE * 100) : 0;
    return `<button class="bar-row" data-action="goto-list" data-cat="${esc(cid)}" data-type="expense">
      <span class="ic">${esc(c.icon || '❔')}</span>
      <span><span class="nm">${esc(c.name || '')}</span>${(() => { const ly = catLastYearAvg(cid, year); if (!ly) return ''; const up = v > ly * 1.25; return ` <small class="ly ${up ? 'up' : ''}">πέρσι ≈ ${eur0(ly)} τον μήνα${up ? ' ▲' : ''}</small>`; })()}<div class="track"><div class="fill" style="width:${Math.max(2, v / max * 100)}%;background:${esc(c.color || '#888')}"></div></div></span>
      <span class="amt num">${eur(v)}<small>${pct}%</small></span></button>`;
  }).join('');

  const recent = [...exp, ...inc].sort((a, b) => (b.created || '').localeCompare(a.created || '') || b.date.localeCompare(a.date)).slice(0, 8);

  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Καλημέρα' : hr < 18 ? 'Καλό απόγευμα' : 'Καλησπέρα';
  const who = (DB.settings.persons || [])[0] || '';
  const voc = DB.settings.callMe != null ? DB.settings.callMe : who.replace(/ος$/, 'ο').replace(/ης$/, 'η').replace(/ας$/, 'α');
  const msg = !tI && !tE ? (isCurrent ? 'Δεν έχει γραφτεί τίποτα αυτόν τον μήνα ακόμα.' : 'Δεν υπάρχουν κινήσεις αυτόν τον μήνα.')
    : bal < 0 ? `${isCurrent ? 'Αυτόν τον μήνα' : 'Εκείνο τον μήνα'} βγήκαν περισσότερα απ’ όσα μπήκαν.` : `${isCurrent ? 'Αυτόν τον μήνα' : 'Εκείνο τον μήνα'} έμειναν ${eur(bal)}.`;
  const tot = Math.max(tI, tE) || 1;
  const s0 = ymOf(year, month);
  const remAll = isCurrent ? reminders() : [];
  const rentOpenTs = DB.tenants.filter(t => tenantActiveIn(t, s0) && tenantRent(t, s0) && tenantMonthStatus(t, s0).cls !== 'ok');
  const attn = [
    ...remAll.filter(r => r.cls === 'late'), ...remAll.filter(r => r.cls !== 'late')
  ].slice(0, 3);
  const goTab = k => `data-action="tab" data-page="home" data-k="${k}"`;
  const mName = MONTHS[month - 1];
  return `
  <div class="hero">
    <div class="hero-t">
      <div class="eyebrow">${isCurrent ? `${hello}${voc ? ', ' + esc(voc) : ''}` : 'Προηγούμενος μήνας'}</div>
      <div class="hero-row">
        <button class="nav-arrow no-print" data-action="month-prev" title="Προηγούμενος μήνας" aria-label="Προηγούμενος μήνας">‹</button>
        <h1>${mName} <span class="yr">${year}</span></h1>
        <button class="nav-arrow no-print" data-action="month-next" title="Επόμενος μήνας" aria-label="Επόμενος μήνας">›</button>
      </div>
    </div>
    <div class="spacer"></div>
    <div class="hero-tools no-print">
      ${isCurrent ? '' : '<button class="btn small primary" data-action="month-today">↩ Σήμερα</button>'}
      <button class="btn small ghost" data-action="month-pdf" title="Μία σελίδα με τη σύνοψη του μήνα, για αρχείο ή για τον λογιστή">📄 PDF μήνα</button>
      <button class="btn small ghost" data-action="print" title="Συγκεντρωτικό Excel">📊 Excel</button>
    </div>
  </div>

  <div class="bento">
    <section class="b-bal ${bal < 0 ? 'neg' : 'pos'}">
      <div class="b-k">Έμειναν ${isCurrent ? 'αυτόν τον μήνα' : 'τον ' + mName.replace(/ς$/, '')}</div>
      <div class="b-v num">${bal < 0 ? '−' + eur(-bal) : eur(bal)}</div>
      <div class="b-msg">${msg}</div>
      <div class="b-flow">
        <div class="b-in"><span class="dot"></span><div><div class="b-k2">Μπήκαν</div><div class="b-v2 num">${eur(tI)}</div><div class="b-s">φέτος <b class="num">${eur0(ytdI)}</b></div></div></div>
        <div class="b-out"><span class="dot"></span><div><div class="b-k2">Βγήκαν</div><div class="b-v2 num">${eur(tE)}</div><div class="b-s">φέτος <b class="num">${eur0(ytdE)}</b></div></div></div>
      </div>
      ${tI || tE ? `<div class="meter" title="Πράσινο: μπήκαν · Κόκκινο: βγήκαν"><i class="mi" style="flex:${tI / tot}"></i><i class="mo" style="flex:${tE / tot}"></i></div>` : ''}
      ${compareLine(year, month, tE, ytdE)}
    </section>
    <section class="b-attn">
      <div class="b-h">${attn.length || rentOpenTs.length ? 'Θέλουν προσοχή' : 'Όλα εντάξει'}</div>
      ${rentOpenTs.length ? `<button class="attn-row" ${goTab('rent')}><span class="a-ic">🔑</span><span class="a-t"><b>${rentOpenTs.length === 1 ? '1 ενοίκιο' : rentOpenTs.length + ' ενοίκια'}</b> δεν πληρώθηκε${rentOpenTs.length === 1 ? '' : 'καν'} ακόμα<small>${rentOpenTs.map(t => esc(t.name)).join(', ')}</small></span><span class="a-go">›</span></button>` : ''}
      ${attn.map(r => `<button class="attn-row ${r.cls === 'late' ? 'late' : ''}" ${goTab('remind')}><span class="a-ic">${r.icon}</span><span class="a-t">${r.text}<small>${r.sub}</small></span><span class="a-go">›</span></button>`).join('')}
      ${!attn.length && !rentOpenTs.length ? `<div class="attn-ok"><span>✓</span>${isCurrent ? 'Δεν υπάρχει κάτι να θυμηθείτε τώρα.' : 'Τίποτα ανοιχτό για αυτόν τον μήνα.'}</div>` : ''}
      ${remAll.length > attn.length ? `<button class="linkish" ${goTab('remind')}>Όλες οι υπενθυμίσεις (${remAll.length}) →</button>` : ''}
      ${plannedTx.length ? `<button class="attn-row soft" ${goTab('planned')}><span class="a-ic">📌</span><span class="a-t"><b>${plannedTx.length}</b> προγραμματισμέν${plannedTx.length === 1 ? 'ο' : 'α'} για τον μήνα</span><span class="a-go">›</span></button>` : ''}
    </section>
  </div>

  ${homeTabs()}`;

  function homeTabs() {
    const rem = isCurrent ? reminders() : [];
    const s = ymOf(year, month);
    const rentTs = DB.tenants.filter(t => tenantActiveIn(t, s));
    const rentOpen = rentTs.filter(t => tenantMonthStatus(t, s).cls !== 'ok').length;
    const items = [
      { k: 'spent', icon: '📊', label: 'Πού πήγαν' },
      ...(isCurrent ? [{ k: 'remind', icon: '🔔', label: 'Να θυμηθώ', count: rem.length, alert: rem.some(r => r.cls === 'late') }] : []),
      ...(rentTs.length ? [{ k: 'rent', icon: '🔑', label: 'Ενοίκια', count: rentOpen, alert: rentOpen > 0 }] : []),
      { k: 'planned', icon: '📌', label: 'Προγραμματισμένα', count: plannedTx.length },
      { k: 'cal', icon: '🗓️', label: 'Ημερολόγιο' },
      { k: 'recent', icon: '🕘', label: 'Τελευταίες' }
    ];
    const [tab, bar] = tabBar('home', items, 'spent');
    let body = '';
    if (tab === 'spent') body = `<div class="panel"><h2>Πού πήγαν τα χρήματα</h2>${bars ? '<div class="h-hint">Πατήστε μια κατηγορία για να δείτε τι περιέχει.</div>' : ''}${bars || '<div class="empty">Δεν υπάρχουν έξοδα αυτόν τον μήνα ακόμα.</div>'}</div>`;
    else if (tab === 'remind') body = `<div style="display:flex;justify-content:flex-end;margin-bottom:.6rem"><button class="btn primary no-print" data-action="note-new">+ Δική μου υπενθύμιση</button></div>` + (remindersPanel() || '<div class="panel empty">Τίποτα να θυμηθείτε αυτή τη στιγμή ✓</div>');
    else if (tab === 'rent') body = homeRentPanel(s);
    else if (tab === 'cal') body = calPanel(year, month);
    else if (tab === 'planned') body = plannedTx.length ? `<div class="panel">
        <h2>📌 Προγραμματισμένα</h2>
        <div class="h-hint">Πληρωμές που περιμένουμε. Πατήστε «Έγινε» όταν γίνουν.</div>
        ${plannedTx.map(t => `<div class="planned-row">
          <span class="p-ic">${esc(catIcon(t.categoryId))}</span>
          <span class="p-nm"><b>${esc(catName(t.categoryId))}</b>${t.recurringId ? ' <span class="tag">🔁 πάγιο</span>' : ''}${t.note ? `<div class="muted" style="font-size:.9rem">${esc(t.note)}</div>` : ''}</span>
          <span class="p-amt num ${t.type === 'income' ? 'inc' : 'exp'}">${t.type === 'income' ? '+' : '−'} ${(DB.recurring.find(r => r.id === t.recurringId) || {}).variable ? '≈ ' : ''}${eur(t.amount)}</span>
          <span class="p-act"><button class="btn small" data-action="edit" data-id="${t.id}">✎ Αλλαγή</button><button class="btn small primary" data-action="confirm-planned" data-id="${t.id}">✓ Έγινε</button></span>
        </div>`).join('')}</div>` : '<div class="panel empty">Δεν υπάρχουν προγραμματισμένα αυτόν τον μήνα.</div>';
    else body = `<div class="panel"><h2>Τελευταίες καταχωρήσεις</h2>
        ${recent.length ? `<div class="tx-list">${recent.map(txRow).join('')}</div>
          <button class="btn" style="margin-top:.6rem;width:100%" data-action="goto-list">Όλες οι κινήσεις του μήνα →</button>` : '<div class="empty">Τίποτα ακόμα. Πατήστε «Νέο έξοδο» αριστερά.</div>'}</div>`;
    return bar + body;
  }
}

function txRow(t) {
  const sign = t.type === 'income' ? '+' : '−';
  const tn = t.tenantId && tenantById(t.tenantId);
  const sub = [dateLabel(t), tn ? '🔑 ' + tn.name : '', t.person, t.method, (t.attachments || []).length ? '📎' : ''].filter(Boolean).map(esc).join(' · ');
  return `<button class="tx" data-action="edit" data-id="${t.id}">
    <span class="ic">${esc(catIcon(t.categoryId))}</span>
    <span><div class="t1">${esc(catName(t.categoryId))}${t.note ? ` <span class="muted" style="font-weight:500">— ${esc(t.note)}</span>` : ''}${t.planned ? '<span class="tag planned">προγραμματισμένο</span>' : ''}</div><div class="t2">${sub}</div></span>
    <span class="amt num ${t.type === 'income' ? 'inc' : 'exp'}">${sign} ${eur(t.amount)}</span></button>`;
}
