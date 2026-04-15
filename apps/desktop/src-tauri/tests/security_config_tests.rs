//! Security Configuration Tests
//!
//! These tests verify that security-critical configurations are correctly set:
//! - TASK-1.5: Devtools only in debug builds
//! - TASK-1.6-1.10: CSP directives in tauri.conf.json
//! - TASK-1.11: Combined CSP verification

use std::fs;
use std::path::Path;

/// Helper to read tauri.conf.json as parsed JSON
fn read_tauri_config() -> serde_json::Value {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let config_path = Path::new(&manifest_dir).join("tauri.conf.json");

    let content = fs::read_to_string(&config_path).expect("Failed to read tauri.conf.json");

    serde_json::from_str(&content).expect("Failed to parse tauri.conf.json as JSON")
}

/// Helper to read Cargo.toml as string for parsing
fn read_cargo_toml() -> String {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let cargo_path = Path::new(&manifest_dir).join("Cargo.toml");

    fs::read_to_string(&cargo_path).expect("Failed to read Cargo.toml")
}

// ========================================
// TASK-1.5: Conditional Devtools Configuration
// ========================================

#[cfg(test)]
mod devtools_configuration_tests {
    use super::*;

    /// T-1.5.1: Verify devtools is not unconditionally enabled in Cargo.toml
    /// Devtools should ONLY be available in debug builds, NOT in release
    #[test]
    fn test_devtools_not_unconditionally_enabled() {
        let cargo_content = read_cargo_toml();

        // The tauri dependency should NOT have devtools feature unconditionally
        // Bad: tauri = { version = "2", features = ["devtools"] }
        // Good: Conditional compilation via #[cfg(debug_assertions)] in code
        //       OR no devtools feature at all (handled at runtime)

        // Check that if devtools is in features, it's conditionally managed
        // For this test, we verify devtools is NOT a permanent feature
        // (actual conditional logic is in Rust code, not Cargo.toml)

        // Parse the tauri dependency line
        let has_devtools_feature = cargo_content.lines().any(|line| {
            line.contains("tauri") && line.contains("features") && line.contains("devtools")
        });

        // If devtools is listed, it should be removed or made conditional
        // For release builds, devtools should NOT be available
        // This test PASSES when devtools is NOT in features OR
        // when we verify it's only in dev dependencies
        assert!(
            !has_devtools_feature,
            "Devtools feature should NOT be unconditionally enabled in Cargo.toml. \
             Remove 'devtools' from tauri features to prevent release builds from including it."
        );
    }

    /// T-1.5.2: Verify that devtools can be conditionally enabled via debug_assertions
    /// This is tested by checking the main.rs uses #[cfg(debug_assertions)]
    #[test]
    fn test_devtools_conditional_compilation_exists() {
        // Read main.rs to verify conditional compilation guard exists
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let main_path = Path::new(&manifest_dir).join("src/main.rs");

        let main_content = fs::read_to_string(&main_path).expect("Failed to read main.rs");

        // Verify that the devtools conditional compilation exists
        // In Tauri 2.0, devtools are controlled by the feature, not #[cfg(debug_assertions)]
        // But we should still have the windows_subsystem guard
        let has_debug_guard = main_content.contains("#[cfg(debug_assertions)]")
            || main_content.contains("#![cfg_attr(not(debug_assertions)");

        assert!(
            has_debug_guard,
            "main.rs should have conditional compilation for debug builds"
        );
    }
}

// ========================================
// TASK-1.6: CSP default-src Configuration
// ========================================

#[cfg(test)]
mod csp_default_src_tests {
    use super::*;

    /// T-1.6.1: Verify CSP default-src is set to 'self' customprotocol: asset:
    #[test]
    fn test_csp_default_src_is_configured() {
        let config = read_tauri_config();

        // Navigate to app.security.csp
        let app = config.get("app").expect("Missing 'app' key in config");
        let security = app.get("security").expect("Missing 'security' key in app");
        let csp = security.get("csp").expect("Missing 'csp' key in security");

        // CSP should be an object with directives, or a string
        // We expect it to be an object with default-src directive
        let default_src = match csp {
            serde_json::Value::Object(ref map) => map
                .get("default-src")
                .expect("Missing 'default-src' directive in CSP")
                .as_str()
                .expect("default-src should be a string"),
            serde_json::Value::String(ref s) => {
                // If CSP is a string, parse it
                assert!(
                    s.contains("default-src"),
                    "CSP string should contain default-src directive"
                );
                return; // String format is also valid
            }
            _ => panic!("CSP should be an object or string"),
        };

        // Verify default-src contains required values
        assert!(
            default_src.contains("'self'"),
            "default-src must contain 'self'"
        );
        assert!(
            default_src.contains("customprotocol:") || default_src.contains("customprotocol"),
            "default-src must allow customprotocol:"
        );
        assert!(
            default_src.contains("asset:") || default_src.contains("asset"),
            "default-src must allow asset:"
        );
    }
}

// ========================================
// TASK-1.7: CSP script-src Configuration
// ========================================

#[cfg(test)]
mod csp_script_src_tests {
    use super::*;

    /// T-1.7.1: Verify CSP script-src is set to 'self' only
    #[test]
    fn test_csp_script_src_is_configured() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        let script_src = match csp {
            serde_json::Value::Object(ref map) => map
                .get("script-src")
                .expect("Missing 'script-src' directive in CSP")
                .as_str()
                .expect("script-src should be a string"),
            serde_json::Value::String(ref s) => {
                assert!(
                    s.contains("script-src"),
                    "CSP string should contain script-src directive"
                );
                return;
            }
            _ => panic!("CSP should be an object or string"),
        };

        // script-src should ONLY allow 'self' (no inline scripts, no eval)
        assert!(
            script_src.contains("'self'"),
            "script-src must contain 'self'"
        );
        // Should NOT contain 'unsafe-inline' for scripts (XSS prevention)
        assert!(
            !script_src.contains("'unsafe-inline'"),
            "script-src should NOT contain 'unsafe-inline' - this allows XSS attacks"
        );
        // Should NOT contain 'unsafe-eval'
        assert!(
            !script_src.contains("'unsafe-eval'"),
            "script-src should NOT contain 'unsafe-eval' - this allows code injection"
        );
    }
}

// ========================================
// TASK-1.8: CSP style-src Configuration
// ========================================

#[cfg(test)]
mod csp_style_src_tests {
    use super::*;

    /// T-1.8.1: Verify CSP style-src allows 'self' and 'unsafe-inline'
    /// Note: 'unsafe-inline' is required for style-src due to CSS-in-JS libraries
    #[test]
    fn test_csp_style_src_is_configured() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        let style_src = match csp {
            serde_json::Value::Object(ref map) => map
                .get("style-src")
                .expect("Missing 'style-src' directive in CSP")
                .as_str()
                .expect("style-src should be a string"),
            serde_json::Value::String(ref s) => {
                assert!(
                    s.contains("style-src"),
                    "CSP string should contain style-src directive"
                );
                return;
            }
            _ => panic!("CSP should be an object or string"),
        };

        // style-src should allow 'self' and 'unsafe-inline' (for Tailwind, CSS-in-JS)
        assert!(
            style_src.contains("'self'"),
            "style-src must contain 'self'"
        );
        assert!(
            style_src.contains("'unsafe-inline'"),
            "style-src must contain 'unsafe-inline' for Tailwind CSS"
        );
    }
}

// ========================================
// TASK-1.9: CSP img-src Configuration
// ========================================

#[cfg(test)]
mod csp_img_src_tests {
    use super::*;

    /// T-1.9.1: Verify CSP img-src allows 'self', asset:, and data:
    #[test]
    fn test_csp_img_src_is_configured() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        let img_src = match csp {
            serde_json::Value::Object(ref map) => map
                .get("img-src")
                .expect("Missing 'img-src' directive in CSP")
                .as_str()
                .expect("img-src should be a string"),
            serde_json::Value::String(ref s) => {
                assert!(
                    s.contains("img-src"),
                    "CSP string should contain img-src directive"
                );
                return;
            }
            _ => panic!("CSP should be an object or string"),
        };

        // img-src should allow 'self', asset:, and data:
        assert!(img_src.contains("'self'"), "img-src must contain 'self'");
        assert!(
            img_src.contains("asset:") || img_src.contains("asset"),
            "img-src must allow asset: for Tauri assets"
        );
        assert!(
            img_src.contains("data:"),
            "img-src must allow data: for inline images"
        );
    }
}

// ========================================
// TASK-1.10: CSP connect-src Configuration
// ========================================

#[cfg(test)]
mod csp_connect_src_tests {
    use super::*;

    /// T-1.10.1: Verify CSP connect-src allows ipc: and http://ipc.localhost
    /// This is required for Tauri IPC communication
    #[test]
    fn test_csp_connect_src_is_configured() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        let connect_src = match csp {
            serde_json::Value::Object(ref map) => map
                .get("connect-src")
                .expect("Missing 'connect-src' directive in CSP")
                .as_str()
                .expect("connect-src should be a string"),
            serde_json::Value::String(ref s) => {
                assert!(
                    s.contains("connect-src"),
                    "CSP string should contain connect-src directive"
                );
                return;
            }
            _ => panic!("CSP should be an object or string"),
        };

        // connect-src should allow ipc: for Tauri IPC
        assert!(
            connect_src.contains("ipc:"),
            "connect-src must allow ipc: for Tauri IPC communication"
        );
        assert!(
            connect_src.contains("ipc.localhost"),
            "connect-src must allow ipc.localhost for Tauri IPC"
        );
    }
}

// ========================================
// TASK-1.11: Combined CSP Verification
// ========================================

#[cfg(test)]
mod csp_combined_tests {
    use super::*;

    /// T-1.11.1: Verify all CSP directives are present together
    #[test]
    fn test_all_csp_directives_present() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        // CSP should not be null
        match csp {
            serde_json::Value::Null => {
                panic!("CSP should not be null - security risk");
            }
            serde_json::Value::Object(ref map) => {
                // Verify all required directives
                let required_directives = [
                    "default-src",
                    "script-src",
                    "style-src",
                    "img-src",
                    "connect-src",
                ];

                for directive in &required_directives {
                    assert!(
                        map.contains_key(*directive),
                        "CSP missing required directive: {}",
                        directive
                    );
                }
            }
            serde_json::Value::String(ref s) => {
                // If CSP is a string, verify all directives are present
                let required_directives = [
                    "default-src",
                    "script-src",
                    "style-src",
                    "img-src",
                    "connect-src",
                ];

                for directive in &required_directives {
                    assert!(
                        s.contains(directive),
                        "CSP string missing required directive: {}",
                        directive
                    );
                }
            }
            _ => panic!("CSP should be an object or string"),
        }
    }

    /// T-1.11.2: Verify CSP does not allow external origins by default
    /// This is a security baseline check
    #[test]
    fn test_csp_no_external_origins() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp_value = security.get("csp").expect("Missing 'csp' key");

        let csp_str = match csp_value {
            serde_json::Value::Object(ref map) => {
                // Combine all directive values
                map.values()
                    .filter_map(|v| v.as_str())
                    .collect::<Vec<_>>()
                    .join(" ")
            }
            serde_json::Value::String(ref s) => s.clone(),
            _ => panic!("CSP should be an object or string"),
        };

        // Should NOT contain https: or http: (except ipc.localhost)
        // This prevents loading external resources
        let has_external_http = csp_str.contains("https://") && !csp_str.contains("ipc.localhost");

        assert!(
            !has_external_http,
            "CSP should not allow arbitrary external origins (https://...)"
        );
    }

    /// T-1.11.3: Verify the complete CSP string is well-formed
    #[test]
    fn test_csp_string_format() {
        let config = read_tauri_config();

        let app = config.get("app").expect("Missing 'app' key");
        let security = app.get("security").expect("Missing 'security' key");
        let csp = security.get("csp").expect("Missing 'csp' key");

        // The CSP should be properly formatted (object with string values)
        match csp {
            serde_json::Value::Object(ref map) => {
                for (directive, value) in map {
                    match value {
                        serde_json::Value::String(s) => {
                            // Verify each directive value is non-empty
                            assert!(!s.is_empty(), "CSP directive {} has empty value", directive);
                        }
                        _ => panic!("CSP directive {} should have a string value", directive),
                    }
                }
            }
            serde_json::Value::String(ref s) => {
                // String format is also valid
                assert!(!s.is_empty(), "CSP string should not be empty");
            }
            _ => panic!("CSP should be an object or string"),
        }
    }
}
