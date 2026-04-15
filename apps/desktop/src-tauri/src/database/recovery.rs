//! Session recovery module
//!
//! Handles recovery of incomplete sessions on app restart.
//! Implements DATABASE-PERSISTENCE-002: Session Recovery on Startup.

use super::models::PostSessionModel;
use super::persistence::{JobPersistence, SessionPersistence};
use serde::{Deserialize, Serialize};

// ============================================
// RECOVERY TYPES
// ============================================

/// Result of recovery operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryResult {
    pub session_id: String,
    pub pending_jobs_count: u32,
    pub status: String,
}

/// Summary of all recovered sessions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoverySummary {
    pub sessions_recovered: u32,
    pub total_pending_jobs: u32,
    pub sessions: Vec<RecoveryResult>,
}

// ============================================
// RECOVERY FUNCTIONS
// ============================================

/// Recover incomplete sessions from persistence
///
/// This function should be called on app startup to find and resume
/// any sessions that were interrupted by app close/crash.
///
/// # Arguments
/// * `session_store` - The session persistence layer
/// * `job_store` - The job persistence layer
///
/// # Returns
/// * `RecoverySummary` - Summary of recovered sessions and pending jobs
pub fn recover_pending_sessions<S, J>(
    session_store: &S,
    job_store: &J,
) -> Result<RecoverySummary, String>
where
    S: SessionPersistence,
    J: JobPersistence,
{
    // Find sessions that need recovery (pending or running)
    let pending_sessions = session_store.get_sessions_by_status("pending")?;
    let running_sessions = session_store.get_sessions_by_status("running")?;

    let mut sessions_to_recover: Vec<PostSessionModel> = Vec::new();
    sessions_to_recover.extend(pending_sessions);
    sessions_to_recover.extend(running_sessions);

    let mut recovery_results: Vec<RecoveryResult> = Vec::new();
    let mut total_pending_jobs = 0u32;

    for session in &sessions_to_recover {
        // Get pending jobs for this session
        let pending_jobs = job_store.get_pending_jobs(&session.id)?;
        let pending_count = pending_jobs.len() as u32;

        if pending_count > 0 {
            total_pending_jobs += pending_count;

            recovery_results.push(RecoveryResult {
                session_id: session.id.clone(),
                pending_jobs_count: pending_count,
                status: session.status.clone(),
            });
        }
    }

    Ok(RecoverySummary {
        sessions_recovered: recovery_results.len() as u32,
        total_pending_jobs,
        sessions: recovery_results,
    })
}

/// Check if a session needs recovery
pub fn session_needs_recovery(session: &PostSessionModel) -> bool {
    matches!(session.status.as_str(), "pending" | "running")
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::super::models::PostJobModel;
    use super::super::persistence::InMemoryStore;
    use super::*;

    #[test]
    fn test_recover_pending_sessions_empty() {
        let store = InMemoryStore::new();
        let result = recover_pending_sessions(&store.sessions, &store.jobs).unwrap();

        assert_eq!(result.sessions_recovered, 0);
        assert_eq!(result.total_pending_jobs, 0);
        assert!(result.sessions.is_empty());
    }

    #[test]
    fn test_recover_pending_sessions_with_pending_jobs() {
        let store = InMemoryStore::new();

        // Create a pending session with jobs
        let mut session = PostSessionModel::new(
            "sess_1".to_string(),
            "acct_1".to_string(),
            None,
            3,
            "{}".to_string(),
        );
        store.sessions.create_session(session.clone()).unwrap();

        // Create pending jobs
        let job1 = PostJobModel::new(
            "job_1".to_string(),
            "sess_1".to_string(),
            "group_1".to_string(),
            "facebook_groups".to_string(),
            1,
            "content".to_string(),
        );
        let job2 = PostJobModel::new(
            "job_2".to_string(),
            "sess_1".to_string(),
            "group_2".to_string(),
            "facebook_groups".to_string(),
            2,
            "content".to_string(),
        );
        store.jobs.create_job(job1).unwrap();
        store.jobs.create_job(job2).unwrap();

        let result = recover_pending_sessions(&store.sessions, &store.jobs).unwrap();

        assert_eq!(result.sessions_recovered, 1);
        assert_eq!(result.total_pending_jobs, 2);
        assert_eq!(result.sessions.len(), 1);
        assert_eq!(result.sessions[0].session_id, "sess_1");
        assert_eq!(result.sessions[0].pending_jobs_count, 2);
    }

    #[test]
    fn test_recover_skips_completed_sessions() {
        let store = InMemoryStore::new();

        // Create completed session
        let mut completed = PostSessionModel::new(
            "sess_completed".to_string(),
            "acct_1".to_string(),
            None,
            1,
            "{}".to_string(),
        );
        completed.status = "completed".to_string();
        store.sessions.create_session(completed).unwrap();

        // Create pending session
        let pending = PostSessionModel::new(
            "sess_pending".to_string(),
            "acct_1".to_string(),
            None,
            1,
            "{}".to_string(),
        );
        store.sessions.create_session(pending).unwrap();

        let job = PostJobModel::new(
            "job_1".to_string(),
            "sess_pending".to_string(),
            "group_1".to_string(),
            "facebook_groups".to_string(),
            1,
            "content".to_string(),
        );
        store.jobs.create_job(job).unwrap();

        let result = recover_pending_sessions(&store.sessions, &store.jobs).unwrap();

        // Only pending session should be recovered
        assert_eq!(result.sessions_recovered, 1);
        assert_eq!(result.sessions[0].session_id, "sess_pending");
    }

    #[test]
    fn test_recover_running_sessions() {
        let store = InMemoryStore::new();

        // Create running session (interrupted mid-execution)
        let mut running = PostSessionModel::new(
            "sess_running".to_string(),
            "acct_1".to_string(),
            None,
            5,
            "{}".to_string(),
        );
        running.status = "running".to_string();
        running.completed_jobs = 2; // Some jobs completed
        store.sessions.create_session(running).unwrap();

        // Create pending jobs (remaining from interrupted run)
        let job = PostJobModel::new(
            "job_remaining".to_string(),
            "sess_running".to_string(),
            "group_1".to_string(),
            "facebook_groups".to_string(),
            1,
            "content".to_string(),
        );
        store.jobs.create_job(job).unwrap();

        let result = recover_pending_sessions(&store.sessions, &store.jobs).unwrap();

        assert_eq!(result.sessions_recovered, 1);
        assert_eq!(result.sessions[0].status, "running");
        assert_eq!(result.sessions[0].pending_jobs_count, 1);
    }

    #[test]
    fn test_session_needs_recovery() {
        let pending = PostSessionModel::new(
            "sess_1".to_string(),
            "acct_1".to_string(),
            None,
            1,
            "{}".to_string(),
        );
        assert!(session_needs_recovery(&pending));

        let mut running = pending.clone();
        running.status = "running".to_string();
        assert!(session_needs_recovery(&running));

        let mut completed = pending.clone();
        completed.status = "completed".to_string();
        assert!(!session_needs_recovery(&completed));

        let mut cancelled = pending.clone();
        cancelled.status = "cancelled".to_string();
        assert!(!session_needs_recovery(&cancelled));
    }

    #[test]
    fn test_multiple_sessions_recovery() {
        let store = InMemoryStore::new();

        // Create multiple sessions in different states
        for i in 0..3 {
            let mut session = PostSessionModel::new(
                format!("sess_{}", i),
                "acct_1".to_string(),
                None,
                2,
                "{}".to_string(),
            );
            if i == 2 {
                session.status = "completed".to_string();
            }
            store.sessions.create_session(session).unwrap();

            // Add pending jobs only to non-completed sessions
            if i < 2 {
                for j in 0..2 {
                    let job = PostJobModel::new(
                        format!("job_{}_{}", i, j),
                        format!("sess_{}", i),
                        format!("group_{}", j),
                        "facebook_groups".to_string(),
                        j as i32,
                        "content".to_string(),
                    );
                    store.jobs.create_job(job).unwrap();
                }
            }
        }

        let result = recover_pending_sessions(&store.sessions, &store.jobs).unwrap();

        // Only 2 sessions should be recovered (pending and running)
        assert_eq!(result.sessions_recovered, 2);
        assert_eq!(result.total_pending_jobs, 4);
    }
}
