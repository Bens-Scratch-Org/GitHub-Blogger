# GitHub-Blogger

A modern blogging platform that fetches and displays content from GitHub's official blog (github.blog). Built as a hybrid application with both web and desktop interfaces using Node.js, Express, Tauri, and Rust.

## 🌟 Features

- 🔄 **Automatic Feed Sync** - Fetches latest posts from GitHub Blog RSS feed
- 🎨 **GitHub-Inspired Design** - Clean UI matching github.blog aesthetic
- 📱 **Responsive Layout** - Optimized for desktop, tablet, and mobile devices
- 🖥️ **Cross-Platform Desktop App** - Built with Tauri (Rust + WebView)
- 🌐 **Web Server** - Express-based API for article management
- 🔍 **Full-Text Search** - Search across all fetched articles
- 💾 **Local Database** - LowDB-based JSON storage for articles
- ⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub-Blogger System                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Tauri Desktop  │         │   Web Interface  │         │
│  │   (Rust + Web)   │         │  (Browser-based) │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│           ┌──────────▼───────────┐                          │
│           │   Express Server     │                          │
│           │   (Node.js)          │                          │
│           │   Port: 3000         │                          │
│           └──────────┬───────────┘                          │
│                      │                                       │
│           ┌──────────┴───────────┐                          │
│           │                      │                          │
│  ┌────────▼─────────┐   ┌───────▼──────────┐              │
│  │  Feed Fetcher    │   │  Blog Database   │              │
│  │  (axios, xml2js) │   │  (LowDB/JSON)    │              │
│  └────────┬─────────┘   └──────────────────┘              │
│           │                                                  │
│  ┌────────▼─────────┐                                       │
│  │  GitHub Blog RSS │                                       │
│  │  github.blog/feed│                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  public/                                                     │
│  ├── index.html      - Main blog listing page               │
│  ├── article.html    - Individual article view              │
│  ├── renderer.js     - Frontend logic for blog list         │
│  ├── article.js      - Frontend logic for article display   │
│  └── styles.css      - Responsive styling                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Express)                      │
├─────────────────────────────────────────────────────────────┤
│  server.js                                                   │
│  ├── GET  /api/articles         - List all articles         │
│  ├── GET  /api/articles/:slug   - Get single article        │
│  ├── GET  /api/search?q=...     - Search articles           │
│  └── POST /api/refresh           - Fetch new posts          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  feedFetcher-node.js                                         │
│  ├── fetchAndStorePosts()    - Fetch RSS feed              │
│  ├── generateSlug()           - Create URL-safe slugs       │
│  └── extractContent()         - Parse article content       │
│                                                              │
│  database-node.js                                            │
│  ├── getAllArticles()         - Retrieve all articles       │
│  ├── getArticleBySlug()       - Find by slug                │
│  ├── createArticle()          - Add new article             │
│  ├── updateArticle()          - Update existing article     │
│  └── searchArticles()         - Full-text search            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ~/.github-blogger/blog.json                                │
│  {                                                           │
│    "articles": [...],                                        │
│    "comments": [...],                                        │
│    "categories": [...]                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Frontend (Browser/   │
│ Tauri WebView)       │
└──────┬───────────────┘
       │ HTTP Request
       ▼
┌──────────────────────┐
│ Express API Routes   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐      ┌──────────────────┐
│ Database Layer       │◄─────┤ Feed Fetcher     │
│ (CRUD operations)    │      │ (Periodic sync)  │
└──────┬───────────────┘      └────────┬─────────┘
       │                               │
       ▼                               ▼
┌──────────────────────┐      ┌──────────────────┐
│ LowDB (JSON file)    │      │ GitHub Blog RSS  │
└──────────────────────┘      └──────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Rust (for Tauri desktop app)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Bens-Scratch-Org/GitHub-Blogger.git
cd GitHub-Blogger

# Install dependencies
npm install
```

### Running the Application

#### Web Server Mode

```bash
# Start the Express server
npm run server
```

The web interface will be available at `http://localhost:3000`

#### Desktop App Mode (Tauri)

```bash
# Development mode
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
GitHub-Blogger/
├── public/                      # Frontend assets
│   ├── index.html              # Main blog listing page
│   ├── article.html            # Article detail page
│   ├── renderer.js             # Blog list frontend logic
│   ├── article.js              # Article display logic
│   └── styles.css              # Responsive styles
├── src-tauri/                  # Tauri (Rust) desktop app
│   ├── src/
│   │   ├── main.rs            # Tauri entry point
│   │   ├── database.rs        # Rust database module
│   │   └── feed.rs            # Rust feed fetcher
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json        # Tauri configuration
├── server.js                   # Express server & API routes
├── database-node.js            # Node.js database layer
├── feedFetcher-node.js         # RSS feed fetcher
├── copilotService.js           # GitHub Copilot integration
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | Retrieve all published articles |
| GET | `/api/articles/:slug` | Get a specific article by slug |
| GET | `/api/search?q=query` | Search articles by keyword |
| POST | `/api/refresh` | Manually trigger feed sync |

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3** - Responsive UI
- **Vanilla JavaScript** - Lightweight client-side logic
- **GitHub Design System** - Inspired styling

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **axios** - HTTP client for RSS fetching
- **xml2js** - XML/RSS parsing

### Desktop
- **Tauri 2** - Desktop framework
- **Rust** - Systems programming language
- **WebView** - Native rendering

### Data
- **LowDB 7** - Lightweight JSON database
- **File-based storage** - `~/.github-blogger/blog.json`

## 📊 Database Schema

```json
{
  "articles": [
    {
      "id": 1,
      "title": "Article Title",
      "slug": "article-title",
      "content": "Full article content...",
      "excerpt": "Short excerpt...",
      "author": "Author Name",
      "published_date": "2026-03-13T00:00:00Z",
      "image_url": "https://...",
      "categories": ["Engineering", "AI"],
      "status": "published",
      "views": 0,
      "created_at": "2026-03-13T00:00:00Z"
    }
  ],
  "comments": [],
  "categories": []
}
```

## 🎯 Roadmap

- [ ] Add commenting system
- [ ] Implement category filtering
- [ ] Add bookmark/favorites feature
- [ ] Enable offline reading mode
- [ ] Add dark mode support
- [ ] Implement article sharing
- [ ] Add GitHub authentication
- [ ] RSS feed export

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Node.js, Express, Tauri, and Rust
