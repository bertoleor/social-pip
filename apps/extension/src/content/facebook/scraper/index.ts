/**
 * Group Scraper Module - Barrel Export
 *
 * Exports all scraper-related functionality.
 */

// Cache
export {
  cacheGroups,
  clearGroupCache,
  getCacheAge,
  getCachedGroups,
  getCacheRemainingTTL,
  isCacheStale,
} from "./cache";
export type {
  GroupPrivacy,
  GroupStatus,
  ProgressCallback,
  ScrapedGroup,
  ScraperConfig,
  ScraperProgress,
  ScraperResult,
} from "./group-scraper";

// Scraper
export {
  GroupScraper,
  quickScrapeGroups,
  scrapeJoinedGroups,
} from "./group-scraper";
export type { RateLimitStatus, RateLimitType } from "./rate-limit";
// Rate Limit
export {
  createSafeDelay,
  detectRateLimitWarning,
  getSuggestedWaitTime,
  isActionRisky,
  validatePageSafe,
} from "./rate-limit";
export type { GroupSelectors, SelectorChain } from "./selectors";
// Selectors
export {
  GROUP_SELECTORS,
  getSelectorsFromChain,
  POST_SELECTORS,
  parseNumericText,
  queryAllWithFallback,
  queryWithFallback,
  RATE_LIMIT_SELECTORS,
  safeTextContent,
} from "./selectors";
