mod database;
mod feed_fetcher;

use database::{Article, BlogDatabase};
use feed_fetcher::FeedFetcher;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db: Mutex<BlogDatabase>,
}

#[derive(Serialize, Deserialize)]
pub struct RefreshResult {
    new_posts: u64,
    updated_posts: u64,
}

#[tauri::command]
fn get_articles(state: State<AppState>) -> Result<Vec<Article>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db.get_all_articles())
}

#[tauri::command]
fn get_article(slug: String, state: State<AppState>) -> Result<Option<Article>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db.get_article_by_slug(&slug))
}

#[tauri::command]
fn search_articles(query: String, state: State<AppState>) -> Result<Vec<Article>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db.search_articles(&query))
}

#[tauri::command]
async fn refresh_feed(state: State<'_, AppState>) -> Result<RefreshResult, String> {
    // Fetch RSS items from the network (no DB lock held during await)
    let items = FeedFetcher::fetch_rss_items()
        .await
        .map_err(|e| e.to_string())?;

    // Apply items to DB synchronously after the await
    let (new_posts, updated_posts) = {
        let mut db = state.db.lock().map_err(|e| e.to_string())?;
        FeedFetcher::store_items(&mut db, items).map_err(|e| e.to_string())?
    };

    Ok(RefreshResult {
        new_posts,
        updated_posts,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut db = BlogDatabase::new();
    db.init().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(db),
        })
        .invoke_handler(tauri::generate_handler![
            get_articles,
            get_article,
            search_articles,
            refresh_feed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
