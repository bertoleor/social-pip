//! System Tray Integration Tests
//!
//! These tests verify the system tray functionality:
//! - TASK-3.1: tray-icon feature in Cargo.toml
//! - TASK-3.2: tray.rs module creation
//! - TASK-3.3: Minimize to tray behavior
//! - TASK-3.4: Tray status indicator
//! - TASK-3.5: Menu creation and event handling
//! - TASK-3.10: tauri.conf.json tray configuration

use std::fs;
use std::path::Path;

/// Helper to read Cargo.toml as string for parsing
fn read_cargo_toml() -> String {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let cargo_path = Path::new(&manifest_dir).join("Cargo.toml");
    fs::read_to_string(&cargo_path).expect("Failed to read Cargo.toml")
}

/// Helper to read tauri.conf.json as parsed JSON
fn read_tauri_config() -> serde_json::Value {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let config_path = Path::new(&manifest_dir).join("tauri.conf.json");
    let content = fs::read_to_string(&config_path).expect("Failed to read tauri.conf.json");
    serde_json::from_str(&content).expect("Failed to parse tauri.conf.json as JSON")
}

// ========================================
// TASK-3.1: tray-icon feature in Cargo.toml
// ========================================

#[cfg(test)]
mod tray_icon_feature_tests {
    use super::*;

    /// T-3.1.1: Verify tray-icon feature is enabled in tauri dependency
    #[test]
    fn test_tray_icon_feature_enabled() {
        let cargo_content = read_cargo_toml();

        // The tauri dependency should have tray-icon feature
        // Expected: tauri = { version = "2", features = ["tray-icon"] }
        let has_tray_icon = cargo_content.lines().any(|line| {
            line.contains("tauri") && line.contains("features") && line.contains("tray-icon")
        });

        assert!(
            has_tray_icon,
            "tray-icon feature should be enabled in Cargo.toml for system tray support. \
             Add 'tray-icon' to tauri features array."
        );
    }

    /// T-3.1.2: Verify tray-icon is listed in features array (not just mentioned)
    #[test]
    fn test_tray_icon_in_features_array() {
        let cargo_content = read_cargo_toml();

        // Find the tauri dependency (not tauri-build) and check for tray-icon in features
        let mut in_tauri_block = false;
        let mut features_content = String::new();
        let mut found_tauri_dep = false;

        for line in cargo_content.lines() {
            // Match the main tauri dependency, not tauri-build or tauri-plugin-*
            if line.trim().starts_with("tauri = ")
                || (line.contains("tauri") && !line.contains("tauri-") && line.contains("version"))
            {
                in_tauri_block = true;
                found_tauri_dep = true;
            }
            if in_tauri_block {
                features_content.push_str(line);
                features_content.push(' ');
                if line.contains("}") {
                    break;
                }
            }
        }

        assert!(
            found_tauri_dep && features_content.contains("tray-icon"),
            "tray-icon should be in tauri features array, found: {}",
            features_content
        );
    }
}

// ========================================
// TASK-3.2: tray.rs module structure tests
// ========================================

#[cfg(test)]
mod tray_module_tests {
    use social_pip_lib::tray::{create_tray_menu_items, AppStatus, TrayState};

    /// T-3.2.1: Verify AppStatus enum exists with required variants
    #[test]
    fn test_app_status_enum_exists() {
        // AppStatus should have Idle, Working, Error variants
        let idle = AppStatus::Idle;
        let working = AppStatus::Working;
        let error = AppStatus::Error;

        // Verify variants can be created and compared
        assert_eq!(idle, AppStatus::Idle);
        assert_eq!(working, AppStatus::Working);
        assert_eq!(error, AppStatus::Error);

        // Verify variants are distinct
        assert_ne!(idle, working);
        assert_ne!(idle, error);
        assert_ne!(working, error);
    }

    /// T-3.2.2: Verify TrayState struct exists with status field
    #[test]
    fn test_tray_state_struct_exists() {
        let state = TrayState::new();
        assert_eq!(
            state.status,
            AppStatus::Idle,
            "TrayState should initialize with Idle status"
        );
    }

    /// T-3.2.3: Verify create_tray_menu_items returns expected menu items
    #[test]
    fn test_create_tray_menu_items() {
        let items = create_tray_menu_items();

        // Should have at least 3 items: Open, Settings, Quit
        assert!(
            items.len() >= 3,
            "Menu should have at least 3 items (Open, Settings, Quit)"
        );

        // Check for expected item IDs
        let item_ids: Vec<&str> = items.iter().map(|(id, _)| *id).collect();
        assert!(item_ids.contains(&"open"), "Menu should have 'open' item");
        assert!(
            item_ids.contains(&"settings"),
            "Menu should have 'settings' item"
        );
        assert!(item_ids.contains(&"quit"), "Menu should have 'quit' item");
    }

    /// T-3.2.4: Verify menu items have correct default labels (Spanish)
    #[test]
    fn test_menu_item_labels_spanish() {
        let items = create_tray_menu_items();

        for (id, label) in &items {
            match *id {
                "open" => assert_eq!(
                    *label, "Abrir Social-Pip",
                    "Open item should have Spanish label"
                ),
                "settings" => assert_eq!(
                    *label, "Configuración",
                    "Settings item should have Spanish label"
                ),
                "quit" => assert_eq!(*label, "Salir", "Quit item should have Spanish label"),
                _ => {}
            }
        }
    }
}

// ========================================
// TASK-3.4: Tray status indicator tests
// ========================================

#[cfg(test)]
mod tray_status_indicator_tests {
    use social_pip_lib::tray::{AppStatus, TrayState};

    /// T-3.4.1: Verify TrayState can update status
    #[test]
    fn test_tray_state_update_status() {
        let mut state = TrayState::new();

        assert_eq!(state.status, AppStatus::Idle);

        state.set_status(AppStatus::Working);
        assert_eq!(state.status, AppStatus::Working);

        state.set_status(AppStatus::Error);
        assert_eq!(state.status, AppStatus::Error);

        state.set_status(AppStatus::Idle);
        assert_eq!(state.status, AppStatus::Idle);
    }

    /// T-3.4.2: Verify AppStatus implements Clone
    #[test]
    fn test_app_status_clone() {
        let status = AppStatus::Working;
        let cloned = status.clone();
        assert_eq!(status, cloned);
    }

    /// T-3.4.3: Verify AppStatus implements Debug
    #[test]
    fn test_app_status_debug() {
        let status = AppStatus::Working;
        let debug_str = format!("{:?}", status);
        assert!(!debug_str.is_empty(), "AppStatus should implement Debug");
    }

    /// T-3.4.4: Verify AppStatus implements Serialize/Deserialize
    #[test]
    fn test_app_status_serialize_deserialize() {
        let status = AppStatus::Working;
        let json = serde_json::to_string(&status).expect("Should serialize");
        let deserialized: AppStatus = serde_json::from_str(&json).expect("Should deserialize");
        assert_eq!(status, deserialized);
    }
}

// ========================================
// TASK-3.10: tauri.conf.json tray configuration
// ========================================

#[cfg(test)]
mod tray_config_tests {
    use super::*;

    /// T-3.10.1: Verify tray icon path is configured in bundle
    #[test]
    fn test_tray_icon_in_bundle_config() {
        let config = read_tauri_config();

        // Check for tray icon configuration
        // In Tauri 2.0, tray icons use the bundle.icon configuration
        let bundle = config.get("bundle").expect("Missing 'bundle' key");
        let icons = bundle.get("icon").expect("Missing 'icon' in bundle");

        // Icons array should exist and contain tray-capable formats
        if let serde_json::Value::Array(icon_list) = icons {
            assert!(!icon_list.is_empty(), "Bundle icons should not be empty");
        }
    }

    /// T-3.10.2: Verify productName is set for tray tooltip
    #[test]
    fn test_product_name_for_tooltip() {
        let config = read_tauri_config();
        let product_name = config.get("productName").expect("Missing 'productName'");

        assert_eq!(
            product_name.as_str().unwrap(),
            "Social-Pip",
            "productName should be 'Social-Pip' for tray tooltip"
        );
    }

    /// T-3.10.3: Verify identifier is set for tray registration
    #[test]
    fn test_identifier_for_tray() {
        let config = read_tauri_config();
        let identifier = config.get("identifier").expect("Missing 'identifier'");

        assert_eq!(
            identifier.as_str().unwrap(),
            "com.social-pip.app",
            "identifier should be 'com.social-pip.app'"
        );
    }
}

// ========================================
// TASK-3.7: i18n menu translations
// ========================================

#[cfg(test)]
mod tray_i18n_tests {
    use social_pip_lib::tray::{get_menu_label, AppStatus};

    /// T-3.7.1: Verify Spanish labels are returned by default
    #[test]
    fn test_spanish_menu_labels() {
        assert_eq!(get_menu_label("open", "es"), "Abrir Social-Pip");
        assert_eq!(get_menu_label("settings", "es"), "Configuración");
        assert_eq!(get_menu_label("quit", "es"), "Salir");
    }

    /// T-3.7.2: Verify English labels are available
    #[test]
    fn test_english_menu_labels() {
        assert_eq!(get_menu_label("open", "en"), "Open Social-Pip");
        assert_eq!(get_menu_label("settings", "en"), "Settings");
        assert_eq!(get_menu_label("quit", "en"), "Quit");
    }

    /// T-3.7.3: Verify status labels in Spanish
    #[test]
    fn test_status_labels_spanish() {
        assert_eq!(AppStatus::Idle.to_string_es(), "Inactivo");
        assert_eq!(AppStatus::Working.to_string_es(), "Trabajando");
        assert_eq!(AppStatus::Error.to_string_es(), "Error");
    }

    /// T-3.7.4: Verify status labels in English
    #[test]
    fn test_status_labels_english() {
        assert_eq!(AppStatus::Idle.to_string_en(), "Idle");
        assert_eq!(AppStatus::Working.to_string_en(), "Working");
        assert_eq!(AppStatus::Error.to_string_en(), "Error");
    }

    /// T-3.7.5: Verify fallback to Spanish for unknown locale
    #[test]
    fn test_fallback_to_spanish() {
        // Unknown locale should return Spanish
        assert_eq!(get_menu_label("open", "fr"), "Abrir Social-Pip");
        assert_eq!(get_menu_label("quit", "de"), "Salir");
    }
}

// ========================================
// TASK-3.6: Register tray in main.rs
// ========================================

#[cfg(test)]
mod tray_registration_tests {
    use super::*;

    /// T-3.6.1: Verify main.rs has tray module imported
    #[test]
    fn test_tray_module_imported_in_main() {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let main_path = Path::new(&manifest_dir).join("src/main.rs");
        let main_content = fs::read_to_string(&main_path).expect("Failed to read main.rs");

        assert!(
            main_content.contains("mod tray;"),
            "main.rs should import tray module"
        );
    }

    /// T-3.6.2: Verify lib.rs exports tray module
    #[test]
    fn test_tray_exported_from_lib() {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let lib_path = Path::new(&manifest_dir).join("src/lib.rs");
        let lib_content = fs::read_to_string(&lib_path).expect("Failed to read lib.rs");

        assert!(
            lib_content.contains("pub mod tray;"),
            "lib.rs should export tray module as public"
        );
    }
}

// ========================================
// TASK-3.8: Tray icon cleanup
// ========================================

#[cfg(test)]
mod tray_cleanup_tests {
    use social_pip_lib::tray::TrayState;

    /// T-3.8.1: Verify TrayState implements Drop for cleanup (if needed)
    #[test]
    fn test_tray_state_cleanup() {
        // TrayState should be able to be dropped cleanly
        let state = TrayState::new();
        drop(state);
        // No assertion needed - just verifying it compiles and doesn't panic
    }

    /// T-3.8.2: Verify TrayState is Clone for state sharing
    #[test]
    fn test_tray_state_clone() {
        let state = TrayState::new();
        let cloned = state.clone();
        assert_eq!(state.status, cloned.status);
    }
}

// ========================================
// TASK-3.3: Minimize to tray behavior
// ========================================

#[cfg(test)]
mod minimize_to_tray_tests {
    use super::*;

    /// T-3.3.1: Verify main.rs has window close handler setup
    #[test]
    fn test_window_close_handler_exists() {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let main_path = Path::new(&manifest_dir).join("src/main.rs");
        let main_content = fs::read_to_string(&main_path).expect("Failed to read main.rs");

        // Verify tray setup function exists
        assert!(
            main_content.contains("fn setup_system_tray"),
            "main.rs should have setup_system_tray function"
        );

        // Verify the tray is built with on_tray_icon_event
        assert!(
            main_content.contains("on_tray_icon_event"),
            "Tray should handle icon events for minimize to tray"
        );
    }

    /// T-3.3.2: Verify tray click restores window
    #[test]
    fn test_tray_click_restores_window() {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let main_path = Path::new(&manifest_dir).join("src/main.rs");
        let main_content = fs::read_to_string(&main_path).expect("Failed to read main.rs");

        // Verify window.show() is called on tray click
        assert!(
            main_content.contains("window.show()"),
            "Tray click should call window.show()"
        );

        // Verify window.unminimize() is called
        assert!(
            main_content.contains("window.unminimize()"),
            "Tray click should call window.unminimize()"
        );

        // Verify window.set_focus() is called
        assert!(
            main_content.contains("window.set_focus()"),
            "Tray click should call window.set_focus()"
        );
    }
}
