const fetch = require('node-fetch');
const xml2js = require('xml2js');

class FeedFetcher {
  constructor(database) {
    this.db = database;
    this.feedUrl = 'https://github.com/blog.atom';
  }

  async fetchAndStorePosts() {
    try {
      console.log('Fetching GitHub blog posts...');
      
      const response = await fetch(this.feedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const xmlData = await response.text();
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      if (!result.feed || !result.feed.entry) {
        console.log('No entries found in feed');
        return;
      }

      const entries = result.feed.entry.slice(0, 20); // Get last 20 posts
      let newPosts = 0;
      let updatedPosts = 0;

      for (const entry of entries) {
        const slug = this.generateSlug(entry.title[0]);
        const existingArticle = this.db.getArticleBySlug(slug);

        const articleData = {
          title: entry.title[0],
          slug: slug,
          content: this.extractContent(entry),
          excerpt: this.extractExcerpt(entry),
          author: this.extractAuthor(entry),
          category: this.extractCategory(entry),
          tags: this.extractTags(entry),
          published_date: entry.published ? entry.published[0] : new Date().toISOString(),
          status: 'published'
        };

        if (existingArticle) {
          // Append new content to existing
          const updatedContent = existingArticle.content + '\n\n--- Updated ---\n\n' + articleData.content;
          await this.db.updateArticle(existingArticle.id, {
            ...articleData,
            content: updatedContent
          });
          updatedPosts++;
        } else {
          // Create new article
          await this.db.createArticle(articleData);
          newPosts++;
        }
      }

      // Maintain rolling 100 posts
      await this.maintainPostLimit(100);

      console.log(`Fetch complete: ${newPosts} new posts, ${updatedPosts} updated posts`);
      return { newPosts, updatedPosts };

    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  async maintainPostLimit(maxPosts) {
    const allArticles = this.db.data.articles
      .sort((a, b) => new Date(b.published_date) - new Date(a.published_date));

    if (allArticles.length > maxPosts) {
      const articlesToRemove = allArticles.slice(maxPosts);
      for (const article of articlesToRemove) {
        await this.db.deleteArticle(article.id);
      }
      console.log(`Removed ${articlesToRemove.length} old posts to maintain limit of ${maxPosts}`);
    }
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  extractContent(entry) {
    if (entry.content && entry.content[0] && entry.content[0]._) {
      return this.stripHtml(entry.content[0]._);
    }
    if (entry.summary && entry.summary[0]) {
      return this.stripHtml(entry.summary[0]);
    }
    return 'Content not available';
  }

  extractExcerpt(entry) {
    if (entry.summary && entry.summary[0]) {
      const summary = this.stripHtml(entry.summary[0]);
      return summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
    }
    const content = this.extractContent(entry);
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  extractAuthor(entry) {
    if (entry.author && entry.author[0] && entry.author[0].name) {
      return entry.author[0].name[0];
    }
    return 'GitHub';
  }

  extractCategory(entry) {
    if (entry.category && entry.category[0] && entry.category[0].$.term) {
      return entry.category[0].$.term;
    }
    return 'General';
  }

  extractTags(entry) {
    if (entry.category && Array.isArray(entry.category)) {
      return entry.category.map(cat => cat.$.term).filter(Boolean);
    }
    return [];
  }

  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

module.exports = FeedFetcher;
