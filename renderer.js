// Load articles from database
async function loadArticles() {
  try {
    const articles = await window.blogAPI.getArticles();
    renderArticles(articles);
  } catch (error) {
    console.error('Error loading articles:', error);
  }
}

// Render articles to the grid
function renderArticles(articles) {
  const articlesGrid = document.querySelector('.articles-grid');
  
  if (!articles || articles.length === 0) {
    articlesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No articles found.</p>';
    return;
  }

  articlesGrid.innerHTML = articles.map(article => `
    <article class="article-card" data-slug="${article.slug}">
      <div class="article-image">
        <div class="placeholder-image"></div>
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

  // Add click handlers
  document.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.dataset.slug;
      viewArticle(slug);
    });
  });
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

// View single article
async function viewArticle(slug) {
  window.location.href = `article.html?slug=${slug}`;
}

// Search functionality
async function searchArticles(query) {
  try {
    const results = await window.blogAPI.searchArticles(query);
    renderArticles(results);
  } catch (error) {
    console.error('Error searching articles:', error);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
  
  // Add search functionality if search input exists
  const searchInput = document.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query.length > 2) {
        searchArticles(query);
      } else if (query.length === 0) {
        loadArticles();
      }
    });
  }

  // Add refresh button handler
  const refreshBtn = document.querySelector('#refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '↻ Refreshing...';
      try {
        const result = await window.blogAPI.refreshFeed();
        await loadArticles();
        alert(`Feed refreshed! ${result.newPosts} new posts, ${result.updatedPosts} updated posts`);
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

// AI Assistant Modal
const aiModal = document.getElementById('ai-modal');
const aiBtn = document.getElementById('ai-assist-btn');
const modalClose = document.querySelector('.modal-close');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

if (aiBtn) {
  aiBtn.addEventListener('click', () => {
    aiModal.classList.add('active');
    chatInput.focus();
  });
}

if (modalClose) {
  modalClose.addEventListener('click', () => {
    aiModal.classList.remove('active');
  });
}

// Close modal on outside click
aiModal?.addEventListener('click', (e) => {
  if (e.target === aiModal) {
    aiModal.classList.remove('active');
  }
});

// Send chat message
async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message
  addChatMessage(message, 'user');
  chatInput.value = '';
  chatSend.disabled = true;

  try {
    const response = await window.blogAPI.copilotChat(message);
    addChatMessage(response.message || 'No response', 'assistant');
  } catch (error) {
    console.error('Chat error:', error);
    addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
  } finally {
    chatSend.disabled = false;
  }
}

function addChatMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatSend) {
  chatSend.addEventListener('click', sendChatMessage);
}

if (chatInput) {
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}
