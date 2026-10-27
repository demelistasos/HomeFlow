// Γέφυρα ανάμεσα στο παράθυρο και τον υπολογιστή (μόνο συγκεκριμένες λειτουργίες)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('homeflow', {
  load: () => ipcRenderer.invoke('data:load'),
  save: text => ipcRenderer.invoke('data:save', text),
  info: () => ipcRenderer.invoke('data:info'),
  openFolder: () => ipcRenderer.invoke('data:openFolder'),
  chooseFolder: () => ipcRenderer.invoke('data:chooseFolder'),
  importFile: () => ipcRenderer.invoke('data:importFile'),
  saveAs: (text, defaultName, kind) => ipcRenderer.invoke('data:saveAs', { text, defaultName, kind }),
  print: () => ipcRenderer.invoke('app:print'),
  archiveMonth: (html, name) => ipcRenderer.invoke('report:archive', { html, name }),
  openMonthPdf: file => ipcRenderer.invoke('report:open', file),
  savePdf: (html, defaultName) => ipcRenderer.invoke('data:savePdf', { html, defaultName }),
  saveXlsx: (book, defaultName) => ipcRenderer.invoke('data:saveXlsx', { book, defaultName }),
  attAdd: title => ipcRenderer.invoke('att:add', title),
  attOpen: file => ipcRenderer.invoke('att:open', file),
  attRemove: file => ipcRenderer.invoke('att:remove', file),
  backupStatus: () => ipcRenderer.invoke('backup:status'),
  backupNow: kind => ipcRenderer.invoke('backup:now', kind),
  backupChoose: kind => ipcRenderer.invoke('backup:choose', kind),
  backupRemove: kind => ipcRenderer.invoke('backup:remove', kind),
  backupOpen: kind => ipcRenderer.invoke('backup:open', kind),
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  justUpdated: () => ipcRenderer.invoke('update:justUpdated'),
  onUpdate: cb => ipcRenderer.on('update:status', (_e, s) => cb(s))
});
