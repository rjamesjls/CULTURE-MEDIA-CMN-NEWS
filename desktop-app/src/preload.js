const { contextBridge, ipcRenderer } = require('electron');

// Expose une API sécurisée au processus de rendu (React/Next.js)
contextBridge.exposeInMainWorld('cmnOS', {
  // === OBS API ===
  obsConnect: (config) => ipcRenderer.invoke('obs-connect', config),
  obsGetScenes: () => ipcRenderer.invoke('obs-get-scenes'),
  obsSetScene: (sceneName) => ipcRenderer.invoke('obs-set-scene', sceneName),
  obsSetPreviewScene: (sceneName) => ipcRenderer.invoke('obs-set-preview-scene', sceneName),
  obsTriggerTransition: () => ipcRenderer.invoke('obs-trigger-transition'),
  obsGetRecordStatus: () => ipcRenderer.invoke('obs-get-record-status'),
  obsToggleRecord: () => ipcRenderer.invoke('obs-toggle-record'),
  obsGetStreamStatus: () => ipcRenderer.invoke('obs-get-stream-status'),
  obsToggleStream: () => ipcRenderer.invoke('obs-toggle-stream'),
  obsGetSceneItems: (sceneName) => ipcRenderer.invoke('obs-get-scene-items', sceneName),
  obsSetSceneItemEnabled: (config) => ipcRenderer.invoke('obs-set-scene-item-enabled', config),
  obsGetSourceScreenshot: (config) => ipcRenderer.invoke('obs-get-source-screenshot', config),

  // === OBS Phase 2 API ===
  obsCreateScene: (sceneName) => ipcRenderer.invoke('obs-create-scene', sceneName),
  obsRemoveScene: (sceneName) => ipcRenderer.invoke('obs-remove-scene', sceneName),
  obsCreateBrowserInput: (config) => ipcRenderer.invoke('obs-create-browser-input', config),
  obsRemoveSceneItem: (config) => ipcRenderer.invoke('obs-remove-scene-item', config),
  
  // === vMix API ===
  vmixCommand: (command) => ipcRenderer.invoke('vmix-command', command),

  // Utilitaires système (si nécessaire plus tard)
  platform: process.platform
});
