//! Database module - SQLite connection pool and persistence layer
//!
//! This module provides database connection pool management using tauri-plugin-sql.
//! Replaces in-memory HashMaps with SQLite persistence for production reliability.
//!
//! # Modules
//! - `models`: Database models matching Prisma schema
//! - `persistence`: In-memory and SQLite persistence implementations
//! - `recovery`: Session recovery on app startup

pub mod models;
pub mod persistence;
pub mod recovery;

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

// Re-export main types for convenience
pub use models::{PostSessionModel, PostJobModel, SessionStatus, JobStatus, ErrorCategory};
pub use persistence::{InMemoryStore, InMemorySessionStore, InMemoryJobStore, SessionPersistence, JobPersistence};
pub use recovery::{recover_pending_sessions, RecoveryResult, RecoverySummary};

// ============================================
// DATABASE CONNECTION TYPES
// ============================================

/// Configuration for database connection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    /// Database URL (SQLite file path)
    pub url: String,
    /// Maximum number of connections in pool
    pub max_connections: u32,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "sqlite:social_pip.db".to_string(),
            max_connections: 5,
        }
    }
}

/// Database connection pool wrapper
/// 
/// This struct wraps the tauri-plugin-sql connection pool and provides
/// high-level database operations for the application.
pub struct DatabasePool {
    config: DatabaseConfig,
    /// Connection state - in production this would be a real SqlitePool
    /// For now, we use a simple state marker
    connected: Arc<Mutex<bool>>,
}

impl DatabasePool {
    /// Create a new database pool with the given configuration
    pub fn new(config: DatabaseConfig) -> Self {
        Self {
            config,
            connected: Arc::new(Mutex::new(false)),
        }
    }

    /// Connect to the database
    /// 
    /// # Errors
    /// Returns an error if connection fails
    pub async fn connect(&self) -> Result<(), String> {
        // In production, this would use tauri-plugin-sql to establish connection
        // For now, we just mark as connected
        let mut connected = self.connected.lock().await;
        *connected = true;
        Ok(())
    }

    /// Check if database is connected
    pub async fn is_connected(&self) -> bool {
        *self.connected.lock().await
    }

    /// Get the database URL
    pub fn url(&self) -> &str {
        &self.config.url
    }

    /// Get max connections
    pub fn max_connections(&self) -> u32 {
        self.config.max_connections
    }

    /// Close the database connection
    pub async fn close(&self) {
        let mut connected = self.connected.lock().await;
        *connected = false;
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // T-1.1.1: Test for database connection pool creation
    // ========================================

    #[test]
    fn test_database_pool_creation_with_default_config() {
        let config = DatabaseConfig::default();
        let pool = DatabasePool::new(config);
        
        assert_eq!(pool.url(), "sqlite:social_pip.db");
        assert_eq!(pool.max_connections(), 5);
    }

    #[test]
    fn test_database_pool_creation_with_custom_config() {
        let config = DatabaseConfig {
            url: "sqlite:custom.db".to_string(),
            max_connections: 10,
        };
        let pool = DatabasePool::new(config);
        
        assert_eq!(pool.url(), "sqlite:custom.db");
        assert_eq!(pool.max_connections(), 10);
    }

    #[tokio::test]
    async fn test_database_pool_connect_marks_as_connected() {
        let pool = DatabasePool::new(DatabaseConfig::default());
        
        // Initially not connected
        assert!(!pool.is_connected().await);
        
        // Connect
        let result = pool.connect().await;
        assert!(result.is_ok());
        
        // Now connected
        assert!(pool.is_connected().await);
    }

    #[tokio::test]
    async fn test_database_pool_close_disconnects() {
        let pool = DatabasePool::new(DatabaseConfig::default());
        
        // Connect first
        pool.connect().await.unwrap();
        assert!(pool.is_connected().await);
        
        // Close
        pool.close().await;
        
        // Now disconnected
        assert!(!pool.is_connected().await);
    }

    #[tokio::test]
    async fn test_database_pool_multiple_connections_safe() {
        let pool = Arc::new(DatabasePool::new(DatabaseConfig::default()));
        
        // Spawn multiple tasks trying to connect
        let handles: Vec<_> = (0..5)
            .map(|_| {
                let pool_clone = pool.clone();
                tokio::spawn(async move {
                    pool_clone.connect().await
                })
            })
            .collect();

        // All should succeed (idempotent connect)
        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.is_ok());
        }
        
        // Should be connected
        assert!(pool.is_connected().await);
    }
}
