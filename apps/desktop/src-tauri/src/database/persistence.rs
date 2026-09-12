//! Database persistence layer for sessions and jobs
//!
//! This module provides the interface for persisting PostSessions and PostJobs
//! to SQLite. Replaces the in-memory HashMaps in commands/posting.rs.

// Note: serde derives not currently used in this file, re-add when needed
use std::collections::HashMap;
use std::sync::Mutex;

use super::models::{PostJobModel, PostSessionModel};

// ============================================
// PERSISTENCE TRAIT
// ============================================

/// Trait for session persistence operations
///
/// This trait abstracts the persistence layer, allowing for different
/// implementations (in-memory for testing, SQLite for production).
pub trait SessionPersistence: Send + Sync {
    /// Create a new session
    fn create_session(&self, session: PostSessionModel) -> Result<(), String>;

    /// Get a session by ID
    fn get_session(&self, id: &str) -> Result<Option<PostSessionModel>, String>;

    /// Update a session
    fn update_session(&self, session: PostSessionModel) -> Result<(), String>;

    /// Delete a session
    fn delete_session(&self, id: &str) -> Result<(), String>;

    /// List all sessions
    fn list_sessions(&self) -> Result<Vec<PostSessionModel>, String>;

    /// Get sessions by status
    fn get_sessions_by_status(&self, status: &str) -> Result<Vec<PostSessionModel>, String>;
}

/// Trait for job persistence operations
pub trait JobPersistence: Send + Sync {
    /// Create a new job
    fn create_job(&self, job: PostJobModel) -> Result<(), String>;

    /// Get a job by ID
    fn get_job(&self, id: &str) -> Result<Option<PostJobModel>, String>;

    /// Update a job
    fn update_job(&self, job: PostJobModel) -> Result<(), String>;

    /// Delete a job
    fn delete_job(&self, id: &str) -> Result<(), String>;

    /// Get all jobs for a session
    fn get_jobs_by_session(&self, session_id: &str) -> Result<Vec<PostJobModel>, String>;

    /// Get pending jobs for a session, ordered by priority
    fn get_pending_jobs(&self, session_id: &str) -> Result<Vec<PostJobModel>, String>;

    /// Get all pending jobs across all sessions (for recovery)
    fn get_all_pending_jobs(&self) -> Result<Vec<PostJobModel>, String>;

    /// Get pending jobs (alias for get_all_pending_jobs)
    fn get_pending_jobs_all(&self) -> Result<Vec<PostJobModel>, String> {
        self.get_all_pending_jobs()
    }
}

// ============================================
// IN-MEMORY IMPLEMENTATION (for testing/transition)
// ============================================

/// In-memory session store for testing and transition period
pub struct InMemorySessionStore {
    sessions: Mutex<HashMap<String, PostSessionModel>>,
}

impl InMemorySessionStore {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

impl Default for InMemorySessionStore {
    fn default() -> Self {
        Self::new()
    }
}

impl SessionPersistence for InMemorySessionStore {
    fn create_session(&self, session: PostSessionModel) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        sessions.insert(session.id.clone(), session);
        Ok(())
    }

    fn get_session(&self, id: &str) -> Result<Option<PostSessionModel>, String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        Ok(sessions.get(id).cloned())
    }

    fn update_session(&self, session: PostSessionModel) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        sessions.insert(session.id.clone(), session);
        Ok(())
    }

    fn delete_session(&self, id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        sessions.remove(id);
        Ok(())
    }

    fn list_sessions(&self) -> Result<Vec<PostSessionModel>, String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        Ok(sessions.values().cloned().collect())
    }

    fn get_sessions_by_status(&self, status: &str) -> Result<Vec<PostSessionModel>, String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        Ok(sessions
            .values()
            .filter(|s| s.status == status)
            .cloned()
            .collect())
    }
}

/// In-memory job store for testing and transition period
pub struct InMemoryJobStore {
    jobs: Mutex<HashMap<String, PostJobModel>>,
}

impl InMemoryJobStore {
    pub fn new() -> Self {
        Self {
            jobs: Mutex::new(HashMap::new()),
        }
    }
}

impl Default for InMemoryJobStore {
    fn default() -> Self {
        Self::new()
    }
}

impl JobPersistence for InMemoryJobStore {
    fn create_job(&self, job: PostJobModel) -> Result<(), String> {
        let mut jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        jobs.insert(job.id.clone(), job);
        Ok(())
    }

    fn get_job(&self, id: &str) -> Result<Option<PostJobModel>, String> {
        let jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        Ok(jobs.get(id).cloned())
    }

    fn update_job(&self, job: PostJobModel) -> Result<(), String> {
        let mut jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        jobs.insert(job.id.clone(), job);
        Ok(())
    }

    fn delete_job(&self, id: &str) -> Result<(), String> {
        let mut jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        jobs.remove(id);
        Ok(())
    }

    fn get_jobs_by_session(&self, session_id: &str) -> Result<Vec<PostJobModel>, String> {
        let jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        Ok(jobs
            .values()
            .filter(|j| j.session_id == session_id)
            .cloned()
            .collect())
    }

    fn get_pending_jobs(&self, session_id: &str) -> Result<Vec<PostJobModel>, String> {
        let jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        let mut pending: Vec<_> = jobs
            .values()
            .filter(|j| j.session_id == session_id && j.status == "pending")
            .cloned()
            .collect();
        pending.sort_by_key(|j| j.priority);
        Ok(pending)
    }

    fn get_all_pending_jobs(&self) -> Result<Vec<PostJobModel>, String> {
        let jobs = self.jobs.lock().map_err(|e| e.to_string())?;
        Ok(jobs
            .values()
            .filter(|j| j.status == "pending")
            .cloned()
            .collect())
    }
}

// ============================================
// COMBINED STORE
// ============================================

/// Combined in-memory store for sessions and jobs
pub struct InMemoryStore {
    pub sessions: InMemorySessionStore,
    pub jobs: InMemoryJobStore,
}

impl InMemoryStore {
    pub fn new() -> Self {
        Self {
            sessions: InMemorySessionStore::new(),
            jobs: InMemoryJobStore::new(),
        }
    }

    /// Clear all data (for testing)
    pub fn clear(&self) -> Result<(), String> {
        self.sessions
            .sessions
            .lock()
            .map_err(|e| e.to_string())?
            .clear();
        self.jobs.jobs.lock().map_err(|e| e.to_string())?.clear();
        Ok(())
    }

    /// Get all pending jobs (for executor polling)
    pub fn get_pending_jobs(&self) -> Result<Vec<PostJobModel>, String> {
        self.jobs.get_all_pending_jobs()
    }
}

impl Default for InMemoryStore {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_session() -> PostSessionModel {
        PostSessionModel::new(
            "sess_test".to_string(),
            "acct_test".to_string(),
            None,
            3,
            "{}".to_string(),
        )
    }

    fn create_test_job(session_id: &str, priority: i32) -> PostJobModel {
        PostJobModel::new(
            format!("job_{}", priority),
            session_id.to_string(),
            "group_test".to_string(),
            "facebook_groups".to_string(),
            priority,
            "Test content".to_string(),
        )
    }

    #[test]
    fn test_in_memory_session_crud() {
        let store = InMemorySessionStore::new();

        // Create
        let session = create_test_session();
        store.create_session(session.clone()).unwrap();

        // Read
        let retrieved = store.get_session("sess_test").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "sess_test");

        // Update
        let mut updated = create_test_session();
        updated.total_jobs = 5;
        store.update_session(updated).unwrap();

        let retrieved = store.get_session("sess_test").unwrap().unwrap();
        assert_eq!(retrieved.total_jobs, 5);

        // Delete
        store.delete_session("sess_test").unwrap();
        let retrieved = store.get_session("sess_test").unwrap();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_in_memory_job_crud() {
        let store = InMemoryJobStore::new();

        // Create
        let job = create_test_job("sess_test", 99);
        store.create_job(job.clone()).unwrap();

        // Read
        let retrieved = store.get_job("job_99").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "job_99");

        // Update
        let mut updated = create_test_job("sess_test", 99);
        updated.status = "success".to_string();
        store.update_job(updated).unwrap();

        let retrieved = store.get_job("job_99").unwrap().unwrap();
        assert_eq!(retrieved.status, "success");

        // Delete
        store.delete_job("job_99").unwrap();
        let retrieved = store.get_job("job_99").unwrap();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_get_jobs_by_session() {
        let store = InMemoryJobStore::new();

        // Create multiple jobs for different sessions
        store.create_job(create_test_job("sess_1", 1)).unwrap();
        store.create_job(create_test_job("sess_1", 2)).unwrap();
        store.create_job(create_test_job("sess_2", 3)).unwrap();

        let jobs = store.get_jobs_by_session("sess_1").unwrap();
        assert_eq!(jobs.len(), 2);

        let jobs = store.get_jobs_by_session("sess_2").unwrap();
        assert_eq!(jobs.len(), 1);
    }

    #[test]
    fn test_get_pending_jobs_ordered_by_priority() {
        let store = InMemoryJobStore::new();

        // Create jobs with different priorities (lower = higher priority)
        let mut job1 = create_test_job("sess_test", 99);
        job1.id = "job_1".to_string();
        store.create_job(job1).unwrap();

        let mut job2 = create_test_job("sess_test", 5);
        job2.id = "job_2".to_string();
        store.create_job(job2).unwrap();

        let mut job3 = create_test_job("sess_test", 10);
        job3.id = "job_3".to_string();
        store.create_job(job3).unwrap();

        // Mark one as processing
        let mut processing = create_test_job("sess_test", 1);
        processing.id = "job_4".to_string();
        processing.status = "processing".to_string();
        store.create_job(processing).unwrap();

        let pending = store.get_pending_jobs("sess_test").unwrap();

        // Should return only pending jobs, ordered by priority
        assert_eq!(pending.len(), 3);
        assert_eq!(pending[0].priority, 5); // Lowest number = highest priority
        assert_eq!(pending[1].priority, 10);
        assert_eq!(pending[2].priority, 99);
    }

    #[test]
    fn test_get_sessions_by_status() {
        let store = InMemorySessionStore::new();

        // Create sessions with different statuses
        let mut session1 = create_test_session();
        session1.id = "sess_1".to_string();
        store.create_session(session1).unwrap();

        let mut session2 = create_test_session();
        session2.id = "sess_2".to_string();
        session2.status = "running".to_string();
        store.create_session(session2).unwrap();

        let mut session3 = create_test_session();
        session3.id = "sess_3".to_string();
        session3.status = "completed".to_string();
        store.create_session(session3).unwrap();

        let pending = store.get_sessions_by_status("pending").unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].id, "sess_1");

        let running = store.get_sessions_by_status("running").unwrap();
        assert_eq!(running.len(), 1);
    }

    #[test]
    fn test_combined_store() {
        let store = InMemoryStore::new();

        // Create session and jobs
        let session = create_test_session();
        store.sessions.create_session(session).unwrap();

        store
            .jobs
            .create_job(create_test_job("sess_test", 1))
            .unwrap();
        store
            .jobs
            .create_job(create_test_job("sess_test", 2))
            .unwrap();

        // Verify both exist
        let session = store.sessions.get_session("sess_test").unwrap().unwrap();
        assert_eq!(session.id, "sess_test");

        let jobs = store.jobs.get_jobs_by_session("sess_test").unwrap();
        assert_eq!(jobs.len(), 2);

        // Clear all
        store.clear().unwrap();

        let session = store.sessions.get_session("sess_test").unwrap();
        assert!(session.is_none());

        let jobs = store.jobs.get_jobs_by_session("sess_test").unwrap();
        assert!(jobs.is_empty());
    }
}
