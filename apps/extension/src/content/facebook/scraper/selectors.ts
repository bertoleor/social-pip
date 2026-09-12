/**
 * Versioned DOM Selectors for Facebook Groups
 *
 * Facebook's DOM changes frequently. This module provides versioned
 * selectors with fallbacks for graceful degradation.
 */

// ============================================================================
// Types
// ============================================================================

export interface SelectorChain {
  v1: string;
  v2?: string;
  v3?: string;
}

export interface GroupSelectors {
  groupName: SelectorChain;
  groupLink: SelectorChain;
  memberCount: SelectorChain;
  privacyBadge: SelectorChain;
  groupCard: SelectorChain;
  groupsContainer: SelectorChain;
  // Aliases for test compatibility
  groupItem: SelectorChain;
  privacy: SelectorChain;
  joinedGroupsSection: SelectorChain;
}

// ============================================================================
// Selector Definitions
// ============================================================================

/**
 * GROUP_SELECTORS - Versioned selectors for Facebook group elements
 *
 * v1: Current production selectors
 * v2: Recent fallback selectors
 * v3: Legacy fallback selectors
 */
export const GROUP_SELECTORS: GroupSelectors = {
  groupName: {
    v1: 'h1[data-testid="group-name"] span',
    v2: 'h1[role="heading"] span[dir="auto"]',
    v3: 'div[role="main"] h1 a span',
  },

  groupLink: {
    v1: 'a[data-testid="group-link"]',
    v2: 'div[role="main"] h1 a',
    v3: 'a[href*="/groups/"][href*="group_id="]',
  },

  memberCount: {
    v1: '[data-testid="member-count"]',
    v2: 'span[class*="member"]',
    v3: 'div[class*="member"]',
  },

  privacyBadge: {
    v1: 'span[data-testid="privacy-badge"]',
    v2: 'span[aria-label*="Private"]',
    v3: 'span[aria-label*="Public"]',
  },

  groupCard: {
    v1: 'div[data-testid="group-card"]',
    v2: 'div[role="article"]',
    v3: 'div[data-visualcompletion="ignore-dynamic"]',
  },

  groupsContainer: {
    v1: 'div[data-testid="groups-container"]',
    v2: 'div[role="main"] > div > div',
    v3: 'div[id^="mount_"]',
  },

  // Aliases for test compatibility
  groupItem: {
    v1: 'div[data-testid="group-item"]',
    v2: 'div[data-testid="group-card"]',
    v3: 'div[role="article"]',
  },

  privacy: {
    v1: 'span[data-testid="privacy-badge"]',
    v2: 'span[aria-label*="Private"]',
    v3: 'span[aria-label*="Public"]',
  },

  joinedGroupsSection: {
    v1: 'div[data-testid="joined-groups"]',
    v2: 'div[data-testid="groups-container"]',
    v3: 'div[role="main"] > div',
  },
};

/**
 * POST_SELECTORS - Selectors for post form elements
 */
export const POST_SELECTORS = {
  postForm: {
    v1: 'form[data-testid="post-form"]',
    v2: 'div[role="textbox"][aria-label*="post"]',
    v3: 'div[contenteditable="true"][aria-label*="Write"]',
  },

  postButton: {
    v1: 'button[data-testid="post-button"]',
    v2: 'div[role="button"]:has-text("Post")',
    v3: 'button[type="submit"]:has-text("Post")',
  },

  postTextarea: {
    v1: 'div[data-testid="post-textarea"]',
    v2: 'div[contenteditable="true"][role="textbox"]',
    v3: 'textarea[name="message"]',
  },
};

/**
 * RATE_LIMIT_SELECTORS - Selectors for rate limit detection
 */
export const RATE_LIMIT_SELECTORS = {
  warningModal: {
    v1: 'div[data-testid="rate-limit-modal"]',
    v2: 'div[role="dialog"]:has-text("try again later")',
    v3: 'div[aria-modal="true"]:has-text("blocked")',
  },

  warningMessage: {
    v1: 'span[data-testid="rate-limit-message"]',
    v2: 'div[role="alert"]:has-text("temporarily blocked")',
    v3: 'span:has-text("try again")',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Query element with fallback selectors
 *
 * Tries each version of selector in order until a match is found.
 * This provides graceful degradation when Facebook updates their DOM.
 *
 * @param selectors - Array of CSS selectors to try in order
 * @param root - Root element to search from (defaults to document)
 * @returns First matching element or null if none found
 */
export function queryWithFallback(
  selectors: string[],
  root: Element | Document = document,
): Element | null {
  for (const selector of selectors) {
    try {
      const element = root.querySelector(selector);
      if (element) {
        return element;
      }
    } catch {
      // Invalid selector, try next
    }
  }
  return null;
}

/**
 * Query all elements with fallback selectors
 *
 * Uses the first selector that finds any elements.
 *
 * @param selectors - Array of CSS selectors to try in order
 * @param root - Root element to search from
 * @returns NodeList of matching elements or empty NodeList if none found
 */
export function queryAllWithFallback(
  selectors: string[],
  root: Element | Document = document,
): NodeListOf<Element> {
  for (const selector of selectors) {
    try {
      const elements = root.querySelectorAll(selector);
      if (elements.length > 0) {
        return elements;
      }
    } catch {
      // Invalid selector, try next
    }
  }
  return document.querySelectorAll(".__nonexistent__");
}

/**
 * Get selector chain as ordered array
 *
 * @param chain - Selector chain object
 * @returns Array of selectors in version order
 */
export function getSelectorsFromChain(chain: SelectorChain): string[] {
  return [chain.v1, chain.v2, chain.v3].filter((s): s is string => s !== undefined);
}

/**
 * Extract text content safely
 *
 * @param element - Element to extract text from
 * @returns Text content or empty string if element is null
 */
export function safeTextContent(element: Element | null): string {
  return element?.textContent?.trim() ?? "";
}

/**
 * Extract numeric value from text
 *
 * Handles formats like "1.2K", "5,000", "10M"
 *
 * @param text - Text containing a number
 * @returns Numeric value or null if parsing fails
 */
export function parseNumericText(text: string): number | null {
  if (!text) return null;

  const cleanText = text
    .toLowerCase()
    .replace(/[^0-9.kmb\s]/g, "")
    .trim();
  if (!cleanText) return null;

  const match = cleanText.match(/^([\d,.]+)\s*([kmb])?$/);
  if (!match?.[1]) return null;

  const numPart = Number.parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(numPart)) return null;

  const multiplier = match[2];
  switch (multiplier) {
    case "k":
      return Math.round(numPart * 1000);
    case "m":
      return Math.round(numPart * 1_000_000);
    case "b":
      return Math.round(numPart * 1_000_000_000);
    default:
      return Math.round(numPart);
  }
}
