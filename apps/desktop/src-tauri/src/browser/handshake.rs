//! Extension Handshake Manager - Detect and confirm extension connection
//!
//! Handles the handshake protocol between the desktop app and Chrome extension:
//! 1. Extension detects URL params (sp_session_id, sp_handshake=1)
//! 2. Extension connects via Native Messaging
//! 3. Extension sends HandshakeInit message
//! 4. Desktop confirms with HandshakeAck
//!
//! # Protocol
//! ```text
//! Extension → Desktop: { "type": "handshake_init", "session_id": "..." }
//! Desktop → Extension: { "type": "handshake_ack", "success": true }
//! Extension → Desktop: { "type": "ping" }
//! Desktop → Extension: { "pong": true }
//! ```

use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

/// Handshake status
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum HandshakeStatus {
    /// Waiting for extension to connect
    Pending,
    /// Extension connected, handshake in progress
    InProgress,
    /// Handshake completed successfully
    Completed,
    /// Handshake failed or timed out
    Failed,
}

/// Handshake configuration
#[derive(Debug, Clone)]
pub struct HandshakeConfig {
    /// Timeout for handshake completion (default: 30s)
    pub timeout_ms: u64,
    /// Number of ping retries before failure (default: 3)
    pub max_retries: u8,
    /// Interval between retries (default: 5s)
    pub retry_interval_ms: u64,
}

impl Default for HandshakeConfig {
    fn default() -> Self {
        Self {
            timeout_ms: 30_000,
            max_retries: 3,
            retry_interval_ms: 5_000,
        }
    }
}

/// Handshake message from extension
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HandshakeMessage {
    /// Extension initiates handshake
    HandshakeInit {
        session_id: String,
        extension_version: String,
    },
    /// Extension confirms ready
    Ready { session_id: String },
    /// Ping for health check
    Ping,
}

/// Handshake response to extension
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HandshakeResponse {
    /// Acknowledge handshake
    HandshakeAck { success: bool, session_id: String },
    /// Pong response
    Pong { pong: bool },
    /// Error response
    Error { message: String },
}

/// Handshake manager - coordinates handshake with extension
#[derive(Debug)]
pub struct HandshakeManager {
    /// Configuration
    config: HandshakeConfig,
    /// Current status
    status: HandshakeStatus,
    /// Session ID being tracked
    session_id: Option<String>,
    /// Timestamp when handshake started
    started_at: Option<Instant>,
}

impl HandshakeManager {
    /// Create a new handshake manager
    pub fn new() -> Self {
        Self::with_config(HandshakeConfig::default())
    }

    /// Create with custom configuration
    pub fn with_config(config: HandshakeConfig) -> Self {
        Self {
            config,
            status: HandshakeStatus::Pending,
            session_id: None,
            started_at: None,
        }
    }

    /// Get current status
    pub fn status(&self) -> HandshakeStatus {
        self.status
    }

    /// Get session ID
    pub fn session_id(&self) -> Option<&str> {
        self.session_id.as_deref()
    }

    /// Start handshake for a session
    pub fn start_handshake(&mut self, session_id: String) {
        self.session_id = Some(session_id);
        self.status = HandshakeStatus::InProgress;
        self.started_at = Some(Instant::now());
    }

    /// Check if handshake has timed out
    pub fn is_timed_out(&self) -> bool {
        if let Some(started_at) = self.started_at {
            let elapsed = started_at.elapsed();
            return elapsed > Duration::from_millis(self.config.timeout_ms);
        }
        false
    }

    /// Complete handshake successfully
    pub fn complete(&mut self) {
        self.status = HandshakeStatus::Completed;
    }

    /// Mark handshake as failed
    pub fn fail(&mut self) {
        self.status = HandshakeStatus::Failed;
    }

    /// Process a handshake message from the extension
    pub fn process_message(&mut self, message: HandshakeMessage) -> HandshakeResponse {
        match message {
            HandshakeMessage::HandshakeInit {
                session_id,
                extension_version: _,
            } => {
                // Validate session ID matches
                if let Some(ref expected_id) = self.session_id {
                    if expected_id != &session_id {
                        return HandshakeResponse::Error {
                            message: "Session ID mismatch".to_string(),
                        };
                    }
                }

                // Acknowledge handshake
                HandshakeResponse::HandshakeAck {
                    success: true,
                    session_id,
                }
            }
            HandshakeMessage::Ready { session_id: _ } => {
                // Extension is ready
                self.complete();
                HandshakeResponse::Pong { pong: true }
            }
            HandshakeMessage::Ping => HandshakeResponse::Pong { pong: true },
        }
    }
}

impl Default for HandshakeManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // T-4.5: Test for extension handshake detection
    // ========================================

    #[test]
    fn test_handshake_manager_module_exists() {
        let manager = HandshakeManager::new();
        assert_eq!(manager.status(), HandshakeStatus::Pending);
    }

    #[test]
    fn test_handshake_config_default_values() {
        let config = HandshakeConfig::default();

        assert_eq!(config.timeout_ms, 30_000);
        assert_eq!(config.max_retries, 3);
        assert_eq!(config.retry_interval_ms, 5_000);
    }

    #[test]
    fn test_handshake_status_initial_state() {
        let manager = HandshakeManager::new();
        assert_eq!(manager.status(), HandshakeStatus::Pending);
        assert!(manager.session_id().is_none());
    }

    #[test]
    fn test_handshake_start_transitions_to_in_progress() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_123".to_string());

        assert_eq!(manager.status(), HandshakeStatus::InProgress);
        assert_eq!(manager.session_id(), Some("sess_123"));
    }

    #[test]
    fn test_handshake_complete_transitions_to_completed() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_123".to_string());
        manager.complete();

        assert_eq!(manager.status(), HandshakeStatus::Completed);
    }

    #[test]
    fn test_handshake_fail_transitions_to_failed() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_123".to_string());
        manager.fail();

        assert_eq!(manager.status(), HandshakeStatus::Failed);
    }

    #[test]
    fn test_handshake_process_handshake_init() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_456".to_string());

        let message = HandshakeMessage::HandshakeInit {
            session_id: "sess_456".to_string(),
            extension_version: "1.0.0".to_string(),
        };

        let response = manager.process_message(message);

        match response {
            HandshakeResponse::HandshakeAck {
                success,
                session_id,
            } => {
                assert!(success);
                assert_eq!(session_id, "sess_456");
            }
            _ => panic!("Expected HandshakeAck response"),
        }
    }

    #[test]
    fn test_handshake_process_ping() {
        let mut manager = HandshakeManager::new();

        let message = HandshakeMessage::Ping;
        let response = manager.process_message(message);

        match response {
            HandshakeResponse::Pong { pong } => {
                assert!(pong);
            }
            _ => panic!("Expected Pong response"),
        }
    }

    #[test]
    fn test_handshake_session_id_mismatch() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_expected".to_string());

        let message = HandshakeMessage::HandshakeInit {
            session_id: "sess_wrong".to_string(),
            extension_version: "1.0.0".to_string(),
        };

        let response = manager.process_message(message);

        match response {
            HandshakeResponse::Error { message } => {
                assert!(message.contains("Session ID mismatch"));
            }
            _ => panic!("Expected Error response"),
        }
    }

    #[test]
    fn test_handshake_ready_completes_handshake() {
        let mut manager = HandshakeManager::new();
        manager.start_handshake("sess_789".to_string());

        assert_eq!(manager.status(), HandshakeStatus::InProgress);

        let message = HandshakeMessage::Ready {
            session_id: "sess_789".to_string(),
        };

        let _response = manager.process_message(message);

        assert_eq!(manager.status(), HandshakeStatus::Completed);
    }

    #[test]
    fn test_handshake_timeout_detection() {
        let mut manager = HandshakeManager::with_config(HandshakeConfig {
            timeout_ms: 10, // 10ms timeout
            ..Default::default()
        });

        manager.start_handshake("sess_timeout".to_string());

        // Should not be timed out immediately
        assert!(!manager.is_timed_out());

        // Wait for timeout
        std::thread::sleep(std::time::Duration::from_millis(20));

        // Now should be timed out
        assert!(manager.is_timed_out());
    }

    #[test]
    fn test_handshake_message_serialization() {
        let msg = HandshakeMessage::HandshakeInit {
            session_id: "sess_123".to_string(),
            extension_version: "1.0.0".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("handshake_init"));
        assert!(json.contains("sess_123"));
    }

    #[test]
    fn test_handshake_response_serialization() {
        let response = HandshakeResponse::HandshakeAck {
            success: true,
            session_id: "sess_456".to_string(),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("handshake_ack"));
        assert!(json.contains("sess_456"));
    }

    #[test]
    fn test_handshake_with_custom_config() {
        let config = HandshakeConfig {
            timeout_ms: 60_000,
            max_retries: 5,
            retry_interval_ms: 10_000,
        };

        let manager = HandshakeManager::with_config(config);
        assert_eq!(manager.config.timeout_ms, 60_000);
        assert_eq!(manager.config.max_retries, 5);
    }
}
