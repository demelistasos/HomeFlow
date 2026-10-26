// Δοκιμή οθόνης: ανοίγει την εφαρμογή σε browser με ψεύτικα δεδομένα, περνάει από
// κάθε σελίδα και καρτέλα σε διάφορα μεγέθη και στις δύο εμφανίσεις, και κάνει τις
// βασικές ενέργειες. Αποτυγχάνει αν εμφανιστεί οποιοδήποτε σφάλμα.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { makeFixture } = require('./fixture');
const { buildXlsx } = require('../xlsx');

const ROOT = path.join(__dirname, '..', 'renderer');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});

let failed = 0, passed = 0;
const fails = [];
function check(ok, name) { if (ok) passed++; else { failed++; fails.push(name); console.log('  ✗ ' + name); } }

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const data = JSON.stringify(makeFixture());
  const browser = await chromium.launch();
  const SIZES = [[1440, 900], [1093, 582], [520, 760]];
  for (const [w, h] of SIZES) for (const theme of ['light', 'dark']) {
    const tag = `${w}×${h} ${theme === 'dark' ? 'σκούρα' : 'φωτεινή'}`;
    console.log('▶ ' + tag);
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', e => errors.push('σφάλμα: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('dialog', d => d.accept());
    await page.goto(url);
    await page.evaluate(([d, t]) => { localStorage.clear(); localStorage.setItem('homeflow-data', d); localStorage.setItem('homeflow-theme', t); }, [data, theme]);
    await page.reload(); await page.waitForTimeout(250);
    check(await page.$eval('#page', e => e.innerText.length > 50), `${tag}: η αρχική σελίδα φορτώνει`);
    check(await page.evaluate(() => document.documentElement.dataset.theme) === theme, `${tag}: σωστή εμφάνιση`);
    const pages = await page.$$eval('#nav button', bs => bs.map(b => b.dataset.page));
    check(pages.length >= 12, `${tag}: το μενού έχει όλες τις σελίδες`);
    for (const pg of pages) {
      await page.evaluate(p => document.querySelector(`#nav button[data-page="${p}"]`).click(), pg); await page.waitForTimeout(40);
      const tabs = await page.$$eval('.tabs .tab', ts => ts.map(t => t.dataset.k));
      for (const k of [null, ...tabs]) {
        if (k) { await page.evaluate(k => { const t = document.querySelector(`.tabs .tab[data-k="${k}"]`); if (t) t.click(); }, k); await page.waitForTimeout(25); }
        const over = await page.evaluate(() => { const m = document.querySelector('.main'); return m.scrollWidth - m.clientWidth; });
        check(over <= 2, `${tag}: η σελίδα «${pg}${k ? ' / ' + k : ''}» χωράει στο πλάτος (ξεχειλίζει ${over}px)`);
      }
      // καρτέλα ενοικιαστή / αυτοκινήτου / προσώπου
      for (const a of ['tenant-open', 'car-open', 'person-open']) {
        if (await page.$(`[data-action="${a}"]`)) { await page.click(`[data-action="${a}"] >> nth=0`); await page.waitForTimeout(40);
          const tabs2 = await page.$$eval('.tabs .tab', ts => ts.map(t => t.dataset.k));
          for (const k of tabs2) { await page.evaluate(k => document.querySelector(`.tabs .tab[data-k="${k}"]`).click(), k); await page.waitForTimeout(20); }
          await page.evaluate(p => document.querySelector(`#nav button[data-page="${p}"]`).click(), pg); }
      }
    }
    const inc = await page.evaluate(() => { const r = document.querySelector('[data-action="new-income"]').getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1; });
    check(inc, `${tag}: τα κουμπιά «Νέο έξοδο / έσοδο» φαίνονται`);

    if (w === 1440 && theme === 'light') {
      const count = async () => { await page.waitForTimeout(150); return page.evaluate(() => JSON.parse(localStorage.getItem('homeflow-data')).transactions.length); };
      const goto = p => page.evaluate(p => document.querySelector(`#nav button[data-page="${p}"]`).click(), p);
      // νέο έξοδο με συντόμευση
      const n0 = await count();
      await page.keyboard.press('Control+KeyE'); await page.waitForTimeout(100);
      await page.fill('#fm-amount', '10+2,5'); await page.click('.cat-btn >> nth=0'); await page.click('[data-action="form-save"]'); await page.waitForTimeout(150);
      check(await count() === n0 + 1, 'νέο έξοδο αποθηκεύεται (με πρόσθεση 10+2,5)');
      // αναζήτηση
      await page.keyboard.press('Control+KeyK'); await page.keyboard.type('Ενοικιαστής Α'); await page.waitForTimeout(80); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
      check((await page.textContent('.page-head h1')).includes('Ενοικιαστής Α'), 'αναζήτηση → καρτέλα ενοικιαστή');
      await page.keyboard.press('Control+KeyK'); await page.keyboard.type('λακτεσκο εταιρια'); await page.waitForTimeout(50); await page.keyboard.press('Escape');
      // πληρωμή ενοικίου
      await page.click('[data-action="tenant-pay"]'); await page.waitForTimeout(80);
      if (await page.$('#fm-amount')) { await page.click('[data-action="form-save"]'); await page.waitForTimeout(100); }
      check(await count() === n0 + 2, 'πληρωμή ενοικίου αποθηκεύεται');
      // εφορία
      await goto('tax'); await page.evaluate(() => document.querySelector('.tabs .tab[data-k="next"]').click()); await page.click('[data-action="tax-pay"] >> nth=0'); await page.waitForTimeout(60); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(80);
      check(await count() === n0 + 3, 'πληρωμή δόσης εφορίας μπαίνει στα έξοδα');
      // πάγια, ασφάλειες
      await goto('recurring'); await page.evaluate(() => document.querySelector('.tabs .tab[data-k="expense"]').click()); await page.click('[data-action="rec-edit"] >> nth=0'); await page.waitForTimeout(60); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(60);
      await page.evaluate(() => document.querySelector('.tabs .tab[data-k="pol"]').click()); await page.click('[data-action="pol-new"]'); await page.fill('#d-amount', '99'); await page.fill('#d-polnext', '2030-01-01'); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(60);
      check(await page.evaluate(() => JSON.parse(localStorage.getItem('homeflow-data')).policies.length) === 2, 'νέα ασφάλεια αποθηκεύεται');
      // χωράφι, ΔΕΗ
      await goto('field'); await page.click('[data-action="water-new"]'); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(60);
      await goto('rent'); await page.evaluate(() => document.querySelector('.tabs .tab[data-k="power"]').click()); await page.click('[data-action="pb-new"]');
      await page.fill('#d-pfrom', '2030-01-01'); await page.fill('#d-pto', '2030-02-01'); await page.fill('#d-pkwh', '200'); await page.fill('#d-penergy', '60'); await page.fill('#d-pfees', '40'); await page.fill('#d-pr1', '1100'); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(60);
      check(await page.evaluate(() => JSON.parse(localStorage.getItem('homeflow-data')).power.bills.length) === 2, 'λογαριασμός ΔΕΗ μοιράζεται και αποθηκεύεται');
      // βοήθεια, ημερολόγιο
      await page.keyboard.press('F1'); await page.waitForTimeout(60); await page.click('[data-action="help-topic"] >> nth=0'); await page.keyboard.press('Escape');
      await goto('home'); await page.evaluate(() => document.querySelector('.tabs .tab[data-k="cal"]').click()); await page.click('.cal-c.has >> nth=0'); await page.waitForTimeout(60); await page.keyboard.press('Escape');
      // Excel
      await page.click('[data-action="print"]'); await page.waitForTimeout(100);
      const book = await page.evaluate(() => window.__lastBook);
      const buf = book && buildXlsx(book);
      check(!!buf && buf.slice(0, 2).toString() === 'PK' && book.sheets.length >= 10, 'το συγκεντρωτικό Excel φτιάχνεται');
      // ενημέρωση
      await page.evaluate(() => showUpdate({ status: 'manual', version: '9.9.9', url: 'https://x', canAuto: true, platform: 'win32' }));
      await page.click('#update-banner [data-action="update-now"]'); await page.waitForTimeout(60);
      check(!!(await page.$('.modal')), 'η ενημέρωση ρωτάει πριν'); await page.keyboard.press('Escape');
      // PIN
      await goto('settings'); await page.evaluate(() => document.querySelector('.tabs .tab[data-k="general"]').click()); await page.click('[data-action="pin-set"]'); await page.fill('#d-p1', '2580'); await page.fill('#d-p2', '2580'); await page.click('[data-action="dlg-save"]');
      await page.waitForSelector('#d-wrote', { timeout: 15000 }); await page.check('#d-wrote'); await page.click('[data-action="dlg-save"]'); await page.waitForTimeout(80);
      await page.reload();
      check(!!(await page.waitForSelector('#lock-root', { timeout: 10000 }).catch(() => null)), 'με PIN η εφαρμογή ανοίγει κλειδωμένη');
      for (const k of '2580') await page.keyboard.press(k);
      check(await page.waitForSelector('#lock-root', { state: 'detached', timeout: 15000 }).then(() => true).catch(() => false), 'το σωστό PIN ξεκλειδώνει');
    }
    check(errors.length === 0, `${tag}: χωρίς σφάλματα${errors.length ? '\n      ' + errors.slice(0, 5).join('\n      ') : ''}`);
    await page.close();
  }
  await browser.close(); server.close();
  console.log(`\n${passed} έλεγχοι πέρασαν, ${failed} απέτυχαν`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
