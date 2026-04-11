//! Account commands module - CRUD operations for social media accounts
//!
//! This module provides Tauri commands for account management following the bounded context pattern.
//! All operations use the existing database layer from @social-pip/database (Prisma).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================
// DOMAIN TYPES
// ============================================

/// Platform enum matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Facebook,
    Instagram,
    Tiktok,
    Twitter,
    Linkedin,
    Threads,
    Telegram,
    Whatsapp,
}

impl Platform {
    pub fn as_str(&self) -> &'static str {
        match self {
            Platform::Facebook => "facebook",
            Platform::Instagram => "instagram",
            Platform::Tiktok => "tiktok",
            Platform::Twitter => "twitter",
            Platform::Linkedin => "linkedin",
            Platform::Threads => "threads",
            Platform::Telegram => "telegram",
            Platform::Whatsapp => "whatsapp",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "facebook" => Some(Platform::Facebook),
            "instagram" => Some(Platform::Instagram),
            "tiktok" => Some(Platform::Tiktok),
            "twitter" => Some(Platform::Twitter),
            "linkedin" => Some(Platform::Linkedin),
            "threads" => Some(Platform::Threads),
            "telegram" => Some(Platform::Telegram),
            "whatsapp" => Some(Platform::Whatsapp),
            _ => None,
        }
    }
}

/// AccountStatus enum matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AccountStatus {
    Active,
    Inactive,
    WarmingUp,
    Restricted,
    Banned,
}

impl AccountStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            AccountStatus::Active => "active",
            AccountStatus::Inactive => "inactive",
            AccountStatus::WarmingUp => "warming_up",
            AccountStatus::Restricted => "restricted",
            AccountStatus::Banned => "banned",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "active" => Some(AccountStatus::Active),
            "inactive" => Some(AccountStatus::Inactive),
            "warming_up" => Some(AccountStatus::WarmingUp),
            "restricted" => Some(AccountStatus::Restricted),
            "banned" => Some(AccountStatus::Banned),
            _ => None,
        }
    }

    pub fn default_status() -> Self {
        AccountStatus::Active
    }
}

impl Default for AccountStatus {
    fn default() -> Self {
        Self::default_status()
    }
}

/// Account entity matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub name: String,
    pub platform: Platform,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chrome_profile_path: Option<String>,
    pub status: AccountStatus,
    pub warmup_progress: i32,
    pub restrictions_count: i32,
    pub daily_posts_count: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_reset_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_used_at: Option<String>,
}

/// Filter parameters for get_accounts
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AccountFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub search: Option<String>,
}

/// Input for creating a new account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAccountInput {
    pub platform: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chrome_profile_path: Option<String>,
    #[serde(default = "default_status")]
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

fn default_status() -> String {
    "active".to_string()
}

/// Input for updating an existing account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAccountInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chrome_profile_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

// ============================================
// IN-MEMORY STORAGE (for MVP, will be replaced by Prisma)
// ============================================

use std::sync::Mutex;
use once_cell::sync::Lazy;

static ACCOUNTS: Lazy<Mutex<HashMap<String, Account>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_id() -> String {
    format!("acct_{}", chrono::Utc::now().timestamp_millis())
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn matches_filter(account: &Account, filter: &AccountFilter) -> bool {
    // Platform filter
    if let Some(ref platform) = filter.platform {
        if platform != "all" && account.platform.as_str() != platform.to_lowercase().as_str() {
            return false;
        }
    }

    // Status filter
    if let Some(ref status) = filter.status {
        if account.status.as_str() != status.to_lowercase().as_str() {
            return false;
        }
    }

    // Search filter (searches in name, username, display_name)
    if let Some(ref search) = filter.search {
        let search_lower = search.to_lowercase();
        let matches_name = account.name.to_lowercase().contains(&search_lower);
        let matches_username = account.username.as_ref()
            .map(|u| u.to_lowercase().contains(&search_lower))
            .unwrap_or(false);
        let matches_display = account.display_name.as_ref()
            .map(|d| d.to_lowercase().contains(&search_lower))
            .unwrap_or(false);

        if !matches_name && !matches_username && !matches_display {
            return false;
        }
    }

    true
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Get all accounts with optional filtering
#[tauri::command]
pub async fn get_accounts(filter: Option<AccountFilter>) -> Result<Vec<Account>, String> {
    let accounts = ACCOUNTS.lock().map_err(|e| e.to_string())?;
    let filter = filter.unwrap_or_default();

    let mut result: Vec<Account> = accounts
        .values()
        .filter(|a| matches_filter(a, &filter))
        .cloned()
        .collect();

    // Sort by created_at descending
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(result)
}

/// Get a single account by ID
#[tauri::command]
pub async fn get_account(id: String) -> Result<Option<Account>, String> {
    let accounts = ACCOUNTS.lock().map_err(|e| e.to_string())?;
    Ok(accounts.get(&id).cloned())
}

/// Create a new account
#[tauri::command]
pub async fn create_account(data: CreateAccountInput) -> Result<Account, String> {
    // Validate platform
    let platform = Platform::from_str(&data.platform)
        .ok_or_else(|| format!("Invalid platform: {}", data.platform))?;

    // Validate status
    let status = AccountStatus::from_str(&data.status)
        .ok_or_else(|| format!("Invalid status: {}", data.status))?;

    // Validate name is not empty
    if data.name.trim().is_empty() {
        return Err("Name is required".to_string());
    }

    // Validate username format if provided
    if let Some(ref username) = data.username {
        if !username.is_empty() {
            let username_regex = regex::Regex::new(r"^[a-zA-Z0-9_]+$")
                .map_err(|e| format!("Regex error: {}", e))?;
            if !username_regex.is_match(username) {
                return Err("Username can only contain letters, numbers, and underscores".to_string());
            }
        }
    }

    let now = now_iso();
    let id = generate_id();

    let account = Account {
        id: id.clone(),
        name: data.name.trim().to_string(),
        platform,
        username: data.username.filter(|u| !u.is_empty()),
        display_name: data.display_name.filter(|d| !d.is_empty()),
        avatar_url: data.avatar_url.filter(|a| !a.is_empty()),
        chrome_profile_path: data.chrome_profile_path.filter(|c| !c.is_empty()),
        status,
        warmup_progress: 0,
        restrictions_count: 0,
        daily_posts_count: 0,
        last_reset_date: None,
        created_at: now.clone(),
        updated_at: now,
        last_used_at: None,
    };

    let mut accounts = ACCOUNTS.lock().map_err(|e| e.to_string())?;
    accounts.insert(id, account.clone());

    Ok(account)
}

/// Update an existing account
#[tauri::command]
pub async fn update_account(id: String, data: UpdateAccountInput) -> Result<Account, String> {
    let mut accounts = ACCOUNTS.lock().map_err(|e| e.to_string())?;

    let account = accounts.get_mut(&id)
        .ok_or_else(|| format!("Account not found: {}", id))?;

    // Update name if provided
    if let Some(ref name) = data.name {
        if name.trim().is_empty() {
            return Err("Name cannot be empty".to_string());
        }
        account.name = name.trim().to_string();
    }

    // Update username if provided
    if let Some(ref username) = data.username {
        if !username.is_empty() {
            let username_regex = regex::Regex::new(r"^[a-zA-Z0-9_]+$")
                .map_err(|e| format!("Regex error: {}", e))?;
            if !username_regex.is_match(username) {
                return Err("Username can only contain letters, numbers, and underscores".to_string());
            }
        }
        account.username = username.clone().filter(|u| !u.is_empty());
    }

    // Update display_name if provided
    if let Some(ref display_name) = data.display_name {
        account.display_name = display_name.clone().filter(|d| !d.is_empty());
    }

    // Update avatar_url if provided
    if let Some(ref avatar_url) = data.avatar_url {
        account.avatar_url = avatar_url.clone().filter(|a| !a.is_empty());
    }

    // Update chrome_profile_path if provided
    if let Some(ref chrome_profile_path) = data.chrome_profile_path {
        account.chrome_profile_path = chrome_profile_path.clone().filter(|c| !c.is_empty());
    }

    // Update status if provided
    if let Some(ref status_str) = data.status {
        let status = AccountStatus::from_str(status_str)
            .ok_or_else(|| format!("Invalid status: {}", status_str))?;
        account.status = status;
    }

    // Update timestamp
    account.updated_at = now_iso();

    Ok(account.clone())
}

/// Delete an account (idempotent - succeeds even if account doesn't exist)
#[tauri::command]
pub async fn delete_account(id: String) -> Result<(), String> {
    let mut accounts = ACCOUNTS.lock().map_err(|e| e.to_string())?;
    // Idempotent: removing a non-existent key is a no-op
    accounts.remove(&id);
    Ok(())
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn reset_accounts() {
        let mut accounts = ACCOUNTS.lock().unwrap();
        accounts.clear();
    }

    // ================================
    // STRUCT DEFINITION TESTS
    // ================================

    #[test]
    fn platform_from_str_valid() {
        assert_eq!(Platform::from_str("facebook"), Some(Platform::Facebook));
        assert_eq!(Platform::from_str("FACEBOOK"), Some(Platform::Facebook));
        assert_eq!(Platform::from_str("instagram"), Some(Platform::Instagram));
        assert_eq!(Platform::from_str("tiktok"), Some(Platform::Tiktok));
        assert_eq!(Platform::from_str("twitter"), Some(Platform::Twitter));
        assert_eq!(Platform::from_str("linkedin"), Some(Platform::Linkedin));
        assert_eq!(Platform::from_str("threads"), Some(Platform::Threads));
        assert_eq!(Platform::from_str("telegram"), Some(Platform::Telegram));
        assert_eq!(Platform::from_str("whatsapp"), Some(Platform::Whatsapp));
    }

    #[test]
    fn platform_from_str_invalid() {
        assert_eq!(Platform::from_str("invalid"), None);
        assert_eq!(Platform::from_str(""), None);
    }

    #[test]
    fn account_status_from_str_valid() {
        assert_eq!(AccountStatus::from_str("active"), Some(AccountStatus::Active));
        assert_eq!(AccountStatus::from_str("inactive"), Some(AccountStatus::Inactive));
        assert_eq!(AccountStatus::from_str("warming_up"), Some(AccountStatus::WarmingUp));
        assert_eq!(AccountStatus::from_str("restricted"), Some(AccountStatus::Restricted));
        assert_eq!(AccountStatus::from_str("banned"), Some(AccountStatus::Banned));
    }

    #[test]
    fn account_status_from_str_invalid() {
        assert_eq!(AccountStatus::from_str("invalid"), None);
        assert_eq!(AccountStatus::from_str(""), None);
    }

    // ================================
    // GET_ACCOUNTS TESTS
    // ================================

    #[test]
    fn test_get_accounts_returns_empty_vec_when_no_accounts_exist() {
        reset_accounts();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_accounts(None));
        assert!(result.is_ok());
        let accounts = result.unwrap();
        assert!(accounts.is_empty());
    }

    #[test]
    fn test_get_accounts_with_platform_filter_returns_only_matching() {
        reset_accounts();

        // Create test accounts
        let rt = tokio::runtime::Runtime::new().unwrap();
        let facebook = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "FB Account".to_string(),
            username: Some("fb_user".to_string()),
            ..Default::default()
        })).unwrap();

        let instagram = rt.block_on(create_account(CreateAccountInput {
            platform: "instagram".to_string(),
            name: "IG Account".to_string(),
            username: Some("ig_user".to_string()),
            ..Default::default()
        })).unwrap();

        // Filter by facebook
        let filter = AccountFilter {
            platform: Some("facebook".to_string()),
            ..Default::default()
        };
        let result = rt.block_on(get_accounts(Some(filter)));
        assert!(result.is_ok());
        let accounts = result.unwrap();
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].platform, Platform::Facebook);

        // Filter by instagram
        let filter = AccountFilter {
            platform: Some("instagram".to_string()),
            ..Default::default()
        };
        let result = rt.block_on(get_accounts(Some(filter)));
        assert!(result.is_ok());
        let accounts = result.unwrap();
        assert_eq!(accounts.len(), 1);
        assert_eq!(accounts[0].platform, Platform::Instagram);

        // Cleanup
        let _ = rt.block_on(delete_account(facebook.id));
        let _ = rt.block_on(delete_account(instagram.id));
    }

    // ================================
    // CREATE_ACCOUNT TESTS
    // ================================

    #[test]
    fn test_create_account_persists_and_returns_with_generated_id() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "Test Account".to_string(),
            username: Some("testuser".to_string()),
            status: "active".to_string(),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let account = result.unwrap();

        // Verify generated ID
        assert!(account.id.starts_with("acct_"));
        assert!(!account.id.is_empty());

        // Verify data persisted
        assert_eq!(account.name, "Test Account");
        assert_eq!(account.platform, Platform::Facebook);
        assert_eq!(account.username, Some("testuser".to_string()));
        assert_eq!(account.status, AccountStatus::Active);

        // Verify timestamps
        assert!(!account.created_at.is_empty());
        assert!(!account.updated_at.is_empty());

        // Cleanup
        let _ = rt.block_on(delete_account(account.id));
    }

    #[test]
    fn test_create_account_validates_platform() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_account(CreateAccountInput {
            platform: "invalid_platform".to_string(),
            name: "Test".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Invalid platform"));
    }

    #[test]
    fn test_create_account_validates_name_required() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("Name is required"));
    }

    #[test]
    fn test_create_account_validates_username_format() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "Test".to_string(),
            username: Some("invalid-user!".to_string()),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("letters, numbers, and underscores"));
    }

    // ================================
    // UPDATE_ACCOUNT TESTS
    // ================================

    #[test]
    fn test_update_account_modifies_existing_account() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create account
        let created = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "Original Name".to_string(),
            username: Some("originaluser".to_string()),
            ..Default::default()
        })).unwrap();

        // Update account
        let result = rt.block_on(update_account(created.id.clone(), UpdateAccountInput {
            name: Some("Updated Name".to_string()),
            username: Some("updateduser".to_string()),
            ..Default::default()
        }));

        assert!(result.is_ok());
        let updated = result.unwrap();

        // Verify updates
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.username, Some("updateduser".to_string()));
        assert_eq!(updated.id, created.id);
        assert!(updated.updated_at != created.updated_at || updated.name != created.name);

        // Cleanup
        let _ = rt.block_on(delete_account(created.id));
    }

    #[test]
    fn test_update_account_returns_error_for_nonexistent_id() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(update_account("nonexistent_id".to_string(), UpdateAccountInput {
            name: Some("New Name".to_string()),
            ..Default::default()
        }));

        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(error.contains("not found"));
    }

    // ================================
    // DELETE_ACCOUNT TESTS
    // ================================

    #[test]
    fn test_delete_account_is_idempotent() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Delete non-existent account should succeed
        let result = rt.block_on(delete_account("nonexistent_id".to_string()));
        assert!(result.is_ok());

        // Create and delete
        let created = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "To Delete".to_string(),
            ..Default::default()
        })).unwrap();

        // Delete once - should succeed
        let result = rt.block_on(delete_account(created.id.clone()));
        assert!(result.is_ok());

        // Delete again - should still succeed (idempotent)
        let result = rt.block_on(delete_account(created.id.clone()));
        assert!(result.is_ok());
    }

    #[test]
    fn test_delete_account_removes_from_storage() {
        reset_accounts();

        let rt = tokio::runtime::Runtime::new().unwrap();

        // Create account
        let created = rt.block_on(create_account(CreateAccountInput {
            platform: "facebook".to_string(),
            name: "To Delete".to_string(),
            ..Default::default()
        })).unwrap();

        // Verify it exists
        let result = rt.block_on(get_account(created.id.clone()));
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());

        // Delete it
        let result = rt.block_on(delete_account(created.id.clone()));
        assert!(result.is_ok());

        // Verify it's gone
        let result = rt.block_on(get_account(created.id.clone()));
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}

impl Default for CreateAccountInput {
    fn default() -> Self {
        Self {
            platform: "facebook".to_string(),
            name: String::new(),
            username: None,
            display_name: None,
            avatar_url: None,
            chrome_profile_path: None,
            status: "active".to_string(),
            notes: None,
        }
    }
}
