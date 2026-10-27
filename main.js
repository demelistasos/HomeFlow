// HomeFlow – κύρια διεργασία Electron
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { buildXlsx } = require('./xlsx');
const upd = require('./updater');
const ofs = (() => { try { return require('original-fs'); } catch { return fs; } })(); // χωρίς «μαγεία» .asar (βλ. updater.js)

const DATA_FILE = 'homeflow-data.json';
const BACKUP_DIR = 'Αντίγραφα ασφαλείας';
const KEEP_BACKUPS = 60;

let win = null;
// Όταν η νέα έκδοση τρέχει για να ολοκληρώσει μια ενημέρωση (βλ. updater.finishUpdate)
const FIN_I = process.argv.indexOf('--homeflow-finish-update');
let FINISH = null;
if (FIN_I > 0) { try { FINISH = JSON.parse(Buffer.from(process.argv[FIN_I + 1] || '', 'base64').toString('utf8')); } catch { FINISH = null; } }

// ---------- ρυθμίσεις θέσης αρχείου ----------
function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}
function readConfig() {
  try { return JSON.parse(fs.readFileSync(configPath(), 'utf8')); } catch { return {}; }
}
function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
}
function dataDir() {
  const cfg = readConfig();
  return cfg.dataDir || path.join(app.getPath('documents'), 'HomeFlow');
}
function dataFile() {
  return path.join(dataDir(), DATA_FILE);
}

// Ασφαλής εγγραφή: πρώτα σε προσωρινό αρχείο, μετά μετονομασία
// ΧΩΡΙΣ να «παγώνει» η εφαρμογή: όσο περιμένουμε, το παράθυρο δέχεται κανονικά πλήκτρα και κλικ.
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function atomicWrite(file, text) {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await fs.promises.writeFile(tmp, text, 'utf8');
  // Στο OneDrive το αρχείο μπορεί να είναι «πιασμένο» για λίγο την ώρα που ανεβαίνει: ξαναδοκιμάζουμε
  for (let i = 1; ; i++) {
    try { await fs.promises.rename(tmp, file); return; } catch (e) {
      if (!['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      if (i >= 20) { await fs.promises.copyFile(tmp, file); await fs.promises.unlink(tmp).catch(() => {}); return; }
      await sleep(150);
    }
  }
}

// Ένα αντίγραφο την ημέρα, κρατάμε τα τελευταία KEEP_BACKUPS
function dailyBackup() {
  const src = dataFile();
  if (!fs.existsSync(src)) return;
  const dir = path.join(dataDir(), BACKUP_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const dst = path.join(dir, `homeflow-${today}.json`);
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
  const files = fs.readdirSync(dir).filter(f => /^homeflow-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  while (files.length > KEEP_BACKUPS) fs.unlinkSync(path.join(dir, files.shift()));
}

// ---------- δεύτερο αντίγραφο: cloud (OneDrive / Google Drive) και USB ----------
// Γράφεται στον φάκελο «HomeFlow αντίγραφα» της θέσης που διάλεξε ο χρήστης:
// ένα αρχείο ανά μέρα (κρατάμε 30) και το «homeflow-τελευταίο.json» που ενημερώνεται σε κάθε αποθήκευση.
const EXTRA_DIR = 'HomeFlow αντίγραφα';
const KEEP_EXTRA = 30;
function backupCfg() { return readConfig().backups || {}; }
function setBackupCfg(kind, val) {
  const cfg = readConfig(); cfg.backups = cfg.backups || {};
  if (val === null) delete cfg.backups[kind]; else cfg.backups[kind] = val;
  writeConfig(cfg);
}
function extraBackup(kind, { quiet } = {}) {
  const b = backupCfg()[kind];
  if (!b || !b.dir) return { ok: false, error: 'Δεν έχει διαλεχτεί θέση.' };
  if (!fs.existsSync(b.dir)) return { ok: false, missing: true, error: kind === 'usb' ? 'Δεν βρέθηκε το USB. Βάλτε το στον υπολογιστή και ξαναδοκιμάστε.' : 'Δεν βρέθηκε ο φάκελος. Είναι ανοιχτό το OneDrive / Google Drive;' };
  const src = dataFile();
  if (!fs.existsSync(src)) return { ok: false, error: 'Δεν υπάρχουν ακόμα δεδομένα.' };
  try {
    const dir = path.join(b.dir, EXTRA_DIR);
    fs.mkdirSync(dir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    fs.copyFileSync(src, path.join(dir, `homeflow-${today}.json`));
    fs.copyFileSync(src, path.join(dir, 'homeflow-τελευταίο.json'));
    const files = fs.readdirSync(dir).filter(f => /^homeflow-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    while (files.length > KEEP_EXTRA) fs.unlinkSync(path.join(dir, files.shift()));
    mirrorDir(attDir(), path.join(dir, ATT_DIR));
    mirrorDir(path.join(dataDir(), 'Μηνιαίες συνόψεις'), path.join(dir, 'Μηνιαίες συνόψεις'));
    setBackupCfg(kind, { ...b, last: new Date().toISOString() });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (quiet ? '' : 'Δεν έγινε το αντίγραφο: ') + e.message };
  }
}
// συνημμένα: αρχεία δίπλα στα δεδομένα, στον φάκελο «Συνημμένα»
const ATT_DIR = 'Συνημμένα';
const attDir = () => path.join(dataDir(), ATT_DIR);
function mirrorDir(src, dst) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    const a = path.join(src, f), b = path.join(dst, f);
    if (fs.statSync(a).isFile() && !fs.existsSync(b)) { fs.copyFileSync(a, b); n++; }
  }
  return n;
}
function backupStatus() {
  const c = backupCfg();
  const st = k => c[k] ? { dir: c[k].dir, last: c[k].last || null, present: fs.existsSync(c[k].dir) } : null;
  return { cloud: st('cloud'), usb: st('usb') };
}
function cloudGuess() {
  const home = app.getPath('home');
  const cands = [process.env.OneDrive, process.env.OneDriveConsumer, path.join(home, 'OneDrive'), 'G:\\My Drive', 'G:\\Ο Δίσκος μου',
    path.join(home, 'Google Drive'), path.join(home, 'Library', 'CloudStorage')].filter(Boolean);
  return cands.find(p => { try { return fs.existsSync(p); } catch { return false; } }) || home;
}

// ---------- παράθυρο ----------
function createWindow() {
  const wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    // Το ελάχιστο μέγεθος δεν πρέπει να ξεπερνά τον χώρο της οθόνης πάνω από τη γραμμή εργασιών.
    // (Σε laptop με μεγέθυνση 125–150% ο χώρος μπορεί να είναι κάτω από 600 pixel ύψος.)
    minWidth: Math.min(520, wa.width),
    minHeight: Math.min(460, wa.height),
    width: Math.min(1320, wa.width),
    height: Math.min(900, wa.height),
    title: 'HomeFlow',
    backgroundColor: '#EEF4F7',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.platform === 'darwin') {
    // Στο Mac χρειάζεται μενού για Cmd+C / Cmd+V / Cmd+Q
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu', label: 'HomeFlow' },
      { role: 'editMenu', label: 'Επεξεργασία' },
      { role: 'windowMenu', label: 'Παράθυρο' }
    ]));
  } else {
    Menu.setApplicationMenu(null);
  }
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.once('ready-to-show', () => { win.show(); win.maximize(); });
  // Αν αλλάξει η οθόνη (π.χ. άλλη ανάλυση ή δεύτερη οθόνη), το ελάχιστο μέγεθος προσαρμόζεται
  const fitMin = () => { if (!win || win.isDestroyed()) return; const d = screen.getDisplayMatching(win.getBounds()).workAreaSize; win.setMinimumSize(Math.min(520, d.width), Math.min(460, d.height)); };
  screen.on('display-metrics-changed', fitMin);
  win.on('moved', fitMin);
  // Εξωτερικοί σύνδεσμοι ανοίγουν στον browser
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

// ---------- IPC ----------
ipcMain.handle('data:load', () => {
  const file = dataFile();
  if (!fs.existsSync(file)) return { data: null, path: file };
  try {
    return { data: JSON.parse(fs.readFileSync(file, 'utf8')), path: file };
  } catch (e) {
    return { data: null, path: file, error: 'Το αρχείο δεδομένων δεν διαβάζεται: ' + e.message };
  }
});

// Οι αποθηκεύσεις γίνονται μία μία, με τη σειρά. Τα δεύτερα αντίγραφα (cloud / USB) γράφονται
// λίγο αργότερα, όταν σταματήσουν οι αλλαγές, για να μην καθυστερεί η εφαρμογή σε κάθε κλικ.
let saveQueue = Promise.resolve(), extraTimer = null;
ipcMain.handle('data:save', (_e, text) => {
  const job = saveQueue.then(async () => {
    try { dailyBackup(); } catch { /* το αντίγραφο της ημέρας θα γίνει την επόμενη φορά */ }
    await atomicWrite(dataFile(), text);
    clearTimeout(extraTimer);
    extraTimer = setTimeout(() => { for (const k of ['cloud', 'usb']) if (backupCfg()[k]) extraBackup(k, { quiet: true }); }, 8000);
    return { ok: true, path: dataFile() };
  });
  saveQueue = job.catch(() => {});
  return job;
});
// πριν κλείσει η εφαρμογή, να γραφτούν και τα δεύτερα αντίγραφα που περιμένουν
app.on('before-quit', () => { if (extraTimer) { clearTimeout(extraTimer); extraTimer = null; for (const k of ['cloud', 'usb']) if (backupCfg()[k]) extraBackup(k, { quiet: true }); } });

ipcMain.handle('data:info', () => ({ path: dataFile(), dir: dataDir(), version: app.getVersion() }));

ipcMain.handle('data:openFolder', () => shell.openPath(dataDir()));

ipcMain.handle('data:chooseFolder', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Επιλέξτε φάκελο για τα δεδομένα του HomeFlow',
    properties: ['openDirectory', 'createDirectory']
  });
  if (res.canceled || !res.filePaths[0]) return { changed: false };
  const newDir = res.filePaths[0];
  const oldFile = dataFile();
  const newFile = path.join(newDir, DATA_FILE);
  if (fs.existsSync(newFile)) {
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Χρήση του αρχείου που υπάρχει εκεί', 'Αντικατάσταση με τα τωρινά δεδομένα', 'Ακύρωση'],
      defaultId: 0, cancelId: 2,
      message: 'Στον φάκελο υπάρχει ήδη αρχείο HomeFlow.',
      detail: 'Τι θέλετε να γίνει;'
    });
    if (response === 2) return { changed: false };
    if (response === 1 && fs.existsSync(oldFile)) fs.copyFileSync(oldFile, newFile);
  } else if (fs.existsSync(oldFile)) {
    fs.copyFileSync(oldFile, newFile);
  }
  try { mirrorDir(path.join(path.dirname(oldFile), ATT_DIR), path.join(newDir, ATT_DIR)); } catch { /* τίποτα */ }
  writeConfig({ ...readConfig(), dataDir: newDir });
  return { changed: true, path: newFile };
});

ipcMain.handle('data:importFile', async () => {
  const res = await dialog.showOpenDialog(win, {
    title: 'Επιλέξτε αρχείο HomeFlow',
    filters: [{ name: 'HomeFlow', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (res.canceled || !res.filePaths[0]) return null;
  try {
    return { data: JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8')), name: path.basename(res.filePaths[0]) };
  } catch (e) {
    return { error: 'Το αρχείο δεν είναι έγκυρο: ' + e.message };
  }
});

ipcMain.handle('data:saveAs', async (_e, { text, defaultName, kind }) => {
  const filters = kind === 'csv'
    ? [{ name: 'Excel (CSV)', extensions: ['csv'] }]
    : [{ name: 'HomeFlow', extensions: ['json'] }];
  const res = await dialog.showSaveDialog(win, {
    title: kind === 'csv' ? 'Αποθήκευση για Excel' : 'Αποθήκευση αντιγράφου',
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters
  });
  if (res.canceled || !res.filePath) return { ok: false };
  fs.writeFileSync(res.filePath, (kind === 'csv' ? '﻿' : '') + text, 'utf8');
  shell.showItemInFolder(res.filePath);
  return { ok: true, path: res.filePath };
});

ipcMain.handle('backup:status', () => backupStatus());
ipcMain.handle('backup:now', (_e, kind) => ({ ...extraBackup(kind), status: backupStatus() }));
ipcMain.handle('backup:remove', (_e, kind) => { setBackupCfg(kind, null); return backupStatus(); });
ipcMain.handle('backup:choose', async (_e, kind) => {
  const res = await dialog.showOpenDialog(win, {
    title: kind === 'usb' ? 'Διαλέξτε το USB για τα αντίγραφα' : 'Διαλέξτε φάκελο στο OneDrive ή στο Google Drive',
    defaultPath: kind === 'usb' ? (process.platform === 'darwin' ? '/Volumes' : undefined) : cloudGuess(),
    properties: ['openDirectory', 'createDirectory']
  });
  if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true, status: backupStatus() };
  setBackupCfg(kind, { dir: res.filePaths[0], last: null });
  return { ...extraBackup(kind), status: backupStatus() };
});
ipcMain.handle('backup:open', (_e, kind) => { const b = backupCfg()[kind]; if (b && fs.existsSync(b.dir)) shell.openPath(path.join(b.dir, EXTRA_DIR)); });

ipcMain.handle('data:saveXlsx', async (_e, { book, defaultName }) => {
  const res = await dialog.showSaveDialog(win, {
    title: 'Αποθήκευση Excel',
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (res.canceled || !res.filePath) return { ok: false };
  try {
    fs.writeFileSync(res.filePath, buildXlsx(book));
  } catch (e) {
    return { ok: false, error: e.code === 'EBUSY' || e.code === 'EPERM' ? 'Το αρχείο είναι ανοιχτό στο Excel. Κλείστε το και ξαναδοκιμάστε.' : 'Δεν αποθηκεύτηκε: ' + e.message };
  }
  shell.openPath(res.filePath);
  return { ok: true, path: res.filePath };
});

// ---------- PDF ----------
// Η σελίδα (HTML) φτιάχνεται στο παράθυρο, εδώ γίνεται PDF σε κρυφό παράθυρο.
async function htmlToPdf(html) {
  // Η γραμματοσειρά μπαίνει μέσα στη σελίδα (data:), ώστε να φορτώνει σίγουρα και μέσα από το app.asar
  // και από φακέλους με ελληνικά ή κενά στο όνομα, χωρίς τους περιορισμούς του file://.
  let font = '';
  try { font = 'data:font/ttf;base64,' + fs.readFileSync(path.join(__dirname, 'renderer', 'fonts', 'Commissioner.ttf')).toString('base64'); } catch { /* τυπώνει με τη γραμματοσειρά του συστήματος */ }
  const tmp = path.join(app.getPath('temp'), `homeflow-report-${process.pid}-${Date.now()}.html`);
  let pdfWin = null;
  try {
    fs.writeFileSync(tmp, String(html).split('__FONT__').join(font), 'utf8');
    pdfWin = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true, contextIsolation: true, nodeIntegration: false } });
    await pdfWin.loadFile(tmp);
    await new Promise(r => setTimeout(r, 250)); // λίγος χρόνος για να εφαρμοστεί η γραμματοσειρά
    return await pdfWin.webContents.printToPDF({ pageSize: 'A4', printBackground: true, preferCSSPageSize: true });
  } finally {
    if (pdfWin && !pdfWin.isDestroyed()) pdfWin.destroy();
    try { fs.unlinkSync(tmp); } catch { /* τίποτα */ }
  }
}
const busyMsg = e => (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES' ? 'Το αρχείο είναι ανοιχτό σε άλλο πρόγραμμα ή ο φάκελος δεν επιτρέπει αποθήκευση. Κλείστε το ή διαλέξτε άλλο φάκελο.' : 'Δεν αποθηκεύτηκε: ' + e.message);
const safeName = n => String(n || 'HomeFlow.pdf').replace(/[\\/:*?"<>|]/g, '_');

// Σύνοψη μήνα σε PDF, όπου διαλέξει ο χρήστης
ipcMain.handle('data:savePdf', async (_e, { html, defaultName }) => {
  const res = await dialog.showSaveDialog(win, {
    title: 'Αποθήκευση PDF',
    defaultPath: path.join(app.getPath('documents'), safeName(defaultName)),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (res.canceled || !res.filePath) return { ok: false };
  try { fs.writeFileSync(res.filePath, await htmlToPdf(html)); } catch (e) { return { ok: false, error: busyMsg(e) }; }
  shell.openPath(res.filePath);
  return { ok: true, path: res.filePath };
});

// Κλείσιμο μήνα: το PDF μπαίνει μόνο του στον φάκελο «Μηνιαίες συνόψεις» δίπλα στα δεδομένα
// και αντιγράφεται και στα δεύτερα αντίγραφα (cloud / USB), όσα είναι διαθέσιμα.
const MONTHS_DIR = 'Μηνιαίες συνόψεις';
const monthsDir = () => path.join(dataDir(), MONTHS_DIR);
ipcMain.handle('report:archive', async (_e, { html, name }) => {
  try {
    const dir = monthsDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, safeName(name));
    fs.writeFileSync(file, await htmlToPdf(html));
    const copies = [];
    for (const [k, b] of Object.entries(backupCfg())) {
      if (!b || !b.dir || !fs.existsSync(b.dir)) continue;
      try { const d = path.join(b.dir, EXTRA_DIR, MONTHS_DIR); fs.mkdirSync(d, { recursive: true }); fs.copyFileSync(file, path.join(d, path.basename(file))); copies.push(k); } catch { /* θα γίνει στο επόμενο αντίγραφο */ }
    }
    return { ok: true, path: file, file: path.basename(file), dir, copies };
  } catch (e) { return { ok: false, error: busyMsg(e) }; }
});
ipcMain.handle('report:open', async (_e, file) => {
  const p = path.join(monthsDir(), path.basename(String(file || '')));
  if (file && fs.existsSync(p)) { const err = await shell.openPath(p); return err ? { error: err } : { ok: true }; }
  fs.mkdirSync(monthsDir(), { recursive: true });
  shell.openPath(monthsDir());
  return { ok: true };
});

ipcMain.handle('att:add', async (_e, title) => {
  const res = await dialog.showOpenDialog(win, {
    title: title || 'Επιλέξτε αρχείο',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Έγγραφα και φωτογραφίες', extensions: ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'txt'] }, { name: 'Όλα τα αρχεία', extensions: ['*'] }]
  });
  if (res.canceled || !res.filePaths.length) return { files: [] };
  const dir = attDir();
  fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const src of res.filePaths) {
    try {
      const st = fs.statSync(src);
      if (st.size > 50 * 1024 * 1024) return { files, error: `Το «${path.basename(src)}» είναι πολύ μεγάλο (πάνω από 50 MB).` };
      const name = path.basename(src);
      const safe = name.replace(/[\\/:*?"<>|]/g, '_');
      const file = `${new Date().toISOString().slice(0, 10)}_${Math.random().toString(36).slice(2, 7)}_${safe}`;
      fs.copyFileSync(src, path.join(dir, file));
      files.push({ id: file, name, file, size: st.size, added: new Date().toISOString() });
    } catch (e) { return { files, error: 'Δεν αντιγράφηκε: ' + e.message }; }
  }
  return { files };
});
ipcMain.handle('att:open', async (_e, file) => {
  const p = path.join(attDir(), path.basename(String(file)));
  if (!fs.existsSync(p)) return { error: 'Το αρχείο δεν βρέθηκε στον φάκελο «Συνημμένα».' };
  const err = await shell.openPath(p);
  return err ? { error: err } : { ok: true };
});
ipcMain.handle('att:remove', async (_e, file) => {
  const p = path.join(attDir(), path.basename(String(file)));
  if (!fs.existsSync(p)) return { ok: true };
  try { await shell.trashItem(p); } catch { try { fs.unlinkSync(p); } catch { /* τίποτα */ } }
  return { ok: true };
});

ipcMain.handle('app:print', () => {
  if (win) win.webContents.print({ printBackground: true });
});

// ---------- ενημερώσεις ----------
// Η εφαρμογή κοιτάει στο GitHub αν υπάρχει νεότερη έκδοση και ΡΩΤΑΕΙ τον χρήστη.
// Μόνο αν πατήσει «Ενημέρωση τώρα» κατεβαίνει και μπαίνει η νέα έκδοση (βλ. updater.js).
// Κάθε έκδοση (tag "v0.1.N") έχει ένα zip για Windows, ένα για Mac και το SHA256SUMS.txt.
let pending = null;
const REPO = 'demelistasos/HomeFlow';
const TAG = /^v(\d[\d.]*)$/;
function send(status, extra = {}) {
  if (win && !win.isDestroyed()) win.webContents.send('update:status', { status, platform: process.platform, ...extra });
}
function newer(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}
let lastLogged = '';
async function checkUpdates() {
  send('checking');
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'HomeFlow' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    let best = null;
    for (const rel of await r.json()) {
      const m = !rel.draft && TAG.exec(rel.tag_name);
      if (!m) continue;
      if (!best || newer(m[1], best.version)) best = { version: m[1], url: rel.html_url, rel };
    }
    if (best && newer(best.version, app.getVersion())) {
      const assets = upd.pickAssets(best.rel, process.platform, best.version);
      let target = upd.installTarget(process.execPath, process.platform);
      if (target.ok && dataInside(target.appPath)) target = { ok: false, reason: 'datainside', dir: target.appPath };
      pending = assets && target.ok ? { version: best.version, url: best.url, assets, target } : null;
      if (lastLogged !== best.version) { lastLogged = best.version; updLog(`βρέθηκε νέα έκδοση ${best.version}` + (pending ? '' : ` (χωρίς αυτόματη ενημέρωση: ${!assets ? 'noassets' : target.reason})`)); }
      send('manual', { version: best.version, url: best.url, canAuto: !!pending, reason: !assets ? 'noassets' : target.reason, dir: target.dir });
    } else send('latest');
  } catch (e) {
    send('error', { message: e.message });
  }
}
function setupUpdates() {
  if (!app.isPackaged) return;
  setTimeout(cleanOldUpdates, 15000);
  // μία γραμμή κάθε φορά που ανοίγει νέα έκδοση, ώστε το ημερολόγιο να υπάρχει πάντα
  try { const cfg = readConfig(); if (cfg.loggedVersion !== app.getVersion()) { updLog(`άνοιξε η έκδοση ${app.getVersion()} από ${path.dirname(process.execPath)}`); writeConfig({ ...readConfig(), loggedVersion: app.getVersion() }); } } catch { /* τίποτα */ }
  setTimeout(checkUpdates, 4000);
  setInterval(checkUpdates, 4 * 60 * 60 * 1000);
}
let installing = false;
// σβήσιμο φακέλου με επιμονή (Windows: antivirus / OneDrive κρατάνε αρχεία για λίγο)
const RM = { recursive: true, force: true, maxRetries: 10, retryDelay: 300 };
// Ασφάλεια: τα δεδομένα ΔΕΝ πρέπει να είναι μέσα στον φάκελο του προγράμματος, γιατί η ενημέρωση τον αντικαθιστά
function dataInside(appPath) {
  const norm = p => path.resolve(p).toLowerCase() + path.sep;
  return norm(dataDir()).startsWith(norm(appPath)) || norm(appPath) === norm(dataDir());
}
// Μαζεύει ό,τι έμεινε από παλιές ενημερώσεις που δεν ολοκληρώθηκαν
function cleanOldUpdates() {
  if (installing) return;
  try {
    const t = upd.installTarget(process.execPath, process.platform);
    for (const dir of [app.getPath('temp'), t.parent].filter(Boolean)) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) if (/^\.?homeflow-update-/.test(f)) { try { ofs.rmSync(path.join(dir, f), RM); updLog('σβήστηκε παλιός φάκελος ενημέρωσης: ' + f); } catch { /* την επόμενη φορά */ } }
    }
  } catch { /* τίποτα */ }
}
// Ημερολόγιο ενημερώσεων (για να βρίσκουμε τι έγινε αν κάτι δεν πάει καλά)
const updLogFile = () => path.join(app.getPath('userData'), 'ενημερώσεις.log');
function updLog(msg) { try { fs.appendFileSync(updLogFile(), `${new Date().toISOString().slice(0, 19)} [${app.getVersion()}] ${msg}\n`, 'utf8'); } catch { /* τίποτα */ } }
ipcMain.handle('update:install', async () => {
  if (installing) { updLog('πατήθηκε ξανά ενώ γινόταν ήδη η ενημέρωση'); return { ok: false, error: 'Η ενημέρωση γίνεται ήδη. Περιμένετε λίγο…' }; }
  if (!pending) { updLog('πατήθηκε χωρίς διαθέσιμη ενημέρωση'); return { ok: false, error: 'Δεν υπάρχει ενημέρωση για εγκατάσταση.' }; }
  installing = true;
  updLog(`ξεκινάει η ενημέρωση στην ${pending.version} (${pending.target.appPath})`);
  const { version, assets, target } = pending;
  // Η δουλειά (κατέβασμα, αποσυμπίεση) γίνεται στον φάκελο προσωρινών αρχείων του υπολογιστή, όχι δίπλα
  // στο πρόγραμμα: αν το πρόγραμμα είναι σε OneDrive (Επιφάνεια εργασίας / Έγγραφα), το OneDrive «πιάνει»
  // τα αρχεία καθώς γράφονται. Μόνο αν ο προσωρινός φάκελος είναι σε άλλο δίσκο, η δουλειά γίνεται δίπλα στο πρόγραμμα.
  const sameDrive = process.platform !== 'win32' || path.win32.parse(app.getPath('temp')).root.toLowerCase() === path.win32.parse(target.appPath).root.toLowerCase();
  let work = path.join(sameDrive ? app.getPath('temp') : target.parent, `homeflow-update-${version}-${Date.now()}`);
  // Στα Windows το antivirus μπορεί να κρατάει για λίγο «κλειδωμένο» ένα αρχείο που μόλις κατέβηκε.
  // Γι' αυτό κάθε βήμα που πειράζει αρχεία ξαναδοκιμάζει μερικές φορές πριν τα παρατήσει.
  const retry = async (what, fn, times = 4) => {
    for (let i = 1; ; i++) {
      try { return await fn(); } catch (e) {
        if (i >= times) throw e;
        updLog(`${what}: απέτυχε (${e.code || e.message}), ξαναδοκιμή ${i + 1}/${times}`);
        await new Promise(r => setTimeout(r, 1500 * i));
      }
    }
  };
  try {
    // 1. αντίγραφο των δεδομένων πριν από οτιδήποτε
    if (fs.existsSync(dataFile())) {
      const bdir = path.join(dataDir(), BACKUP_DIR); fs.mkdirSync(bdir, { recursive: true });
      fs.copyFileSync(dataFile(), path.join(bdir, `homeflow-πριν-την-${version}.json`));
    }
    // 2. κατέβασμα
    fs.mkdirSync(work, { recursive: true });
    const zip = path.join(work, assets.zipName);
    const sums = upd.parseSums(await retry('αποτυπώματα', () => upd.downloadText(assets.sumsUrl), 3));
    const want = sums[assets.zipName];
    if (!want) throw new Error('Η νέα έκδοση δεν έχει αποτύπωμα για αυτόν τον υπολογιστή.');
    // κατέβασμα και 3. έλεγχος αποτυπώματος (αν κοπεί ή χαλάσει, ξανακατεβαίνει)
    await retry('κατέβασμα', async () => {
      send('downloading', { version, percent: 0 });
      await upd.downloadTo(assets.zipUrl, zip, p => send('progress', { version, percent: p }));
      send('verifying', { version });
      const got = await upd.sha256File(zip);
      updLog(`κατέβηκε (${fs.statSync(zip).size} bytes, αποτύπωμα ${got.slice(0, 12)}…, αναμενόμενο ${want.slice(0, 12)}…)`);
      if (want !== got) throw new Error('Το αρχείο δεν κατέβηκε σωστά (δεν ταιριάζει το αποτύπωμα).');
    }, 3);
    // 4. αποσυμπίεση δίπλα στο τωρινό πρόγραμμα
    send('installing', { version });
    await retry('αποσυμπίεση', () => { ofs.rmSync(path.join(work, 'x'), RM); upd.extractZip(zip, path.join(work, 'x'), process.platform); });
    try { fs.rmSync(zip, { force: true }); } catch { /* θα σβηστεί μαζί με τον φάκελο εργασίας */ }
    const exeName = target.exeName || 'HomeFlow.exe';
    const newPath = upd.findApp(path.join(work, 'x'), process.platform, exeName);
    if (!newPath) throw new Error('Δεν βρέθηκε η νέα εφαρμογή μέσα στο zip.');
    // 5. script που αλλάζει την έκδοση αφού κλείσει η εφαρμογή
    const logFile = updLogFile();
    updLog('η νέα έκδοση είναι έτοιμη, η εφαρμογή κλείνει');
    writeConfig({ ...readConfig(), updatedFrom: app.getVersion() });
    let child;
    if (process.platform === 'win32') {
      // Windows: χωρίς PowerShell. Η ίδια η νέα έκδοση (από τον προσωρινό φάκελο) ολοκληρώνει την αλλαγή.
      const arg = Buffer.from(JSON.stringify({ pid: process.pid, appPath: target.appPath, newPath, exeName, logFile })).toString('base64');
      updLog('ξεκινάει η νέα έκδοση για να ολοκληρώσει την αλλαγή');
      child = require('child_process').spawn(path.join(newPath, exeName), ['--homeflow-finish-update', arg], { detached: true, stdio: 'ignore', cwd: newPath });
    } else {
      const h = upd.helperScript(process.platform, { pid: process.pid, appPath: target.appPath, newPath, workDir: work, exeName, logFile });
      const script = path.join(app.getPath('temp'), h.name);
      fs.writeFileSync(script, h.content, 'utf8');
      fs.chmodSync(script, 0o755);
      child = require('child_process').spawn(h.cmd, h.args(script), { detached: true, stdio: 'ignore' });
    }
    child.on('error', e => updLog('ΣΦΑΛΜΑ στο ξεκίνημα της ολοκλήρωσης: ' + e.message));
    child.unref();
    send('restarting', { version });
    setTimeout(() => app.quit(), 600);
    return { ok: true };
  } catch (e) {
    installing = false;
    updLog('ΣΦΑΛΜΑ: ' + (e && e.stack || e));
    try { ofs.rmSync(work, RM); } catch { /* τίποτα */ }
    send('install-error', { version, message: e.message, url: pending.url });
    return { ok: false, error: e.message };
  }
});
// Μετά από ενημέρωση: ποια ήταν η προηγούμενη έκδοση (για το μήνυμα «Ενημερώθηκε»)
ipcMain.handle('update:openLog', () => { if (!fs.existsSync(updLogFile())) updLog(`έκδοση ${app.getVersion()}: δεν έχει γίνει ακόμα καμία ενημέρωση`); shell.openPath(updLogFile()); return { ok: true }; });
ipcMain.handle('update:justUpdated', () => {
  const cfg = readConfig();
  if (!cfg.updatedFrom) return null;
  const from = cfg.updatedFrom; delete cfg.updatedFrom; writeConfig(cfg);
  return from !== app.getVersion() ? { from, to: app.getVersion() } : { failed: true, from };
});
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) return { status: 'dev' };
  checkUpdates();
  return { status: 'checking' };
});

// ---------- εκκίνηση ----------
if (FINISH) {
  // Λειτουργία «ολοκλήρωση ενημέρωσης»: χωρίς παράθυρο, κάνει την αλλαγή και κλείνει.
  const log = m => { try { fs.appendFileSync(FINISH.logFile, `${new Date().toISOString().slice(0, 19)} [${app.getVersion()}] ${m}\n`, 'utf8'); } catch { /* τίποτα */ } };
  const launch = p => { try { require('child_process').spawn(p, [], { detached: true, stdio: 'ignore', cwd: path.dirname(p) }).unref(); log('άνοιξε: ' + p); } catch (e) { log('δεν άνοιξε: ' + e.message); } };
  app.whenReady().then(() => upd.finishUpdate(FINISH, { log, launch })).catch(e => log('ΣΦΑΛΜΑ: ' + e.message)).finally(() => app.exit(0));
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    createWindow();
    setupUpdates();
  });
  app.on('window-all-closed', () => app.quit());
}
