/**
 * Group Scraper Module
 *
 * Scrapes joined Facebook groups from user profile with anti-ban measures.
 */

import {
  GROUP_SELECTORS,
  getSelectorsFromChain,
  parseNumericText,
  queryAllWithFallback,
  queryWithFallback,
  safeTextContent,
} from "./selectors";

// ============================================================================
// Types
// ============================================================================

export type GroupPrivacy = "public" | "private" | "secret";
export type GroupStatus = "active" | "archived" | "unavailable";

export interface ScrapedGroup {
  id: string;
  name: string;
  url: string;
  memberCount: number | null;
  privacy: GroupPrivacy;
  requiresApproval: boolean;
  lastPostedAt?: Date;
}

export interface ScraperConfig {
  maxGroups: number;
  scrollAttempts: number;
  scrollDelay: [number, number]; // ms range for randomization
  useCache: boolean;
}

export interface ScraperResult {
  groups: ScrapedGroup[];
  totalFound: number;
  scrapedAt: Date;
  hasMore: boolean;
}

export interface ScraperProgress {
  phase: "init" | "loading" | "scraping" | "scrolling" | "complete" | "error";
  groupsFound: number;
  currentBatch: number;
  message?: string;
}

export type ProgressCallback = (progress: ScraperProgress) => void;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: ScraperConfig = {
  maxGroups: 50,
  scrollAttempts: 10,
  scrollDelay: [2000, 4000], // 2-4 seconds randomized
  useCache: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate random delay within range
 */
function getRandomDelay(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract group ID from URL
 */
function extractGroupId(url: string): string | null {
  // Try different URL patterns
  const patterns = [/groups\/(\d+)/, /groups\/([^/?]+)/, /group_id=(\d+)/, /id=(\d+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detect privacy from element
 */
function detectPrivacy(element: Element | null): GroupPrivacy {
  if (!element) return "private";

  const text = safeTextContent(element).toLowerCase();
  const ariaLabel = element.getAttribute("aria-label")?.toLowerCase() ?? "";

  if (text.includes("public") || ariaLabel.includes("public")) {
    return "public";
  }
  if (text.includes("secret") || ariaLabel.includes("secret")) {
    return "secret";
  }
  return "private";
}

/**
 * Check if group requires approval
 */
function detectRequiresApproval(element: Element | null): boolean {
  if (!element) return false;

  const text = safeTextContent(element).toLowerCase();
  return text.includes("approval") || text.includes("request to join");
}

/**
 * Extract group data from a group card element (exported for testing)
 */
export function extractGroupData(card: Element, _doc?: Document): ScrapedGroup | null {
  // Get group name
  const nameEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupName), card);
  const name = safeTextContent(nameEl);
  if (!name) return null;

  // Get group link
  const linkEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupLink), card);
  const url = linkEl?.getAttribute("href") ?? "";
  if (!url) return null;

  // Extract ID from URL
  const id = extractGroupId(url);
  if (!id) return null;

  // Get member count
  const memberEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.memberCount), card);
  const memberText = safeTextContent(memberEl);
  const memberCount = parseNumericText(memberText);

  // Get privacy
  const privacyEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.privacyBadge), card);
  const privacy = detectPrivacy(privacyEl);

  // Check if requires approval
  const requiresApproval = detectRequiresApproval(card);

  return {
    id,
    name,
    url,
    memberCount,
    privacy,
    requiresApproval,
  };
}

/**
 * Scroll to load more groups (exported for testing)
 */
export async function scrollToLoadMore(
  attempts: number,
  delayRange: [number, number],
  _win?: Window,
): Promise<number> {
  let totalNewGroups = 0;

  for (let i = 0; i < attempts; i++) {
    const initialCount = document.querySelectorAll(
      getSelectorsFromChain(GROUP_SELECTORS.groupCard)[0] ?? "",
    ).length;

    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);

    // Wait for content to load
    await sleep(getRandomDelay(delayRange));

    // Check for new content
    const newCount = document.querySelectorAll(
      getSelectorsFromChain(GROUP_SELECTORS.groupCard)[0] ?? "",
    ).length;

    const newGroupsLoaded = newCount - initialCount;
    totalNewGroups += Math.max(0, newGroupsLoaded);
  }

  return totalNewGroups;
}

// ============================================================================
// Main Scraper Class
// ============================================================================

/**
 * GroupScraper - Scrapes joined groups with anti-ban measures
 */
export class GroupScraper {
  private config: ScraperConfig;
  private onProgress?: ProgressCallback;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<ScraperConfig>, onProgress?: ProgressCallback) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onProgress = onProgress;
  }

  /**
   * Navigate to groups page if not already there
   */
  private async ensureOnGroupsPage(): Promise<void> {
    const currentUrl = window.location.href;
    if (!currentUrl.includes("/groups")) {
      window.location.href = "https://www.facebook.com/groups/?ref=bookmark";
      await sleep(3000); // Wait for navigation
    }
  }

  /**
   * Extract group data from a group card element
   */
  private extractGroupFromCard(card: Element): ScrapedGroup | null {
    // Get group name
    const nameEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupName), card);
    const name = safeTextContent(nameEl);
    if (!name) return null;

    // Get group link
    const linkEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupLink), card);
    const url = linkEl?.getAttribute("href") ?? "";
    if (!url) return null;

    // Extract ID from URL
    const id = extractGroupId(url);
    if (!id) return null;

    // Get member count
    const memberEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.memberCount), card);
    const memberText = safeTextContent(memberEl);
    const memberCount = parseNumericText(memberText);

    // Get privacy
    const privacyEl = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.privacyBadge), card);
    const privacy = detectPrivacy(privacyEl);

    // Check if requires approval
    const requiresApproval = detectRequiresApproval(card);

    return {
      id,
      name,
      url,
      memberCount,
      privacy,
      requiresApproval,
    };
  }

  /**
   * Scroll to load more groups
   */
  private async scrollToLoadMore(): Promise<number> {
    let newGroupsLoaded = 0;
    const initialCount = document.querySelectorAll(
      getSelectorsFromChain(GROUP_SELECTORS.groupCard)[0] ?? "",
    ).length;

    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);

    // Wait for content to load
    await sleep(getRandomDelay(this.config.scrollDelay));

    // Check for new content
    const newCount = document.querySelectorAll(
      getSelectorsFromChain(GROUP_SELECTORS.groupCard)[0] ?? "",
    ).length;

    newGroupsLoaded = newCount - initialCount;
    return Math.max(0, newGroupsLoaded);
  }

  /**
   * Scrape joined groups from current page
   */
  async scrape(): Promise<ScraperResult> {
    this.abortController = new AbortController();
    const groups: ScrapedGroup[] = [];
    let scrollAttempts = 0;
    let hasMore = true;

    try {
      // Initialize
      this.onProgress?.({
        phase: "init",
        groupsFound: 0,
        currentBatch: 0,
        message: "Initializing scraper...",
      });

      // Ensure we're on groups page
      await this.ensureOnGroupsPage();

      this.onProgress?.({
        phase: "loading",
        groupsFound: 0,
        currentBatch: 0,
        message: "Loading groups...",
      });

      await sleep(getRandomDelay([1000, 2000]));

      // Scrape initial groups
      this.onProgress?.({
        phase: "scraping",
        groupsFound: 0,
        currentBatch: 1,
        message: "Extracting visible groups...",
      });

      // Initial extraction - always run at least once
      do {
        // Check for abort
        if (this.abortController.signal.aborted) {
          break;
        }

        // Get all visible group cards
        const cardSelectors = getSelectorsFromChain(GROUP_SELECTORS.groupCard);
        const cards = queryAllWithFallback(cardSelectors);

        // Extract new groups
        for (const card of cards) {
          if (groups.length >= this.config.maxGroups) break;

          const group = this.extractGroupFromCard(card);
          if (group && !groups.some((g) => g.id === group.id)) {
            groups.push(group);
            this.onProgress?.({
              phase: "scraping",
              groupsFound: groups.length,
              currentBatch: scrollAttempts + 1,
              message: `Found ${groups.length} groups...`,
            });
          }
        }

        // Check if we need to scroll for more groups
        if (
          groups.length < this.config.maxGroups &&
          scrollAttempts < this.config.scrollAttempts &&
          hasMore
        ) {
          this.onProgress?.({
            phase: "scrolling",
            groupsFound: groups.length,
            currentBatch: scrollAttempts + 1,
            message: "Loading more groups...",
          });

          const newGroups = await this.scrollToLoadMore();
          if (newGroups === 0) {
            hasMore = false;
          }
          scrollAttempts++;
        } else {
          hasMore = false;
        }
      } while (
        scrollAttempts < this.config.scrollAttempts &&
        hasMore &&
        groups.length < this.config.maxGroups
      );

      this.onProgress?.({
        phase: "complete",
        groupsFound: groups.length,
        currentBatch: scrollAttempts,
        message: `Scraping complete. Found ${groups.length} groups.`,
      });

      return {
        groups,
        totalFound: groups.length,
        scrapedAt: new Date(),
        hasMore: hasMore && scrollAttempts >= this.config.scrollAttempts,
      };
    } catch (error) {
      this.onProgress?.({
        phase: "error",
        groupsFound: groups.length,
        currentBatch: scrollAttempts,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Abort current scraping operation
   */
  abort(): void {
    this.abortController?.abort();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Scrape joined groups with default config
 * Note: _doc parameter is for test injection only
 */
export async function scrapeJoinedGroups(
  config?: Partial<ScraperConfig>,
  _doc?: Document,
): Promise<ScrapedGroup[]> {
  const scraper = new GroupScraper(config);
  const result = await scraper.scrape();
  return result.groups;
}

/**
 * Quick scrape - Get visible groups without scrolling
 */
export async function quickScrapeGroups(): Promise<ScrapedGroup[]> {
  const scraper = new GroupScraper({ scrollAttempts: 0, useCache: false });
  const result = await scraper.scrape();
  return result.groups;
}
