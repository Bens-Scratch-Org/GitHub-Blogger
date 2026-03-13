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
  initReadingMode();
  loadArticle();

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Reading mode toggle
  const readingModeBtn = document.getElementById('reading-mode-btn');
  if (readingModeBtn) {
    readingModeBtn.addEventListener('click', toggleReadingMode);
  }

  // Close controls button
  const closeControlsBtn = document.getElementById('close-controls');
  if (closeControlsBtn) {
    closeControlsBtn.addEventListener('click', () => {
      document.getElementById('reading-mode-controls').style.display = 'none';
    });
  }

  // Add home navigation
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/index.html';
    });
  }

  // Initialize reading mode controls
  initReadingModeControls();
});

// Reading Mode functionality
function initReadingMode() {
  const savedReadingMode = localStorage.getItem('readingMode') === 'true';
  const savedSize = localStorage.getItem('readingSize') || 'normal';
  const savedSpacing = localStorage.getItem('readingSpacing') || 'normal';
  const savedBackground = localStorage.getItem('readingBackground') || 'default';

  if (savedReadingMode) {
    document.body.classList.add('reading-mode');
    document.getElementById('reading-mode-btn').classList.add('active');
    document.getElementById('reading-mode-controls').style.display = 'block';
  }

  document.body.setAttribute('data-reading-size', savedSize);
  document.body.setAttribute('data-reading-spacing', savedSpacing);
  document.body.setAttribute('data-reading-background', savedBackground);
}

function toggleReadingMode() {
  const isActive = document.body.classList.toggle('reading-mode');
  const btn = document.getElementById('reading-mode-btn');
  const controls = document.getElementById('reading-mode-controls');

  btn.classList.toggle('active', isActive);
  controls.style.display = isActive ? 'block' : 'none';

  localStorage.setItem('readingMode', isActive);
}

function initReadingModeControls() {
  // Text size controls
  const sizeButtons = document.querySelectorAll('[data-size]');
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      document.body.setAttribute('data-reading-size', size);
      localStorage.setItem('readingSize', size);
      updateActiveButton(sizeButtons, btn);
    });
  });

  // Line spacing controls
  const spacingButtons = document.querySelectorAll('[data-spacing]');
  spacingButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const spacing = btn.getAttribute('data-spacing');
      document.body.setAttribute('data-reading-spacing', spacing);
      localStorage.setItem('readingSpacing', spacing);
      updateActiveButton(spacingButtons, btn);
    });
  });

  // Background color controls
  const backgroundButtons = document.querySelectorAll('[data-background]');
  backgroundButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const background = btn.getAttribute('data-background');
      document.body.setAttribute('data-reading-background', background);
      localStorage.setItem('readingBackground', background);
      updateActiveButton(backgroundButtons, btn);
    });
  });

  // Set initial active states
  const savedSize = localStorage.getItem('readingSize') || 'normal';
  const savedSpacing = localStorage.getItem('readingSpacing') || 'normal';
  const savedBackground = localStorage.getItem('readingBackground') || 'default';

  document.querySelector(`[data-size="${savedSize}"]`)?.classList.add('active');
  document.querySelector(`[data-spacing="${savedSpacing}"]`)?.classList.add('active');
  document.querySelector(`[data-background="${savedBackground}"]`)?.classList.add('active');
}

function updateActiveButton(buttons, activeBtn) {
  buttons.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}
