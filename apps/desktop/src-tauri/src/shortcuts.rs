//! Global Shortcuts Module
//!
//! This module provides global keyboard shortcuts for Social-Pip:
//! - Ctrl+N (Cmd+N on macOS): Create new post
//! - Ctrl+S: Save current post
//! - Ctrl+Q: Quit application (with confirmation)
//! - Ctrl+,: Open settings

use serde::{Deserialize, Serialize};

/// Unique identifiers for each global shortcut
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ShortcutId {
    /// Create new post (Ctrl+N / Cmd+N)
    NewPost,
    /// Save current post (Ctrl+S)
    Save,
    /// Quit application (Ctrl+Q)
    Quit,
    /// Open settings (Ctrl+,)
    Settings,
}

impl ShortcutId {
    /// Get the keyboard shortcut string for this ID
    /// Returns platform-specific format (Cmd on macOS, Ctrl elsewhere)
    pub fn to_shortcut_string(&self) -> &'static str {
        #[cfg(target_os = "macos")]
        {
            match self {
                ShortcutId::NewPost => "Command+N",
                ShortcutId::Save => "Command+S",
                ShortcutId::Quit => "Command+Q",
                ShortcutId::Settings => "Command+,",
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            match self {
                ShortcutId::NewPost => "Ctrl+N",
                ShortcutId::Save => "Ctrl+S",
                ShortcutId::Quit => "Ctrl+Q",
                ShortcutId::Settings => "Ctrl+,",
            }
        }
    }

    /// Get the unique string identifier for this shortcut
    pub fn to_id_string(&self) -> &'static str {
        match self {
            ShortcutId::NewPost => "new_post",
            ShortcutId::Save => "save",
            ShortcutId::Quit => "quit",
            ShortcutId::Settings => "settings",
        }
    }

    /// Get the event name emitted to the frontend when this shortcut is triggered
    pub fn to_event_name(&self) -> &'static str {
        match self {
            ShortcutId::NewPost => "shortcut:new-post",
            ShortcutId::Save => "shortcut:save",
            ShortcutId::Quit => "shortcut:quit",
            ShortcutId::Settings => "shortcut:settings",
        }
    }

    /// Parse from string identifier
    pub fn from_id_string(s: &str) -> Option<Self> {
        match s {
            "new_post" => Some(ShortcutId::NewPost),
            "save" => Some(ShortcutId::Save),
            "quit" => Some(ShortcutId::Quit),
            "settings" => Some(ShortcutId::Settings),
            _ => None,
        }
    }
}

/// Payload sent to frontend when a shortcut is triggered
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutEvent {
    pub shortcut_id: String,
    pub event_name: String,
}

/// Get all registered shortcuts with their key combinations
pub fn get_all_shortcuts() -> Vec<(ShortcutId, &'static str)> {
    vec![
        (
            ShortcutId::NewPost,
            ShortcutId::NewPost.to_shortcut_string(),
        ),
        (ShortcutId::Save, ShortcutId::Save.to_shortcut_string()),
        (ShortcutId::Quit, ShortcutId::Quit.to_shortcut_string()),
        (
            ShortcutId::Settings,
            ShortcutId::Settings.to_shortcut_string(),
        ),
    ]
}

/// Create a shortcut event payload
pub fn create_shortcut_event(id: ShortcutId) -> ShortcutEvent {
    ShortcutEvent {
        shortcut_id: id.to_id_string().to_string(),
        event_name: id.to_event_name().to_string(),
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // TASK-4.1 Tests: Ctrl+N shortcut
    // ========================================

    #[test]
    fn test_new_post_shortcut_id_string() {
        let id = ShortcutId::NewPost;
        assert_eq!(id.to_id_string(), "new_post");
    }

    #[test]
    fn test_new_post_shortcut_event_name() {
        let id = ShortcutId::NewPost;
        assert_eq!(id.to_event_name(), "shortcut:new-post");
    }

    #[test]
    fn test_new_post_shortcut_key_combination() {
        let id = ShortcutId::NewPost;
        // On non-macOS, should return Ctrl+N
        #[cfg(not(target_os = "macos"))]
        assert_eq!(id.to_shortcut_string(), "Ctrl+N");
        // On macOS, should return Command+N
        #[cfg(target_os = "macos")]
        assert_eq!(id.to_shortcut_string(), "Command+N");
    }

    #[test]
    fn test_shortcut_id_from_string_new_post() {
        let id = ShortcutId::from_id_string("new_post");
        assert_eq!(id, Some(ShortcutId::NewPost));
    }

    #[test]
    fn test_create_shortcut_event_new_post() {
        let event = create_shortcut_event(ShortcutId::NewPost);
        assert_eq!(event.shortcut_id, "new_post");
        assert_eq!(event.event_name, "shortcut:new-post");
    }

    // ========================================
    // TASK-4.2 Tests: Ctrl+S shortcut
    // ========================================

    #[test]
    fn test_save_shortcut_id_string() {
        let id = ShortcutId::Save;
        assert_eq!(id.to_id_string(), "save");
    }

    #[test]
    fn test_save_shortcut_event_name() {
        let id = ShortcutId::Save;
        assert_eq!(id.to_event_name(), "shortcut:save");
    }

    #[test]
    fn test_save_shortcut_key_combination() {
        let id = ShortcutId::Save;
        #[cfg(not(target_os = "macos"))]
        assert_eq!(id.to_shortcut_string(), "Ctrl+S");
        #[cfg(target_os = "macos")]
        assert_eq!(id.to_shortcut_string(), "Command+S");
    }

    #[test]
    fn test_shortcut_id_from_string_save() {
        let id = ShortcutId::from_id_string("save");
        assert_eq!(id, Some(ShortcutId::Save));
    }

    #[test]
    fn test_create_shortcut_event_save() {
        let event = create_shortcut_event(ShortcutId::Save);
        assert_eq!(event.shortcut_id, "save");
        assert_eq!(event.event_name, "shortcut:save");
    }

    // ========================================
    // TASK-4.3 Tests: Ctrl+Q shortcut (quit)
    // ========================================

    #[test]
    fn test_quit_shortcut_id_string() {
        let id = ShortcutId::Quit;
        assert_eq!(id.to_id_string(), "quit");
    }

    #[test]
    fn test_quit_shortcut_event_name() {
        let id = ShortcutId::Quit;
        assert_eq!(id.to_event_name(), "shortcut:quit");
    }

    #[test]
    fn test_quit_shortcut_key_combination() {
        let id = ShortcutId::Quit;
        #[cfg(not(target_os = "macos"))]
        assert_eq!(id.to_shortcut_string(), "Ctrl+Q");
        #[cfg(target_os = "macos")]
        assert_eq!(id.to_shortcut_string(), "Command+Q");
    }

    #[test]
    fn test_shortcut_id_from_string_quit() {
        let id = ShortcutId::from_id_string("quit");
        assert_eq!(id, Some(ShortcutId::Quit));
    }

    #[test]
    fn test_create_shortcut_event_quit() {
        let event = create_shortcut_event(ShortcutId::Quit);
        assert_eq!(event.shortcut_id, "quit");
        assert_eq!(event.event_name, "shortcut:quit");
    }

    // ========================================
    // TASK-4.4 Tests: Ctrl+, shortcut (settings)
    // ========================================

    #[test]
    fn test_settings_shortcut_id_string() {
        let id = ShortcutId::Settings;
        assert_eq!(id.to_id_string(), "settings");
    }

    #[test]
    fn test_settings_shortcut_event_name() {
        let id = ShortcutId::Settings;
        assert_eq!(id.to_event_name(), "shortcut:settings");
    }

    #[test]
    fn test_settings_shortcut_key_combination() {
        let id = ShortcutId::Settings;
        #[cfg(not(target_os = "macos"))]
        assert_eq!(id.to_shortcut_string(), "Ctrl+,");
        #[cfg(target_os = "macos")]
        assert_eq!(id.to_shortcut_string(), "Command+,");
    }

    #[test]
    fn test_shortcut_id_from_string_settings() {
        let id = ShortcutId::from_id_string("settings");
        assert_eq!(id, Some(ShortcutId::Settings));
    }

    #[test]
    fn test_create_shortcut_event_settings() {
        let event = create_shortcut_event(ShortcutId::Settings);
        assert_eq!(event.shortcut_id, "settings");
        assert_eq!(event.event_name, "shortcut:settings");
    }

    // ========================================
    // TASK-4.5: Get all shortcuts
    // ========================================

    #[test]
    fn test_get_all_shortcuts_returns_four_shortcuts() {
        let shortcuts = get_all_shortcuts();
        assert_eq!(shortcuts.len(), 4);
    }

    #[test]
    fn test_get_all_shortcuts_contains_new_post() {
        let shortcuts = get_all_shortcuts();
        let has_new_post = shortcuts.iter().any(|(id, _)| *id == ShortcutId::NewPost);
        assert!(has_new_post);
    }

    #[test]
    fn test_get_all_shortcuts_contains_save() {
        let shortcuts = get_all_shortcuts();
        let has_save = shortcuts.iter().any(|(id, _)| *id == ShortcutId::Save);
        assert!(has_save);
    }

    #[test]
    fn test_get_all_shortcuts_contains_quit() {
        let shortcuts = get_all_shortcuts();
        let has_quit = shortcuts.iter().any(|(id, _)| *id == ShortcutId::Quit);
        assert!(has_quit);
    }

    #[test]
    fn test_get_all_shortcuts_contains_settings() {
        let shortcuts = get_all_shortcuts();
        let has_settings = shortcuts.iter().any(|(id, _)| *id == ShortcutId::Settings);
        assert!(has_settings);
    }

    // ========================================
    // Edge Cases & Triangulation
    // ========================================

    #[test]
    fn test_shortcut_id_from_invalid_string_returns_none() {
        let id = ShortcutId::from_id_string("invalid_shortcut");
        assert!(id.is_none());
    }

    #[test]
    fn test_shortcut_id_from_empty_string_returns_none() {
        let id = ShortcutId::from_id_string("");
        assert!(id.is_none());
    }

    #[test]
    fn test_shortcut_event_serializes_to_json() {
        let event = create_shortcut_event(ShortcutId::NewPost);
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("new_post"));
        assert!(json.contains("shortcut:new-post"));
    }

    #[test]
    fn test_shortcut_event_deserializes_from_json() {
        let json = r#"{"shortcut_id":"save","event_name":"shortcut:save"}"#;
        let event: ShortcutEvent = serde_json::from_str(json).unwrap();
        assert_eq!(event.shortcut_id, "save");
        assert_eq!(event.event_name, "shortcut:save");
    }

    #[test]
    fn test_all_shortcut_ids_are_unique() {
        let ids: Vec<&str> = vec![
            ShortcutId::NewPost.to_id_string(),
            ShortcutId::Save.to_id_string(),
            ShortcutId::Quit.to_id_string(),
            ShortcutId::Settings.to_id_string(),
        ];
        // Check for uniqueness by comparing length with set length
        let unique_count = ids.iter().collect::<std::collections::HashSet<_>>().len();
        assert_eq!(ids.len(), unique_count);
    }

    #[test]
    fn test_all_event_names_are_unique() {
        let events: Vec<&str> = vec![
            ShortcutId::NewPost.to_event_name(),
            ShortcutId::Save.to_event_name(),
            ShortcutId::Quit.to_event_name(),
            ShortcutId::Settings.to_event_name(),
        ];
        let unique_count = events
            .iter()
            .collect::<std::collections::HashSet<_>>()
            .len();
        assert_eq!(events.len(), unique_count);
    }
}
