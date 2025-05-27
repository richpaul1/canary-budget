const { app, BrowserWindow, ipcMain } = require('electron');
const windowStateKeeper = require('electron-window-state');
const serve = require('electron-serve').default; // This 'serve' IS the function to set up the handler
const path = require('path');

try {
  require('electron-reloader')(module, {
    electron: require.resolve('electron')
  });
}
catch (error) {
  console.error('Error during electron-reloader initialization:', error);
}

// Correct usage: Call 'serve' once to configure it and get the actual load function.
// If your SvelteKit build output is in 'dist', use 'dist'.
console.log('electron-serve:', serve);
const loadProductionURL = serve({ directory: 'build/prerendered/client' });

// You had a redundant and incorrectly used `serveUrl` here. Remove or correct it.
// const serveUrl = serve({ directory: '.' }); // THIS IS THE PROBLEM LINE
// console.log('Serve URL:', serveUrl);

const port = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

function createWindow () {
  let windowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  });

  mainWindow = new BrowserWindow({
    backgroundColor: '#ffffff',
    title: 'Canary Budget',
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Be cautious with nodeIntegration: true and contextIsolation: true. Usually, it's one or the other, or contextIsolation + preload.
      contextIsolation: true, // This is good for security
      enableRemoteModule: true, // Deprecated and insecure. Avoid if possible.
      spellcheck: false,
      devTools: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
  });
  windowState.manage(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', () => {
    windowState.saveState(mainWindow);
  });

  return mainWindow;
}

function loadVite(port){
  console.log('Loading Vite at port:', port);
  mainWindow.loadURL(`http://localhost:${port}`).catch((error) => {
      console.error('Failed to load Vite URL:', error);
    setTimeout(() => {
        loadVite(port)
    }, 200);
  });
}

async function createMainWindow() { // Make this async because loadProductionURL is async
  if (mainWindow) {
    mainWindow.close();
  }
  mainWindow = createWindow();
  if (isDev) {
    loadVite(port);
  } else {
    // Correct usage: Await the call to loadProductionURL
    await loadProductionURL(mainWindow); // This is where you use the function returned by serve
  }
}

app.once('ready',createMainWindow)
app.on('activate', () => {
  if (mainWindow === null || mainWindow.isDestroyed()) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
ipcMain.on('reload-window', () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});
ipcMain.on('to-main', (event,count) => {
  return mainWindow.webContents.send('from-main', `next count is ${count+1}`);
});