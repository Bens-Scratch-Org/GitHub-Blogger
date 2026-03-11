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
  try {
    const article = await window.blogAPI.getArticle(slug);
    if (article) {
      alert(`Article: ${article.title}\n\n${article.content}`);
      // TODO: Create a proper article view page
    }
  } catch (error) {
    console.error('Error loading article:', error);
  }
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
