//! System Tray Integration Module
//!
//! This module provides system tray functionality for Social-Pip:
//! - Tray icon with status indicator (idle/working/error)
//! - Context menu (Open, Settings, Quit)
//! - Minimize to tray behavior
//! - i18n support (Spanish/English)

use serde::{Deserialize, Serialize};

/// Application status displayed in the tray
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum AppStatus {
    #[default]
    Idle,
    Working,
    Error,
}

/// State managed by the system tray
#[derive(Debug, Clone)]
pub struct TrayState {
    pub status: AppStatus,
}

impl TrayState {
    /// Create a new TrayState with Idle status
    pub fn new() -> Self {
        Self {
            status: AppStatus::Idle,
        }
    }

    /// Update the tray status
    pub fn set_status(&mut self, status: AppStatus) {
        self.status = status;
    }
}

impl Default for TrayState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppStatus {
    /// Convert status to Spanish string
    pub fn to_string_es(&self) -> &'static str {
        match self {
            AppStatus::Idle => "Inactivo",
            AppStatus::Working => "Trabajando",
            AppStatus::Error => "Error",
        }
    }

    /// Convert status to English string
    pub fn to_string_en(&self) -> &'static str {
        match self {
            AppStatus::Idle => "Idle",
            AppStatus::Working => "Working",
            AppStatus::Error => "Error",
        }
    }
}

/// Get menu item label for a given ID and locale
///
/// # Arguments
/// * `id` - Menu item ID (e.g., "open", "settings", "quit")
/// * `locale` - Locale code (e.g., "es", "en")
///
/// # Returns
/// Localized label string (defaults to Spanish for unknown locales)
/// For unknown IDs, returns the ID itself as a fallback
pub fn get_menu_label(id: &str, locale: &str) -> String {
    match locale {
        "en" => match id {
            "open" => "Open Social-Pip".to_string(),
            "settings" => "Settings".to_string(),
            "quit" => "Quit".to_string(),
            unknown => format!("Unknown: {}", unknown),
        },
        _ => match id {
            // Spanish (default) and fallback
            "open" => "Abrir Social-Pip".to_string(),
            "settings" => "Configuración".to_string(),
            "quit" => "Salir".to_string(),
            unknown => format!("Desconocido: {}", unknown),
        },
    }
}

/// Create tray menu items with default Spanish labels
///
/// # Returns
/// Vector of (id, label) tuples for menu items
pub fn create_tray_menu_items() -> Vec<(&'static str, &'static str)> {
    vec![
        ("open", "Abrir Social-Pip"),
        ("settings", "Configuración"),
        ("quit", "Salir"),
    ]
}

/// Create tray menu items with custom locale
///
/// # Arguments
/// * `locale` - Locale code (e.g., "es", "en")
///
/// # Returns
/// Vector of (id, label) tuples for menu items
pub fn create_tray_menu_items_with_locale(locale: &str) -> Vec<(&'static str, String)> {
    vec![
        ("open", get_menu_label("open", locale)),
        ("settings", get_menu_label("settings", locale)),
        ("quit", get_menu_label("quit", locale)),
    ]
}

/// Get tooltip text for the tray icon
///
/// # Arguments
/// * `status` - Current app status
/// * `locale` - Locale code (e.g., "es", "en")
///
/// # Returns
/// Formatted tooltip string
pub fn get_tray_tooltip(status: AppStatus, locale: &str) -> String {
    match locale {
        "en" => format!("Social-Pip - {}", status.to_string_en()),
        _ => format!("Social-Pip - {}", status.to_string_es()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_status_default() {
        let status = AppStatus::default();
        assert_eq!(status, AppStatus::Idle);
    }

    #[test]
    fn test_tray_state_new() {
        let state = TrayState::new();
        assert_eq!(state.status, AppStatus::Idle);
    }

    #[test]
    fn test_tray_state_set_status() {
        let mut state = TrayState::new();
        state.set_status(AppStatus::Working);
        assert_eq!(state.status, AppStatus::Working);
    }

    #[test]
    fn test_app_status_strings() {
        assert_eq!(AppStatus::Idle.to_string_es(), "Inactivo");
        assert_eq!(AppStatus::Working.to_string_es(), "Trabajando");
        assert_eq!(AppStatus::Error.to_string_es(), "Error");

        assert_eq!(AppStatus::Idle.to_string_en(), "Idle");
        assert_eq!(AppStatus::Working.to_string_en(), "Working");
        assert_eq!(AppStatus::Error.to_string_en(), "Error");
    }

    #[test]
    fn test_get_menu_label_spanish() {
        assert_eq!(get_menu_label("open", "es"), "Abrir Social-Pip");
        assert_eq!(get_menu_label("settings", "es"), "Configuración");
        assert_eq!(get_menu_label("quit", "es"), "Salir");
    }

    #[test]
    fn test_get_menu_label_english() {
        assert_eq!(get_menu_label("open", "en"), "Open Social-Pip");
        assert_eq!(get_menu_label("settings", "en"), "Settings");
        assert_eq!(get_menu_label("quit", "en"), "Quit");
    }

    #[test]
    fn test_get_menu_label_fallback() {
        // Unknown locale should fall back to Spanish
        assert_eq!(get_menu_label("open", "fr"), "Abrir Social-Pip");
        assert_eq!(get_menu_label("quit", "de"), "Salir");
    }

    #[test]
    fn test_create_tray_menu_items() {
        let items = create_tray_menu_items();
        assert_eq!(items.len(), 3);
        assert_eq!(items[0].0, "open");
        assert_eq!(items[1].0, "settings");
        assert_eq!(items[2].0, "quit");
    }

    #[test]
    fn test_create_tray_menu_items_english() {
        let items = create_tray_menu_items_with_locale("en");
        assert_eq!(items[0].1, "Open Social-Pip");
        assert_eq!(items[1].1, "Settings");
        assert_eq!(items[2].1, "Quit");
    }

    #[test]
    fn test_get_tray_tooltip() {
        assert_eq!(
            get_tray_tooltip(AppStatus::Idle, "es"),
            "Social-Pip - Inactivo"
        );
        assert_eq!(
            get_tray_tooltip(AppStatus::Working, "en"),
            "Social-Pip - Working"
        );
    }
}
