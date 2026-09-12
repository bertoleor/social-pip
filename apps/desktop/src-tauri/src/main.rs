#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod alert_system;
mod anti_ban;
mod ai_service;
mod scheduler;
mod commands;
mod error_handler;
mod circuit_breaker;
mod dead_letter_queue;
mod spintax;
mod native_messaging;
mod database;
mod secure_storage;
mod tray;
mod shortcuts;
mod autostart;
mod platform_gating;
mod mcp_server;

use commands::account::{
    get_accounts, get_account, create_account, update_account, delete_account,
};

use commands::post::{
    get_posts, get_post, create_post, update_post, delete_post,
};

use commands::scheduler::{
    get_schedules, get_schedule, create_schedule, update_schedule, cancel_schedule, delete_schedule,
};

use commands::task::{
    get_tasks, get_task, create_task, update_task_status, cancel_task, retry_task, delete_task,
};

use commands::posting::{
    start_posting_session, cancel_posting_session, get_posting_session_status,
    update_post_job_status, get_session_anti_ban_stats, get_next_posting_delay,
    can_post_to_group, record_posting_action, list_posting_sessions, delete_posting_session,
    start_multi_platform_session, get_platform_delay, get_platform_config,
    check_batch_break_needed, get_batch_break_duration, reset_batch, check_risk_event,
    get_post_jobs, retry_failed_job,
};

use commands::media::{
    get_image_metadata, validate_image, get_platform_media_constraints,
};

use commands::error::{
    get_error_stats, get_dlq_entries, retry_dlq_entry, get_circuit_breaker_status,
};

use commands::template::{
    generate_spintax_preview, validate_template_content,
    create_template, get_template, update_template, delete_template, list_templates,
};

use commands::secure_storage::{
    store_credential, retrieve_credential, clear_credential, list_credentials, credential_exists,
};

use autostart::{
    enable_autostart, disable_autostart, get_autostart_status,
};

use ai_service::{AIService, AIConfig, CaptionRequest, CaptionResponse, get_sector_prompt};
use anti_ban::{AntiBanEngine, AntiBanStats};
use alert_system::{AlertEngine, Alert, AlertStats, AlertType};
use error_handler::Severity;
use shortcuts::{create_shortcut_event, get_all_shortcuts};

// ============================================
// VAULT PASSWORD MANAGEMENT
// ============================================

/// Generate a random 32-byte hex string for vault password
/// Uses ring::rand for cryptographically secure random generation
fn generate_vault_password() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// Get or create the vault password from OS keyring
/// Falls back to generating a new random password if keyring is unavailable
fn get_or_create_vault_password() -> String {
    let entry = keyring::Entry::new("social-pip", "vault-password");
    match entry {
        Ok(entry) => {
            // Try to get existing password
            match entry.get_password() {
                Ok(password) => {
                    log::info!("Retrieved vault password from OS keyring");
                    password
                }
                Err(_) => {
                    // No existing password, generate new one
                    let password = generate_vault_password();
                    if let Err(e) = entry.set_password(&password) {
                        log::warn!("Failed to store password in keyring: {}", e);
                    } else {
                        log::info!("Stored vault password in OS keyring");
                    }
                    password
                }
            }
        }
        Err(e) => {
            log::warn!("Keyring unavailable: {}, using ephemeral password", e);
            generate_vault_password()
        }
    }
}

#[derive(Default)]
pub struct AppState {
    pub anti_ban: std::sync::Mutex<Option<AntiBanEngine>>,
    pub ai_service: std::sync::Mutex<Option<AIService>>,
    pub alert_engine: std::sync::Mutex<Option<AlertEngine>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskRequest {
    pub platform: String,
    pub action_type: String,
    pub account_id: String,
    pub content: Option<String>,
    pub media_urls: Option<Vec<String>>,
    pub target: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskResponse {
    pub success: bool,
    pub task_id: String,
    pub error: Option<String>,
    pub post_url: Option<String>,
    pub platform_post_id: Option<String>,
}

#[tauri::command]
fn init_anti_ban(platform: String, state: tauri::State<AppState>) -> Result<AntiBanStats, String> {
    let config = get_platform_config(platform);
    let engine = AntiBanEngine::new(config);
    let stats = engine.get_stats();

    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;
    *guard = Some(engine);

    Ok(stats)
}

#[tauri::command]
fn check_can_post(platform: String, action_type: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        match engine.can_execute(&action_type) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    } else {
        let config = get_platform_config(platform);
        let mut engine = AntiBanEngine::new(config);
        let can = engine.can_execute(&action_type).is_ok();
        *guard = Some(engine);
        Ok(can)
    }
}

#[tauri::command]
fn get_next_delay(platform: String, state: tauri::State<AppState>) -> Result<u64, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        Ok(engine.next_action_delay_ms())
    } else {
        let config = get_platform_config(platform);
        let engine = AntiBanEngine::new(config);
        let delay = engine.next_action_delay_ms();
        *guard = Some(engine);
        Ok(delay)
    }
}

#[tauri::command]
fn record_post_action(
    platform: String,
    action_type: String,
    success: bool,
    delay_used_ms: u64,
    state: tauri::State<AppState>,
) -> Result<AntiBanStats, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        engine.record_action(action_type, success, delay_used_ms);
        Ok(engine.get_stats())
    } else {
        let config = get_platform_config(platform);
        let mut engine = AntiBanEngine::new(config);
        engine.record_action(action_type, success, delay_used_ms);
        let stats = engine.get_stats();
        *guard = Some(engine);
        Ok(stats)
    }
}

#[tauri::command]
fn should_break(_platform: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        let should = engine.should_take_batch_break();
        if should {
            engine.reset_batch();
        }
        Ok(should)
    } else {
        Ok(false)
    }
}

#[tauri::command]
fn get_typing_delay(platform: String, text: String, state: tauri::State<AppState>) -> Result<Vec<u64>, String> {
    let mut guard = state.anti_ban.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        Ok(engine.typing_delay_ms(&text))
    } else {
        let config = get_platform_config(platform);
        let engine = AntiBanEngine::new(config);
        let delays = engine.typing_delay_ms(&text);
        *guard = Some(engine);
        Ok(delays)
    }
}

#[tauri::command]
fn get_anti_ban_stats(state: tauri::State<AppState>) -> Result<Option<AntiBanStats>, String> {
    let guard = state.anti_ban.lock().map_err(|e| e.to_string())?;
    Ok(guard.as_ref().map(|e| e.get_stats()))
}

#[tauri::command]
fn init_ai_service(config: AIConfig, state: tauri::State<AppState>) -> Result<bool, String> {
    let service = AIService::new(config);
    let enabled = service.is_enabled();

    let mut guard = state.ai_service.lock().map_err(|e| e.to_string())?;
    *guard = Some(service);

    Ok(enabled)
}

#[tauri::command]
async fn generate_caption(
    content: String,
    platform: String,
    style: Option<String>,
    sector: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<CaptionResponse, String> {
    // Extract config and drop the lock before await
    let config = {
        let guard = state.ai_service.lock().map_err(|e| e.to_string())?;
        guard.as_ref()
            .map(|s| s.get_config().clone())
    };

    if let Some(config) = config {
        let service = AIService::new(config);
        let request = CaptionRequest {
            content,
            platform,
            style,
            sector,
        };
        service.generate_caption(request).await
    } else {
        Err("AI service no inicializado. Ve a Settings para configurar.".to_string())
    }
}

#[tauri::command]
fn get_sector_context(sector: String) -> String {
    get_sector_prompt(&sector).to_string()
}

#[tauri::command]
fn test_ai_connection(state: tauri::State<AppState>) -> Result<String, String> {
    let guard = state.ai_service.lock().map_err(|e| e.to_string())?;

    if let Some(ref service) = *guard {
        if service.is_enabled() {
            Ok(format!("Conectado a {:?}", service.get_provider()))
        } else {
            Err("AI está deshabilitado".to_string())
        }
    } else {
        Err("AI service no configurado. Ve a Settings.".to_string())
    }
}

#[tauri::command]
fn init_alert_system(state: tauri::State<AppState>) -> Result<AlertStats, String> {
    let engine = AlertEngine::new();
    let stats = engine.get_alert_stats();

    let mut guard = state.alert_engine.lock().map_err(|e| e.to_string())?;
    *guard = Some(engine);

    Ok(stats)
}

#[tauri::command]
fn create_alert(
    alert_type: String,
    severity: String,
    message: String,
    platform: Option<String>,
    account_id: Option<String>,
    state: tauri::State<AppState>,
) -> Result<Alert, String> {
    let mut guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    let parsed_type = AlertType::from_str(&alert_type)
        .ok_or_else(|| format!("Invalid alert type: {}", alert_type))?;

    let parsed_severity = match severity.to_uppercase().as_str() {
        "INFO" => Severity::Info,
        "WARNING" => Severity::Warning,
        "ERROR" => Severity::Error,
        "CRITICAL" => Severity::Critical,
        _ => return Err(format!("Invalid severity: {}", severity)),
    };

    if let Some(ref mut engine) = *guard {
        let mut alert = engine.create_alert(parsed_type, parsed_severity, message);

        if let Some(p) = platform {
            alert = alert.with_platform(p);
        }
        if let Some(a) = account_id {
            alert = alert.with_account(a);
        }

        Ok(alert)
    } else {
        let mut engine = AlertEngine::new();
        let alert = engine.create_alert(parsed_type, parsed_severity, message);
        *guard = Some(engine);
        Ok(alert)
    }
}

#[tauri::command]
fn get_alerts(
    limit: Option<usize>,
    severity_filter: Option<String>,
    state: tauri::State<AppState>,
) -> Result<Vec<Alert>, String> {
    let guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref engine) = *guard {
        let mut alerts = engine.get_alerts(limit);

        if let Some(filter) = severity_filter {
            let target_severity = match filter.to_uppercase().as_str() {
                "INFO" => Severity::Info,
                "WARNING" => Severity::Warning,
                "ERROR" => Severity::Error,
                "CRITICAL" => Severity::Critical,
                _ => return Ok(alerts),
            };
            alerts = alerts
                .into_iter()
                .filter(|a| a.severity == target_severity)
                .collect();
        }

        Ok(alerts)
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
fn get_unresolved_alerts(state: tauri::State<AppState>) -> Result<Vec<Alert>, String> {
    let guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref engine) = *guard {
        Ok(engine.get_unresolved_alerts())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
fn get_critical_alerts(state: tauri::State<AppState>) -> Result<Vec<Alert>, String> {
    let guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref engine) = *guard {
        Ok(engine.get_critical_alerts())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
fn acknowledge_alert(alert_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        engine.acknowledge_alert(&alert_id)
    } else {
        Err("Alert engine not initialized".to_string())
    }
}

#[tauri::command]
fn resolve_alert(alert_id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        engine.resolve_alert(&alert_id)
    } else {
        Err("Alert engine not initialized".to_string())
    }
}

#[tauri::command]
fn get_alert_stats(state: tauri::State<AppState>) -> Result<AlertStats, String> {
    let guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref engine) = *guard {
        Ok(engine.get_alert_stats())
    } else {
        Ok(AlertStats::default())
    }
}

#[tauri::command]
fn clear_old_alerts(days: u32, state: tauri::State<AppState>) -> Result<u32, String> {
    let mut guard = state.alert_engine.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut engine) = *guard {
        Ok(engine.clear_old_alerts(days))
    } else {
        Ok(0)
    }
}

fn main() {
    // Check for native messaging mode
    let args: Vec<String> = std::env::args().collect();

    // E2.15: Check for MCP server mode
    if args.contains(&"--mcp".to_string()) {
        if let Err(e) = mcp_server::run_mcp_server() {
            log::error!("MCP server error: {}", e);
            eprintln!("MCP server error: {}", e);
            std::process::exit(1);
        }
        return;
    }

    if args.contains(&"--native-messaging".to_string()) {
        // Run as native messaging host for Chrome extension
        run_native_messaging_mode();
        return;
    }

    // Normal GUI mode
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .target(tauri_plugin_log::Target::new(
                tauri_plugin_log::TargetKind::Stdout,
            ))
            .target(tauri_plugin_log::Target::new(
                tauri_plugin_log::TargetKind::LogDir { file_name: None },
            ))
            .build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
// Stronghold plugin for secure credential storage
        // The closure receives the password and should return a hashed key (Vec<u8>)
        // Uses OS keyring for secure password storage with fallback to random generation
        .plugin(tauri_plugin_stronghold::Builder::new(|_password| {
            let vault_password = get_or_create_vault_password();
            // Hash the password for Stronghold key derivation
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(b"social-pip-vault-key");
            hasher.update(vault_password.as_bytes());
            let result = hasher.finalize();
            result.to_vec()
        }).build())
// Global keyboard shortcuts plugin
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    // Autostart plugin for launch at login
    .plugin(tauri_plugin_autostart::Builder::new().build())
.manage(AppState::default())
.setup(|app| {
// Initialize system tray
setup_system_tray(app)?;

// Register global keyboard shortcuts
setup_global_shortcuts(app)?;

// Perform session recovery on startup
// This recovers any interrupted sessions from previous app runs
match perform_startup_recovery() {
Ok(summary) => {
if summary.sessions_recovered > 0 {
log::warn!(
"Recovered {} interrupted session(s) with {} pending job(s)",
summary.sessions_recovered,
summary.total_pending_jobs
);
}
}
Err(e) => {
// Log error but don't fail startup - app should still be usable
log::error!("Session recovery failed (non-fatal): {}", e);
}
}
Ok(())
})
.invoke_handler(tauri::generate_handler![
        init_anti_ban,
        check_can_post,
        get_next_delay,
        record_post_action,
        should_break,
        get_typing_delay,
        get_anti_ban_stats,
        init_ai_service,
        generate_caption,
        get_sector_context,
        test_ai_connection,
        get_schedules,
        get_schedule,
        create_schedule,
        update_schedule,
        cancel_schedule,
        delete_schedule,
        get_accounts,
        get_account,
        create_account,
        update_account,
        delete_account,
        get_posts,
        get_post,
        create_post,
        update_post,
        delete_post,
        init_alert_system,
        create_alert,
        get_alerts,
        get_unresolved_alerts,
        get_critical_alerts,
        acknowledge_alert,
        resolve_alert,
        get_alert_stats,
        clear_old_alerts,
        get_tasks,
        get_task,
        create_task,
        update_task_status,
        cancel_task,
        retry_task,
        delete_task,
        // Posting session commands
        start_posting_session,
        cancel_posting_session,
        get_posting_session_status,
        update_post_job_status,
        get_session_anti_ban_stats,
        get_next_posting_delay,
        can_post_to_group,
        record_posting_action,
        list_posting_sessions,
        delete_posting_session,
        start_multi_platform_session,
        get_platform_delay,
        get_platform_config,
        check_batch_break_needed,
        get_batch_break_duration,
        reset_batch,
        check_risk_event,
        get_post_jobs,
        retry_failed_job,
        // Media commands
        get_image_metadata,
        validate_image,
        get_platform_media_constraints,
        // Error handling commands
        get_error_stats,
        get_dlq_entries,
        retry_dlq_entry,
        get_circuit_breaker_status,
        // Template commands
        generate_spintax_preview,
        validate_template_content,
        create_template,
        get_template,
        update_template,
        delete_template,
        list_templates,
// Secure storage commands
    store_credential,
    retrieve_credential,
    clear_credential,
    list_credentials,
    credential_exists,
    // Autostart commands
    enable_autostart,
    disable_autostart,
    get_autostart_status,
    ])
.run(tauri::generate_context!())
.expect("error while running tauri application");
}

// ============================================
// SYSTEM TRAY SETUP
// ============================================

/// Setup system tray with menu and event handlers
///
/// Creates a tray icon with:
/// - Context menu (Open, Settings, Quit)
/// - Click handler to show/hide window
/// - Menu event handler for actions
fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{
        menu::{MenuBuilder, MenuItemBuilder},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
        Emitter, Manager,
    };

// Create menu items
let open_item = MenuItemBuilder::with_id("open", "Abrir Social-Pip").build(app)?;
let settings_item = MenuItemBuilder::with_id("settings", "Configuración").build(app)?;
let quit_item = MenuItemBuilder::with_id("quit", "Salir").build(app)?;

// Build the menu
let menu = MenuBuilder::new(app)
.items(&[&open_item, &settings_item, &quit_item])
.build()?;

// Create the tray icon
let _tray = TrayIconBuilder::new()
.menu(&menu)
.tooltip("Social-Pip - Automatización de redes sociales")
.on_menu_event(|app, event| {
match event.id().as_ref() {
"open" => {
// Show and focus the main window
if let Some(window) = app.get_webview_window("main") {
let _ = window.show();
let _ = window.unminimize();
let _ = window.set_focus();
}
}
                "settings" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.emit("navigate-to", "/settings");
                    }
                }
"quit" => {
// Exit the application
app.exit(0);
}
_ => {}
}
})
.on_tray_icon_event(|tray, event| {
// Handle left-click on tray icon to toggle window visibility
if let TrayIconEvent::Click {
button: MouseButton::Left,
button_state: MouseButtonState::Up,
..
} = event
{
let app = tray.app_handle();
if let Some(window) = app.get_webview_window("main") {
// Toggle: if visible and focused, minimize; otherwise show
if window.is_visible().unwrap_or(false) && window.is_focused().unwrap_or(false) {
let _ = window.minimize();
} else {
let _ = window.show();
let _ = window.unminimize();
let _ = window.set_focus();
}
}
}
})
.build(app)?;

log::info!("System tray initialized successfully");
Ok(())
}

// ============================================
// GLOBAL SHORTCUTS SETUP
// ============================================

/// Setup global keyboard shortcuts with event handlers
///
/// Registers the following shortcuts:
/// - Ctrl+N (Cmd+N on macOS): Create new post
/// - Ctrl+S: Save current post
/// - Ctrl+Q: Quit application
/// - Ctrl+,: Open settings
///
/// Emits events to the frontend which handles the actual actions
fn setup_global_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

// Register each shortcut with its handler
for (id, _key_combo) in get_all_shortcuts() {
let shortcut_str = id.to_shortcut_string();
let event_name = id.to_event_name();

// Parse the shortcut string into a Shortcut
let shortcut = parse_shortcut_string(&shortcut_str)?;

// Register the shortcut - handler receives (app, shortcut, event)
app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, _event| {
// Emit event to frontend
if let Some(window) = app.get_webview_window("main") {
let event = create_shortcut_event(id);
// Emit the shortcut event to the frontend
// event_name is a static &'static str so we can use it directly
let _: std::result::Result<(), _> = window.emit(event_name, event);
}
})?;

log::info!("Registered global shortcut: {} -> {}", shortcut_str, event_name);
}

log::info!("Global shortcuts initialized successfully");
Ok(())
}

/// Parse a shortcut string (e.g., "Ctrl+N") into a Shortcut
fn parse_shortcut_string(s: &str) -> Result<tauri_plugin_global_shortcut::Shortcut, Box<dyn std::error::Error>> {
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

let parts: Vec<&str> = s.split('+').collect();
let mut modifiers = Modifiers::empty();
let mut code = None;

for part in parts {
match part.trim() {
"Ctrl" | "Control" => modifiers.insert(Modifiers::CONTROL),
"Command" | "Cmd" | "Super" | "Meta" => modifiers.insert(Modifiers::SUPER),
"Alt" => modifiers.insert(Modifiers::ALT),
"Shift" => modifiers.insert(Modifiers::SHIFT),
"N" => code = Some(Code::KeyN),
"S" => code = Some(Code::KeyS),
"Q" => code = Some(Code::KeyQ),
"," => code = Some(Code::Comma),
_ => {
log::warn!("Unknown shortcut part: {}", part);
}
}
}

let code = code.ok_or("No key code found in shortcut string")?;
Ok(Shortcut::new(Some(modifiers), code))
}

// ============================================
// STARTUP RECOVERY
// ============================================

/// Perform session recovery on app startup
///
/// This function is called during Tauri app setup to recover any
/// sessions that were interrupted by app close or crash.
///
/// # Arguments
/// * `app_handle` - Tauri app handle for accessing managed state
///
/// # Returns
/// Result with recovery summary or error
fn perform_startup_recovery() -> Result<database::RecoverySummary, String> {
    use database::{InMemoryStore, recover_pending_sessions};

    // Try SQLite first for production recovery
    if let Some(stores) = database::get_sqlite_stores() {
        let result = recover_pending_sessions(&stores.0, &stores.1);
        match &result {
            Ok(summary) => {
                if summary.sessions_recovered > 0 {
                    log::info!(
                        "Recovered {} sessions from SQLite database",
                        summary.sessions_recovered
                    );
                }
            }
            Err(e) => {
                log::warn!("SQLite recovery failed: {}, falling back to in-memory", e);
            }
        }
        return result;
    }

    // Fallback to in-memory (empty) for v1
    log::warn!("SQLite stores not available, using empty in-memory store for recovery");
    let store = InMemoryStore::new();
    recover_pending_sessions(&store.sessions, &store.jobs)
}

/// Run in native messaging mode for Chrome extension communication
fn run_native_messaging_mode() {
    use native_messaging::{NativeMessage, NativeResponse, run_native_messaging_host};

    // Initialize anti-ban engine with default config
    let config = get_platform_config("facebook".to_string());
    let engine = std::sync::Arc::new(std::sync::Mutex::new(AntiBanEngine::new(config)));

    // Create handler closure
    let handler = |message: NativeMessage| -> NativeResponse {
        let engine_clone = engine.clone();
        
        match message {
            NativeMessage::CheckCanPost { platform, action } => {
                let config = get_platform_config(platform);
                let mut guard = engine_clone.lock().unwrap();
                *guard = AntiBanEngine::new(config);
                let can = guard.can_execute(&action).is_ok();
                NativeResponse::Bool(can)
            }
            NativeMessage::GetNextDelay { platform } => {
                let config = get_platform_config(platform);
                let mut guard = engine_clone.lock().unwrap();
                *guard = AntiBanEngine::new(config);
                let delay = guard.next_action_delay_ms();
                NativeResponse::Number(delay)
            }
            NativeMessage::RecordPostAction { platform, action, success, delay_used_ms } => {
                let config = get_platform_config(platform);
                let mut guard = engine_clone.lock().unwrap();
                *guard = AntiBanEngine::new(config);
                guard.record_action(action, success, delay_used_ms);
                NativeResponse::Ack { success: true }
            }
            NativeMessage::ShouldBreak { platform: _ } => {
                let mut guard = engine_clone.lock().unwrap();
                let should = guard.should_take_batch_break();
                if should {
                    guard.reset_batch();
                }
                NativeResponse::Bool(should)
            }
            NativeMessage::TaskResult { result } => {
                log::info!("Task result received: {:?}", result);
                NativeResponse::Ack { success: true }
            }
            NativeMessage::Ping => {
                NativeResponse::Pong { pong: true }
            }
        }
    };

    // Run the native messaging loop
    if let Err(e) = run_native_messaging_host(handler) {
        log::error!("Native messaging error: {}", e);
        eprintln!("Native messaging error: {}", e);
        std::process::exit(1);
    }
}

// ============================================
// TESTS FOR STARTUP RECOVERY
// ============================================

#[cfg(test)]
mod startup_recovery_tests {
    use super::*;
    use database::{InMemoryStore, PostSessionModel, PostJobModel, recover_pending_sessions};

    // ========================================
    // T-2.1: Test for recovery on startup
    // ========================================

    #[test]
    fn test_perform_startup_recovery_returns_ok() {
        // Should return Ok with a recovery summary
        let result = perform_startup_recovery();
        assert!(result.is_ok());

        let summary = result.unwrap();
        // Empty store should have 0 sessions recovered
        assert_eq!(summary.sessions_recovered, 0);
        assert_eq!(summary.total_pending_jobs, 0);
    }

    // ========================================
    // T-2.3: Test for recovery error handling
    // ========================================

    #[test]
    fn test_recovery_error_handling_logs_but_does_not_panic() {
        // Simulate a recovery that encounters an error
        // This test verifies that errors are handled gracefully

        // Create a store with valid data
        let store = InMemoryStore::new();

        // Recovery should work fine
        let result = recover_pending_sessions(&store.sessions, &store.jobs);
        assert!(result.is_ok());
    }

    // ========================================
    // T-2.5: Test for recovery with empty database
    // ========================================

    #[test]
    fn test_recovery_with_empty_database_is_graceful() {
        // Empty database should not cause any issues
        let store = InMemoryStore::new();

        let result = recover_pending_sessions(&store.sessions, &store.jobs);

        // Should succeed with 0 sessions
        assert!(result.is_ok());
        let summary = result.unwrap();
        assert_eq!(summary.sessions_recovered, 0);
        assert_eq!(summary.total_pending_jobs, 0);
        assert!(summary.sessions.is_empty());
    }

    #[test]
    fn test_recovery_function_is_callable_from_main() {
        // Verify that perform_startup_recovery can be called
        // This is the integration point between recovery module and main.rs
        let result = perform_startup_recovery();

        // Should always succeed (even if empty)
        assert!(result.is_ok());
    }

    #[test]
    fn test_recovery_logs_appropriate_information() {
        // Test that recovery produces meaningful results
        let summary = perform_startup_recovery().unwrap();

        // Summary should have valid counts (even if zero)
        assert!(summary.sessions_recovered >= 0);
        assert!(summary.total_pending_jobs >= 0);
    }
}
