const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const BlogDatabase = require('./database');
const FeedFetcher = require('./feedFetcher');
// const CopilotService = require('./copilotService'); // ES module not compatible with CommonJS

let mainWindow;
let db;
let feedFetcher;
// let copilot; // Disabled until SDK CommonJS support

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile('index.html');

  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('Window crashed, killed:', killed);
  });

  mainWindow.on('unresponsive', () => {
    console.error('Window became unresponsive');
  });
}

app.on('ready', async () => {
  db = new BlogDatabase();
  await db.init();
  
  feedFetcher = new FeedFetcher(db);
  
  createWindow();
  
  // Disable automatic feed fetch - use manual refresh button instead
  // setTimeout(async () => {
  //   try {
  //     await feedFetcher.fetchAndStorePosts();
  //     mainWindow?.webContents.send('feed-updated');
  //   } catch (error) {
  //     console.error('Failed to fetch posts on startup:', error);
  //   }
  // }, 2000);
  
  // Initialize Copilot
  // copilot = new CopilotService(db);
  // try {
  //   await copilot.init();
  //   console.log('Copilot SDK initialized');
  // } catch (error) {
  //   console.error('Failed to initialize Copilot:', error);
  // }

  // IPC handlers for database operations
  ipcMain.handle('get-articles', async () => {
    return db.getAllArticles();
  });

  ipcMain.handle('get-article', async (event, slug) => {
    return db.getArticleBySlug(slug);
  });

  ipcMain.handle('search-articles', async (event, query) => {
    return db.searchArticles(query);
  });

  ipcMain.handle('refresh-feed', async () => {
    try {
      return await feedFetcher.fetchAndStorePosts();
    } catch (error) {
      console.error('Failed to refresh feed:', error);
      throw error;
    }
  });

  ipcMain.handle('copilot-chat', async (event, message) => {
    // Temporary mock response until SDK is properly configured
    return {
      message: `I'm the AI assistant. You asked: "${message}"\n\nI can help you search articles, find content by category, and answer questions about the blog. (Copilot SDK integration in progress)`
    };
  });

  ipcMain.handle('navigate-to-article', async (event, slug) => {
    mainWindow.loadFile('article.html', { query: { slug } });
  });

  ipcMain.handle('navigate-home', async () => {
    mainWindow.loadFile('index.html');
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed - NOT quitting on macOS');
  // Don't quit on macOS - keep app in dock
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  console.log('App activated');
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('App is quitting');
});

app.on('will-quit', () => {
  console.log('App will quit');
});
