/**
 * Target-tab verification for queued posting dispatches (audit FR-06).
 *
 * A queued task must only be dispatched to a tab whose URL matches the expected
 * facebook.com group/account (task.target). Without this check, a task posts to
 * whatever tab happens to be active when it executes, which can be the wrong
 * destination if the user changed tabs between queuing and dispatch.
 */

const FACEBOOK_HOST_RE = /(^|\.)facebook\.com$/i;

/** True when the URL is on a facebook.com host. */
export function isFacebookUrl(url: string): boolean {
  try {
    return FACEBOOK_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Extract the group segment from a /groups/<id> facebook URL, lowercased.
 * Returns null when the URL is not a facebook group page.
 */
export function facebookGroupPath(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!FACEBOOK_HOST_RE.test(hostname)) return null;
    const match = pathname.match(/^\/groups\/([^/?#]+)/i);
    return match ? decodeURIComponent(match[1] ?? "").toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Canonical identity of a facebook page: normalized pathname, lowercase, no
 * trailing slash. Used to compare the tab url against an expected target url
 * for both group and account pages. Returns null for non-facebook URLs.
 */
export function canonicalFacebookPath(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!FACEBOOK_HOST_RE.test(hostname)) return null;
    let path = pathname.replace(/\/+$/, "");
    if (path === "") path = "/";
    return path.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Decide whether a tab url is the expected facebook destination for a task.
 *
 * - `target` a full URL  -> compare canonical facebook paths (group or account).
 * - `target` a bare id   -> tab must be on the facebook group page for that id.
 * Returns false whenever any input is missing, non-facebook, or mismatched so a
 * queued task aborts rather than posting to the wrong destination.
 */
export function tabUrlMatchesTarget(
  tabUrl: string | undefined,
  target: string | undefined,
): boolean {
  if (!tabUrl || !target) return false;

  const targetLooksLikeUrl = /^https?:\/\//i.test(target);

  if (targetLooksLikeUrl) {
    const tabPath = canonicalFacebookPath(tabUrl);
    const targetPath = canonicalFacebookPath(target);
    return tabPath !== null && tabPath === targetPath;
  }

  // Bare group identifier (id or slug).
  const tabGroup = facebookGroupPath(tabUrl);
  if (tabGroup === null) return false;
  return tabGroup === target.trim().toLowerCase();
}
