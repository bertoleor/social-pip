pub const ACTIVE_PLATFORMS: &[&str] = &["facebook_groups", "facebook_pages"];
#[allow(dead_code)]
pub const PENDING_PLATFORMS: &[&str] = &["instagram", "twitter", "linkedin"];

pub fn is_platform_active(platform: &str) -> bool {
    ACTIVE_PLATFORMS.contains(&platform)
}
