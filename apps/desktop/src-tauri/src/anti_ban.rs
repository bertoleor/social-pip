use chrono::{DateTime, Duration, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanConfig {
    pub platform: String,
    pub min_action_delay_ms: u64,
    pub max_action_delay_ms: u64,
    pub hourly_action_limit: u32,
    pub daily_action_limit: u32,
    pub session_gap_min_minutes: u64,
    pub human_like_typing: bool,
    pub jitter_percentage: f32,
    pub batch_size: u32,
    pub batch_break_minutes: u32,
}

impl Default for AntiBanConfig {
    fn default() -> Self {
        Self {
            platform: "facebook".to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 240_000,
            hourly_action_limit: 20,
            daily_action_limit: 60,
            session_gap_min_minutes: 120,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 5,
            batch_break_minutes: 20,
        }
    }
}

impl AntiBanConfig {
    pub fn platform_name(&self) -> &str {
        &self.platform
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionRecord {
    pub action_type: String,
    pub timestamp: DateTime<Utc>,
    pub success: bool,
    pub delay_used_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BanRisk {
    HourlyLimitExceeded,
    DailyLimitExceeded,
    BurstPattern,
    RateLimitDetected,
    AccountRestricted,
}

pub struct AntiBanEngine {
    config: AntiBanConfig,
    history: VecDeque<ActionRecord>,
    current_batch_count: u32,
    batch_start_time: Option<DateTime<Utc>>,
}

impl AntiBanEngine {
    pub fn new(config: AntiBanConfig) -> Self {
        Self {
            config,
            history: VecDeque::with_capacity(1000),
            current_batch_count: 0,
            batch_start_time: None,
        }
    }

    pub fn next_action_delay_ms(&self) -> u64 {
        let base_delay = rand::thread_rng().gen_range(
            self.config.min_action_delay_ms..=self.config.max_action_delay_ms
        );
        let jitter = (base_delay as f32 * self.config.jitter_percentage) as u64;
        let actual_jitter = rand::thread_rng().gen_range(0..=jitter);
        base_delay + actual_jitter
    }

    pub fn can_execute(&self, action_type: &str) -> Result<(), BanRisk> {
        let now = Utc::now();
        
        let recent_count = self.history
            .iter()
            .filter(|r| r.action_type == action_type && r.timestamp > now - Duration::hours(1))
            .count() as u32;
        
        if recent_count >= self.config.hourly_action_limit {
            return Err(BanRisk::HourlyLimitExceeded);
        }

        let today_count = self.history
            .iter()
            .filter(|r| r.timestamp > now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc())
            .count() as u32;
        
        if today_count >= self.config.daily_action_limit {
            return Err(BanRisk::DailyLimitExceeded);
        }

        if self.detect_burst_pattern() {
            return Err(BanRisk::BurstPattern);
        }

        Ok(())
    }

    fn detect_burst_pattern(&self) -> bool {
        let last_5 = self.history.iter().rev().take(5).collect::<Vec<_>>();
        
        if last_5.len() < 5 {
            return false;
        }

        let total_delay: i64 = last_5.windows(2)
            .map(|w| (w[1].timestamp - w[0].timestamp).num_seconds() as i64)
            .sum();

        let avg_delay = total_delay / 4;
        
        avg_delay < 30
    }

    pub fn record_action(&mut self, action_type: String, success: bool, delay_used_ms: u64) {
        let record = ActionRecord {
            action_type,
            timestamp: Utc::now(),
            success,
            delay_used_ms,
        };

        if self.history.len() >= 1000 {
            self.history.pop_front();
        }
        self.history.push_back(record);

        if success {
            self.current_batch_count += 1;
            
            if self.batch_start_time.is_none() {
                self.batch_start_time = Some(Utc::now());
            }
        }
    }

    pub fn should_take_batch_break(&self) -> bool {
        if self.current_batch_count >= self.config.batch_size {
            if let Some(start) = self.batch_start_time {
                let elapsed = Utc::now() - start;
                return elapsed.num_minutes() >= self.config.batch_break_minutes as i64;
            }
        }
        false
    }

    pub fn reset_batch(&mut self) {
        self.current_batch_count = 0;
        self.batch_start_time = None;
    }

    pub fn typing_delay_ms(&self, text: &str) -> Vec<u64> {
        if !self.config.human_like_typing {
            return vec![];
        }

        let base_delay = self.config.min_action_delay_ms / 20;
        
        text.chars().map(|c| {
            let mut delay = rand::thread_rng().gen_range(base_delay..=base_delay * 2);
            
            if c == '.' || c == ',' || c == '!' || c == '?' {
                delay += rand::thread_rng().gen_range(200..=400);
            }
            
            if c == ' ' {
                delay += rand::thread_rng().gen_range(50..=150);
            }
            
            delay
        }).collect()
    }

    pub fn get_stats(&self) -> AntiBanStats {
        let now = Utc::now();
        let hour_ago = now - Duration::hours(1);
        let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();

        let hourly_count = self.history.iter()
            .filter(|r| r.timestamp > hour_ago)
            .count() as u32;

        let daily_count = self.history.iter()
            .filter(|r| r.timestamp > today_start)
            .count() as u32;

        let success_rate = if !self.history.is_empty() {
            let success = self.history.iter().filter(|r| r.success).count();
            (success as f32 / self.history.len() as f32) * 100.0
        } else {
            100.0
        };

        AntiBanStats {
            hourly_count,
            daily_count,
            success_rate,
            batch_count: self.current_batch_count,
            config: self.config.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanStats {
    pub hourly_count: u32,
    pub daily_count: u32,
    pub success_rate: f32,
    pub batch_count: u32,
    pub config: AntiBanConfig,
}

pub fn get_platform_config(platform: &str) -> AntiBanConfig {
    match platform {
        "facebook_groups" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 240_000,
            hourly_action_limit: 20,
            daily_action_limit: 60,
            session_gap_min_minutes: 120,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 5,
            batch_break_minutes: 20,
        },
        "facebook_marketplace" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 30_000,
            max_action_delay_ms: 60_000,
            hourly_action_limit: 10,
            daily_action_limit: 30,
            session_gap_min_minutes: 180,
            human_like_typing: true,
            jitter_percentage: 0.10,
            batch_size: 5,
            batch_break_minutes: 15,
        },
        "instagram" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 90_000,
            max_action_delay_ms: 300_000,
            hourly_action_limit: 15,
            daily_action_limit: 45,
            session_gap_min_minutes: 90,
            human_like_typing: true,
            jitter_percentage: 0.20,
            batch_size: 5,
            batch_break_minutes: 30,
        },
        "twitter" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 30_000,
            max_action_delay_ms: 120_000,
            hourly_action_limit: 50,
            daily_action_limit: 150,
            session_gap_min_minutes: 60,
            human_like_typing: true,
            jitter_percentage: 0.10,
            batch_size: 10,
            batch_break_minutes: 20,
        },
        "tiktok" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 120_000,
            max_action_delay_ms: 300_000,
            hourly_action_limit: 10,
            daily_action_limit: 25,
            session_gap_min_minutes: 180,
            human_like_typing: true,
            jitter_percentage: 0.25,
            batch_size: 5,
            batch_break_minutes: 30,
        },
        "linkedin" => AntiBanConfig {
            platform: platform.to_string(),
            min_action_delay_ms: 60_000,
            max_action_delay_ms: 180_000,
            hourly_action_limit: 25,
            daily_action_limit: 75,
            session_gap_min_minutes: 90,
            human_like_typing: true,
            jitter_percentage: 0.15,
            batch_size: 10,
            batch_break_minutes: 25,
        },
        _ => AntiBanConfig::default(),
    }
}