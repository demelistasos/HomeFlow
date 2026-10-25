// HomeFlow – κύρια διεργασία Electron
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

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

// ---------- παράθυρο ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1000,
    minHeight: 680,
    title: 'HomeFlow',
    backgroundColor: '#f6f4ef',
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
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
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
