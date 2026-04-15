//! Chrome Browser Launcher - Launch Chrome with custom parameters
//!
//! Provides functionality to:
//! - Build Chrome URLs with session metadata
//! - Launch Chrome via tauri-plugin-shell
//! - Pass handshake parameters to the extension

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Chrome launch parameters for extension handshake
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChromeParams {
    /// Session ID for this posting session
    pub session_id: String,
    /// Job ID being processed
    pub job_id: String,
    /// Target group URL
    pub group_url: String,
    /// Target platform (facebook, instagram, etc.)
    pub platform: String,
    /// Optional: Custom Chrome profile path
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile_path: Option<String>,
    /// Optional: Debug port for DevTools
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_port: Option<u16>,
}

/// Browser launcher configuration
#[derive(Debug, Clone)]
pub struct BrowserLauncher {
    /// Chrome executable path (auto-detected if None)
    chrome_path: Option<String>,
    /// Default debug port
    default_debug_port: u16,
}

impl Default for BrowserLauncher {
    fn default() -> Self {
        Self {
            chrome_path: None,
            default_debug_port: 9222,
        }
    }
}

impl BrowserLauncher {
    /// Create a new browser launcher
    pub fn new() -> Self {
        Self::default()
    }

    /// Set custom Chrome path
    pub fn with_chrome_path(mut self, path: String) -> Self {
        self.chrome_path = Some(path);
        self
    }

    /// Get Chrome executable path
    pub fn chrome_path(&self) -> Option<&str> {
        self.chrome_path.as_deref()
    }
}

/// Build a Chrome URL with session metadata for extension handshake
///
/// The extension detects these URL parameters and initiates a handshake:
/// - `sp_session_id`: Session identifier
/// - `sp_job_id`: Job identifier
/// - `sp_group_url`: Target group URL (URL-encoded)
/// - `sp_platform`: Target platform
/// - `sp_handshake`: Always "1" to signal handshake mode
///
/// # Example
/// ```rust
/// use social_pip_lib::browser::{build_chrome_url, ChromeParams};
///
/// let params = ChromeParams {
///     session_id: "sess_123".to_string(),
///     job_id: "job_456".to_string(),
///     group_url: "https://facebook.com/groups/123".to_string(),
///     platform: "facebook".to_string(),
///     profile_path: None,
///     debug_port: None,
/// };
///
/// let url = build_chrome_url(&params);
/// assert!(url.contains("sp_session_id=sess_123"));
/// assert!(url.contains("sp_handshake=1"));
/// ```
pub fn build_chrome_url(params: &ChromeParams) -> String {
    let mut url_params = HashMap::new();

    url_params.insert("sp_session_id", params.session_id.clone());
    url_params.insert("sp_job_id", params.job_id.clone());
    url_params.insert("sp_group_url", params.group_url.clone());
    url_params.insert("sp_platform", params.platform.clone());
    url_params.insert("sp_handshake", "1".to_string());

    // Build query string
    let query: Vec<String> = url_params
        .iter()
        .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
        .collect();

    format!("https://social-pip.local/handshake?{}", query.join("&"))
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // T-4.1: Test for browser module structure
    // ========================================

    #[test]
    fn test_browser_launcher_module_exists() {
        // Test that BrowserLauncher can be created
        let launcher = BrowserLauncher::new();
        assert!(launcher.chrome_path.is_none());
    }

    #[test]
    fn test_chrome_params_struct_exists() {
        let params = ChromeParams {
            session_id: "test_session".to_string(),
            job_id: "test_job".to_string(),
            group_url: "https://test.com".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        assert_eq!(params.session_id, "test_session");
        assert_eq!(params.job_id, "test_job");
    }

    #[test]
    fn test_browser_launcher_default_config() {
        let launcher = BrowserLauncher::new();

        assert!(launcher.chrome_path.is_none());
        assert_eq!(launcher.default_debug_port, 9222);
    }

    #[test]
    fn test_browser_launcher_with_custom_path() {
        let launcher =
            BrowserLauncher::new().with_chrome_path("/custom/path/to/chrome".to_string());

        assert!(launcher.chrome_path.is_some());
        assert_eq!(launcher.chrome_path(), Some("/custom/path/to/chrome"));
    }

    // ========================================
    // T-4.3: Test for Chrome launch params
    // ========================================

    #[test]
    fn test_build_chrome_url_includes_session_id() {
        let params = ChromeParams {
            session_id: "sess_12345".to_string(),
            job_id: "job_67890".to_string(),
            group_url: "https://facebook.com/groups/test".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        assert!(url.contains("sp_session_id=sess_12345"));
        assert!(url.contains("sp_handshake=1"));
    }

    #[test]
    fn test_build_chrome_url_includes_job_id() {
        let params = ChromeParams {
            session_id: "sess_123".to_string(),
            job_id: "job_456".to_string(),
            group_url: "https://test.com".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        assert!(url.contains("sp_job_id=job_456"));
    }

    #[test]
    fn test_build_chrome_url_includes_group_url() {
        let params = ChromeParams {
            session_id: "sess".to_string(),
            job_id: "job".to_string(),
            group_url: "https://facebook.com/groups/12345".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        // URL should be encoded
        assert!(url.contains("sp_group_url="));
        assert!(url.contains("facebook.com"));
    }

    #[test]
    fn test_build_chrome_url_includes_platform() {
        let params = ChromeParams {
            session_id: "sess".to_string(),
            job_id: "job".to_string(),
            group_url: "https://test.com".to_string(),
            platform: "instagram".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        assert!(url.contains("sp_platform=instagram"));
    }

    #[test]
    fn test_build_chrome_url_url_encodes_special_chars() {
        let params = ChromeParams {
            session_id: "sess with spaces".to_string(),
            job_id: "job/special&chars".to_string(),
            group_url: "https://test.com/path?query=value&other=123".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        // Spaces and special chars should be encoded
        assert!(url.contains("sess%20with%20spaces") || url.contains("sess+with+spaces"));
        assert!(!url.contains("sess with spaces"));
    }

    #[test]
    fn test_build_chrome_url_starts_with_handshake_base() {
        let params = ChromeParams {
            session_id: "sess".to_string(),
            job_id: "job".to_string(),
            group_url: "https://test.com".to_string(),
            platform: "facebook".to_string(),
            profile_path: None,
            debug_port: None,
        };

        let url = build_chrome_url(&params);

        assert!(url.starts_with("https://social-pip.local/handshake?"));
    }
}
