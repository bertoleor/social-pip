//! Post commands module - CRUD operations for social media posts
//!
//! This module provides Tauri commands for post management following the bounded context pattern.
//! All operations use in-memory storage (will be replaced by Prisma in production).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

// Import shared types from account module
use super::account::{Platform, AccountStatus};

// ============================================
// DOMAIN TYPES
// ============================================

/// PostStatus enum matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PostStatus {
    Draft,
    Scheduled,
    Published,
    Failed,
}

impl PostStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            PostStatus::Draft => "DRAFT",
            PostStatus::Scheduled => "SCHEDULED",
            PostStatus::Published => "PUBLISHED",
            PostStatus::Failed => "FAILED",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "DRAFT" => Some(PostStatus::Draft),
            "SCHEDULED" => Some(PostStatus::Scheduled),
            "PUBLISHED" => Some(PostStatus::Published),
            "FAILED" => Some(PostStatus::Failed),
            _ => None,
        }
    }
}

impl Default for PostStatus {
    fn default() -> Self {
        PostStatus::Draft
    }
}

/// Post entity matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: String,
    pub account_id: String,
    pub platform: Platform,
    pub status: PostStatus,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_urls: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hashtags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Filter parameters for get_posts
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PostFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_after: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_before: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<i32>,
}

/// Input for creating a new post
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePostInput {
    pub account_id: String,
    pub platform: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_urls: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hashtags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<String>,
    #[serde(default = "default_post_status")]
    pub status: String,
}

fn default_post_status() -> String {
    "DRAFT".to_string()
}

/// Input for updating an existing post
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePostInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_urls: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hashtags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

// ============================================
// IN-MEMORY STORAGE (for MVP, will be replaced by Prisma)
// ============================================

static POSTS: Lazy<Mutex<HashMap<String, Post>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_id() -> String {
    format!("post_{}", chrono::Utc::now().timestamp_millis())
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn matches_filter(post: &Post, filter: &PostFilter) -> bool {
    // Account ID filter
    if let Some(ref account_id) = filter.account_id {
        if &post.account_id != account_id {
            return false;
        }
    }

    // Platform filter
    if let Some(ref platform) = filter.platform {
        if platform != "all" && post.platform.as_str() != platform.to_lowercase().as_str() {
            return false;
        }
    }

    // Status filter
    if let Some(ref status) = filter.status {
        if post.status.as_str() != status.to_uppercase().as_str() {
            return false;
        }
    }

    // Scheduled after filter
    if let Some(ref scheduled_after) = filter.scheduled_after {
        if let Some(ref post_scheduled) = post.scheduled_at {
            if post_scheduled < scheduled_after {
                return false;
            }
        } else {
            return false;
        }
    }

    // Scheduled before filter
    if let Some(ref scheduled_before) = filter.scheduled_before {
        if let Some(ref post_scheduled) = post.scheduled_at {
            if post_scheduled > scheduled_before {
                return false;
            }
        } else {
            return false;
        }
    }

    true
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Get all posts with optional filtering
#[tauri::command]
pub async fn get_posts(filter: Option<PostFilter>) -> Result<Vec<Post>, String> {
    let posts = POSTS.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut result: Vec<Post> = posts
        .values()
        .filter(|p| matches_filter(p, &filter))
        .cloned()
        .collect();

    // Sort by created_at descending
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    // Apply pagination
    let offset = filter.offset.unwrap_or(0) as usize;
    let limit = filter.limit.unwrap_or(100) as usize;

    let result: Vec<Post> = result
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();

    Ok(result)
}

/// Get a single post by ID
#[tauri::command]
pub async fn get_post(id: String) -> Result<Option<Post>, String> {
    let posts = POSTS.lock().map_err(|e| e.to_string())?;
    Ok(posts.get(&id).cloned())
}

/// Create a new post
#[tauri::command]
pub async fn create_post(data: CreatePostInput) -> Result<Post, String> {
    // Validate platform
    let platform = Platform::from_str(&data.platform)
        .ok_or_else(|| format!("Invalid platform: {}", data.platform))?;

    // Validate status
    let status = PostStatus::from_str(&data.status)
        .ok_or_else(|| format!("Invalid status: {}", data.status))?;

    // Validate content is not empty
    if data.content.trim().is_empty() {
        return Err("Content is required".to_string());
    }

    // Validate account_id is not empty
    if data.account_id.trim().is_empty() {
        return Err("Account ID is required".to_string());
    }

    let now = now_iso();
    let id = generate_id();

    let post = Post {
        id: id.clone(),
        account_id: data.account_id.clone(),
        platform,
        status,
        content: data.content.trim().to_string(),
        media_urls: data.media_urls.filter(|m| !m.is_empty()),
        hashtags: data.hashtags.filter(|h| !h.is_empty()),
        scheduled_at: data.scheduled_at.filter(|s| !s.is_empty()),
        published_at: None,
        platform_post_id: None,
        platform_post_url: None,
        error_message: None,
        created_at: now.clone(),
        updated_at: now,
    };

    let mut posts = POSTS.lock().map_err(|e| e.to_string())?;
    posts.insert(id, post.clone());

    Ok(post)
}

/// Update an existing post
#[tauri::command]
pub async fn update_post(id: String, data: UpdatePostInput) -> Result<Post, String> {
    let mut posts = POSTS.lock().map_err(|e| e.to_string())?;

    let post = posts.get_mut(&id)
        .ok_or_else(|| format!("Post not found: {}", id))?;

    // Update content if provided
    if let Some(ref content) = data.content {
        if content.trim().is_empty() {
            return Err("Content cannot be empty".to_string());
        }
        post.content = content.trim().to_string();
    }

    // Update media_urls if provided
    if let Some(ref media_urls) = data.media_urls {
        post.media_urls = Some(media_urls.clone()).filter(|m| !m.is_empty());
    }

    // Update hashtags if provided
    if let Some(ref hashtags) = data.hashtags {
        post.hashtags = Some(hashtags.clone()).filter(|h| !h.is_empty());
    }

    // Update status if provided
    if let Some(ref status_str) = data.status {
        let status = PostStatus::from_str(status_str)
            .ok_or_else(|| format!("Invalid status: {}", status_str))?;
        post.status = status;
    }

    // Update scheduled_at if provided
    if let Some(ref scheduled_at) = data.scheduled_at {
        post.scheduled_at = Some(scheduled_at.clone()).filter(|s| !s.is_empty());
    }

    // Update published_at if provided
    if let Some(ref published_at) = data.published_at {
        post.published_at = Some(published_at.clone()).filter(|p| !p.is_empty());
    }

    // Update platform_post_id if provided
    if let Some(ref platform_post_id) = data.platform_post_id {
        post.platform_post_id = Some(platform_post_id.clone()).filter(|p| !p.is_empty());
    }

    // Update platform_post_url if provided
    if let Some(ref platform_post_url) = data.platform_post_url {
        post.platform_post_url = Some(platform_post_url.clone()).filter(|p| !p.is_empty());
    }

    // Update error_message if provided
    if let Some(ref error_message) = data.error_message {
        post.error_message = Some(error_message.clone()).filter(|e| !e.is_empty());
    }

    // Update timestamp
    post.updated_at = now_iso();

    Ok(post.clone())
}

/// Delete a post (idempotent - succeeds even if post doesn't exist)
#[tauri::command]
pub async fn delete_post(id: String) -> Result<(), String> {
    let mut posts = POSTS.lock().map_err(|e| e.to_string())?;
    // Idempotent: removing a non-existent key is a no-op
    posts.remove(&id);
    Ok(())
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_posts() {
        let mut posts = POSTS.lock().unwrap();
        posts.clear();
    }

    // ================================
    // STRUCT DEFINITION TESTS
    // ================================

    #[test]
    fn post_status_from_str_valid() {
        assert_eq!(PostStatus::from_str("DRAFT"), Some(PostStatus::Draft));
        assert_eq!(PostStatus::from_str("draft"), Some(PostStatus::Draft));
        assert_eq!(PostStatus::from_str("SCHEDULED"), Some(PostStatus::Scheduled));
        assert_eq!(PostStatus::from_str("PUBLISHED"), Some(PostStatus::Published));
        assert_eq!(PostStatus::from_str("FAILED"), Some(PostStatus::Failed));
    }

    #[test]
    fn post_status_from_str_invalid() {
        assert_eq!(PostStatus::from_str("invalid"), None);
        assert_eq!(PostStatus::from_str(""), None);
    }

    // ================================
    // GET_POSTS TESTS
    // ================================

    #[test]
    fn test_get_posts_returns_empty_vec_when_no_posts_exist() {
        reset_posts();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_posts(None));
        assert!(result.is_ok());
        let posts = result.unwrap();
        assert!(posts.is_empty());
    }

    #[test]
    fn test_get_posts_with_platform_filter_returns_only_matching() {
        reset_posts();

        // Create test posts
        let rt = tokio::runtime::Runtime::new().unwrap();
        let facebook_post = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "FB Post".to_string(),
            status: "DRAFT".to_string(),
            ..Default::default()
        })).unwrap();

        let instagram_post = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_2".to_string(),
            platform: "instagram".to_string(),
            content: "IG Post".to_string(),
            status: "DRAFT".to_string(),
            ..Default::default()
        })).unwrap();

        // Filter by facebook
        let filter = PostFilter {
            platform: Some("facebook".to_string()),
            ..Default::default()
        };
        let result = rt.block_on(get_posts(Some(filter)));
        assert!(result.is_ok());
        let posts = result.unwrap();
        assert_eq!(posts.len(), 1);
        assert_eq!(posts[0].platform, Platform::Facebook);

        // Cleanup
        let _ = rt.block_on(delete_post(facebook_post.id));
        let _ = rt.block_on(delete_post(instagram_post.id));
    }

    #[test]
    fn test_get_posts_with_pagination() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create 5 posts
        for i in 0..5 {
            let _ = rt.block_on(create_post(CreatePostInput {
                account_id: format!("acct_{}", i),
                platform: "facebook".to_string(),
                content: format!("Post {}", i),
                status: "DRAFT".to_string(),
                ..Default::default()
            }));
        }

        // Get first 2
        let filter = PostFilter {
            limit: Some(2),
            offset: Some(0),
            ..Default::default()
        };
        let result = rt.block_on(get_posts(Some(filter)));
        assert!(result.is_ok());
        let posts = result.unwrap();
        assert_eq!(posts.len(), 2);

        // Get next 2
        let filter = PostFilter {
            limit: Some(2),
            offset: Some(2),
            ..Default::default()
        };
        let result = rt.block_on(get_posts(Some(filter)));
        assert!(result.is_ok());
        let posts = result.unwrap();
        assert_eq!(posts.len(), 2);

        // Cleanup
        let all_posts = rt.block_on(get_posts(None)).unwrap();
        for post in all_posts {
            let _ = rt.block_on(delete_post(post.id));
        }
    }

    // ================================
    // CREATE_POST TESTS
    // ================================

    #[test]
    fn test_create_post_persists_and_returns_with_generated_id() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_123".to_string(),
            platform: "facebook".to_string(),
            content: "Test Post Content".to_string(),
            status: "DRAFT".to_string(),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let post = result.unwrap();

        // Verify generated ID
        assert!(post.id.starts_with("post_"));
        assert!(!post.id.is_empty());

        // Verify data persisted
        assert_eq!(post.content, "Test Post Content");
        assert_eq!(post.platform, Platform::Facebook);
        assert_eq!(post.account_id, "acct_123");
        assert_eq!(post.status, PostStatus::Draft);

        // Verify timestamps
        assert!(!post.created_at.is_empty());
        assert!(!post.updated_at.is_empty());

        // Cleanup
        let _ = rt.block_on(delete_post(post.id));
    }

    #[test]
    fn test_create_post_validates_platform() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "invalid_platform".to_string(),
            content: "Test".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Invalid platform"));
    }

    #[test]
    fn test_create_post_validates_content_required() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Content is required"));
    }

    #[test]
    fn test_create_post_validates_account_id_required() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_post(CreatePostInput {
            account_id: "".to_string(),
            platform: "facebook".to_string(),
            content: "Test".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Account ID is required"));
    }

    #[test]
    fn test_create_post_with_optional_fields() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "instagram".to_string(),
            content: "Test with media".to_string(),
            media_urls: Some(vec!["url1.jpg".to_string(), "url2.jpg".to_string()]),
            hashtags: Some(vec!["#test".to_string(), "#example".to_string()]),
            scheduled_at: Some("2024-12-31T10:00:00Z".to_string()),
            status: "SCHEDULED".to_string(),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let post = result.unwrap();
        assert_eq!(post.media_urls, Some(vec!["url1.jpg".to_string(), "url2.jpg".to_string()]));
        assert_eq!(post.hashtags, Some(vec!["#test".to_string(), "#example".to_string()]));
        assert_eq!(post.scheduled_at, Some("2024-12-31T10:00:00Z".to_string()));
        assert_eq!(post.status, PostStatus::Scheduled);

        // Cleanup
        let _ = rt.block_on(delete_post(post.id));
    }

    // ================================
    // UPDATE_POST TESTS
    // ================================

    #[test]
    fn test_update_post_modifies_existing_post() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create post
        let created = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "Original Content".to_string(),
            ..Default::default()
        })).unwrap();

        // Update post
        let result = rt.block_on(update_post(created.id.clone(), UpdatePostInput {
            content: Some("Updated Content".to_string()),
            status: Some("SCHEDULED".to_string()),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let updated = result.unwrap();

        // Verify updates
        assert_eq!(updated.content, "Updated Content");
        assert_eq!(updated.status, PostStatus::Scheduled);
        assert_eq!(updated.id, created.id);
        assert!(updated.updated_at != created.updated_at || updated.content != created.content);

        // Cleanup
        let _ = rt.block_on(delete_post(created.id));
    }

    #[test]
    fn test_update_post_returns_error_for_nonexistent_id() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(update_post("nonexistent_id".to_string(), UpdatePostInput {
            content: Some("New Content".to_string()),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("not found"));
    }

    #[test]
    fn test_update_post_validates_content_not_empty() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create post
        let created = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "Original".to_string(),
            ..Default::default()
        })).unwrap();

        // Try to update with empty content
        let result = rt.block_on(update_post(created.id.clone(), UpdatePostInput {
            content: Some("".to_string()),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("cannot be empty"));

        // Cleanup
        let _ = rt.block_on(delete_post(created.id));
    }

    #[test]
    fn test_update_post_with_published_data() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create post
        let created = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "Test".to_string(),
            ..Default::default()
        })).unwrap();

        // Mark as published
        let result = rt.block_on(update_post(created.id.clone(), UpdatePostInput {
            status: Some("PUBLISHED".to_string()),
            published_at: Some("2024-01-15T10:30:00Z".to_string()),
            platform_post_id: Some("fb_post_123".to_string()),
            platform_post_url: Some("https://facebook.com/post/123".to_string()),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let updated = result.unwrap();
        assert_eq!(updated.status, PostStatus::Published);
        assert!(updated.published_at.is_some());
        assert!(updated.platform_post_id.is_some());
        assert!(updated.platform_post_url.is_some());

        // Cleanup
        let _ = rt.block_on(delete_post(created.id));
    }

    // ================================
    // DELETE_POST TESTS
    // ================================

    #[test]
    fn test_delete_post_is_idempotent() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Delete non-existent post should succeed
        let result = rt.block_on(delete_post("nonexistent_id".to_string()));
        assert!(result.is_ok());

        // Create and delete
        let created = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "To Delete".to_string(),
            ..Default::default()
        })).unwrap();

        // Delete once - should succeed
        let result = rt.block_on(delete_post(created.id.clone()));
        assert!(result.is_ok());

        // Delete again - should still succeed (idempotent)
        let result = rt.block_on(delete_post(created.id.clone()));
        assert!(result.is_ok());
    }

    #[test]
    fn test_delete_post_removes_from_storage() {
        reset_posts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create post
        let created = rt.block_on(create_post(CreatePostInput {
            account_id: "acct_1".to_string(),
            platform: "facebook".to_string(),
            content: "To Delete".to_string(),
            ..Default::default()
        })).unwrap();

        // Verify it exists
        let result = rt.block_on(get_post(created.id.clone()));
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());

        // Delete it
        let result = rt.block_on(delete_post(created.id.clone()));
        assert!(result.is_ok());

        // Verify it's gone
        let result = rt.block_on(get_post(created.id.clone()));
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}

impl Default for CreatePostInput {
    fn default() -> Self {
        Self {
            account_id: String::new(),
            platform: "facebook".to_string(),
            content: String::new(),
            media_urls: None,
            hashtags: None,
            scheduled_at: None,
            status: "DRAFT".to_string(),
        }
    }
}
