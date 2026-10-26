'use strict';
// HomeFlow · Σελίδα «Πάγια»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Πάγια ----------
function recurringPage() {
  const row = r => {
    const nd = nextDue(r);
    return `<div class="tx" style="cursor:default;grid-template-columns:2.4rem 1fr auto auto">
      <span class="ic">${esc(catIcon(r.categoryId))}</span>
      <span><div class="t1">${esc(catName(r.categoryId))}${r.note ? ` <span class="muted" style="font-weight:500">— ${esc(r.note)}</span>` : ''}${!r.active ? ' <span class="tag">σταματημένο</span>' : ''}</div>
        <div class="t2">${esc(freqText(r))}${r.active && nd ? ` · επόμενο: <b>${ymLabel(nd)}</b>` : ''}${r.person ? ' · ' + esc(r.person) : ''}</div>
        ${r.until ? `<div class="t2">${recEnded(r) ? `<b class="inc">Τελείωσε ✓</b> (τελευταία ${r.total ? 'δόση' : 'φορά'}: ${ymLabel(r.until)})` : `${r.total && instNo(r, nd || curYM()) ? `Δόση <b>${instNo(r, nd || curYM())} από ${r.total}</b> · ` : ''}τελευταία ${r.total ? 'δόση' : 'φορά'}: <b>${ymLabel(r.until)}</b>${r.total ? ` · μένουν ${r.total - instNo(r, nd || curYM()) + 1} (${eur((r.total - instNo(r, nd || curYM()) + 1) * r.amount)})` : ''}`}</div>` : ''}</span>
      <span class="amt num ${r.type === 'income' ? 'inc' : 'exp'}">${r.type === 'income' ? '+' : '−'} ${r.variable ? '≈ ' : ''}${eur(r.amount)}</span>
      <span style="display:flex;gap:.4rem">
        <button class="btn small" data-action="rec-edit" data-id="${r.id}">✎ Αλλαγή</button>
        ${r.active ? `<button class="btn small" data-action="rec-stop" data-id="${r.id}">Σταμάτημα</button>` : `<button class="btn small" data-action="rec-resume" data-id="${r.id}">▶ Συνέχεια</button><button class="btn small danger" data-action="rec-delete" data-id="${r.id}">🗑</button>`}
      </span></div>`;
  };
  const list = type => DB.recurring.filter(r => r.type === type).sort((a, b) => (b.active - a.active) || catName(a.categoryId).localeCompare(catName(b.categoryId), 'el'));
  const monthlyOut = round2(DB.recurring.filter(r => r.active && !recEnded(r) && r.type === 'expense').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const monthlyIn = round2(DB.recurring.filter(r => r.active && !recEnded(r) && r.type === 'income').reduce((a, r) => a + r.amount / (r.every || 1), 0));
  const exp = list('expense'), inc = list('income');
  return `
  <div class="page-head"><h1>Πάγια</h1><div class="spacer"></div>
    <button class="btn expense no-print" data-action="rec-new" data-type="expense">+ Πάγιο έξοδο</button>
    <button class="btn income no-print" data-action="rec-new" data-type="income">+ Πάγιο έσοδο</button></div>
  <div class="notice info">Πάγια είναι τα ποσά που επαναλαμβάνονται, όπως ΔΕΗ, τηλέφωνο, δόσεις, σύνταξη. Τα γράφετε μία φορά εδώ και κάθε μήνα εμφανίζονται μόνα τους στον «Μήνα», στα <b>📌 Προγραμματισμένα</b>, για να πατήσετε <b>«✓ Έγινε»</b>.</div>
  <div class="cards" style="grid-template-columns:repeat(2,1fr)">
    <div class="card exp"><div class="label">Πάγια έξοδα τον μήνα (περίπου)</div><div class="value exp num">${eur(monthlyOut)}</div></div>
    <div class="card inc"><div class="label">Πάγια έσοδα τον μήνα (περίπου)</div><div class="value inc num">${eur(monthlyIn)}</div></div>
  </div>
  ${(() => {
    const pols = DB.policies || [];
    const polDue = pols.filter(p => p.next && daysUntil(p.next) <= 30).length;
    const [tab, bar] = tabBar('recurring', [{ k: 'expense', icon: '−', label: 'Πάγια έξοδα', count: exp.length }, { k: 'income', icon: '+', label: 'Πάγια έσοδα', count: inc.length }, { k: 'pol', icon: '🛡️', label: 'Ασφάλειες και τέλη', count: polDue || pols.length, alert: polDue > 0 }], 'expense');
    if (tab === 'pol') return bar + polPanel();
    const list = tab === 'income' ? inc : exp;
    return bar + `<div class="panel">${list.length ? `<div class="tx-list">${list.map(row).join('')}</div>` : '<div class="empty">Κανένα ακόμα.</div>'}</div>`;
  })()}`;
}
