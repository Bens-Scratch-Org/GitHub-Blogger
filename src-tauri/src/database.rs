use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Article {
    pub id: u64,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: String,
    pub author: String,
    pub category: String,
    pub tags: Vec<String>,
    pub published_date: String,
    pub status: String,
    pub views: u64,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct DbData {
    articles: Vec<Article>,
    comments: Vec<serde_json::Value>,
    categories: Vec<String>,
}

pub struct BlogDatabase {
    path: PathBuf,
    data: DbData,
}

impl BlogDatabase {
    pub fn new() -> Self {
        let data_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".github-blogger");
        fs::create_dir_all(&data_dir).ok();
        BlogDatabase {
            path: data_dir.join("blog.json"),
            data: DbData::default(),
        }
    }

    pub fn init(&mut self) -> Result<()> {
        if self.path.exists() {
            let content = fs::read_to_string(&self.path)?;
            self.data = serde_json::from_str(&content).unwrap_or_default();
        } else {
            self.save()?;
        }
        Ok(())
    }

    fn save(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.data)?;
        fs::write(&self.path, content)?;
        Ok(())
    }

    pub fn get_all_articles(&self) -> Vec<Article> {
        let mut articles: Vec<Article> = self
            .data
            .articles
            .iter()
            .filter(|a| a.status == "published")
            .cloned()
            .collect();
        articles.sort_by(|a, b| b.published_date.cmp(&a.published_date));
        articles
    }

    pub fn get_article_by_slug(&self, slug: &str) -> Option<Article> {
        self.data
            .articles
            .iter()
            .find(|a| a.slug == slug)
            .cloned()
    }

    pub fn create_article(&mut self, mut article: Article) -> Result<Article> {
        let next_id = self.data.articles.iter().map(|a| a.id).max().unwrap_or(0) + 1;
        article.id = next_id;
        article.created_at = Utc::now().to_rfc3339();
        self.data.articles.push(article.clone());
        self.save()?;
        Ok(article)
    }

    pub fn update_article(&mut self, id: u64, updates: Article) -> Result<Option<Article>> {
        if let Some(article) = self.data.articles.iter_mut().find(|a| a.id == id) {
            article.title = updates.title;
            article.content = updates.content;
            article.excerpt = updates.excerpt;
            article.author = updates.author;
            article.category = updates.category;
            article.tags = updates.tags;
            article.published_date = updates.published_date;
            article.updated_date = Some(Utc::now().to_rfc3339());
            let result = article.clone();
            self.save()?;
            Ok(Some(result))
        } else {
            Ok(None)
        }
    }

    pub fn search_articles(&self, query: &str) -> Vec<Article> {
        let q = query.to_lowercase();
        self.data
            .articles
            .iter()
            .filter(|a| {
                a.status == "published"
                    && (a.title.to_lowercase().contains(&q)
                        || a.content.to_lowercase().contains(&q)
                        || a.excerpt.to_lowercase().contains(&q))
            })
            .cloned()
            .collect()
    }

    pub fn maintain_post_limit(&mut self, limit: usize) -> Result<()> {
        if self.data.articles.len() > limit {
            self.data
                .articles
                .sort_by(|a, b| b.published_date.cmp(&a.published_date));
            self.data.articles.truncate(limit);
            self.save()?;
        }
        Ok(())
    }

    pub fn article_count(&self) -> usize {
        self.data.articles.len()
    }
}
