// Use Tauri invoke when available, fall back to fetch for browser-only testing
const invoke = window.__TAURI__?.core?.invoke || window.__TAURI_INVOKE__;

// ── View switching ────────────────────────────────────────────────────────────

function showListView() {
  document.getElementById('view-list').style.display = '';
  document.getElementById('view-article').style.display = 'none';
  setActiveTimeline(null);
  document.title = 'GitHub Blogger';
}

function showArticleView() {
  document.getElementById('view-list').style.display = 'none';
  document.getElementById('view-article').style.display = '';
}

// ── Timeline ──────────────────────────────────────────────────────────────────

// Render the timeline sidebar (sorted newest-first, never filtered)
function renderTimeline(articles) {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;

  if (!articles || articles.length === 0) {
    timeline.innerHTML = '<p style="padding:12px 16px;font-size:13px;color:var(--color-text-secondary);">No articles yet.</p>';
    return;
  }

  const sorted = [...articles].sort((a, b) => new Date(b.published_date) - new Date(a.published_date));

  timeline.innerHTML = sorted.map(article => `
    <div class="timeline-item" data-slug="${article.slug}">
      <a href="#" data-slug="${article.slug}">
        <span class="timeline-item-date">${formatDateShort(article.published_date)}</span>
        <span class="timeline-item-title">${article.title}</span>
      </a>
    </div>
  `).join('');

  // Click → open article inline
  timeline.querySelectorAll('a[data-slug]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      viewArticle(link.dataset.slug);
    });
  });
}

// Highlight the active timeline item (pass null to clear)
function setActiveTimeline(slug) {
  document.querySelectorAll('#timeline .timeline-item').forEach(item => {
    item.classList.toggle('active', item.dataset.slug === slug);
  });
}

// ── Articles list ─────────────────────────────────────────────────────────────

async function loadArticles() {
  try {
    const articles = await invoke('get_articles');
    renderArticles(articles);
    renderTimeline(articles);
  } catch (error) {
    console.error('Error loading articles:', error);
  }
}

function renderArticles(articles) {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  if (!articles || articles.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">No articles found. Click Refresh to fetch posts.</p>';
    return;
  }

  grid.innerHTML = articles.map(article => `
    <article class="article-card" data-slug="${article.slug}">
      <div class="article-image">
        ${article.image_url 
          ? `<img src="${article.image_url}" alt="${article.title}" loading="lazy">` 
          : '<div class="placeholder-image"></div>'}
      </div>
      <div class="article-content">
        <span class="article-tag">${article.category || 'General'}</span>
        <h2 class="article-title">${article.title}</h2>
        <p class="article-excerpt">${article.excerpt || ''}</p>
        <div class="article-meta">
          <span class="author">${article.author}</span>
          <span class="date">${formatDate(article.published_date)}</span>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => viewArticle(card.dataset.slug));
  });
}

// ── Article detail ────────────────────────────────────────────────────────────

async function viewArticle(slug) {
  try {
    const article = await invoke('get_article', { slug });
    if (!article) {
      console.error('Article not found:', slug);
      return;
    }

    document.getElementById('article-category').textContent = article.category || 'General';
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-author').textContent = article.author;
    document.getElementById('article-date').textContent = formatDate(article.published_date);
    document.getElementById('article-content').innerHTML = formatContent(article.content);
    document.title = `${article.title} - GitHub Blogger`;

    showArticleView();
    setActiveTimeline(slug);

    // Scroll the content area back to top
    document.querySelector('.content-area').scrollTop = 0;
  } catch (error) {
    console.error('Error loading article:', error);
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

async function searchArticles(query) {
  try {
    const results = await invoke('search_articles', { query });
    renderArticles(results);
    // Keep full timeline intact; only grid changes during search
  } catch (error) {
    console.error('Error searching articles:', error);
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateShort(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatContent(content) {
  // Content already includes HTML from RSS feed with images
  return content;
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadArticles();

  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => showListView());
  }

  // Search
  const searchInput = document.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value;
      if (q.length > 2) searchArticles(q);
      else if (q.length === 0) loadArticles();
    });
  }

  // Refresh
  const refreshBtn = document.querySelector('#refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '↻ Refreshing...';
      try {
        const result = await invoke('refresh_feed');
        await loadArticles();
        alert(`Feed refreshed! ${result.new_posts} new posts, ${result.updated_posts} updated posts`);
      } catch (error) {
        console.error('Error refreshing feed:', error);
        alert('Failed to refresh feed. Check console for details.');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Refresh';
      }
    });
  }
});

// ── AI Assistant Modal ────────────────────────────────────────────────────────

const aiModal = document.getElementById('ai-modal');
const aiBtn = document.getElementById('ai-assist-btn');
const modalClose = document.querySelector('.modal-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

if (aiBtn) {
  aiBtn.addEventListener('click', () => { aiModal.classList.add('active'); chatInput.focus(); });
}
if (modalClose) {
  modalClose.addEventListener('click', () => aiModal.classList.remove('active'));
}
aiModal?.addEventListener('click', e => { if (e.target === aiModal) aiModal.classList.remove('active'); });

async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  addChatMessage(message, 'user');
  chatInput.value = '';
  chatSend.disabled = true;
  try {
    addChatMessage('AI Assistant is not yet configured.', 'assistant');
  } finally {
    chatSend.disabled = false;
  }
}

function addChatMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `chat-message ${sender}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatSend) chatSend.addEventListener('click', sendChatMessage);
if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage(); });
