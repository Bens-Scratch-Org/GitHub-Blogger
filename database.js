const { JSONFilePreset } = require('lowdb/node');
const path = require('path');
const { app } = require('electron');

class BlogDatabase {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'blog.json');
    this.db = null;
  }

  async init() {
    const defaultData = {
      articles: [],
      comments: [],
      categories: []
    };

    this.db = await JSONFilePreset(this.dbPath, defaultData);
  }

  // Article CRUD operations
  getAllArticles() {
    return this.db.data.articles
      .filter(a => a.status === 'published')
      .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
  }

  getArticleBySlug(slug) {
    return this.db.data.articles.find(a => a.slug === slug);
  }

  async createArticle(article) {
    const newId = Math.max(...this.db.data.articles.map(a => a.id), 0) + 1;
    const newArticle = {
      id: newId,
      ...article,
      status: article.status || 'draft',
      views: 0,
      created_at: new Date().toISOString()
    };
    this.db.data.articles.push(newArticle);
    await this.db.write();
    return newArticle;
  }

  async updateArticle(id, article) {
    const index = this.db.data.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      this.db.data.articles[index] = {
        ...this.db.data.articles[index],
        ...article,
        updated_date: new Date().toISOString()
      };
      await this.db.write();
      return this.db.data.articles[index];
    }
    return null;
  }

  async deleteArticle(id) {
    const index = this.db.data.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      this.db.data.articles.splice(index, 1);
      await this.db.write();
      return true;
    }
    return false;
  }

  // Comment operations
  getCommentsByArticle(articleId) {
    return this.db.data.comments
      .filter(c => c.article_id === articleId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async addComment(comment) {
    const newId = Math.max(...this.db.data.comments.map(c => c.id), 0) + 1;
    const newComment = {
      id: newId,
      ...comment,
      created_at: new Date().toISOString()
    };
    this.db.data.comments.push(newComment);
    await this.db.write();
    return newComment;
  }

  // Search
  searchArticles(query) {
    const lowerQuery = query.toLowerCase();
    return this.db.data.articles
      .filter(a => 
        a.status === 'published' && (
          a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(lowerQuery))
        )
      )
      .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
  }
}

module.exports = BlogDatabase;
