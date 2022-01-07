import { app, ipcMain, ipcRenderer } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { createWindow } from './helpers';

// require('@electron/remote/main').initialize()
// require("@electron/remote/main").enable(webContents)

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app'  });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 855,
    height: 555,
    frame: false,
    resizable: false,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
    }
  });

  mainWindow.setMenuBarVisibility(false);
  app.setUserTasks([])
  
  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    // mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});
