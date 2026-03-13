use anyhow::Result;
use quick_xml::events::Event;
use quick_xml::reader::Reader;
use regex::Regex;

use crate::database::{Article, BlogDatabase};

const FEED_URL: &str = "https://github.blog/feed/";
const MAX_POSTS: usize = 20;
const POST_LIMIT: usize = 100;

pub struct FeedFetcher;

#[derive(Debug, Default)]
pub struct RssItem {
    pub title: String,
    pub description: String,
    pub content_encoded: String,
    pub pub_date: String,
    pub creator: String,
    pub categories: Vec<String>,
}

impl FeedFetcher {
    /// Fetch RSS feed and return parsed items. No DB lock held.
    pub async fn fetch_rss_items() -> Result<Vec<RssItem>> {
        let client = reqwest::Client::builder()
            .user_agent("GitHub-Blogger-App")
            .build()?;

        let response = client.get(FEED_URL).send().await?;
        let xml_text = response.text().await?;

        let items = Self::parse_rss(&xml_text)?;
        Ok(items.into_iter().take(MAX_POSTS).collect())
    }

    /// Store parsed items into the DB. Synchronous, no async.
    pub fn store_items(db: &mut BlogDatabase, items: Vec<RssItem>) -> Result<(u64, u64)> {
        let mut new_posts = 0u64;
        let mut updated_posts = 0u64;

        for item in &items {
            let slug = Self::generate_slug(&item.title);
            let content_raw = if !item.content_encoded.is_empty() {
                &item.content_encoded
            } else {
                &item.description
            };
            let content = Self::strip_html(content_raw);
            let excerpt = Self::make_excerpt(&Self::strip_html(&item.description));
            let author = if !item.creator.is_empty() {
                item.creator.clone()
            } else {
                "GitHub".to_string()
            };
            let category = item
                .categories
                .first()
                .cloned()
                .unwrap_or_else(|| "General".to_string());
            let tags: Vec<String> = item.categories.iter().take(5).cloned().collect();
            let published_date = if !item.pub_date.is_empty() {
                item.pub_date.clone()
            } else {
                chrono::Utc::now().to_rfc3339()
            };

            let new_article = Article {
                id: 0,
                title: item.title.clone(),
                slug: slug.clone(),
                content: content.clone(),
                excerpt,
                author,
                category,
                tags,
                published_date,
                status: "published".to_string(),
                views: 0,
                created_at: String::new(),
                updated_date: None,
            };

            if let Some(existing) = db.get_article_by_slug(&slug) {
                if existing.content != content {
                    db.update_article(existing.id, new_article)?;
                    updated_posts += 1;
                }
            } else {
                db.create_article(new_article)?;
                new_posts += 1;
            }
        }

        db.maintain_post_limit(POST_LIMIT)?;
        Ok((new_posts, updated_posts))
    }

    fn parse_rss(xml: &str) -> Result<Vec<RssItem>> {
        let mut reader = Reader::from_str(xml);
        reader.trim_text(true);

        let mut items: Vec<RssItem> = Vec::new();
        let mut current_item: Option<RssItem> = None;
        let mut current_tag = String::new();

        let mut buf = Vec::new();
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(e)) => {
                    let name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                    current_tag = name.clone();
                    if name == "item" {
                        current_item = Some(RssItem::default());
                    }
                }
                Ok(Event::CData(e)) => {
                    if let Some(ref mut item) = current_item {
                        let text = String::from_utf8_lossy(&e).to_string();
                        Self::set_field(item, &current_tag, text);
                    }
                }
                Ok(Event::Text(e)) => {
                    if let Some(ref mut item) = current_item {
                        if let Ok(text) = e.unescape() {
                            let text = text.trim().to_string();
                            if !text.is_empty() {
                                Self::set_field(item, &current_tag, text);
                            }
                        }
                    }
                }
                Ok(Event::End(e)) => {
                    let name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                    if name == "item" {
                        if let Some(item) = current_item.take() {
                            if !item.title.is_empty() {
                                items.push(item);
                            }
                        }
                    }
                    if name == current_tag {
                        current_tag.clear();
                    }
                }
                Ok(Event::Eof) => break,
                Err(_) => break,
                _ => {}
            }
            buf.clear();
        }

        Ok(items)
    }

    fn set_field(item: &mut RssItem, tag: &str, value: String) {
        match tag {
            "title" => {
                if item.title.is_empty() {
                    item.title = value;
                }
            }
            "description" => {
                if item.description.is_empty() {
                    item.description = value;
                }
            }
            "encoded" | "content:encoded" => {
                if item.content_encoded.is_empty() {
                    item.content_encoded = value;
                }
            }
            "pubDate" | "pubdate" => {
                if item.pub_date.is_empty() {
                    item.pub_date = value;
                }
            }
            "creator" | "dc:creator" => {
                if item.creator.is_empty() {
                    item.creator = value;
                }
            }
            "category" => {
                item.categories.push(value);
            }
            _ => {}
        }
    }

    fn strip_html(html: &str) -> String {
        let tag_re = Regex::new(r"<[^>]+>").unwrap();
        let result = tag_re.replace_all(html, "");
        result
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
    }

    fn make_excerpt(text: &str) -> String {
        if text.len() <= 200 {
            text.to_string()
        } else {
            format!("{}...", &text[..200])
        }
    }

    pub fn generate_slug(title: &str) -> String {
        let re = Regex::new(r"[^a-z0-9]+").unwrap();
        let slug = re.replace_all(&title.to_lowercase(), "-").to_string();
        slug.trim_matches('-').to_string()
    }
}
