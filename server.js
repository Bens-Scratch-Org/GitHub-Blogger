const express = require('express');
const path = require('path');
const BlogDatabase = require('./database-node');
const FeedFetcher = require('./feedFetcher-node');

const app = express();
const PORT = process.env.PORT || 3000;

let db;
let feedFetcher;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
async function init() {
  db = new BlogDatabase();
  await db.init();
  feedFetcher = new FeedFetcher(db);
  
  console.log('Database initialized');
}

// API Routes
app.get('/api/articles', (req, res) => {
  try {
    const articles = db.getAllArticles();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/:slug', (req, res) => {
  try {
    const article = db.getArticleBySlug(req.params.slug);
    if (article) {
      res.json(article);
    } else {
      res.status(404).json({ error: 'Article not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const results = db.searchArticles(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    const result = await feedFetcher.fetchAndStorePosts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/article', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'article.html'));
});

// Start server
init().then(() => {
  app.listen(PORT, () => {
    console.log(`GitHub Blogger running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize:', err);
  process.exit(1);
});
