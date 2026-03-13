const axios = require('axios');
const xml2js = require('xml2js');

class FeedFetcher {
  constructor(database) {
    this.db = database;
    this.feedUrl = 'https://github.blog/feed/';
  }

  async fetchAndStorePosts() {
    try {
      console.log('Fetching GitHub blog posts...');
      
      const response = await axios.get(this.feedUrl, {
        headers: {
          'User-Agent': 'GitHub-Blogger-App'
        }
      });
      const xmlData = response.data;
      
      const parser = new xml2js.Parser({
        explicitArray: false,
        tagNameProcessors: [xml2js.processors.stripPrefix],
        attrNameProcessors: [xml2js.processors.stripPrefix]
      });
      const result = await parser.parseStringPromise(xmlData);
      
      console.log('Feed parsed successfully');
      
      if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
        console.log('No entries found in feed');
        console.log('Result keys:', Object.keys(result));
        return { newPosts: 0, updatedPosts: 0 };
      }

      const entries = Array.isArray(result.rss.channel.item) 
        ? result.rss.channel.item.slice(0, 20) 
        : [result.rss.channel.item];
      
      let newPosts = 0;
      let updatedPosts = 0;

      for (const entry of entries) {
        const slug = this.generateSlug(entry.title);
        const existingArticle = this.db.getArticleBySlug(slug);

        const articleData = {
          title: entry.title,
          slug: slug,
          content: this.extractContent(entry),
          excerpt: this.extractExcerpt(entry),
          author: this.extractAuthor(entry),
          category: this.extractCategory(entry),
          tags: this.extractTags(entry),
          image_url: this.extractFeaturedImage(entry),
          published_date: entry.pubdate || entry.pubDate || new Date().toISOString(),
          status: 'published'
        };

        if (existingArticle) {
          // Check if content has actually changed before updating
          if (existingArticle.content !== articleData.content) {
            await this.db.updateArticle(existingArticle.id, articleData);
            updatedPosts++;
          }
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
    if (!this.db.db || !this.db.db.data || !this.db.db.data.articles) {
      console.log('Database not initialized properly');
      return;
    }
    
    const allArticles = [...this.db.db.data.articles]
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
    // RSS feed uses 'content:encoded' or 'description'
    // Keep HTML including images for proper content display
    if (entry['content:encoded']) {
      return entry['content:encoded'];
    }
    if (entry.description) {
      return entry.description;
    }
    return 'Content not available';
  }

  extractExcerpt(entry) {
    if (entry.description) {
      const summary = this.stripHtml(entry.description);
      return summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
    }
    const content = this.extractContent(entry);
    return content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

  extractAuthor(entry) {
    if (entry['dc:creator']) {
      return entry['dc:creator'];
    }
    if (entry.author) {
      return entry.author;
    }
    return 'GitHub';
  }

  extractCategory(entry) {
    if (entry.category) {
      if (Array.isArray(entry.category)) {
        return entry.category[0];
      }
      return entry.category;
    }
    return 'General';
  }

  extractTags(entry) {
    if (entry.category) {
      if (Array.isArray(entry.category)) {
        return entry.category.slice(0, 5);
      }
      return [entry.category];
    }
    return [];
  }

  extractFeaturedImage(entry) {
    // Try to extract featured image from various RSS fields
    // Check media:content
    if (entry['media:content'] && entry['media:content'].$.url) {
      return entry['media:content'].$.url;
    }
    
    // Check enclosure (common in RSS feeds)
    if (entry.enclosure && entry.enclosure.$ && entry.enclosure.$.url) {
      const url = entry.enclosure.$.url;
      // Check if it's an image
      if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return url;
      }
    }
    
    // Extract first image from content
    const content = entry['content:encoded'] || entry.description || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    
    return null;
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
