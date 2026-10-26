// Μικρές δοκιμές για τα κομμάτια που δεν φαίνονται στην οθόνη (ενημέρωση, Excel).
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const zlib = require('zlib');
const upd = require('../updater');
const { buildXlsx } = require('../xlsx');

let failed = 0, passed = 0;
async function t(name, fn) {
  try { await fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + (e && e.stack || e)); }
}

(async () => {
  console.log('Μικρές δοκιμές');
  await t('pickAssets βρίσκει το σωστό zip και τα αποτυπώματα', () => {
    const rel = { assets: [{ name: 'HomeFlow-Windows-0.1.9.zip', browser_download_url: 'w', size: 1 }, { name: 'HomeFlow-Mac-0.1.9.zip', browser_download_url: 'm', size: 2 }, { name: 'SHA256SUMS.txt', browser_download_url: 's' }] };
    assert.strictEqual(upd.pickAssets(rel, 'win32', '0.1.9').zipUrl, 'w');
    assert.strictEqual(upd.pickAssets(rel, 'darwin', '0.1.9').zipUrl, 'm');
    assert.strictEqual(upd.pickAssets({ assets: rel.assets.slice(0, 2) }, 'win32', '0.1.9'), null, 'χωρίς SHA256SUMS δεν γίνεται αυτόματα');
  });
  await t('parseSums διαβάζει το SHA256SUMS.txt', () => {
    const h = 'a'.repeat(64);
    assert.deepStrictEqual(upd.parseSums(`${h}  HomeFlow-Mac-0.1.9.zip\n${'b'.repeat(64)} *HomeFlow-Windows-0.1.9.zip\r\n`), { 'HomeFlow-Mac-0.1.9.zip': h, 'HomeFlow-Windows-0.1.9.zip': 'b'.repeat(64) });
  });
  await t('installTarget: Program Files και Mac', () => {
    assert.strictEqual(upd.installTarget('C:\\Program Files\\HomeFlow\\HomeFlow.exe', 'win32').reason, 'programfiles');
    assert.strictEqual(upd.installTarget('/private/var/folders/x/AppTranslocation/y/HomeFlow.app/Contents/MacOS/HomeFlow', 'darwin').reason, 'translocated');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-'));
    const app = path.join(dir, 'HomeFlow.app', 'Contents', 'MacOS'); fs.mkdirSync(app, { recursive: true });
    const r = upd.installTarget(path.join(app, 'HomeFlow'), 'darwin');
    assert.ok(r.ok); assert.strictEqual(r.appPath, path.join(dir, 'HomeFlow.app'));
  });
  await t('findApp βρίσκει την εφαρμογή μέσα στο zip', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-'));
    fs.mkdirSync(path.join(dir, 'w', 'sub'), { recursive: true }); fs.writeFileSync(path.join(dir, 'w', 'sub', 'HomeFlow.exe'), 'x');
    fs.mkdirSync(path.join(dir, 'm', 'HomeFlow.app', 'Contents', 'MacOS'), { recursive: true });
    assert.strictEqual(upd.findApp(path.join(dir, 'w'), 'win32', 'HomeFlow.exe'), path.join(dir, 'w', 'sub'));
    assert.strictEqual(upd.findApp(path.join(dir, 'm'), 'darwin'), path.join(dir, 'm', 'HomeFlow.app'));
    assert.strictEqual(upd.findApp(path.join(dir, 'w'), 'darwin'), null);
  });
  await t('sha256File', async () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hf-')), 'a.txt'); fs.writeFileSync(f, 'HomeFlow');
    assert.strictEqual(await upd.sha256File(f), require('crypto').createHash('sha256').update('HomeFlow').digest('hex'));
  });
  await t('helperScript: Windows και Mac, με ελληνικά και απόστροφους', () => {
    const o = { pid: 42, appPath: "C:\\Users\\Νίκος O'Neil\\HomeFlow", newPath: 'C:\\x\\new', workDir: 'C:\\x', exeName: 'HomeFlow.exe', logFile: 'C:\\log.txt' };
    const w = upd.helperScript('win32', o);
    assert.ok(w.content.startsWith('\ufeff'), 'UTF-8 BOM για το PowerShell');
    assert.ok(w.content.includes("'C:\\Users\\Νίκος O''Neil\\HomeFlow'"), 'απόστροφος σωστά');
    assert.ok(w.content.includes('Get-Process -Id 42'));
    const m = upd.helperScript('darwin', { ...o, appPath: "/Applications/Home'Flow.app", newPath: '/tmp/n/HomeFlow.app', workDir: '/tmp/n', logFile: '/tmp/l' });
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hf-')), 's.sh'); fs.writeFileSync(f, m.content);
    const r = require('child_process').spawnSync('bash', ['-n', f]); assert.strictEqual(r.status, 0, 'σύνταξη bash: ' + r.stderr);
  });
  await t('buildXlsx φτιάχνει έγκυρο αρχείο Excel', () => {
    const buf = buildXlsx({ title: 'Δοκιμή', sheets: [{ name: 'Σύνοψη/2026?', rows: [[{ v: 'Τίτλος', s: 'title' }], [{ v: 'Ποσό', s: 'head' }], ['Α & Β <x>', { v: 12.5, s: 'money' }], [{ v: 45000, s: 'date' }]], widths: [20, 12], freeze: 2 }, { name: 'Σύνοψη/2026?', rows: [] }] });
    assert.strictEqual(buf.slice(0, 2).toString(), 'PK');
    // διαβάζουμε τα αρχεία του zip και ελέγχουμε ότι είναι σωστή XML
    let off = 0, names = [];
    while (buf.readUInt32LE(off) === 0x04034b50) {
      const csize = buf.readUInt32LE(off + 18), nlen = buf.readUInt16LE(off + 26), xlen = buf.readUInt16LE(off + 28);
      const name = buf.slice(off + 30, off + 30 + nlen).toString(); const data = zlib.inflateRawSync(buf.slice(off + 30 + nlen + xlen, off + 30 + nlen + xlen + csize)).toString();
      names.push(name); assert.ok(data.startsWith('<?xml') || data.startsWith('<'), name);
      if (name.endsWith('sheet1.xml')) { assert.ok(data.includes('Α &amp; Β &lt;x&gt;')); assert.ok(data.includes('<v>12.5</v>')); }
      if (name === 'xl/workbook.xml') { assert.ok(!/name="[^"]*[\/?]/.test(data), 'όχι μη επιτρεπτοί χαρακτήρες στα ονόματα φύλλων'); assert.ok(/Σύνοψη 2026 2/.test(data), 'διπλά ονόματα φύλλων γίνονται μοναδικά'); }
      off += 30 + nlen + xlen + csize;
    }
    assert.ok(names.includes('xl/worksheets/sheet2.xml'));
  });
  console.log(`\n${passed} πέρασαν, ${failed} απέτυχαν`);
  process.exit(failed ? 1 : 0);
})();
