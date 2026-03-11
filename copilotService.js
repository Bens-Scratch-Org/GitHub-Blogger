const { Agent } = require('@github/copilot-sdk');

class CopilotService {
  constructor(database) {
    this.db = database;
    this.agent = null;
  }

  async init() {
    // Initialize the Copilot agent
    this.agent = new Agent({
      name: 'github-blogger-assistant',
      description: 'AI assistant for managing and searching blog content',
      tools: this.getTools()
    });
  }

  getTools() {
    return [
      {
        name: 'search_articles',
        description: 'Search for articles in the blog database',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find articles'
            }
          },
          required: ['query']
        },
        execute: async ({ query }) => {
          const results = this.db.searchArticles(query);
          return {
            results: results.map(a => ({
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt,
              author: a.author,
              category: a.category
            }))
          };
        }
      },
      {
        name: 'get_article_content',
        description: 'Get the full content of a specific article',
        parameters: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'The slug/identifier of the article'
            }
          },
          required: ['slug']
        },
        execute: async ({ slug }) => {
          const article = this.db.getArticleBySlug(slug);
          return article || { error: 'Article not found' };
        }
      },
      {
        name: 'list_categories',
        description: 'List all article categories',
        parameters: {
          type: 'object',
          properties: {}
        },
        execute: async () => {
          const articles = this.db.getAllArticles();
          const categories = [...new Set(articles.map(a => a.category))];
          return { categories };
        }
      },
      {
        name: 'get_articles_by_category',
        description: 'Get articles filtered by category',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'The category to filter by'
            }
          },
          required: ['category']
        },
        execute: async ({ category }) => {
          const articles = this.db.getAllArticles();
          const filtered = articles.filter(a => a.category === category);
          return {
            articles: filtered.map(a => ({
              title: a.title,
              slug: a.slug,
              excerpt: a.excerpt,
              author: a.author
            }))
          };
        }
      }
    ];
  }

  async chat(userMessage) {
    if (!this.agent) {
      throw new Error('Copilot agent not initialized');
    }

    try {
      const response = await this.agent.run(userMessage);
      return response;
    } catch (error) {
      console.error('Copilot chat error:', error);
      throw error;
    }
  }
}

module.exports = CopilotService;
