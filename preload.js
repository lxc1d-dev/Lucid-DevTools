const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lucid', {
  platform: process.platform,
  copy: (text) => ipcRenderer.invoke('copy-text', text)
});
