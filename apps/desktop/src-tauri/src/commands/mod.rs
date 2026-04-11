pub mod account;
pub mod media;
pub mod post;
pub mod posting;
pub mod scheduler;
pub mod task;

pub use account::{
    Account, AccountFilter, CreateAccountInput, UpdateAccountInput,
    Platform, AccountStatus,
};

pub use media::{
    ImageMetadata, ValidationError, ValidationWarning, ValidationResult,
    PlatformConstraints, get_image_metadata, validate_image, get_platform_media_constraints,
};

pub use post::{
    Post, PostFilter, PostStatus, CreatePostInput, UpdatePostInput,
};

pub use posting::{
    PostSession, PostJob, PostJobStatus, SessionStatus, ErrorCategory,
    StartSessionInput, SessionCompleteResult, UpdateJobResult,
    start_posting_session, cancel_posting_session, get_posting_session_status,
    update_post_job_status, get_session_anti_ban_stats, get_next_posting_delay,
    can_post_to_group, record_posting_action, list_posting_sessions, delete_posting_session,
};

pub use scheduler::{
    Schedule, ScheduleFilter, ScheduleStatus, CreateScheduleInput, UpdateScheduleInput,
    get_schedules, get_schedule, create_schedule, update_schedule, cancel_schedule, delete_schedule,
};

pub use task::{
    Task, TaskFilter, TaskStatus, TaskType, CreateTaskInput,
    get_tasks, get_task, create_task, update_task_status, cancel_task, retry_task, delete_task,
};
