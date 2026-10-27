'use strict';
// HomeFlow · Ενοίκια: «Για τη δήλωση» και «ΔΕΗ ισογείου»
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

// ---------- Ενοίκια: για τη φορολογική δήλωση ----------
function declRows(year) {
  const out = [];
  for (const t of DB.tenants) {
    let months = 0, contract = 0; const rents = new Set();
    for (let m = 1; m <= 12; m++) { const s = ymOf(year, m); if (tenantActiveIn(t, s)) { const r = tenantRent(t, s); if (r) { months++; contract += r; rents.add(r); } } }
    const received = sumPaid(tenantPayments(t).filter(p => yOf(p) === year));
    if (!months && !received) continue;
    const sh = shareOf(t);
    const sp = tenantYearSplit(t, year);
    out.push({ t, months, rents: [...rents], contract: round2(contract), received, rentPaid: sp.rent, extra: sp.extra, share: sh, ours: round2(contract * sh / 100), oursRec: round2(received * sh / 100) });
  }
  return out;
}
function declPanel() {
  const year = ui.declYear || now.getFullYear();
  const rows = declRows(year);
  const tot = k => round2(rows.reduce((a, r) => a + r[k], 0));
  return `<div class="panel">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.8rem">
      <h2 style="margin:0">🧾 Ενοίκια για τη δήλωση</h2><div class="spacer"></div>
      <div class="month-nav"><button class="btn no-print" data-action="decl-prev">◀</button><div class="month-title" style="min-width:6rem">${year}</div><button class="btn no-print" data-action="decl-next">▶</button></div>
    </div>
    ${rows.length ? `<div class="sheet-wrap"><table class="data">
      <thead><tr><th>Ενοικιαστής</th><th class="r">Ενοίκιο × μήνες</th><th class="r">Ενοίκια χρονιάς</th><th class="r">Δικό μας</th><th class="r">Εισπράχθηκαν για ενοίκιο</th><th class="r">+ Για παλιές οφειλές</th></tr></thead>
      <tbody>${rows.map(r => `<tr style="cursor:default">
        <td><b>${esc(r.t.name)}</b><div class="muted" style="font-size:.9rem">${esc(r.t.property || '')}</div></td>
        <td class="r num">${r.months ? `${r.rents.map(x => eur(x)).join(' → <br>')} × ${r.months}` : '<span class="muted">δεν ήταν νοικιασμένο</span>'}</td>
        <td class="r num">${eur(r.contract)}</td>
        <td class="r num"><b>${eur(r.ours)}</b>${r.share !== 100 ? `<div class="muted" style="font-size:.9rem">το ${r.share}%</div>` : ''}</td>
        <td class="r num ${r.rentPaid + 0.005 < r.contract ? 'exp' : 'inc'}">${eur(r.rentPaid)}</td><td class="r num">${r.extra ? eur(r.extra) : '<span class="muted">—</span>'}</td></tr>`).join('')}
        <tr style="cursor:default;border-top:3px solid var(--line)"><td><b>Σύνολο</b></td><td></td><td class="r num"><b>${eur(tot('contract'))}</b></td><td class="r num" style="font-size:1.2rem"><b>${eur(tot('ours'))}</b></td><td class="r num"><b>${eur(tot('rentPaid'))}</b></td><td class="r num"><b>${eur(tot('extra'))}</b></td></tr>
      </tbody></table></div>
      <p class="muted" style="margin-bottom:0">«Ενοίκια χρονιάς» = ενοίκιο × μήνες που ήταν νοικιασμένο, όπως το υπολογίζατε στο Excel. «Δικό μας ποσό» είναι αυτό που αναλογεί σε εμάς με το ποσοστό. Η τελευταία στήλη δείχνει τι πληρώθηκε πραγματικά μέσα στη χρονιά (κόκκινο αν πληρώθηκαν λιγότερα).</p>`
    : `<div class="empty">Δεν υπάρχουν ενοίκια για το ${year}.</div>`}
  </div>`;
}

// ---------- ΔΕΗ ισογείου: μοίρασμα λογαριασμού με υπομετρητή ----------
function newPowerCfg(name) {
  return { id: 'pw' + uid(), name: name || 'ΔΕΗ', totalM2: 0, meteredM2: 0, meteredTenantId: '', meteredName: 'Με υπομετρητή', restTenantId: '', restName: 'Το υπόλοιπο', georgeShare: 0, lastReading: null, bills: [] };
}
// Το μοίρασμα που βλέπουμε τώρα (ui.powerId). Αν δεν υπάρχει κανένα, φτιάχνεται ένα.
function powerCfg() {
  DB.powers = DB.powers || [];
  if (!DB.powers.length) DB.powers.push({ ...newPowerCfg('ΔΕΗ ισογείου'), meteredName: 'Πίσω (με υπομετρητή)', restName: 'Διαμέρισμα' });
  return DB.powers.find(p => p.id === ui.powerId) || DB.powers[0];
}
const powerOwedCount = () => (DB.powers || []).reduce((n, c) => n + c.bills.filter(b => (b.metered.who && !b.metered.paid) || (b.rest.tenant && !b.rest.paid)).length, 0);
const pwWho = (tid, fallback) => { const t = tid && tenantById(tid); return t ? t.name : fallback; };
function powerCalc(c, x) {
  const kwh = +x.kwh || 0, energy = +x.energy || 0, fees = +x.fees || 0;
  const sub = x.r1 != null && x.r0 != null ? round2(x.r1 - x.r0) : 0;
  const total = round2(energy + fees);
  const perKwh = kwh ? energy / kwh : 0;
  const mEnergy = round2(sub * perKwh), mFees = round2(c.totalM2 ? fees * c.meteredM2 / c.totalM2 : 0);
  const metered = round2(mEnergy + mFees);
  return { kwh, energy, fees, total, sub, perKwh, mEnergy, mFees, metered, rest: round2(total - metered) };
}
function powerPanel() {
  const c = powerCfg();
  const bills = c.bills.slice().sort((a, b) => b.to.localeCompare(a.to));
  const owed = bills.reduce((a, b) => a + (b.metered.who && !b.metered.paid ? b.metered.amount : 0) + (b.rest.tenant && !b.rest.paid ? b.rest.amount : 0), 0);
  const row = b => `<tr style="cursor:default">
    <td><b>${shortDate(b.from)} – ${shortDate(b.to)}</b><div class="muted" style="font-size:.9rem">${int0.format(b.kwh)} kWh · υπομετρητής ${int0.format(b.sub)} kWh</div></td>
    <td class="r num"><b>${eur(b.total)}</b></td>
    <td>${b.metered.who ? `${esc(b.metered.who)}: <b class="num">${eur(b.metered.amount)}</b> ${b.metered.paid ? `<span class="status" style="${STATUS_STYLE.ok}">✓ Τα έδωσε</span> <button class="btn small ghost no-print" data-action="pb-unpaid" data-id="${b.id}" data-p="metered">↩</button>` : `<button class="btn small income no-print" data-action="pb-paid" data-id="${b.id}" data-p="metered">✓ Τα έδωσε</button>`}` : ''}</td>
    <td>${esc(b.rest.who)}: <b class="num">${eur(b.rest.amount)}</b> ${b.rest.tenant ? (b.rest.paid ? `<span class="status" style="${STATUS_STYLE.ok}">✓ Τα έδωσε</span> <button class="btn small ghost no-print" data-action="pb-unpaid" data-id="${b.id}" data-p="rest">↩</button>` : `<button class="btn small income no-print" data-action="pb-paid" data-id="${b.id}" data-p="rest">✓ Τα έδωσε</button>`) : `<div class="muted" style="font-size:.9rem">ξενοίκιαστο: εμείς${c.georgeShare ? ` · Γιώργος ${c.georgeShare}%: ${eur(b.rest.amount * c.georgeShare / 100)}` : ''}</div>`}</td>
    <td style="width:3rem"><button class="btn small ghost no-print" data-action="pb-edit" data-id="${b.id}" title="Αλλαγή">✎</button></td></tr>`;
  return `${`<div class="chips no-print" style="margin-bottom:.8rem">${DB.powers.map(p => `<button class="chip ${p.id === c.id ? 'sel' : ''}" data-action="pw-pick" data-id="${p.id}">⚡ ${esc(p.name)}</button>`).join('')}
      <button class="chip" data-action="pw-add">+ Νέο μοίρασμα ΔΕΗ (άλλο ακίνητο)</button></div>`}
    <div class="panel">
    <div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap;margin-bottom:.6rem">
      <h2 style="margin:0">⚡ ${esc(c.name)}</h2><div class="spacer"></div>
      <button class="btn primary no-print" data-action="pb-new">+ Νέος λογαριασμός ΔΕΗ</button>
      <button class="btn no-print" data-action="pw-set">⚙️ Ρυθμίσεις</button>
    </div>
    <div class="muted" style="margin-bottom:.8rem">Ο λογαριασμός μοιράζεται έτσι:
      <b>${esc(pwWho(c.meteredTenantId, c.meteredName))}</b> πληρώνει όσες kWh δείχνει ο υπομετρητής × την τιμή της kWh, και δημοτικά τέλη για ${numFmt.format(c.meteredM2)} τ.μ. από τα ${numFmt.format(c.totalM2)}.
      Τα υπόλοιπα πάνε στο <b>${esc(c.restName)}</b>: ${c.restTenantId ? `τα πληρώνει ο/η <b>${esc(pwWho(c.restTenantId, ''))}</b>` : `είναι <b>ξενοίκιαστο</b>, τα πληρώνουμε εμείς${c.georgeShare ? ` (μισά με τον Γιώργο)` : ''}`}.</div>
    ${owed > 0.005 ? `<div class="notice" style="margin:0 0 .8rem">Χρωστάνε για ρεύμα: <b>${eur(owed)}</b></div>` : ''}
    ${bills.length ? `<div class="sheet-wrap"><table class="data"><thead><tr><th>Περίοδος</th><th class="r">Λογαριασμός</th><th>Υπομετρητής</th><th>Υπόλοιπο</th><th></th></tr></thead><tbody>${bills.map(row).join('')}</tbody></table></div>`
      : `<div class="empty">Δεν έχει γραφτεί λογαριασμός ακόμα. Όταν έρθει ο λογαριασμός της ΔΕΗ, πατήστε «+ Νέος λογαριασμός ΔΕΗ» και γράψτε τις kWh, την αξία ρεύματος, τα δημοτικά τέλη και την ένδειξη του υπομετρητή. Η εφαρμογή βγάζει μόνη της ποιος πληρώνει τι.</div>`}
  </div>`;
}
function powerPreview(d) {
  const c = powerCfg();
  const x = { kwh: parseAmount(d.kwhStr), energy: parseAmount(d.energyStr), fees: parseAmount(d.feesStr), r0: parseAmount(d.r0Str), r1: parseAmount(d.r1Str) };
  if ([x.kwh, x.energy, x.fees, x.r0, x.r1].some(v => v === null || isNaN(v))) return '<span class="muted">Συμπληρώστε όλα τα νούμερα για να δείτε το μοίρασμα.</span>';
  const k = powerCalc(c, x);
  return `Σύνολο λογαριασμού <b>${eur(k.total)}</b> · τιμή kWh ${numFmt.format(k.perKwh)} €<br>
    <b>${esc(pwWho(c.meteredTenantId, c.meteredName))}</b>: ${int0.format(k.sub)} kWh = ${eur(k.mEnergy)} + τέλη ${eur(k.mFees)} = <b class="exp">${eur(k.metered)}</b><br>
    <b>${esc(c.restTenantId ? pwWho(c.restTenantId, '') : c.restName + ' (εμείς)')}</b>: <b>${eur(k.rest)}</b>`;
}
