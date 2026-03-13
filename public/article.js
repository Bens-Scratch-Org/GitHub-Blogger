// Use Tauri invoke when available
const invoke = window.__TAURI__?.core?.invoke || window.__TAURI_INVOKE__;

// Get article slug from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const articleSlug = urlParams.get('slug');

// Load and display the article
async function loadArticle() {
  if (!articleSlug) {
    document.querySelector('.article-full').innerHTML = '<p>Article not found</p>';
    return;
  }

  try {
    const article = await invoke('get_article', { slug: articleSlug });
    
    if (!article) {
      document.querySelector('.article-full').innerHTML = '<p>Article not found</p>';
      return;
    }

    // Populate article content
    document.getElementById('article-category').textContent = article.category || 'General';
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-author').textContent = article.author;
    document.getElementById('article-date').textContent = formatDate(article.published_date);
    document.getElementById('article-content').innerHTML = formatContent(article.content);
    document.title = `${article.title} - GitHub Blogger`;

  } catch (error) {
    console.error('Error loading article:', error);
    document.querySelector('.article-full').innerHTML = '<p>Error loading article</p>';
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Format content with HTML rendering including images
function formatContent(content) {
  // Content already includes HTML from RSS feed
  // Sanitize while preserving images, links, and basic formatting
  return content;
}

// Theme toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.textContent = theme === 'light' ? '🌙' : '☀️';
    btn.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadArticle();

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Add home navigation
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/index.html';
    });
  }
});
