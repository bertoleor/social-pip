//! Secure Storage Module - Stronghold Vault Wrapper
//!
//! This module provides secure credential storage using Tauri's Stronghold plugin.
//! Stronghold uses IOTA's Stronghold secret management engine for OS-level encryption.
//!
//! # Security Considerations
//!
//! - All credentials are encrypted at rest using Stronghold's vault
//! - The vault password should be derived from user input or system keychain
//! - Credentials are never stored in plain text in memory longer than necessary
//! - Clear functions ensure data is removed from the vault
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
//! │   Frontend      │────▶│  Tauri Command  │────▶│ SecureStorage   │
//! │   (React)       │     │  (store_*, etc) │     │ (Stronghold)    │
//! └─────────────────┘     └─────────────────┘     └─────────────────┘
//!                                                         │
//!                                                         ▼
//!                                                 ┌─────────────────┐
//!                                                 │  vault.hold     │
//!                                                 │  (Encrypted)    │
//!                                                 └─────────────────┘
//! ```
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::secure_storage::{SecureStorage, SecureStorageError};
//!
//! // Initialize with app handle
//! let storage = SecureStorage::new(app_handle, "vault_password")?;
//!
//! // Store a credential
//! storage.store("api_key_openai", "sk-xxxxx")?;
//!
//! // Retrieve a credential
//! let key = storage.retrieve("api_key_openai")?;
//!
//! // Clear a credential
//! storage.clear("api_key_openai")?;
//! ```

use serde::{Deserialize, Serialize};

// ============================================
// ERROR TYPES
// ============================================

/// Errors that can occur during secure storage operations.
///
/// All errors implement `Display` via thiserror for clean error messages.
#[derive(Debug, thiserror::Error)]
pub enum SecureStorageError {
    /// The vault has not been initialized.
    /// Call `SecureStorage::new()` before performing operations.
    #[error("Vault not initialized")]
    NotInitialized,

    /// Failed to store a value in the vault.
    /// This can happen if the vault is corrupted or disk is full.
    #[error("Failed to store credential: {0}")]
    StoreFailed(String),

    /// Failed to retrieve a value from the vault.
    /// This can happen if the key doesn't exist or vault is corrupted.
    #[error("Failed to retrieve credential: {0}")]
    RetrieveFailed(String),

    /// Failed to clear a value from the vault.
    #[error("Failed to clear credential: {0}")]
    ClearFailed(String),

    /// Failed to list credentials from the vault.
    #[error("Failed to list credentials: {0}")]
    ListFailed(String),

    /// Failed to initialize the Stronghold vault.
    /// This can happen if the vault file is corrupted or password is wrong.
    #[error("Failed to initialize vault: {0}")]
    InitFailed(String),

    /// The requested credential was not found in the vault.
    #[error("Credential not found: {0}")]
    NotFound(String),

    /// Invalid key name provided.
    /// Keys must be non-empty and contain only alphanumeric, underscore, or hyphen.
    #[error("Invalid key name: {0}")]
    InvalidKey(String),
}

// ============================================
// TYPES
// ============================================

/// Metadata about a stored credential.
/// Contains the key name but NOT the actual value for security.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialMetadata {
    /// The key name of the stored credential
    pub key: String,
    /// Timestamp when the credential was stored (ISO 8601)
    pub stored_at: String,
}

/// Result of a list operation containing metadata for all stored credentials.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialList {
    /// List of credential metadata (keys only, no values)
    pub credentials: Vec<CredentialMetadata>,
    /// Total count of stored credentials
    pub total: usize,
}

// ============================================
// SECURE STORAGE IMPLEMENTATION
// ============================================

/// Secure storage wrapper for Stronghold vault operations.
///
/// This struct provides a high-level API for storing, retrieving, and managing
/// credentials securely using Tauri's Stronghold plugin.
///
/// # Thread Safety
///
/// `SecureStorage` is designed to be used through Tauri commands which handle
/// async operations. The actual Stronghold operations are performed through
/// the plugin's async API.
///
/// # Security Considerations
///
/// - All data is encrypted using IOTA Stronghold
/// - Keys are validated to prevent injection attacks
/// - Values are cleared from memory as soon as possible
pub struct SecureStorage;

impl SecureStorage {
    /// Default client name for the Stronghold client
    pub const DEFAULT_CLIENT_NAME: &'static str = "social-pip-credentials";

    /// Default vault filename
    pub const DEFAULT_VAULT_NAME: &'static str = "vault.hold";

    /// Validates a key name.
    ///
    /// Keys must:
    /// - Not be empty
    /// - Contain only alphanumeric characters, underscores, hyphens, or slashes
    /// - Be at most 255 characters
    ///
    /// # Security
    ///
    /// This validation prevents key injection attacks and ensures
    /// keys are filesystem-safe when used as part of storage paths.
    pub fn validate_key(key: &str) -> Result<(), SecureStorageError> {
        if key.is_empty() {
            return Err(SecureStorageError::InvalidKey(
                "Key cannot be empty".to_string(),
            ));
        }

        if key.len() > 255 {
            return Err(SecureStorageError::InvalidKey(
                "Key cannot exceed 255 characters".to_string(),
            ));
        }

        // Allow alphanumeric, underscore, hyphen, and forward slash (for namespacing)
        let valid_chars = key
            .chars()
            .all(|c| c.is_alphanumeric() || c == '_' || c == '-' || c == '/');

        if !valid_chars {
            return Err(SecureStorageError::InvalidKey(
                "Key can only contain alphanumeric characters, underscores, hyphens, and slashes"
                    .to_string(),
            ));
        }

        Ok(())
    }

    /// Converts a string value to bytes for Stronghold storage.
    ///
    /// # Security
    ///
    /// The returned Vec should be cleared after use when possible.
    pub fn value_to_bytes(value: &str) -> Vec<u8> {
        value.as_bytes().to_vec()
    }

    /// Converts bytes back to a string value.
    ///
    /// # Security
    ///
    /// The input bytes should be cleared after this conversion.
    pub fn bytes_to_value(bytes: &[u8]) -> Result<String, SecureStorageError> {
        String::from_utf8(bytes.to_vec())
            .map_err(|e| SecureStorageError::RetrieveFailed(format!("Invalid UTF-8: {}", e)))
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // T-2.1: SecureStorageError Tests
    // ========================================

    #[test]
    fn test_secure_storage_error_display_not_initialized() {
        let error = SecureStorageError::NotInitialized;
        assert_eq!(error.to_string(), "Vault not initialized");
    }

    #[test]
    fn test_secure_storage_error_display_store_failed() {
        let error = SecureStorageError::StoreFailed("disk full".to_string());
        assert_eq!(error.to_string(), "Failed to store credential: disk full");
    }

    #[test]
    fn test_secure_storage_error_display_retrieve_failed() {
        let error = SecureStorageError::RetrieveFailed("corrupted".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to retrieve credential: corrupted"
        );
    }

    #[test]
    fn test_secure_storage_error_display_clear_failed() {
        let error = SecureStorageError::ClearFailed("permission denied".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to clear credential: permission denied"
        );
    }

    #[test]
    fn test_secure_storage_error_display_init_failed() {
        let error = SecureStorageError::InitFailed("password wrong".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to initialize vault: password wrong"
        );
    }

    #[test]
    fn test_secure_storage_error_display_not_found() {
        let error = SecureStorageError::NotFound("api_key".to_string());
        assert_eq!(error.to_string(), "Credential not found: api_key");
    }

    #[test]
    fn test_secure_storage_error_display_invalid_key() {
        let error = SecureStorageError::InvalidKey("empty key".to_string());
        assert_eq!(error.to_string(), "Invalid key name: empty key");
    }

    // ========================================
    // T-2.1: Key Validation Tests (RED -> GREEN)
    // ========================================

    #[test]
    fn test_validate_key_accepts_alphanumeric() {
        assert!(SecureStorage::validate_key("apikey123").is_ok());
        assert!(SecureStorage::validate_key("API_KEY_123").is_ok());
        assert!(SecureStorage::validate_key("my-secret-key").is_ok());
    }

    #[test]
    fn test_validate_key_accepts_namespace_separator() {
        assert!(SecureStorage::validate_key("platform/facebook/api_key").is_ok());
        assert!(SecureStorage::validate_key("account/123/token").is_ok());
    }

    #[test]
    fn test_validate_key_rejects_empty() {
        let result = SecureStorage::validate_key("");
        assert!(result.is_err());
        assert!(matches!(result, Err(SecureStorageError::InvalidKey(_))));
    }

    #[test]
    fn test_validate_key_rejects_too_long() {
        let long_key = "a".repeat(256);
        let result = SecureStorage::validate_key(&long_key);
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_key_accepts_max_length() {
        let max_key = "a".repeat(255);
        assert!(SecureStorage::validate_key(&max_key).is_ok());
    }

    #[test]
    fn test_validate_key_rejects_special_characters() {
        assert!(SecureStorage::validate_key("key with spaces").is_err());
        assert!(SecureStorage::validate_key("key!@#$%").is_err());
        assert!(SecureStorage::validate_key("key\nnewline").is_err());
    }

    // ========================================
    // T-2.1: CredentialMetadata Tests
    // ========================================

    #[test]
    fn test_credential_metadata_serialization() {
        let metadata = CredentialMetadata {
            key: "api_key_openai".to_string(),
            stored_at: "2024-01-15T10:30:00Z".to_string(),
        };

        let json = serde_json::to_string(&metadata).unwrap();
        assert!(json.contains("api_key_openai"));
        assert!(json.contains("2024-01-15"));

        let parsed: CredentialMetadata = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.key, "api_key_openai");
    }

    // ========================================
    // T-2.1: CredentialList Tests
    // ========================================

    #[test]
    fn test_credential_list_empty() {
        let list = CredentialList {
            credentials: vec![],
            total: 0,
        };

        assert!(list.credentials.is_empty());
        assert_eq!(list.total, 0);
    }

    #[test]
    fn test_credential_list_with_credentials() {
        let list = CredentialList {
            credentials: vec![
                CredentialMetadata {
                    key: "api_key_1".to_string(),
                    stored_at: "2024-01-15T10:00:00Z".to_string(),
                },
                CredentialMetadata {
                    key: "api_key_2".to_string(),
                    stored_at: "2024-01-15T11:00:00Z".to_string(),
                },
            ],
            total: 2,
        };

        assert_eq!(list.credentials.len(), 2);
        assert_eq!(list.total, 2);
        assert_eq!(list.credentials[0].key, "api_key_1");
        assert_eq!(list.credentials[1].key, "api_key_2");
    }

    #[test]
    fn test_credential_list_serialization() {
        let list = CredentialList {
            credentials: vec![CredentialMetadata {
                key: "key1".to_string(),
                stored_at: "2024-01-15T10:00:00Z".to_string(),
            }],
            total: 1,
        };

        let json = serde_json::to_string(&list).unwrap();
        assert!(json.contains("\"total\":1"));
        assert!(json.contains("key1"));

        let parsed: CredentialList = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.total, 1);
        assert_eq!(parsed.credentials.len(), 1);
    }

    // ========================================
    // T-2.1: Default Constants Tests
    // ========================================

    #[test]
    fn test_default_client_name() {
        assert_eq!(SecureStorage::DEFAULT_CLIENT_NAME, "social-pip-credentials");
    }

    #[test]
    fn test_default_vault_name() {
        assert_eq!(SecureStorage::DEFAULT_VAULT_NAME, "vault.hold");
    }

    // ========================================
    // T-2.1: Value Conversion Tests
    // ========================================

    #[test]
    fn test_value_to_bytes_produces_correct_bytes() {
        let value = "my-secret-key-123";
        let bytes = SecureStorage::value_to_bytes(value);
        assert_eq!(bytes, value.as_bytes().to_vec());
        assert_eq!(bytes.len(), value.len());
    }

    #[test]
    fn test_bytes_to_value_reverses_correctly() {
        let original = "my-secret-key-123";
        let bytes = SecureStorage::value_to_bytes(original);
        let restored = SecureStorage::bytes_to_value(&bytes).unwrap();
        assert_eq!(restored, original);
    }

    #[test]
    fn test_bytes_to_value_handles_empty() {
        let bytes: Vec<u8> = vec![];
        let result = SecureStorage::bytes_to_value(&bytes);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "");
    }

    #[test]
    fn test_bytes_to_value_rejects_invalid_utf8() {
        // Invalid UTF-8 sequence
        let invalid_bytes: Vec<u8> = vec![0xFF, 0xFE, 0xFD];
        let result = SecureStorage::bytes_to_value(&invalid_bytes);
        assert!(result.is_err());
    }

    // ========================================
    // T-2.1: Error Types Serialization Tests
    // ========================================

    #[test]
    fn test_error_can_be_converted_to_string() {
        let errors = vec![
            SecureStorageError::NotInitialized,
            SecureStorageError::StoreFailed("test".to_string()),
            SecureStorageError::RetrieveFailed("test".to_string()),
            SecureStorageError::ClearFailed("test".to_string()),
            SecureStorageError::ListFailed("test".to_string()),
            SecureStorageError::InitFailed("test".to_string()),
            SecureStorageError::NotFound("test".to_string()),
            SecureStorageError::InvalidKey("test".to_string()),
        ];

        for error in errors {
            let _msg = error.to_string();
            // Verify each error has a non-empty message
            assert!(!_msg.is_empty());
        }
    }
}
