// Social-Pip - Shared Types

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'threads'
  | 'telegram'
  | 'whatsapp';

export type ActionType =
  | 'post_feed'
  | 'post_story'
  | 'post_reel'
  | 'post_group'
  | 'post_marketplace'
  | 'send_message';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export type ScheduleStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AccountStatus = 'active' | 'inactive' | 'warming_up' | 'restricted' | 'banned';

export interface PostContent {
  text: string;
  hashtags?: string[];
  link?: string;
  location?: string;
}

export interface AntiBanProfile {
  minDelayMs: number;
  maxDelayMs: number;
  humanLikeTyping: boolean;
  scrollBeforeAction: boolean;
  jitterPercentage: number;
  batchSize: number;
  batchBreakMinutes: number;
}

export interface Account {
  id: string;
  name: string;
  platform: Platform;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  chromeProfilePath?: string;
  status: AccountStatus;
  warmupProgress: number;
  restrictionsCount: number;
  dailyPostsCount: number;
  lastResetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  platform: Platform;
  status: PostStatus;
  altCaptions: string[];
  currentCaption?: string;
  hashtags: string[];
  scheduledAt?: Date;
  variance: number;
  publishedAt?: Date;
  externalId?: string;
  errorMessage?: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  scheduledAt: Date;
  variance: number;
  status: ScheduleStatus;
  cronExpression?: string;
  attempts: number;
  maxAttempts: number;
  result?: string;
  postId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEDULE FILTER TYPES (Phase 3.1)
// ============================================

export interface ScheduleFilter {
  accountId?: string;
  status?: ScheduleStatus;
  from?: Date;
  to?: Date;
}

export interface UpdateScheduleData {
  scheduledAt?: Date;
  variance?: number;
}

// ============================================
// ACCOUNT TYPES (Phase 5)
// ============================================

export interface AccountFilter {
  platform?: Platform;
  status?: AccountStatus;
  search?: string;
}

export interface CreateAccountInput {
  platform: Platform;
  name: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  chromeProfilePath?: string;
  status?: AccountStatus;
  notes?: string;
}

export interface UpdateAccountInput {
  name?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  chromeProfilePath?: string;
  status?: AccountStatus;
  notes?: string;
}

// ============================================
// POST MANAGEMENT TYPES (Phase 6)
// ============================================

export interface PostFilter {
  accountId?: string;
  platform?: Platform;
  status?: PostStatus;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface CreatePostInput {
  accountId: string;
  platform: Platform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: Date;
  status?: PostStatus;
}

export interface UpdatePostInput {
  content?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  status?: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  externalId?: string;
  errorMessage?: string;
}

export interface Group {
  id: string;
  platform: Platform;
  name: string;
  url: string;
  sector?: string;
  status: string;
  lastPostedAt?: Date;
  postsCount: number;
  requiresApproval: boolean;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  sector: string;
  platforms: string[];
  content: string;
  variants: string[];
  imagePaths: string[];
  includeLink: boolean;
  linkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostLog {
  id: string;
  taskId?: string;
  platform: Platform;
  action: ActionType;
  target?: string;
  status: 'success' | 'failed' | 'skipped';
  contentPreview?: string;
  postUrl?: string;
  errorMessage?: string;
  durationMs?: number;
  accountId: string;
  timestamp: Date;
}

export interface AntiBanStats {
  hourly_count: number;
  daily_count: number;
  success_rate: number;
  batch_count: number;
  config: {
    platform: string;
    min_action_delay_ms: number;
    max_action_delay_ms: number;
    hourly_action_limit: number;
    daily_action_limit: number;
    batch_size: number;
    batch_break_minutes: number;
  };
}

export interface PlatformConfig {
  id: string;
  platform: Platform;
  maxPostsPerDay: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  batchSize: number;
  batchBreakMinutes: number;
  maxImages: number;
  maxVideoMinutes: number;
  maxTextLength: number;
  supportsStories: boolean;
  supportsCarousel: boolean;
  maxHashtags: number;
  supportsLinks: boolean;
}

export function getPlatformConfig(platform: Platform): PlatformConfig {
  const configs: Record<Platform, PlatformConfig> = {
    facebook: {
      id: '',
      platform: 'facebook',
      maxPostsPerDay: 20,
      minDelaySeconds: 60,
      maxDelaySeconds: 240,
      batchSize: 5,
      batchBreakMinutes: 20,
      maxImages: 10,
      maxVideoMinutes: 240,
      maxTextLength: 63206,
      supportsStories: true,
      supportsCarousel: true,
      maxHashtags: 30,
      supportsLinks: true,
    },
    instagram: {
      id: '',
      platform: 'instagram',
      maxPostsPerDay: 15,
      minDelaySeconds: 90,
      maxDelaySeconds: 300,
      batchSize: 5,
      batchBreakMinutes: 30,
      maxImages: 20,
      maxVideoMinutes: 60,
      maxTextLength: 2200,
      supportsStories: true,
      supportsCarousel: true,
      maxHashtags: 30,
      supportsLinks: false,
    },
    twitter: {
      id: '',
      platform: 'twitter',
      maxPostsPerDay: 50,
      minDelaySeconds: 30,
      maxDelaySeconds: 120,
      batchSize: 10,
      batchBreakMinutes: 20,
      maxImages: 4,
      maxVideoMinutes: 140,
      maxTextLength: 280,
      supportsStories: false,
      supportsCarousel: true,
      maxHashtags: 30,
      supportsLinks: true,
    },
    tiktok: {
      id: '',
      platform: 'tiktok',
      maxPostsPerDay: 10,
      minDelaySeconds: 120,
      maxDelaySeconds: 300,
      batchSize: 5,
      batchBreakMinutes: 30,
      maxImages: 35,
      maxVideoMinutes: 60,
      maxTextLength: 2200,
      supportsStories: true,
      supportsCarousel: true,
      maxHashtags: 100,
      supportsLinks: true,
    },
    linkedin: {
      id: '',
      platform: 'linkedin',
      maxPostsPerDay: 25,
      minDelaySeconds: 60,
      maxDelaySeconds: 180,
      batchSize: 10,
      batchBreakMinutes: 25,
      maxImages: 9,
      maxVideoMinutes: 30,
      maxTextLength: 3000,
      supportsStories: false,
      supportsCarousel: true,
      maxHashtags: 5,
      supportsLinks: true,
    },
    threads: {
      id: '',
      platform: 'threads',
      maxPostsPerDay: 20,
      minDelaySeconds: 60,
      maxDelaySeconds: 180,
      batchSize: 10,
      batchBreakMinutes: 20,
      maxImages: 20,
      maxVideoMinutes: 5,
      maxTextLength: 500,
      supportsStories: false,
      supportsCarousel: true,
      maxHashtags: 0,
      supportsLinks: false,
    },
    telegram: {
      id: '',
      platform: 'telegram',
      maxPostsPerDay: 100,
      minDelaySeconds: 5,
      maxDelaySeconds: 30,
      batchSize: 20,
      batchBreakMinutes: 10,
      maxImages: 10,
      maxVideoMinutes: 60,
      maxTextLength: 4096,
      supportsStories: true,
      supportsCarousel: true,
      maxHashtags: 30,
      supportsLinks: true,
    },
    whatsapp: {
      id: '',
      platform: 'whatsapp',
      maxPostsPerDay: 100,
      minDelaySeconds: 10,
      maxDelaySeconds: 60,
      batchSize: 30,
      batchBreakMinutes: 15,
      maxImages: 30,
      maxVideoMinutes: 30,
      maxTextLength: 65536,
      supportsStories: true,
      supportsCarousel: true,
      maxHashtags: 0,
      supportsLinks: true,
    },
  };

  return {
    ...configs[platform],
    id: `config_${platform}_${Date.now()}`,
  };
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  type: 'post' | 'message' | 'story' | 'reel';
  platform: Platform;
  accountId: string;
  postId?: string;
  status: TaskStatus;
  priority: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilter {
  accountId?: string;
  platform?: Platform;
  status?: TaskStatus;
  type?: 'post' | 'message' | 'story' | 'reel';
}

export interface CreateTaskInput {
  type: 'post' | 'message' | 'story' | 'reel';
  platform: Platform;
  accountId: string;
  postId?: string;
  priority?: number;
  scheduledAt?: Date;
  maxRetries?: number;
}

export type AIProvider = 'nim' | 'openai' | 'anthropic';

export interface AIGenerationLog {
  id: string;
  provider: AIProvider;
  promptType: 'caption' | 'hashtag' | 'variant';
  inputPrompt: string;
  generatedText: string;
  platform?: Platform;
  postId?: string;
  accountId?: string;
  tokensUsed?: number;
  latencyMs?: number;
  rating?: number;
  createdAt: Date;
}

export interface GenerateCaptionInput {
  content: string;
  platform: Platform;
  tone?: AICaptionTone;
  maxLength?: number;
  includeHashtags?: boolean;
}

export interface GenerateCaptionOutput {
  caption: string;
  hashtags: string[];
  alternatives: string[];
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Settings {
  id: string;
  aiConfig?: AIConfig;
  antiBanEnabled: boolean;
  antiBanStrictMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoStart: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AI CAPTION TYPES (Phase 8)
// ============================================

export type AICaptionTone = 'professional' | 'casual' | 'humorous' | 'inspirational';

export interface CaptionRequest {
  content: string;
  platform: Platform;
  tone?: AICaptionTone;
  maxLength?: number;
  includeHashtags?: boolean;
}

export interface CaptionResponse {
  caption: string;
  hashtags: string[];
  alternatives: string[];
  generatedAt: Date;
}

export interface GenerationOptions {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface GenerationHistory {
  id: string;
  request: CaptionRequest;
  response: CaptionResponse;
  createdAt: Date;
}

// ============================================
// SETTINGS TYPES (Phase 9)
// ============================================

export type { AppSettings, AntiBanSettings, NotificationSettings } from './settings'
export { DEFAULT_APP_SETTINGS, DEFAULT_ANTI_BAN_SETTINGS, DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_SETTINGS } from './settings'
export type { Settings as NewSettings } from './settings'

export type {
  BrowserTaskType,
  TaskResult,
  BrowserTask,
  CreateBrowserTaskInput,
  BrowserTaskFilter,
} from './task'

// ============================================
// SPINTAX ENGINE (Facebook Publishing)
// ============================================

export {
  parseSpintax,
  validateSpintax,
  countVariations,
  createSeededRng,
  SpintaxError,
} from './spintax/index'
export type {
  SpintaxConfig,
  SpintaxParseResult,
  SpintaxValidationResult,
} from './spintax/index'

// ============================================
// MEDIA UPLOAD TYPES
// ============================================

export type {
  ImageFormat,
  ImageDimensions,
  ValidationStatus,
  MediaFile,
  PlatformViolation,
  ValidationError as MediaValidationError,
  ValidationWarning as MediaValidationWarning,
  MediaErrorCode,
  MediaWarningCode,
  MediaValidationResult,
  PlatformMediaConstraints,
} from './media'

export {
  PLATFORM_MEDIA_CONSTRAINTS,
  getPlatformMediaConstraints,
  formatFileSize,
  imageFormatFromExtension,
  imageFormatFromMimeType,
} from './media'

export {
  PLATFORM_PRIORITIES,
  getPlatformPriority,
  isPostingPlatform,
} from './platform'
export type { PostingPlatform, PlatformTarget } from './platform'

export type { StartMultiPlatformSessionInput } from './posting'

export type {
  UnifiedError,
  RecoveryStrategy,
  Severity,
  CircuitBreakerState,
  CircuitBreakerConfig,
  CircuitBreakerStatus,
  PlatformHealthStatus,
  PlatformHealth,
  DeadLetterQueueEntry,
  CreateDlqEntryInput,
  DlqEntryFilter,
  ErrorClassificationResult,
} from './error'

export {
  rateLimitError,
  authExpiredError,
  accountRestrictedError,
  networkFailureError,
  browserFailureError,
  platformErrorError,
  validationFailedError,
  circuitOpenError,
  duplicateTaskError,
  unknownError,
} from './error'

// ============================================
// ERROR HANDLING V2.0 TYPES (Enterprise-Grade Error Handling)
// ============================================

export type {
  OutboxStatus,
  OutboxEntry,
  CreateOutboxEntryOptions,
  SagaState,
  SagaStepStatus,
  SagaExecution,
  SagaStep,
  ErrorContext,
  BulkheadConfig,
  BulkheadStatus,
  OnTimeoutAction,
  TimeoutConfig,
  BatchResult,
  BatchError,
  ErrorGroup,
  CircuitBreakerConfigV2,
  CircuitBreakerMetrics,
  StateTransition,
  CircuitBreakerState as CircuitBreakerStateV2,
  AlertV2,
  AlertType,
  Severity as SeverityV2,
  DeadLetterEntryV2,
  TracingContext,
  SpanKind,
  SpanStatus,
  ObservabilityConfig,
  // New v2.0 types
  SloMetric,
  SloThreshold,
  ActiveJob,
  TimeoutResult,
  RetryContext,
  DedupConfig,
  AggregationStats,
  BatchConfig,
  AlertStats,
} from './error-v2'

export {
  SLO_THRESHOLDS,
  DEDUP_CONFIGS,
  BATCH_CONFIGS,
  TIMEOUT_CONFIGS,
  CIRCUIT_BREAKER_CONFIGS,
} from './error-v2'
