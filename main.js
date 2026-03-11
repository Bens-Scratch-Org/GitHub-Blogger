const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const BlogDatabase = require('./database');
const FeedFetcher = require('./feedFetcher');
const CopilotService = require('./copilotService');

let mainWindow;
let db;
let feedFetcher;
// let copilot; // Disabled until SDK CommonJS support

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  db = new BlogDatabase();
  await db.init();
  
  feedFetcher = new FeedFetcher(db);
  
  // Fetch posts on startup
  try {
    await feedFetcher.fetchAndStorePosts();
  } catch (error) {
    console.error('Failed to fetch posts on startup:', error);
  }
  
  // Initialize Copilot
  // copilot = new CopilotService(db);
  // try {
  //   await copilot.init();
  //   console.log('Copilot SDK initialized');
  // } catch (error) {
  //   console.error('Failed to initialize Copilot:', error);
  // }
  
  createWindow();

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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
