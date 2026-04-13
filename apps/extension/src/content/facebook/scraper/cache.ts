/**
 * Group Scraper Cache Layer
 *
 * Caches scraped groups in Chrome storage with TTL.
 */

import type { ScrapedGroup } from './group-scraper'

// ============================================================================
// Constants
// ============================================================================

const CACHE_KEY = 'facebook_groups_cache'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  groups: ScrapedGroup[]
  scrapedAt: string // ISO date string for JSON serialization
  version: number // For future migrations
}

// ============================================================================
// Cache Functions
// ============================================================================

/**
 * Get cached groups if still valid
 *
 * @returns Cached groups or null if expired/missing
 */
export async function getCachedGroups(): Promise<ScrapedGroup[] | null> {
  try {
    // Use chrome.storage.local if available (extension context)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(CACHE_KEY)
      const entry = result[CACHE_KEY] as CacheEntry | undefined

      if (!entry) return null

      // Check TTL
      const scrapedAt = new Date(entry.scrapedAt)
      const age = Date.now() - scrapedAt.getTime()

      if (age > CACHE_TTL_MS) {
        // Cache expired, clear it
        await clearGroupCache()
        return null
      }

      return entry.groups
    }

    // Fallback to localStorage for non-extension contexts (testing)
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return null

    const entry = JSON.parse(stored) as CacheEntry
    const scrapedAt = new Date(entry.scrapedAt)
    const age = Date.now() - scrapedAt.getTime()

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return entry.groups
  } catch {
    return null
  }
}

/**
 * Cache scraped groups with timestamp
 *
 * @param groups - Groups to cache
 */
export async function cacheGroups(groups: ScrapedGroup[]): Promise<void> {
  const entry: CacheEntry = {
    groups,
    scrapedAt: new Date().toISOString(),
    version: 1,
  }

  try {
    // Use chrome.storage.local if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [CACHE_KEY]: entry })
      return
    }

    // Fallback to localStorage
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch (error) {
    console.error('Failed to cache groups:', error)
  }
}

/**
 * Clear the group cache
 */
export async function clearGroupCache(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(CACHE_KEY)
      return
    }

    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

/**
 * Get cache age in milliseconds
 *
 * @returns Age in ms or null if no cache
 */
export async function getCacheAge(): Promise<number | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(CACHE_KEY)
      const entry = result[CACHE_KEY] as CacheEntry | undefined
      if (!entry) return null

      return Date.now() - new Date(entry.scrapedAt).getTime()
    }

    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return null

    const entry = JSON.parse(stored) as CacheEntry
    return Date.now() - new Date(entry.scrapedAt).getTime()
  } catch {
    return null
  }
}

/**
 * Check if cache is stale (older than TTL)
 */
export async function isCacheStale(): Promise<boolean> {
  const age = await getCacheAge()
  return age === null || age > CACHE_TTL_MS
}

/**
 * Get remaining TTL in milliseconds
 *
 * @returns Remaining time in ms or 0 if expired/no cache
 */
export async function getCacheRemainingTTL(): Promise<number> {
  const age = await getCacheAge()
  if (age === null) return 0

  const remaining = CACHE_TTL_MS - age
  return Math.max(0, remaining)
}
