const { contextBridge, ipcRenderer } = require('electron');

// Expose database API to renderer process
contextBridge.exposeInMainWorld('blogAPI', {
  getArticles: () => ipcRenderer.invoke('get-articles'),
  getArticle: (slug) => ipcRenderer.invoke('get-article', slug),
  searchArticles: (query) => ipcRenderer.invoke('search-articles', query),
  refreshFeed: () => ipcRenderer.invoke('refresh-feed'),
  copilotChat: (message) => ipcRenderer.invoke('copilot-chat', message),
  navigateToArticle: (slug) => ipcRenderer.invoke('navigate-to-article', slug),
  navigateHome: () => ipcRenderer.invoke('navigate-home')
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('GitHub Blogger loaded');
});
