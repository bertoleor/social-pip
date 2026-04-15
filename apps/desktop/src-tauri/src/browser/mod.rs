//! Browser Automation Module - Chrome launch and extension handshake
//!
//! This module handles:
//! - Chrome browser launch with custom URL parameters
//! - Extension handshake via Native Messaging
//! - Session metadata passing to the extension
//!
//! # Architecture
//! ```text
//! ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
//! │ Tauri App       │───│ Chrome           │───│ Extension       │
//! │                 │   │ (with URL params)│   │ (Handshake)     │
//! │ 1. Launch Chrome│   │                  │   │                 │
//! 2. Wait Handshake│   │ 3. Detect params │   │ 4. Send Ping    │
//! │ 5. Confirm      │   │ 5. Connect Native│   │ 6. Execute Job  │
//! └─────────────────┘   └──────────────────┘   └─────────────────┘
//! ```

mod handshake;
mod launcher;

pub use handshake::{
    HandshakeConfig, HandshakeManager, HandshakeMessage, HandshakeResponse, HandshakeStatus,
};
pub use launcher::{build_chrome_url, BrowserLauncher, ChromeParams};
