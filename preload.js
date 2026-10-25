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
  checkUpdates: () => ipcRenderer.invoke('update:check'),
  onUpdate: cb => ipcRenderer.on('update:status', (_e, s) => cb(s))
});
