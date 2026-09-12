/**
 * @file Tests for versioned DOM selectors with fallbacks
 * TDD: RED phase - Write failing tests first
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  GROUP_SELECTORS,
  getSelectorsFromChain,
  queryAllWithFallback,
  queryWithFallback,
} from "./selectors";

describe("selectors", () => {
  beforeEach(() => {
    // happy-dom provides document and window globals
    document.body.innerHTML = "";
  });

  describe("GROUP_SELECTORS", () => {
    it("should have groupName selectors with fallbacks", () => {
      expect(GROUP_SELECTORS.groupName).toBeDefined();
      expect(typeof GROUP_SELECTORS.groupName).toBe("object");
      expect(GROUP_SELECTORS.groupName.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.groupName).length).toBeGreaterThanOrEqual(1);
    });

    it("should have groupLink selectors with fallbacks", () => {
      expect(GROUP_SELECTORS.groupLink).toBeDefined();
      expect(typeof GROUP_SELECTORS.groupLink).toBe("object");
      expect(GROUP_SELECTORS.groupLink.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.groupLink).length).toBeGreaterThanOrEqual(1);
    });

    it("should have memberCount selectors with fallbacks", () => {
      expect(GROUP_SELECTORS.memberCount).toBeDefined();
      expect(typeof GROUP_SELECTORS.memberCount).toBe("object");
      expect(GROUP_SELECTORS.memberCount.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.memberCount).length).toBeGreaterThanOrEqual(1);
    });

    it("should have privacyBadge selectors with fallbacks", () => {
      expect(GROUP_SELECTORS.privacyBadge).toBeDefined();
      expect(typeof GROUP_SELECTORS.privacyBadge).toBe("object");
      expect(GROUP_SELECTORS.privacyBadge.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.privacyBadge).length).toBeGreaterThanOrEqual(1);
    });

    it("should have groupCard selectors for group listings", () => {
      expect(GROUP_SELECTORS.groupCard).toBeDefined();
      expect(typeof GROUP_SELECTORS.groupCard).toBe("object");
      expect(GROUP_SELECTORS.groupCard.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.groupCard).length).toBeGreaterThanOrEqual(1);
    });

    it("should have groupsContainer selector", () => {
      expect(GROUP_SELECTORS.groupsContainer).toBeDefined();
      expect(typeof GROUP_SELECTORS.groupsContainer).toBe("object");
      expect(GROUP_SELECTORS.groupsContainer.v1).toBeDefined();
      expect(getSelectorsFromChain(GROUP_SELECTORS.groupsContainer).length).toBeGreaterThanOrEqual(
        1,
      );
    });
  });

  describe("queryWithFallback", () => {
    it("should return element when first selector matches", () => {
      const div = document.createElement("div");
      div.setAttribute("data-testid", "group-name");
      document.body.appendChild(div);

      const selectors = ['[data-testid="group-name"]', ".fallback"];
      const result = queryWithFallback(selectors, document);

      expect(result).toBe(div);
    });

    it("should fallback to second selector if first fails", () => {
      const span = document.createElement("span");
      span.className = "fallback";
      document.body.appendChild(span);

      const selectors = ['[data-testid="nonexistent"]', ".fallback"];
      const result = queryWithFallback(selectors, document);

      expect(result).toBe(span);
    });

    it("should return null when no selectors match", () => {
      const selectors = ['[data-testid="nonexistent"]', ".also-nonexistent"];
      const result = queryWithFallback(selectors, document);

      expect(result).toBeNull();
    });

    it("should handle empty selector array", () => {
      const result = queryWithFallback([], document);
      expect(result).toBeNull();
    });

    it("should work with Facebook v1 group name selector", () => {
      const h1 = document.createElement("h1");
      h1.setAttribute("data-testid", "group-name");
      const span = document.createElement("span");
      span.textContent = "Test Group";
      h1.appendChild(span);
      document.body.appendChild(h1);

      const result = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupName), document);
      expect(result).toBe(span);
    });

    it("should work with Facebook v2 group name selector (fallback)", () => {
      const h1 = document.createElement("h1");
      h1.setAttribute("role", "heading");
      const span = document.createElement("span");
      span.setAttribute("dir", "auto");
      span.textContent = "Fallback Group Name";
      h1.appendChild(span);
      document.body.appendChild(h1);

      const result = queryWithFallback(getSelectorsFromChain(GROUP_SELECTORS.groupName), document);
      expect(result).toBe(span);
    });
  });

  describe("queryAllWithFallback", () => {
    it("should return all matching elements", () => {
      // Create multiple group items
      for (let i = 0; i < 3; i++) {
        const div = document.createElement("div");
        div.setAttribute("data-testid", "group-item");
        document.body.appendChild(div);
      }

      const selectors = ['[data-testid="group-item"]', ".fallback"];
      const result = queryAllWithFallback(selectors, document);

      expect(result.length).toBe(3);
    });

    it("should fallback to second selector if first returns empty", () => {
      const div1 = document.createElement("div");
      div1.className = "group-card";
      const div2 = document.createElement("div");
      div2.className = "group-card";
      document.body.appendChild(div1);
      document.body.appendChild(div2);

      const selectors = ['[data-testid="nonexistent"]', ".group-card"];
      const result = queryAllWithFallback(selectors, document);

      expect(result.length).toBe(2);
    });

    it("should return empty NodeList when no selectors match", () => {
      const selectors = ['[data-testid="nonexistent"]'];
      const result = queryAllWithFallback(selectors, document);

      expect(result.length).toBe(0);
    });
  });
});
