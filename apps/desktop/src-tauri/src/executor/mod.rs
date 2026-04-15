//! Job Executor Module - Background worker for processing posting jobs
//!
//! This module provides a Tokio-based background worker that:
//! - Polls for pending jobs from the database
//! - Integrates with AntiBanEngine for safe execution
//! - Emits Tauri events for frontend synchronization
//! - Handles graceful shutdown with cancellation tokens
//!
//! # Architecture
//! ```text
//! ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
//! │   Frontend      │◄───│  Tauri Events    │◄───│   Executor      │
//! │ (React/TypeScript)│    │ job:started     │    │ (Background)    │
//! └─────────────────┘    │ job:completed   │    │                 │
//!                        │ job:failed      │    │  ┌───────────┐  │
//!                        └──────────────────┘    │  │ AntiBan  │  │
//!                                                │  │ Engine   │  │
//!                                                │  └───────────┘  │
//!                                                │                 │
//!                                                │  ┌───────────┐  │
//!                                                │  │ Database  │  │
//!                                                │  │ (Jobs)    │  │
//!                                                │  └───────────┘  │
//!                                                └─────────────────┘
//! ```

mod executor;

pub use executor::{Executor, ExecutorConfig, ExecutorState, spawn_executor};
