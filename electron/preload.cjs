const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexus', {
  memories: {
    list: () => ipcRenderer.invoke('memory:list'),
    save: (memory) => ipcRenderer.invoke('memory:save', memory),
    remove: (id) => ipcRenderer.invoke('memory:delete', id),
    clear: () => ipcRenderer.invoke('memory:clear'),
    export: (memories) => ipcRenderer.invoke('memory:export', memories),
    import: () => ipcRenderer.invoke('memory:import')
  },
  system: {
    info: () => ipcRenderer.invoke('system:info')
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
