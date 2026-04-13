/**
 * Rate Limit Detection Module
 *
 * Detects Facebook rate limit warnings and blocks.
 */

import { queryWithFallback, getSelectorsFromChain } from './selectors'
import { RATE_LIMIT_SELECTORS } from './selectors'

// ============================================================================
// Types
// ============================================================================

export type RateLimitType = 'temporary' | 'permanent' | 'warning'

export interface RateLimitStatus {
  detected: boolean
  type?: RateLimitType
  message?: string
  suggestedWaitMs?: number
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect rate limit warning on current page
 *
 * @returns Rate limit status if detected, or safe status if not
 */
export function detectRateLimitWarning(): RateLimitStatus {
  // Check for warning modal
  const modalSelectors = getSelectorsFromChain(RATE_LIMIT_SELECTORS.warningModal)
  const modal = queryWithFallback(modalSelectors)

  if (modal) {
    // Extract message
    const messageSelectors = getSelectorsFromChain(RATE_LIMIT_SELECTORS.warningMessage)
    const messageEl = queryWithFallback(messageSelectors, modal)
    const message = messageEl?.textContent?.trim() ?? 'Rate limit detected'

    // Determine type from message
    const messageLower = message.toLowerCase()
    let type: RateLimitType = 'warning'
    let suggestedWaitMs: number | undefined

    if (messageLower.includes('temporarily') || messageLower.includes('try again later')) {
      type = 'temporary'
      // Suggest 30 minute wait for temporary blocks
      suggestedWaitMs = 30 * 60 * 1000
    } else if (messageLower.includes('permanently') || messageLower.includes('blocked')) {
      type = 'permanent'
    }

    return {
      detected: true,
      type,
      message,
      suggestedWaitMs,
    }
  }

  // Check for inline warning messages
  const warningTexts = [
    'try again later',
    'temporarily blocked',
    'you\'ve been temporarily blocked',
    'rate limit exceeded',
    'too many requests',
    'slow down',
  ]

  const bodyText = document.body.textContent?.toLowerCase() ?? ''
  for (const text of warningTexts) {
    if (bodyText.includes(text)) {
      return {
        detected: true,
        type: 'warning',
        message: `Detected warning: "${text}"`,
        suggestedWaitMs: 30 * 60 * 1000,
      }
    }
  }

  return {
    detected: false,
  }
}

/**
 * Check if action is likely to trigger rate limit
 *
 * @param recentActions - Number of recent actions (last hour)
 * @param actionThreshold - Threshold for warning
 * @returns Whether action might trigger rate limit
 */
export function isActionRisky(recentActions: number, actionThreshold: number = 30): boolean {
  return recentActions >= actionThreshold * 0.8 // Warn at 80% of threshold
}

/**
 * Get suggested wait time based on rate limit status
 *
 * @param status - Current rate limit status
 * @returns Suggested wait time in ms
 */
export function getSuggestedWaitTime(status: RateLimitStatus): number {
  if (!status.detected) return 0

  if (status.suggestedWaitMs) return status.suggestedWaitMs

  switch (status.type) {
    case 'temporary':
      return 30 * 60 * 1000 // 30 minutes
    case 'permanent':
      return 24 * 60 * 60 * 1000 // 24 hours
    case 'warning':
    default:
      return 5 * 60 * 1000 // 5 minutes
  }
}

/**
 * Create a rate limit safe delay
 *
 * @param baseDelay - Base delay in ms
 * @param variance - Random variance to add (default 50%)
 * @returns Actual delay to use
 */
export function createSafeDelay(baseDelay: number, variance: number = 0.5): number {
  const min = baseDelay * (1 - variance)
  const max = baseDelay * (1 + variance)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Validate page is safe for scraping
 *
 * @returns Rate limit status - abort if detected
 */
export function validatePageSafe(): RateLimitStatus {
  const status = detectRateLimitWarning()

  if (status.detected) {
    console.warn('[Rate Limit] Detected rate limit:', status.message)
  }

  return status
}
