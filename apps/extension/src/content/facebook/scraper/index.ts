/**
 * Group Scraper Module - Barrel Export
 *
 * Exports all scraper-related functionality.
 */

// Selectors
export {
  GROUP_SELECTORS,
  POST_SELECTORS,
  RATE_LIMIT_SELECTORS,
  queryWithFallback,
  queryAllWithFallback,
  getSelectorsFromChain,
  safeTextContent,
  parseNumericText,
} from './selectors'

export type { SelectorChain, GroupSelectors } from './selectors'

// Scraper
export {
  GroupScraper,
  scrapeJoinedGroups,
  quickScrapeGroups,
} from './group-scraper'

export type {
  ScrapedGroup,
  ScraperConfig,
  ScraperResult,
  ScraperProgress,
  GroupPrivacy,
  GroupStatus,
  ProgressCallback,
} from './group-scraper'

// Cache
export {
  getCachedGroups,
  cacheGroups,
  clearGroupCache,
  getCacheAge,
  isCacheStale,
  getCacheRemainingTTL,
} from './cache'

// Rate Limit
export {
  detectRateLimitWarning,
  isActionRisky,
  getSuggestedWaitTime,
  createSafeDelay,
  validatePageSafe,
} from './rate-limit'

export type { RateLimitType, RateLimitStatus } from './rate-limit'
