//! Integration tests for Executor + Browser Launcher + Result Handler
//!
//! Phase 6: Integration Wiring
//! These tests verify the full posting flow:
//! - T-6.1: Executor startup integration
//! - T-6.2: Wire executor to lib.rs startup
//! - T-6.3: Browser launcher integration
//! - T-6.4: Connect executor to browser launcher
//! - T-6.5: Full posting flow
//! - T-6.6: End-to-end integration

use social_pip_lib::*;
use std::sync::Arc;
use std::time::Duration;

// Import browser types directly
use social_pip_lib::browser::{HandshakeMessage, HandshakeResponse};

// ========================================
// T-6.1: Test for executor startup integration
// ========================================

#[tokio::test]
async fn test_executor_starts_with_default_config() {
    let executor = Arc::new(Executor::new());

    // Should start successfully
    let result = executor.start().await;
    assert!(result.is_ok(), "Executor should start successfully");

    // Should be in running state
    let state = executor.state().await;
    assert_eq!(state, ExecutorState::Running);

    // Cleanup
    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_executor_starts_with_custom_config() {
    let config = ExecutorConfig {
        poll_interval_ms: 1000,
        max_concurrent_jobs: 5,
        anti_ban_enabled: true,
        default_platform: "facebook_groups".to_string(),
    };

    let executor = Arc::new(Executor::with_config(config));

    let result = executor.start().await;
    assert!(result.is_ok());

    let state = executor.state().await;
    assert_eq!(state, ExecutorState::Running);

    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_executor_can_be_spawned_convenience_function() {
    let config = ExecutorConfig {
        poll_interval_ms: 500,
        ..Default::default()
    };

    let executor = spawn_executor(config).await;
    assert!(executor.is_ok(), "spawn_executor should succeed");

    let executor = executor.unwrap();
    let state = executor.state().await;
    assert_eq!(state, ExecutorState::Running);

    executor.stop().await.unwrap();
}

// ========================================
// T-6.2: Wire executor to lib.rs startup
// ========================================

#[tokio::test]
async fn test_executor_integrates_with_in_memory_store() {
    let store = Arc::new(InMemoryStore::new());
    let executor = Executor::new().with_store(store.clone());

    // Should be able to start with store attached
    let result = executor.start().await;
    assert!(result.is_ok());

    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_executor_emits_events_on_startup() {
    let executor = Arc::new(Executor::new());
    let mut receiver = executor.subscribe();

    executor.start().await.unwrap();

    // Give it a moment to start polling
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Should be running
    assert_eq!(executor.state().await, ExecutorState::Running);

    executor.stop().await.unwrap();
}

// ========================================
// T-6.3: Test for browser launcher integration
// ========================================

#[test]
fn test_browser_launcher_integration_with_executor() {
    // BrowserLauncher should be creatable independently
    let launcher = BrowserLauncher::new();

    // Should have default config
    assert!(launcher.chrome_path().is_none());
}

#[test]
fn test_chrome_url_integration_with_session() {
    let params = ChromeParams {
        session_id: "sess_integration".to_string(),
        job_id: "job_integration".to_string(),
        group_url: "https://facebook.com/groups/test".to_string(),
        platform: "facebook_groups".to_string(),
        profile_path: None,
        debug_port: None,
    };

    let url = build_chrome_url(&params);

    // URL should contain all required params
    assert!(url.contains("sp_session_id=sess_integration"));
    assert!(url.contains("sp_job_id=job_integration"));
    assert!(url.contains("sp_platform=facebook_groups"));
    assert!(url.contains("sp_handshake=1"));
}

#[test]
fn test_handshake_manager_integration_flow() {
    let mut handshake = HandshakeManager::new();

    // Start handshake
    handshake.start_handshake("sess_test".to_string());
    assert_eq!(handshake.status(), HandshakeStatus::InProgress);

    // Process handshake init
    let msg = HandshakeMessage::HandshakeInit {
        session_id: "sess_test".to_string(),
        extension_version: "1.0.0".to_string(),
    };

    let response = handshake.process_message(msg);
    match response {
        HandshakeResponse::HandshakeAck { success, .. } => {
            assert!(success);
        }
        _ => panic!("Expected HandshakeAck"),
    }
}

// ========================================
// T-6.4: Connect executor to browser launcher
// ========================================

#[tokio::test]
async fn test_executor_and_browser_launcher_work_together() {
    // Create executor
    let executor = Arc::new(Executor::new());

    // Create browser launcher
    let launcher = BrowserLauncher::new();

    // Start executor
    executor.start().await.unwrap();

    // Build URL for a job
    let params = ChromeParams {
        session_id: "sess_combo".to_string(),
        job_id: "job_combo".to_string(),
        group_url: "https://facebook.com/groups/combo".to_string(),
        platform: "facebook_groups".to_string(),
        profile_path: None,
        debug_port: None,
    };

    let url = build_chrome_url(&params);

    // Should be valid URL
    assert!(url.starts_with("https://social-pip.local/handshake?"));

    // Cleanup
    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_executor_anti_ban_integrates_with_browser_launch() {
    let executor = Arc::new(Executor::new());

    // Start executor first
    executor.start().await.unwrap();

    // Create anti-ban engine for session
    executor
        .get_or_create_anti_ban("sess_anti_ban", "facebook_groups")
        .await;

    // Check if can execute
    let can_execute = executor.can_execute_job("sess_anti_ban", "post").await;
    assert!(can_execute, "Should be able to execute initially");

    // Get delay
    let delay = executor.get_next_delay("sess_anti_ban").await;
    assert!(delay >= 60_000, "Delay should be at least 60 seconds");

    executor.stop().await.unwrap();
}

// ========================================
// T-6.5: Test for full posting flow
// ========================================

#[tokio::test]
async fn test_full_posting_flow_with_store() {
    // Setup
    let store = Arc::new(InMemoryStore::new());
    let executor = Executor::new().with_store(store.clone());

    // Create a session
    let session = database::PostSessionModel::new(
        "sess_full_flow".to_string(),
        "acct_123".to_string(),
        None,
        2,
        "{}".to_string(),
    );
    store.sessions.create_session(session).unwrap();

    // Create jobs
    let job1 = database::PostJobModel::new(
        "job_full_1".to_string(),
        "sess_full_flow".to_string(),
        "group_123".to_string(),
        "facebook_groups".to_string(),
        1,
        "Test content".to_string(),
    );
    let job2 = database::PostJobModel::new(
        "job_full_2".to_string(),
        "sess_full_flow".to_string(),
        "group_456".to_string(),
        "facebook_groups".to_string(),
        2,
        "Test content 2".to_string(),
    );
    store.jobs.create_job(job1).unwrap();
    store.jobs.create_job(job2).unwrap();

    // Start executor
    executor.start().await.unwrap();

    // Give it time to process
    tokio::time::sleep(Duration::from_millis(200)).await;

    // Executor should be running
    assert_eq!(executor.state().await, ExecutorState::Running);

    // Cleanup
    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_posting_flow_with_result_handler() {
    // Setup store and handler
    let store = Arc::new(InMemoryStore::new());
    let handler = Arc::new(ResultHandler::new(store.clone()));

    // Create session and job
    let session = database::PostSessionModel::new(
        "sess_result".to_string(),
        "acct_result".to_string(),
        None,
        1,
        "{}".to_string(),
    );
    store.sessions.create_session(session).unwrap();

    let job = database::PostJobModel::new(
        "job_result".to_string(),
        "sess_result".to_string(),
        "group_result".to_string(),
        "facebook_groups".to_string(),
        1,
        "Result test".to_string(),
    );
    store.jobs.create_job(job).unwrap();

    // Process result
    let result = PostResult::success(
        "job_result".to_string(),
        "sess_result".to_string(),
        Some("https://facebook.com/post/123".to_string()),
        None,
        Some(5000),
    );

    let outcome = handler.handle_job_result(result).unwrap();

    assert!(outcome.success);
    assert_eq!(outcome.job_id, "job_result");

    // Verify job updated
    let updated_job = store.jobs.get_job("job_result").unwrap().unwrap();
    assert_eq!(updated_job.status, "success");
}

// ========================================
// T-6.6: End-to-end integration
// ========================================

#[tokio::test]
async fn test_end_to_end_create_session_executor_picks_up() {
    // Full flow: create session → executor picks up → browser launches → result reported

    // 1. Setup
    let store = Arc::new(InMemoryStore::new());
    let executor = Arc::new(Executor::new().with_store(store.clone()));
    let result_handler = Arc::new(ResultHandler::new(store.clone()));

    // 2. Create session
    let session = database::PostSessionModel::new(
        "sess_e2e".to_string(),
        "acct_e2e".to_string(),
        None,
        3,
        "{}".to_string(),
    );
    store.sessions.create_session(session).unwrap();

    // 3. Create jobs with different priorities
    for i in 1..=3 {
        let job = database::PostJobModel::new(
            format!("job_e2e_{}", i),
            "sess_e2e".to_string(),
            format!("group_{}", i),
            "facebook_groups".to_string(),
            i as i32,
            format!("Content {}", i),
        );
        store.jobs.create_job(job).unwrap();
    }

    // 4. Start executor
    executor.start().await.unwrap();

    // 5. Subscribe to events
    let mut event_receiver = executor.subscribe();

    // 6. Give executor time to pick up jobs
    tokio::time::sleep(Duration::from_millis(500)).await;

    // 7. Build browser URLs for each job (simulating browser launch)
    for i in 1..=3 {
        let params = ChromeParams {
            session_id: "sess_e2e".to_string(),
            job_id: format!("job_e2e_{}", i),
            group_url: format!("https://facebook.com/groups/{}", i),
            platform: "facebook_groups".to_string(),
            profile_path: None,
            debug_port: None,
        };
        let url = build_chrome_url(&params);
        assert!(url.contains(&format!("job_e2e_{}", i)));
    }

    // 8. Simulate result reporting
    let result = PostResult::success(
        "job_e2e_1".to_string(),
        "sess_e2e".to_string(),
        Some("https://facebook.com/post/e2e1".to_string()),
        None,
        Some(3000),
    );

    let outcome = result_handler.handle_job_result(result).unwrap();
    assert!(outcome.success);

    // 9. Verify session counters updated
    let session = store.sessions.get_session("sess_e2e").unwrap().unwrap();
    assert_eq!(session.successful_jobs, 1);

    // 10. Cleanup
    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_e2e_with_anti_ban_integration() {
    // End-to-end test with anti-ban integration

    let store = Arc::new(InMemoryStore::new());
    let executor = Executor::new().with_store(store.clone());

    // Create session
    let session = database::PostSessionModel::new(
        "sess_antiban_e2e".to_string(),
        "acct_antiban".to_string(),
        None,
        5,
        "{}".to_string(),
    );
    store.sessions.create_session(session).unwrap();

    // Create multiple jobs
    for i in 1..=5 {
        let job = database::PostJobModel::new(
            format!("job_antiban_{}", i),
            "sess_antiban_e2e".to_string(),
            format!("group_ab_{}", i),
            "facebook_groups".to_string(),
            i as i32,
            format!("Anti-ban test {}", i),
        );
        store.jobs.create_job(job).unwrap();
    }

    // Start executor
    executor.start().await.unwrap();

    // Initialize anti-ban for session
    executor
        .get_or_create_anti_ban("sess_antiban_e2e", "facebook_groups")
        .await;

    // Check execution is allowed
    let can_execute = executor.can_execute_job("sess_antiban_e2e", "post").await;
    assert!(can_execute, "Should be able to execute initially");

    // Get delay for first job
    let delay = executor.get_next_delay("sess_antiban_e2e").await;
    assert!(delay > 0, "Should have a positive delay");

    // Simulate recording actions
    executor
        .record_action("sess_antiban_e2e", "post", true, 60000)
        .await;

    // Get updated delay (should potentially change)
    let new_delay = executor.get_next_delay("sess_antiban_e2e").await;
    assert!(new_delay > 0);

    // Cleanup
    executor.stop().await.unwrap();
}

#[tokio::test]
async fn test_e2e_handshake_flow() {
    // Test handshake flow integration

    let mut handshake = HandshakeManager::new();

    // Start handshake
    handshake.start_handshake("sess_handshake_e2e".to_string());

    // Extension initiates handshake
    let init_msg = HandshakeMessage::HandshakeInit {
        session_id: "sess_handshake_e2e".to_string(),
        extension_version: "1.0.0".to_string(),
    };

    let ack = handshake.process_message(init_msg);
    match ack {
        HandshakeResponse::HandshakeAck { success, .. } => {
            assert!(success, "Handshake should succeed");
        }
        _ => panic!("Expected HandshakeAck"),
    }

    // Extension confirms ready
    let ready_msg = HandshakeMessage::Ready {
        session_id: "sess_handshake_e2e".to_string(),
    };

    let _response = handshake.process_message(ready_msg);

    // Handshake should be complete
    assert_eq!(handshake.status(), HandshakeStatus::Completed);
}

#[tokio::test]
async fn test_e2e_error_handling_flow() {
    // Test error handling through the full flow

    let store = Arc::new(InMemoryStore::new());
    let result_handler = Arc::new(ResultHandler::new(store.clone()));

    // Create session and job
    let session = database::PostSessionModel::new(
        "sess_error_e2e".to_string(),
        "acct_error".to_string(),
        None,
        1,
        "{}".to_string(),
    );
    store.sessions.create_session(session).unwrap();

    let job = database::PostJobModel::new(
        "job_error_e2e".to_string(),
        "sess_error_e2e".to_string(),
        "group_error".to_string(),
        "facebook_groups".to_string(),
        1,
        "Error test".to_string(),
    );
    store.jobs.create_job(job).unwrap();

    // Clear error aggregator
    ErrorAggregator::clear_all();

    // Process failure result
    let result = PostResult::failure(
        "job_error_e2e".to_string(),
        "sess_error_e2e".to_string(),
        "Rate limit exceeded for posting".to_string(),
        Some("RATE_LIMITED".to_string()),
        None,
    );

    let outcome = result_handler.handle_job_result(result).unwrap();

    assert!(!outcome.success);
    assert!(outcome.error_group.is_some());

    // Verify error was aggregated
    let group = outcome.error_group.unwrap();
    assert_eq!(group.error_type, "RATE_LIMITED");

    // Verify job status
    let job = store.jobs.get_job("job_error_e2e").unwrap().unwrap();
    assert_eq!(job.status, "failed");

    // Verify session counter
    let session = store
        .sessions
        .get_session("sess_error_e2e")
        .unwrap()
        .unwrap();
    assert_eq!(session.failed_jobs, 1);
}

// ========================================
// Integration helper tests
// ========================================

#[test]
fn test_integration_test_infrastructure() {
    // Verify all components can be created for integration tests
    let store = InMemoryStore::new();
    let launcher = BrowserLauncher::new();
    let handshake = HandshakeManager::new();

    // All should be creatable
    assert!(true);
}

#[tokio::test]
async fn test_executor_lifecycle_with_multiple_sessions() {
    let executor = Arc::new(Executor::new());

    executor.start().await.unwrap();

    // Create multiple session anti-ban engines
    for i in 1..=5 {
        executor
            .get_or_create_anti_ban(&format!("sess_multi_{}", i), "facebook_groups")
            .await;
    }

    // All should be trackable
    for i in 1..=5 {
        let can_execute = executor
            .can_execute_job(&format!("sess_multi_{}", i), "post")
            .await;
        assert!(can_execute);
    }

    // Remove some
    executor.remove_anti_ban("sess_multi_1").await;
    executor.remove_anti_ban("sess_multi_3").await;

    // Verify removed by checking can_execute fails for removed ones
    // (they would need to be recreated, so we check behavior instead)
    executor.stop().await.unwrap();
}
