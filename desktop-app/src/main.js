const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const OBSWebSocket = require('obs-websocket-js').default;

const obs = new OBSWebSocket();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset', // Pour un look premium sans bordure standard
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, // IMPORTANT: permet l'utilisation de <webview> dans React
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // En développement, on pointe sur le serveur Next.js directement sur la partie admin
  const devUrl = 'http://localhost:3000/admin';
  mainWindow.loadURL(devUrl);

  // Gérer les popups (ex: Google OAuth pour Claude/ChatGPT)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 600,
        height: 800,
        titleBarStyle: 'default',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      }
    };
  });

  // Changer le User-Agent globalement pour tromper Google OAuth qui bloque souvent les navigateurs "embarqués"
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Supprimer les restrictions d'iframes et CSP pour permettre l'affichage de sites tiers dans les webviews
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const newHeaders = Object.assign({}, details.responseHeaders);
    
    // Supprime la restriction de frame pour permettre l'incrustation
    delete newHeaders['X-Frame-Options'];
    delete newHeaders['x-frame-options'];
    
    // Modifie la politique de sécurité pour éviter les blocages de webview
    if (newHeaders['Content-Security-Policy'] || newHeaders['content-security-policy']) {
      delete newHeaders['Content-Security-Policy'];
      delete newHeaders['content-security-policy'];
    }

    callback({
      cancel: false,
      responseHeaders: newHeaders
    });
  });

  // Ouvre les DevTools pour le débogage
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// IPC (Communication React <-> Electron)
// ==========================================

// OBS: Connexion
ipcMain.handle('obs-connect', async (event, { url, password }) => {
  try {
    const { obsWebSocketVersion, negotiatedRpcVersion } = await obs.connect(url, password);
    console.log(`Connected to OBS (version ${obsWebSocketVersion})`);
    return { success: true };
  } catch (error) {
    console.error('Failed to connect to OBS:', error.message);
    return { success: false, error: error.message };
  }
});

// OBS: Obtenir les scènes
ipcMain.handle('obs-get-scenes', async () => {
  try {
    const data = await obs.call('GetSceneList');
    return { success: true, scenes: data.scenes, currentScene: data.currentProgramSceneName };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Changer de scène (Program)
ipcMain.handle('obs-set-scene', async (event, sceneName) => {
  try {
    await obs.call('SetCurrentProgramScene', { sceneName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Changer de scène (Preview)
ipcMain.handle('obs-set-preview-scene', async (event, sceneName) => {
  try {
    await obs.call('SetCurrentPreviewScene', { sceneName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Transition (Preview -> Program)
ipcMain.handle('obs-trigger-transition', async () => {
  try {
    await obs.call('TriggerStudioModeTransition');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Record Status
ipcMain.handle('obs-get-record-status', async () => {
  try {
    const data = await obs.call('GetRecordStatus');
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('obs-toggle-record', async () => {
  try {
    await obs.call('ToggleRecord');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Stream Status
ipcMain.handle('obs-get-stream-status', async () => {
  try {
    const data = await obs.call('GetStreamStatus');
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('obs-toggle-stream', async () => {
  try {
    await obs.call('ToggleStream');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Obtenir les éléments d'une scène (Sources)
ipcMain.handle('obs-get-scene-items', async (event, sceneName) => {
  try {
    const data = await obs.call('GetSceneItemList', { sceneName });
    return { success: true, items: data.sceneItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Afficher/Masquer une source
ipcMain.handle('obs-set-scene-item-enabled', async (event, { sceneName, sceneItemId, sceneItemEnabled }) => {
  try {
    await obs.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// OBS: Capture d'écran (Moniteur Vidéo)
ipcMain.handle('obs-get-source-screenshot', async (event, { sourceName, imageFormat = 'jpeg', imageWidth = 480 }) => {
  try {
    const data = await obs.call('GetSourceScreenshot', {
      sourceName,
      imageFormat,
      imageWidth,
      imageCompressionQuality: 50 // Qualité réduite pour plus de fluidité
    });
    return { success: true, imageData: data.imageData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==========================================
// Phase 2: Édition (Scènes & Sources)
// ==========================================

ipcMain.handle('obs-create-scene', async (event, sceneName) => {
  try {
    await obs.call('CreateScene', { sceneName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('obs-remove-scene', async (event, sceneName) => {
  try {
    await obs.call('RemoveScene', { sceneName });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Ajoute une source Web (Browser Source) à la scène
ipcMain.handle('obs-create-browser-input', async (event, { sceneName, inputName, inputUrl }) => {
  try {
    await obs.call('CreateInput', {
      sceneName,
      inputName,
      inputKind: 'browser_source',
      inputSettings: {
        url: inputUrl,
        width: 1920,
        height: 1080
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Supprime une source de la scène
ipcMain.handle('obs-remove-scene-item', async (event, { sceneName, sceneItemId }) => {
  try {
    await obs.call('RemoveSceneItem', { sceneName, sceneItemId });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// vMix: Placeholder pour futures commandes HTTP
ipcMain.handle('vmix-command', async (event, commandStr) => {
  // TODO: call vMix HTTP API
  return { success: true };
});
