//! SQLite-based persistence layer for sessions and jobs
//!
//! This module provides SQLite persistence implementations for SessionPersistence
//! and JobPersistence traits using `rusqlite` (bundled SQLite).
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
//! │  Application    │────▶│  SqliteSession  │────▶│  SQLite (rusqlite│
//! │  Code           │     │  / SqliteJob    │     │  bundled)        │
//! └─────────────────┘     └─────────────────┘     └─────────────────┘
//!                                                        │
//!                                                        ▼
//!                                                   ┌─────────────────┐
//!                                                   │ social_pip.db  │
//!                                                   └─────────────────┘
//! ```
//!
//! # Database Schema
//!
//! - `sessions` table: Stores posting session data
//! - `jobs` table: Stores individual posting jobs per session
//!
//! Both stores hold an `Arc<Mutex<Connection>>` so the combined [`SqliteStore`]
//! can share a single connection (which is required for in-memory test DBs and
//! for `jobs.session_id` foreign-key integrity). Every query is parametrized
//! (no string-built SQL) to satisfy RS-05.

use std::path::Path;
use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::database::{JobPersistence, PostJobModel, PostSessionModel, SessionPersistence};

// ============================================
// SCHEMA
// ============================================

const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS sessions (
    id               TEXT PRIMARY KEY NOT NULL,
    status           TEXT NOT NULL,
    template_id      TEXT,
    account_id       TEXT NOT NULL,
    total_jobs       INTEGER NOT NULL,
    completed_jobs   INTEGER NOT NULL DEFAULT 0,
    successful_jobs  INTEGER NOT NULL DEFAULT 0,
    failed_jobs      INTEGER NOT NULL DEFAULT 0,
    started_at       TEXT,
    completed_at     TEXT,
    cancelled_at     TEXT,
    last_error       TEXT,
    error_category   TEXT,
    config_snapshot  TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY NOT NULL,
    session_id      TEXT NOT NULL,
    group_id        TEXT NOT NULL,
    platform        TEXT NOT NULL,
    priority        INTEGER NOT NULL,
    content         TEXT NOT NULL,
    post_url        TEXT,
    status          TEXT NOT NULL,
    error_message   TEXT,
    error_category  TEXT,
    started_at      TEXT,
    completed_at    TEXT,
    duration_ms     INTEGER,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    max_retries     INTEGER NOT NULL DEFAULT 3,
    next_retry_at   TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_jobs_session ON jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
"#;

const SESSION_COLUMNS: &str = "id, status, template_id, account_id, total_jobs, completed_jobs, successful_jobs, failed_jobs, started_at, completed_at, cancelled_at, last_error, error_category, config_snapshot, created_at, updated_at";

const JOB_COLUMNS: &str = "id, session_id, group_id, platform, priority, content, post_url, status, error_message, error_category, started_at, completed_at, duration_ms, retry_count, max_retries, next_retry_at, created_at, updated_at";

// ============================================
// CONNECTION HELPERS
// ============================================

/// Open a SQLite connection, creating the parent directory for file paths and
/// enabling foreign-key enforcement. `":memory:"` yields a private in-memory DB.
fn open_connection(db_path: &str) -> Result<Connection, String> {
    if db_path != ":memory:" && !db_path.is_empty() {
        if let Some(parent) = Path::new(db_path).parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent).map_err(|e| {
                    format!("Failed to create database directory '{}': {}", parent.display(), e)
                })?;
            }
        }
    }

    let conn = Connection::open(db_path)
        .map_err(|e| format!("Failed to open SQLite database '{}': {}", db_path, e))?;

    let _ = conn.busy_timeout(std::time::Duration::from_secs(5));
    let _ = conn.execute_batch("PRAGMA foreign_keys = ON;");
    Ok(conn)
}

/// Create tables/indexes if they do not already exist.
fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(SCHEMA_SQL)
        .map_err(|e| format!("Failed to initialize SQLite schema: {}", e))
}

// ============================================
// ROW MAPPERS
// ============================================

fn row_to_session(row: &Row<'_>) -> rusqlite::Result<PostSessionModel> {
    Ok(PostSessionModel {
        id: row.get(0)?,
        status: row.get(1)?,
        template_id: row.get(2)?,
        account_id: row.get(3)?,
        total_jobs: row.get(4)?,
        completed_jobs: row.get(5)?,
        successful_jobs: row.get(6)?,
        failed_jobs: row.get(7)?,
        started_at: row.get(8)?,
        completed_at: row.get(9)?,
        cancelled_at: row.get(10)?,
        last_error: row.get(11)?,
        error_category: row.get(12)?,
        config_snapshot: row.get(13)?,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
    })
}

fn row_to_job(row: &Row<'_>) -> rusqlite::Result<PostJobModel> {
    Ok(PostJobModel {
        id: row.get(0)?,
        session_id: row.get(1)?,
        group_id: row.get(2)?,
        platform: row.get(3)?,
        priority: row.get(4)?,
        content: row.get(5)?,
        post_url: row.get(6)?,
        status: row.get(7)?,
        error_message: row.get(8)?,
        error_category: row.get(9)?,
        started_at: row.get(10)?,
        completed_at: row.get(11)?,
        duration_ms: row.get(12)?,
        retry_count: row.get(13)?,
        max_retries: row.get(14)?,
        next_retry_at: row.get(15)?,
        created_at: row.get(16)?,
        updated_at: row.get(17)?,
    })
}

// ============================================
// SQLITE SESSION STORE
// ============================================

/// SQLite-based session store.
///
/// Persists `PostSessionModel` rows to the `sessions` table. All reads/writes
/// go through the shared connection guarded by a `Mutex`, making the struct
/// `Send + Sync` to satisfy the `SessionPersistence` trait.
pub struct SqliteSessionStore {
    conn: Arc<Mutex<Connection>>,
    db_path: String,
}

impl SqliteSessionStore {
    /// Create a new SQLite session store, opening (and initializing) the
    /// database at `db_path`.
    pub fn new(db_path: String) -> Self {
        match open_connection(&db_path) {
            Ok(conn) => {
                let _ = init_schema(&conn);
                Self {
                    conn: Arc::new(Mutex::new(conn)),
                    db_path,
                }
            }
            Err(e) => {
                log::error!("SQLite session store open failed ({}), using in-memory fallback", e);
                let conn = Connection::open_in_memory().expect("in-memory fallback connection");
                let _ = init_schema(&conn);
                Self {
                    conn: Arc::new(Mutex::new(conn)),
                    db_path: ":memory:".to_string(),
                }
            }
        }
    }

    /// Build a session store sharing an existing connection (used by the
    /// combined [`SqliteStore`] so sessions and jobs share one DB).
    pub(crate) fn from_shared(conn: Arc<Mutex<Connection>>, db_path: String) -> Self {
        Self { conn, db_path }
    }

    /// Get the database path
    pub fn db_path(&self) -> &str {
        &self.db_path
    }
}

impl SessionPersistence for SqliteSessionStore {
    fn create_session(&self, session: PostSessionModel) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            &format!(
                "INSERT INTO sessions ({}) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)",
                SESSION_COLUMNS
            ),
            params![
                session.id,
                session.status,
                session.template_id,
                session.account_id,
                session.total_jobs,
                session.completed_jobs,
                session.successful_jobs,
                session.failed_jobs,
                session.started_at,
                session.completed_at,
                session.cancelled_at,
                session.last_error,
                session.error_category,
                session.config_snapshot,
                session.created_at,
                session.updated_at,
            ],
        )
        .map_err(|e| format!("Failed to create session: {}", e))?;
        Ok(())
    }

    fn get_session(&self, id: &str) -> Result<Option<PostSessionModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.query_row(
            &format!("SELECT {} FROM sessions WHERE id = ?1", SESSION_COLUMNS),
            params![id],
            row_to_session,
        )
        .optional()
        .map_err(|e| format!("Failed to get session '{}': {}", id, e))
    }

    fn update_session(&self, session: PostSessionModel) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE sessions SET status=?2, template_id=?3, account_id=?4, total_jobs=?5, \
             completed_jobs=?6, successful_jobs=?7, failed_jobs=?8, started_at=?9, \
             completed_at=?10, cancelled_at=?11, last_error=?12, error_category=?13, \
             config_snapshot=?14, created_at=?15, updated_at=?16 WHERE id = ?1",
            params![
                session.id,
                session.status,
                session.template_id,
                session.account_id,
                session.total_jobs,
                session.completed_jobs,
                session.successful_jobs,
                session.failed_jobs,
                session.started_at,
                session.completed_at,
                session.cancelled_at,
                session.last_error,
                session.error_category,
                session.config_snapshot,
                session.created_at,
                session.updated_at,
            ],
        )
        .map_err(|e| format!("Failed to update session: {}", e))?;
        Ok(())
    }

    fn delete_session(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete session '{}': {}", id, e))?;
        Ok(())
    }

    fn list_sessions(&self) -> Result<Vec<PostSessionModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(&format!("SELECT {} FROM sessions ORDER BY created_at", SESSION_COLUMNS))
            .map_err(|e| format!("Failed to prepare list_sessions: {}", e))?;
        let rows = stmt
            .query_map(params![], row_to_session)
            .map_err(|e| format!("Failed to query sessions: {}", e))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read sessions: {}", e))
    }

    fn get_sessions_by_status(&self, status: &str) -> Result<Vec<PostSessionModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM sessions WHERE status = ?1 ORDER BY created_at",
                SESSION_COLUMNS
            ))
            .map_err(|e| format!("Failed to prepare get_sessions_by_status: {}", e))?;
        let rows = stmt
            .query_map(params![status], row_to_session)
            .map_err(|e| format!("Failed to query sessions by status: {}", e))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read sessions by status: {}", e))
    }
}

// ============================================
// SQLITE JOB STORE
// ============================================

/// SQLite-based job store.
///
/// Persists `PostJobModel` rows to the `jobs` table, keyed by `session_id`.
pub struct SqliteJobStore {
    conn: Arc<Mutex<Connection>>,
    db_path: String,
}

impl SqliteJobStore {
    /// Create a new SQLite job store, opening (and initializing) the database
    /// at `db_path`.
    pub fn new(db_path: String) -> Self {
        match open_connection(&db_path) {
            Ok(conn) => {
                let _ = init_schema(&conn);
                Self {
                    conn: Arc::new(Mutex::new(conn)),
                    db_path,
                }
            }
            Err(e) => {
                log::error!("SQLite job store open failed ({}), using in-memory fallback", e);
                let conn = Connection::open_in_memory().expect("in-memory fallback connection");
                let _ = init_schema(&conn);
                Self {
                    conn: Arc::new(Mutex::new(conn)),
                    db_path: ":memory:".to_string(),
                }
            }
        }
    }

    /// Build a job store sharing an existing connection (used by the combined
    /// [`SqliteStore`]).
    pub(crate) fn from_shared(conn: Arc<Mutex<Connection>>, db_path: String) -> Self {
        Self { conn, db_path }
    }

    /// Get the database path
    pub fn db_path(&self) -> &str {
        &self.db_path
    }
}

impl JobPersistence for SqliteJobStore {
    fn create_job(&self, job: PostJobModel) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            &format!(
                "INSERT INTO jobs ({}) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18)",
                JOB_COLUMNS
            ),
            params![
                job.id,
                job.session_id,
                job.group_id,
                job.platform,
                job.priority,
                job.content,
                job.post_url,
                job.status,
                job.error_message,
                job.error_category,
                job.started_at,
                job.completed_at,
                job.duration_ms,
                job.retry_count,
                job.max_retries,
                job.next_retry_at,
                job.created_at,
                job.updated_at,
            ],
        )
        .map_err(|e| format!("Failed to create job: {}", e))?;
        Ok(())
    }

    fn get_job(&self, id: &str) -> Result<Option<PostJobModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.query_row(
            &format!("SELECT {} FROM jobs WHERE id = ?1", JOB_COLUMNS),
            params![id],
            row_to_job,
        )
        .optional()
        .map_err(|e| format!("Failed to get job '{}': {}", id, e))
    }

    fn update_job(&self, job: PostJobModel) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE jobs SET session_id=?2, group_id=?3, platform=?4, priority=?5, content=?6, \
             post_url=?7, status=?8, error_message=?9, error_category=?10, started_at=?11, \
             completed_at=?12, duration_ms=?13, retry_count=?14, max_retries=?15, \
             next_retry_at=?16, created_at=?17, updated_at=?18 WHERE id = ?1",
            params![
                job.id,
                job.session_id,
                job.group_id,
                job.platform,
                job.priority,
                job.content,
                job.post_url,
                job.status,
                job.error_message,
                job.error_category,
                job.started_at,
                job.completed_at,
                job.duration_ms,
                job.retry_count,
                job.max_retries,
                job.next_retry_at,
                job.created_at,
                job.updated_at,
            ],
        )
        .map_err(|e| format!("Failed to update job: {}", e))?;
        Ok(())
    }

    fn delete_job(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM jobs WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete job '{}': {}", id, e))?;
        Ok(())
    }

    fn get_jobs_by_session(&self, session_id: &str) -> Result<Vec<PostJobModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM jobs WHERE session_id = ?1 ORDER BY priority ASC, created_at ASC",
                JOB_COLUMNS
            ))
            .map_err(|e| format!("Failed to prepare get_jobs_by_session: {}", e))?;
        let rows = stmt
            .query_map(params![session_id], row_to_job)
            .map_err(|e| format!("Failed to query jobs by session: {}", e))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read jobs by session: {}", e))
    }

    fn get_pending_jobs(&self, session_id: &str) -> Result<Vec<PostJobModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM jobs WHERE session_id = ?1 AND status = 'pending' ORDER BY priority ASC, created_at ASC",
                JOB_COLUMNS
            ))
            .map_err(|e| format!("Failed to prepare get_pending_jobs: {}", e))?;
        let rows = stmt
            .query_map(params![session_id], row_to_job)
            .map_err(|e| format!("Failed to query pending jobs: {}", e))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read pending jobs: {}", e))
    }

    fn get_all_pending_jobs(&self) -> Result<Vec<PostJobModel>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(&format!(
                "SELECT {} FROM jobs WHERE status = 'pending' ORDER BY priority ASC, created_at ASC",
                JOB_COLUMNS
            ))
            .map_err(|e| format!("Failed to prepare get_all_pending_jobs: {}", e))?;
        let rows = stmt
            .query_map(params![], row_to_job)
            .map_err(|e| format!("Failed to query all pending jobs: {}", e))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to read all pending jobs: {}", e))
    }
}

// ============================================
// COMBINED STORE
// ============================================

/// Combined SQLite store for sessions and jobs sharing a single connection.
///
/// Mirrors the API of `InMemoryStore` (`sessions`, `jobs`, `clear`,
/// `get_pending_jobs`) so the posting command layer can swap persistence
/// backends without changing call sites.
pub struct SqliteStore {
    pub sessions: SqliteSessionStore,
    pub jobs: SqliteJobStore,
}

impl SqliteStore {
    /// Create a combined SQLite store at the given path, sharing one
    /// connection between the session and job stores.
    pub fn new(db_path: String) -> Self {
        let conn = match open_connection(&db_path) {
            Ok(conn) => conn,
            Err(e) => {
                log::error!("SQLite store open failed ({}), using in-memory fallback", e);
                Connection::open_in_memory().expect("in-memory fallback connection")
            }
        };
        let _ = init_schema(&conn);
        let shared = Arc::new(Mutex::new(conn));
        Self {
            sessions: SqliteSessionStore::from_shared(shared.clone(), db_path.clone()),
            jobs: SqliteJobStore::from_shared(shared, db_path),
        }
    }

    /// Build an in-memory store for tests and transient use.
    pub fn in_memory() -> Self {
        Self::new(":memory:".to_string())
    }

    /// Clear all data (session and job rows).
    pub fn clear(&self) -> Result<(), String> {
        let conn = self.sessions.conn.lock().map_err(|e| e.to_string())?;
        conn.execute_batch("DELETE FROM jobs; DELETE FROM sessions;")
            .map_err(|e| format!("Failed to clear SQLite store: {}", e))
    }

    /// Get all pending jobs across all sessions (for executor polling).
    pub fn get_pending_jobs(&self) -> Result<Vec<PostJobModel>, String> {
        self.jobs.get_all_pending_jobs()
    }

    /// Get the database path
    pub fn db_path(&self) -> &str {
        self.sessions.db_path()
    }
}

impl Default for SqliteStore {
    fn default() -> Self {
        Self::in_memory()
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn make_session(id: &str) -> PostSessionModel {
        PostSessionModel::new(
            id.to_string(),
            "acct_test".to_string(),
            Some("tmpl_1".to_string()),
            3,
            "{}".to_string(),
        )
    }

    fn make_job(id: &str, session_id: &str, priority: i32) -> PostJobModel {
        PostJobModel::new(
            id.to_string(),
            session_id.to_string(),
            format!("group_{}", id),
            "facebook_groups".to_string(),
            priority,
            "Test content".to_string(),
        )
    }

    #[test]
    fn test_sqlite_session_store_creation() {
        let store = SqliteSessionStore::new(":memory:".to_string());
        assert_eq!(store.db_path(), ":memory:");
    }

    #[test]
    fn test_sqlite_job_store_creation() {
        let store = SqliteJobStore::new(":memory:".to_string());
        assert_eq!(store.db_path(), ":memory:");
    }

    #[test]
    fn test_session_crud_persists() {
        let store = SqliteStore::in_memory();
        let session = make_session("sess_crud");

        // Create
        store.sessions.create_session(session.clone()).unwrap();

        // Read
        let retrieved = store.sessions.get_session("sess_crud").unwrap().unwrap();
        assert_eq!(retrieved.id, "sess_crud");
        assert_eq!(retrieved.account_id, "acct_test");
        assert_eq!(retrieved.total_jobs, 3);

        // Update
        let mut updated = make_session("sess_crud");
        updated.status = "running".to_string();
        updated.completed_jobs = 1;
        store.sessions.update_session(updated).unwrap();

        let retrieved = store.sessions.get_session("sess_crud").unwrap().unwrap();
        assert_eq!(retrieved.status, "running");
        assert_eq!(retrieved.completed_jobs, 1);

        // Delete
        store.sessions.delete_session("sess_crud").unwrap();
        assert!(store.sessions.get_session("sess_crud").unwrap().is_none());
    }

    #[test]
    fn test_job_crud_persists() {
        let store = SqliteStore::in_memory();
        store
            .sessions
            .create_session(make_session("sess_job"))
            .unwrap();

        // Create
        store.jobs.create_job(make_job("job_1", "sess_job", 5)).unwrap();

        // Read
        let retrieved = store.jobs.get_job("job_1").unwrap().unwrap();
        assert_eq!(retrieved.session_id, "sess_job");
        assert_eq!(retrieved.priority, 5);

        // Update
        let mut updated = make_job("job_1", "sess_job", 5);
        updated.status = "success".to_string();
        updated.post_url = Some("https://fb.com/post/1".to_string());
        store.jobs.update_job(updated).unwrap();

        let retrieved = store.jobs.get_job("job_1").unwrap().unwrap();
        assert_eq!(retrieved.status, "success");
        assert_eq!(retrieved.post_url.as_deref(), Some("https://fb.com/post/1"));

        // Delete
        store.jobs.delete_job("job_1").unwrap();
        assert!(store.jobs.get_job("job_1").unwrap().is_none());
    }

    #[test]
    fn test_get_jobs_by_session_and_pending() {
        let store = SqliteStore::in_memory();
        store
            .sessions
            .create_session(make_session("sess_1"))
            .unwrap();

        let mut j1 = make_job("job_a", "sess_1", 10);
        let mut j2 = make_job("job_b", "sess_1", 5);
        let mut j3 = make_job("job_c", "sess_1", 1);
        j3.status = "processing".to_string();
        store.jobs.create_job(j1.clone()).unwrap();
        store.jobs.create_job(j2.clone()).unwrap();
        store.jobs.create_job(j3).unwrap();

        let by_session = store.jobs.get_jobs_by_session("sess_1").unwrap();
        assert_eq!(by_session.len(), 3);

        let pending = store.jobs.get_pending_jobs("sess_1").unwrap();
        assert_eq!(pending.len(), 2);
        assert_eq!(pending[0].priority, 5);
        assert_eq!(pending[1].priority, 10);

        let all_pending = store.jobs.get_all_pending_jobs().unwrap();
        assert_eq!(all_pending.len(), 2);
    }

    #[test]
    fn test_sessions_by_status_and_list() {
        let store = SqliteStore::in_memory();

        let mut s1 = make_session("sess_pending");
        let mut s2 = make_session("sess_completed");
        s2.status = "completed".to_string();
        store.sessions.create_session(s1).unwrap();
        store.sessions.create_session(s2).unwrap();

        let pending = store.sessions.get_sessions_by_status("pending").unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].id, "sess_pending");

        let all = store.sessions.list_sessions().unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_clear_empties_both_tables() {
        let store = SqliteStore::in_memory();
        store
            .sessions
            .create_session(make_session("sess_clear"))
            .unwrap();
        store.jobs.create_job(make_job("job_clear", "sess_clear", 1)).unwrap();

        store.clear().unwrap();

        assert!(store.sessions.list_sessions().unwrap().is_empty());
        assert!(store.jobs.get_all_pending_jobs().unwrap().is_empty());
    }

    #[test]
    fn test_missing_session_returns_none() {
        let store = SqliteStore::in_memory();
        assert!(store.sessions.get_session("nope").unwrap().is_none());
        assert!(store.jobs.get_job("nope").unwrap().is_none());
    }

    #[test]
    fn test_file_backed_store_survives_reopen() {
        let dir = std::env::temp_dir().join(format!("social_pip_test_{}", std::process::id()));
        let db_path = dir.join("store.db").to_string_lossy().to_string();

        // Write a row through one store instance.
        {
            let store = SqliteStore::new(db_path.clone());
            store
                .sessions
                .create_session(make_session("sess_persist"))
                .unwrap();
            store.jobs.create_job(make_job("job_persist", "sess_persist", 1)).unwrap();
        }

        // Reopen the same file with a fresh store: data must survive.
        {
            let store = SqliteStore::new(db_path.clone());
            let session = store.sessions.get_session("sess_persist").unwrap().unwrap();
            assert_eq!(session.id, "sess_persist");
            let jobs = store.jobs.get_jobs_by_session("sess_persist").unwrap();
            assert_eq!(jobs.len(), 1);
        }

        let _ = std::fs::remove_dir_all(&dir);
    }
}