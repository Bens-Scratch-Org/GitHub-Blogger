const { app, BrowserWindow } = require('electron');

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  win.loadFile('index.html');
  
  win.on('closed', () => {
    console.log('Window closed normally');
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  app.quit();
});

process.on('exit', (code) => {
  console.log('Process exiting with code:', code);
});
