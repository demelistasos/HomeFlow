// Ψεύτικα δεδομένα για τις δοκιμές. ΔΕΝ περιέχουν πραγματικά στοιχεία.
// Καλύπτουν όλα τα κομμάτια της εφαρμογής, ώστε οι δοκιμές να ανοίγουν κάθε σελίδα με περιεχόμενο.
function pad(n) { return String(n).padStart(2, '0'); }
function makeFixture(today = new Date()) {
  const Y = today.getFullYear(), M = today.getMonth() + 1;
  const ym = (y, m) => { while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return `${y}-${pad(m)}`; };
  const cats = [
    ['x_super', 'Σούπερ μάρκετ', '🛒', 'expense', 6000], ['x_dei', 'ΔΕΗ', '💡', 'expense', 1800], ['x_car', 'Αυτοκίνητα (σέρβις, τέλη)', '🔧', 'expense', 1200],
    ['x_tax', 'Εφορία & ΕΝΦΙΑ', '🏛️', 'expense', 4000], ['x_out', 'Έξοδοι', '🍽️', 'expense', 500], ['x_fuel', 'Καύσιμα', '⛽', 'expense', 2000],
    ['x_extra', 'Αγορές – έκτακτα', '🛍️', 'expense', 0], ['x_ins', 'Ασφάλειες', '🛡️', 'expense', 900], ['x_misc', 'Διάφορα', '📦', 'expense', 600],
    ['x_pension', 'Σύνταξη', '👴', 'income', 0], ['x_rent', 'Ενοίκια', '🔑', 'income', 0], ['x_other', 'Άλλα έσοδα', '💶', 'income', 0]
  ].map(([id, name, icon, type, budget], i) => ({ id, name, icon, type, color: '#0f766e', budget: budget || null, extra: id === 'x_extra', archived: false, order: i }));
  const tx = [];
  let n = 0;
  const add = (date, type, cat, amount, extra = {}) => tx.push({ id: 't' + (++n), date, dayKnown: true, type, amount, categoryId: cat, note: extra.note || '', person: extra.person || '', method: extra.method || '', planned: !!extra.planned, tenantId: extra.tenantId || '', recurringId: '', source: 'test', created: `${date}T10:00:00`, ...extra });
  for (let m = 1; m <= M; m++) {
    const s = ym(Y, m);
    add(`${s}-03`, 'expense', 'x_super', 120 + m * 7, { note: 'λαϊκή' });
    add(`${s}-09`, 'expense', 'x_super', 85.4);
    add(`${s}-12`, 'expense', 'x_fuel', 60 + m, { note: 'βενζίνη', method: 'Κάρτα' });
    add(`${s}-20`, 'expense', 'x_out', 45);
    add(`${s}-01`, 'income', 'x_pension', 1000, { person: 'Πατέρας', method: 'Τράπεζα' });
    if (m < M) {
      add(`${s}-05`, 'income', 'x_rent', 500, { tenantId: 'ten_a', note: 'ενοίκιο' });
      add(`${s}-07`, 'income', 'x_rent', 300, { tenantId: 'ten_b', rentAmount: 600 });
    }
    if (m % 2 === 0) add(`${s}-15`, 'expense', 'x_dei', 140.5);
  }
  add(`${ym(Y, M)}-02`, 'expense', 'x_extra', 900, { note: 'ψυγείο' });
  add(`${ym(Y, M)}-01`, 'expense', 'x_dei', 150, { planned: true });
  const inst = (from, count, amount, paidN) => Array.from({ length: count }, (_, k) => { const s = ym(+from.slice(0, 4), +from.slice(5) + k); const last = new Date(+s.slice(0, 4), +s.slice(5), 0).getDate(); return { due: `${s}-${pad(last)}`, amount, paid: k < paidN, paidDate: k < paidN ? `${s}-20` : '', txId: '' }; });
  return {
    app: 'HomeFlow', version: 1,
    settings: { persons: ['Πατέρας', 'Μητέρα'], methods: ['Μετρητά', 'Τράπεζα', 'Κάρτα'], fontScale: 1.15, usdPerEur: 1.1, rentCategoryId: 'x_rent', taxCategoryId: 'x_tax', migrations: ['bills-2026'] },
    categories: cats,
    transactions: tx,
    recurring: [
      { id: 'r1', type: 'income', categoryId: 'x_pension', amount: 1000, day: 1, every: 1, note: '', person: 'Πατέρας', method: 'Τράπεζα', active: true, skip: [], from: ym(Y, M), until: '', total: null },
      { id: 'r2', type: 'expense', categoryId: 'x_dei', amount: 150, day: 1, every: 1, note: 'λογαριασμός', person: '', method: '', active: true, skip: [], from: ym(Y, M + 1), until: '', total: null, variable: true },
      { id: 'r3', type: 'expense', categoryId: 'x_misc', amount: 40, day: 10, every: 1, note: 'δόση', person: '', method: '', active: true, skip: [], from: ym(Y, M - 3), until: ym(Y + 1, M), total: 24 }
    ],
    tenants: [
      { id: 'ten_a', name: 'Ενοικιαστής Α', property: 'Ακίνητο 1', rents: [{ from: ym(Y, 1), amount: 500 }], start: ym(Y, 1), end: '', opening: 0, dueDay: 5, note: '', active: true, share: 100, leaseEnd: `${ym(Y, M + 1)}-15`, adjust: '' },
      { id: 'ten_b', name: 'Εταιρεία Β', property: 'Ισόγειο', rents: [{ from: ym(Y, 1), amount: 600 }], start: ym(Y, 1), end: '', opening: 100, dueDay: 7, note: 'μισό δικό μας', active: true, share: 50 },
      { id: 'ten_c', name: 'Παλιός Γ', property: 'Διαμέρισμα', rents: [{ from: ym(Y - 1, 9), amount: 400 }], start: ym(Y - 1, 9), end: ym(Y - 1, 12), opening: 0, dueDay: 1, note: '', active: true, share: 50 }
    ],
    accounts: [
      { id: 'a1', bank: 'Τράπεζα Α', name: 'Τρεχούμενος', owner: 'Πατέρας', currency: 'EUR', kind: 'current', archived: false, order: 0, history: [{ date: `${ym(Y, 1)}-01`, balance: 5000 }, { date: `${ym(Y, M - 1)}-01`, balance: 6200.5 }] },
      { id: 'a2', bank: 'Τράπεζα Β', name: 'Προθεσμιακή', owner: 'Μητέρα', currency: 'USD', kind: 'deposit', archived: false, order: 1, maturity: `${ym(Y, M + 2)}-01`, history: [{ date: `${ym(Y, 1)}-01`, balance: 20000 }] },
      { id: 'a3', bank: '', name: 'Μετρητά', owner: '', currency: 'EUR', kind: 'cash', archived: false, order: 2, history: [{ date: `${ym(Y, M)}-01`, balance: 300 }] },
      { id: 'a4', bank: 'Τράπεζα Γ', name: 'Παλιός', owner: '', currency: 'EUR', kind: 'current', archived: true, order: 3, history: [{ date: `${ym(Y - 1, 1)}-01`, balance: 0 }] }
    ],
    taxes: [
      { id: 'tx1', name: `ΕΝΦΙΑ ${Y}`, person: 'Πατέρας', kind: 'enfia', year: Y, installments: inst(ym(Y, 3), 10, 120.5, 4) },
      { id: 'tx2', name: 'Φόρος εισοδήματος', person: 'Μητέρα', kind: 'income', year: Y, installments: inst(ym(Y, 7), 6, 300, 0) }
    ],
    people: [{ id: 'p1', name: 'Συγγενής Δ', note: 'έξοδα για λογαριασμό τους', entries: [
      { id: 'e1', date: `${ym(Y, 2)}-10`, text: 'ΕΝΦΙΑ', amount: 200, dir: 'out' }, { id: 'e2', date: `${ym(Y, 3)}-10`, text: 'μας έστειλαν', amount: 150, dir: 'in' }] }],
    cars: [
      { id: 'c1', name: 'Αυτοκίνητο Α', since: `${Y - 3}-01-01`, fuelCategoryId: 'x_fuel', sold: '', kteo: `${ym(Y, M + 1)}-10`, km: [{ date: `${ym(Y, 1)}-01`, km: 50000 }, { date: `${ym(Y, M)}-01`, km: 58000 }], services: [{ id: 's1', date: `${ym(Y, 1)}-05`, km: 50000, work: 'Λάδια και φίλτρα', nextKm: 58500, cost: 180 }] },
      { id: 'c2', name: 'Παλιό αυτοκίνητο', since: '2015-01-01', fuelCategoryId: '', sold: `${Y - 1}-06-01`, kteo: '', km: [], services: [] }
    ],
    field: { waterings: [{ id: 'w1', date: `${Y - 1}-07-01`, hours: 10 }, { id: 'w2', date: `${ym(Y, Math.max(1, M - 1))}-05`, hours: 2 }, { id: 'w3', date: `${ym(Y, M)}-03`, hours: 1.5 }], payments: [{ id: 'f1', year: Y - 1, date: `${Y - 1}-10-01`, amount: 170, hours: 10, txId: '' }], categoryId: '' },
    power: { name: 'ΔΕΗ ισογείου', totalM2: 180, meteredM2: 65, meteredTenantId: 'ten_b', meteredName: 'Πίσω', restTenantId: '', restName: 'Διαμέρισμα', georgeShare: 50, lastReading: 1000,
      bills: [{ id: 'b1', from: `${ym(Y, 1)}-01`, to: `${ym(Y, 2)}-01`, kwh: 300, energy: 90, fees: 60, r0: 900, r1: 1000, sub: 100, total: 150, metered: { who: 'Εταιρεία Β', amount: 51.67, paid: false }, rest: { who: 'Διαμέρισμα', tenant: false, amount: 98.33, paid: false } }] },
    policies: [{ id: 'pl1', kind: 'car', name: 'Ασφάλεια αυτοκινήτου', what: 'Αυτοκίνητο Α', company: 'Ασφαλιστική', number: '123', amount: 300, every: 12, next: `${ym(Y, M + 1)}-01`, categoryId: 'x_ins', attachments: [], history: [] }],
    history: { [String(Y - 1)]: { monthlyExpenses: Array.from({ length: 12 }, (_, i) => 1500 + i * 20), expenses: 19320, categories: { x_super: 2400, x_dei: 1600 } }, [String(Y - 5)]: { income: 30000, expenses: 25000 } }
  };
}
module.exports = { makeFixture };
