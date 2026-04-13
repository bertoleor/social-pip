//! Native Messaging Host for Chrome Extension Communication
//!
//! This module handles Chrome Native Messaging protocol for communication
//! between the Chrome extension and the Tauri desktop application.
//!
//! # Protocol
//! Chrome Native Messaging uses stdin/stdout for JSON message exchange:
//! - Messages are prefixed with a 4-byte length header (little-endian u32)
//! - The extension connects via `chrome.runtime.connectNative()`
//! - The host reads messages from stdin and writes responses to stdout
//!
//! # Usage
//! The Tauri app can run in native messaging mode with:
//! ```bash
//! social-pip.exe --native-messaging
//! ```

use serde::{Deserialize, Serialize};
use std::io::{self, Read, Write};

/// Native Messaging Host name - must match manifest and extension
pub const NATIVE_HOST_NAME: &str = "com.social_pip.app";

/// Maximum message size (1MB should be more than enough)
const MAX_MESSAGE_SIZE: usize = 1024 * 1024;

/// Native message from Chrome extension
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NativeMessage {
    CheckCanPost {
        platform: String,
        action: String,
    },
    GetNextDelay {
        platform: String,
    },
    RecordPostAction {
        platform: String,
        action: String,
        success: bool,
        delay_used_ms: u64,
    },
    ShouldBreak {
        platform: String,
    },
    TaskResult {
        result: TaskResultPayload,
    },
    /// Ping for health check
    Ping,
}

/// Task result payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResultPayload {
    pub task_id: String,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform_post_id: Option<String>,
}

/// Response to Chrome extension
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NativeResponse {
    /// Boolean response (e.g., can_post)
    Bool(bool),
    /// Numeric response (e.g., delay in ms)
    Number(u64),
    /// Acknowledgment
    Ack { success: bool },
    /// Error response
    Error { error: String },
    /// Pong response
    Pong { pong: bool },
}

/// Read a native message from stdin
///
/// Chrome Native Messaging protocol:
/// - First 4 bytes: message length (little-endian u32)
/// - Next N bytes: UTF-8 JSON message
pub fn read_message() -> io::Result<Option<NativeMessage>> {
    let mut stdin = io::stdin();

    // Read length prefix (4 bytes, little-endian)
    let mut length_buf = [0u8; 4];
    match stdin.read_exact(&mut length_buf) {
        Ok(_) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => {
            // stdin closed, normal shutdown
            return Ok(None);
        }
        Err(e) => return Err(e),
    }

    let length = u32::from_le_bytes(length_buf) as usize;

    // Sanity check
    if length > MAX_MESSAGE_SIZE {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Message too large: {} bytes", length),
        ));
    }

    // Read the JSON message
    let mut message_buf = vec![0u8; length];
    stdin.read_exact(&mut message_buf)?;

    // Parse JSON
    let message_str = String::from_utf8(message_buf)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    let message: NativeMessage = serde_json::from_str(&message_str)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    Ok(Some(message))
}

/// Write a response to stdout
///
/// Chrome Native Messaging protocol:
/// - First 4 bytes: message length (little-endian u32)
/// - Next N bytes: UTF-8 JSON response
pub fn write_response(response: &NativeResponse) -> io::Result<()> {
    let mut stdout = io::stdout();

    // Serialize response to JSON
    let json = serde_json::to_string(response)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    let json_bytes = json.as_bytes();
    let length = json_bytes.len() as u32;

    // Write length prefix
    stdout.write_all(&length.to_le_bytes())?;

    // Write JSON message
    stdout.write_all(json_bytes)?;

    // Flush to ensure message is sent
    stdout.flush()?;

    Ok(())
}

/// Run the native messaging host loop
///
/// This function reads messages from stdin and writes responses to stdout
/// until stdin is closed or an unrecoverable error occurs.
pub fn run_native_messaging_host<F>(mut handler: F) -> io::Result<()>
where
    F: FnMut(NativeMessage) -> NativeResponse,
{
    loop {
        match read_message()? {
            Some(message) => {
                log::debug!("Received native message: {:?}", message);
                let response = handler(message);
                log::debug!("Sending response: {:?}", response);
                write_response(&response)?;
            }
            None => {
                // stdin closed, normal shutdown
                log::info!("Native messaging connection closed");
                break;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_serialization() {
        let msg = NativeMessage::CheckCanPost {
            platform: "facebook".to_string(),
            action: "post".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("check_can_post"));
        assert!(json.contains("facebook"));
        assert!(json.contains("post"));
    }

    #[test]
    fn test_response_serialization() {
        let response = NativeResponse::Bool(true);
        let json = serde_json::to_string(&response).unwrap();
        assert_eq!(json, "true");

        let response = NativeResponse::Number(5000);
        let json = serde_json::to_string(&response).unwrap();
        assert_eq!(json, "5000");
    }

    #[test]
    fn test_task_result_deserialization() {
        let json = r#"{"type":"task_result","result":{"task_id":"abc123","success":true}}"#;
        let msg: NativeMessage = serde_json::from_str(json).unwrap();

        match msg {
            NativeMessage::TaskResult { result } => {
                assert_eq!(result.task_id, "abc123");
                assert!(result.success);
            }
            _ => panic!("Wrong message type"),
        }
    }
}
