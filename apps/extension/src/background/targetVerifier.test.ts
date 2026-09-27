/**
 * @file Tests for target-tab verification (audit finding FR-06).
 * TDD: RED phase - Write failing tests first.
 *
 * A queued post must only be dispatched to the tab whose URL matches the
 * expected facebook.com group/account (task.target); otherwise the post could
 * land on the wrong destination if the user changed tabs.
 */

import { describe, expect, it } from "vitest";
import {
  canonicalFacebookPath,
  facebookGroupPath,
  isFacebookUrl,
  tabUrlMatchesTarget,
} from "./targetVerifier";

describe("isFacebookUrl", () => {
  it("accepts www.facebook.com group URLs", () => {
    expect(isFacebookUrl("https://www.facebook.com/groups/123456")).toBe(true);
  });

  it("accepts bare facebook.com / mobile variants", () => {
    expect(isFacebookUrl("https://facebook.com/groups/abc")).toBe(true);
    expect(isFacebookUrl("https://m.facebook.com/groups/xyz")).toBe(true);
  });

  it("rejects non-facebook hosts", () => {
    expect(isFacebookUrl("https://instagram.com/example")).toBe(false);
    expect(isFacebookUrl("https://notfacebook.com/groups/1")).toBe(false);
  });
});

describe("facebookGroupPath", () => {
  it("extracts the group segment from a group URL", () => {
    expect(facebookGroupPath("https://www.facebook.com/groups/123456")).toBe("123456");
    expect(facebookGroupPath("https://www.facebook.com/groups/My%20Group")).toBe("my group");
  });

  it("returns null for non-group facebook URLs", () => {
    expect(facebookGroupPath("https://www.facebook.com/profile.php?id=1")).toBeNull();
  });

  it("returns null for non-facebook URLs", () => {
    expect(facebookGroupPath("https://instagram.com/groups/1")).toBeNull();
  });
});

describe("canonicalFacebookPath", () => {
  it("normalizes a group page path (lowercase, no trailing slash)", () => {
    expect(canonicalFacebookPath("https://www.facebook.com/groups/123456/")).toBe("/groups/123456");
  });

  it("normalizes account page paths", () => {
    expect(canonicalFacebookPath("https://www.facebook.com/cool.page/")).toBe("/cool.page");
  });
});

describe("tabUrlMatchesTarget", () => {
  it("matches when the target is a full group URL equal to the tab", () => {
    const tabUrl = "https://www.facebook.com/groups/123456";
    const target = "https://www.facebook.com/groups/123456";
    expect(tabUrlMatchesTarget(tabUrl, target)).toBe(true);
  });

  it("matches case-insensitively and ignores trailing slashes / query", () => {
    const tabUrl = "https://www.facebook.com/groups/MyGroup?ref=feed";
    const target = "https://www.facebook.com/groups/mygroup/";
    expect(tabUrlMatchesTarget(tabUrl, target)).toBe(true);
  });

  it("matches when the target is a bare group identifier", () => {
    const tabUrl = "https://www.facebook.com/groups/123456";
    expect(tabUrlMatchesTarget(tabUrl, "123456")).toBe(true);
  });

  it("rejects when the tab is on a different group", () => {
    const tabUrl = "https://www.facebook.com/groups/999999";
    const target = "https://www.facebook.com/groups/123456";
    expect(tabUrlMatchesTarget(tabUrl, target)).toBe(false);
  });

  it("rejects a pending queue posting to the wrong account page", () => {
    const tabUrl = "https://www.facebook.com/otherprofile";
    const target = "https://www.facebook.com/intendedprofile";
    expect(tabUrlMatchesTarget(tabUrl, target)).toBe(false);
  });

  it("rejects when target is a bare id but tab is not on a group page", () => {
    expect(tabUrlMatchesTarget("https://www.facebook.com/feed", "123456")).toBe(false);
  });

  it("rejects missing tab url or missing target", () => {
    expect(tabUrlMatchesTarget(undefined, "https://www.facebook.com/groups/1")).toBe(false);
    expect(tabUrlMatchesTarget("https://www.facebook.com/groups/1", undefined)).toBe(false);
    expect(tabUrlMatchesTarget(undefined, undefined)).toBe(false);
  });

  it("rejects when the tab is not a facebook url at all", () => {
    expect(
      tabUrlMatchesTarget("https://www.google.com/", "https://www.facebook.com/groups/123456"),
    ).toBe(false);
  });
});
