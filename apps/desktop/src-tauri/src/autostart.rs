//! Auto-Start Module
//!
//! This module provides auto-start functionality for Social-Pip:
//! - Enable/disable launch at login
//! - Check autostart status
//!
//! Platform Support:
//! - Windows: Registry entry
//! - macOS: Launch Agent or AppleScript
//! - Linux: Desktop entry

use serde::{Deserialize, Serialize};

// ============================================
// ERROR TYPES
// ============================================

/// Errors that can occur during autostart operations.
#[derive(Debug, thiserror::Error)]
pub enum AutostartError {
    /// Failed to enable autostart.
    #[error("Failed to enable autostart: {0}")]
    EnableFailed(String),

    /// Failed to disable autostart.
    #[error("Failed to disable autostart: {0}")]
    DisableFailed(String),

    /// Failed to check autostart status.
    #[error("Failed to check autostart status: {0}")]
    StatusCheckFailed(String),
}

// ============================================
// TYPES
// ============================================

/// Autostart status response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutostartStatus {
    /// Whether autostart is currently enabled.
    pub enabled: bool,
}

impl Default for AutostartStatus {
    fn default() -> Self {
        Self { enabled: false }
    }
}

// ============================================
// TAURI COMMANDS
// ============================================

/// Enable auto-start at login.
///
/// # Arguments
/// * `app` - Tauri app handle
///
/// # Returns
/// Result indicating success or error message
#[tauri::command]
pub fn enable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    let manager = app.autolaunch();
    manager
        .enable()
        .map_err(|e| format!("Failed to enable autostart: {}", e))
}

/// Disable auto-start at login.
///
/// # Arguments
/// * `app` - Tauri app handle
///
/// # Returns
/// Result indicating success or error message
#[tauri::command]
pub fn disable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    let manager = app.autolaunch();
    manager
        .disable()
        .map_err(|e| format!("Failed to disable autostart: {}", e))
}

/// Get the current autostart status.
///
/// # Arguments
/// * `app` - Tauri app handle
///
/// # Returns
/// Result with AutostartStatus or error message
#[tauri::command]
pub fn get_autostart_status(app: tauri::AppHandle) -> Result<AutostartStatus, String> {
    use tauri_plugin_autostart::ManagerExt;

    let manager = app.autolaunch();
    let enabled = manager
        .is_enabled()
        .map_err(|e| format!("Failed to check autostart status: {}", e))?;

    Ok(AutostartStatus { enabled })
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // TASK-5.1: AutostartError Tests
    // ========================================

    #[test]
    fn test_autostart_error_display_enable_failed() {
        let error = AutostartError::EnableFailed("registry error".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to enable autostart: registry error"
        );
    }

    #[test]
    fn test_autostart_error_display_disable_failed() {
        let error = AutostartError::DisableFailed("permission denied".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to disable autostart: permission denied"
        );
    }

    #[test]
    fn test_autostart_error_display_status_check_failed() {
        let error = AutostartError::StatusCheckFailed("registry access denied".to_string());
        assert_eq!(
            error.to_string(),
            "Failed to check autostart status: registry access denied"
        );
    }

    // ========================================
    // TASK-5.2: AutostartStatus Tests
    // ========================================

    #[test]
    fn test_autostart_status_default() {
        let status = AutostartStatus::default();
        assert!(!status.enabled);
    }

    #[test]
    fn test_autostart_status_disabled() {
        let status = AutostartStatus { enabled: false };
        assert!(!status.enabled);
    }

    #[test]
    fn test_autostart_status_enabled() {
        let status = AutostartStatus { enabled: true };
        assert!(status.enabled);
    }

    #[test]
    fn test_autostart_status_serialization() {
        let status = AutostartStatus { enabled: true };
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("true"));
        assert!(json.contains("enabled"));

        let parsed: AutostartStatus = serde_json::from_str(&json).unwrap();
        assert!(parsed.enabled);
    }

    #[test]
    fn test_autostart_status_deserialization() {
        let json = r#"{"enabled":false}"#;
        let status: AutostartStatus = serde_json::from_str(json).unwrap();
        assert!(!status.enabled);
    }

    // ========================================
    // TASK-5.3: Triangulation - Multiple Cases
    // ========================================

    #[test]
    fn test_autostart_status_can_be_toggled() {
        // Simulate toggle behavior
        let mut status = AutostartStatus { enabled: false };
        assert!(!status.enabled);

        // Enable
        status.enabled = true;
        assert!(status.enabled);

        // Disable
        status.enabled = false;
        assert!(!status.enabled);
    }

    #[test]
    fn test_autostart_status_json_roundtrip() {
        let original = AutostartStatus { enabled: true };
        let json = serde_json::to_string(&original).unwrap();
        let restored: AutostartStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(original.enabled, restored.enabled);
    }

    #[test]
    fn test_autostart_status_false_json_roundtrip() {
        let original = AutostartStatus { enabled: false };
        let json = serde_json::to_string(&original).unwrap();
        let restored: AutostartStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(original.enabled, restored.enabled);
    }

    // ========================================
    // TASK-5.4: Error Types Comprehensive Tests
    // ========================================

    #[test]
    fn test_all_autostart_errors_have_messages() {
        let errors = vec![
            AutostartError::EnableFailed("test".to_string()),
            AutostartError::DisableFailed("test".to_string()),
            AutostartError::StatusCheckFailed("test".to_string()),
        ];

        for error in errors {
            let msg = error.to_string();
            assert!(!msg.is_empty());
            assert!(msg.contains("Failed"));
        }
    }

    #[test]
    fn test_autostart_error_debug_impl() {
        let error = AutostartError::EnableFailed("test".to_string());
        let debug_output = format!("{:?}", error);
        assert!(debug_output.contains("EnableFailed"));
    }

    #[test]
    fn test_autostart_status_debug_impl() {
        let status = AutostartStatus { enabled: true };
        let debug_output = format!("{:?}", status);
        assert!(debug_output.contains("AutostartStatus"));
        assert!(debug_output.contains("enabled: true"));
    }
}
