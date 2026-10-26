// HomeFlow – κύρια διεργασία Electron
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { buildXlsx } = require('./xlsx');

const DATA_FILE = 'homeflow-data.json';
const BACKUP_DIR = 'Αντίγραφα ασφαλείας';
const KEEP_BACKUPS = 60;

let win = null;

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
function atomicWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
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

ipcMain.handle('data:save', (_e, text) => {
  dailyBackup();
  atomicWrite(dataFile(), text);
  // δεύτερα αντίγραφα: αθόρυβα, όσα είναι διαθέσιμα τώρα
  for (const k of ['cloud', 'usb']) if (backupCfg()[k]) extraBackup(k, { quiet: true });
  return { ok: true, path: dataFile() };
});

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
// Δεν εγκαθίσταται τίποτα αυτόματα. Η εφαρμογή απλώς κοιτάει στο GitHub
// αν υπάρχει νεότερη έκδοση και δείχνει ειδοποίηση με κουμπί «Κατέβασμα».
// Κάθε έκδοση (tag "v0.1.N") έχει ένα zip για Windows και ένα για Mac.
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
      if (!best || newer(m[1], best.version)) best = { version: m[1], url: rel.html_url };
    }
    if (best && newer(best.version, app.getVersion())) send('manual', best);
    else send('latest');
  } catch (e) {
    send('error', { message: e.message });
  }
}
function setupUpdates() {
  if (!app.isPackaged) return;
  setTimeout(checkUpdates, 4000);
  setInterval(checkUpdates, 4 * 60 * 60 * 1000);
}
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) return { status: 'dev' };
  checkUpdates();
  return { status: 'checking' };
});

// ---------- εκκίνηση ----------
if (!app.requestSingleInstanceLock()) {
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
