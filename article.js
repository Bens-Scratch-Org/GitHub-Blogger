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
    const article = await window.blogAPI.getArticle(articleSlug);
    
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

// Format content with basic HTML rendering
function formatContent(content) {
  // Convert line breaks to paragraphs
  return content
    .split('\n\n')
    .map(para => `<p>${para.trim()}</p>`)
    .join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadArticle();

  // Add home navigation
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await window.blogAPI.navigateHome();
    });
  }
});
