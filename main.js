const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 900,
    minWidth: 400,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
