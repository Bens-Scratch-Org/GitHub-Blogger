const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class BlogDatabase {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'blog.db');
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    // Articles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        author TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        featured_image TEXT,
        published_date TEXT NOT NULL,
        updated_date TEXT,
        status TEXT DEFAULT 'draft',
        views INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        email TEXT,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
      )
    `);

    // Categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `);

    // Insert sample data
    this.seedSampleData();
  }

  seedSampleData() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM articles').get();
    if (count.count === 0) {
      const insert = this.db.prepare(`
        INSERT INTO articles (title, slug, content, excerpt, author, category, tags, published_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const articles = [
        {
          title: 'Building Modern Web Applications',
          slug: 'building-modern-web-applications',
          content: 'Full article content here...',
          excerpt: 'Explore the latest techniques and best practices for creating responsive, performant web applications.',
          author: 'John Doe',
          category: 'Engineering',
          tags: 'web,javascript,development',
          published_date: '2026-03-10',
          status: 'published'
        },
        {
          title: 'Designing for Accessibility',
          slug: 'designing-for-accessibility',
          content: 'Full article content here...',
          excerpt: 'Learn how to make your applications accessible to everyone with inclusive design principles.',
          author: 'Jane Smith',
          category: 'Product',
          tags: 'design,accessibility,ux',
          published_date: '2026-03-09',
          status: 'published'
        },
        {
          title: 'Securing Your Code',
          slug: 'securing-your-code',
          content: 'Full article content here...',
          excerpt: 'Best practices for keeping your codebase secure and protecting against vulnerabilities.',
          author: 'Alex Johnson',
          category: 'Security',
          tags: 'security,best-practices',
          published_date: '2026-03-08',
          status: 'published'
        }
      ];

      articles.forEach(article => {
        insert.run(
          article.title,
          article.slug,
          article.content,
          article.excerpt,
          article.author,
          article.category,
          article.tags,
          article.published_date,
          article.status
        );
      });
    }
  }

  // Article CRUD operations
  getAllArticles() {
    return this.db.prepare('SELECT * FROM articles WHERE status = ? ORDER BY published_date DESC').all('published');
  }

  getArticleBySlug(slug) {
    return this.db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);
  }

  createArticle(article) {
    const insert = this.db.prepare(`
      INSERT INTO articles (title, slug, content, excerpt, author, category, tags, published_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return insert.run(
      article.title,
      article.slug,
      article.content,
      article.excerpt,
      article.author,
      article.category,
      article.tags,
      article.published_date,
      article.status || 'draft'
    );
  }

  updateArticle(id, article) {
    const update = this.db.prepare(`
      UPDATE articles 
      SET title = ?, content = ?, excerpt = ?, author = ?, category = ?, tags = ?, updated_date = ?
      WHERE id = ?
    `);
    return update.run(
      article.title,
      article.content,
      article.excerpt,
      article.author,
      article.category,
      article.tags,
      new Date().toISOString(),
      id
    );
  }

  deleteArticle(id) {
    return this.db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  }

  // Comment operations
  getCommentsByArticle(articleId) {
    return this.db.prepare('SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC').all(articleId);
  }

  addComment(comment) {
    const insert = this.db.prepare(`
      INSERT INTO comments (article_id, author, email, content)
      VALUES (?, ?, ?, ?)
    `);
    return insert.run(comment.article_id, comment.author, comment.email, comment.content);
  }

  // Search
  searchArticles(query) {
    return this.db.prepare(`
      SELECT * FROM articles 
      WHERE status = 'published' AND (title LIKE ? OR content LIKE ? OR excerpt LIKE ?)
      ORDER BY published_date DESC
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  close() {
    this.db.close();
  }
}

module.exports = BlogDatabase;
