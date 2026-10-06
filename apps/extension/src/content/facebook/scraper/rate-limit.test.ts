/**
 * @file Tests for rate limit detection
 * TDD: RED phase - Write failing tests first
 */

import { beforeEach, describe, expect, it } from "vitest";
import { detectRateLimitWarning, type RateLimitStatus } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // happy-dom provides document and window globals
    document.body.innerHTML = "";
  });

  describe("detectRateLimitWarning", () => {
    it("should return not detected when no warning present", () => {
      const result = detectRateLimitWarning();

      const expected: RateLimitStatus = {
        detected: false,
      };
      expect(result).toEqual(expected);
    });

    it('should detect Spanish "limitamos" warning (temporary)', () => {
      document.body.innerHTML = `
        <div>
          <p>Te limitamos la frecuencia con la que puedes publicar contenido.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
      expect(result.message).toContain("limitamos");
    });

    it('should detect English "We limit" warning (temporary)', () => {
      document.body.innerHTML = `
        <div>
          <p>We limit how often you can post, comment or do other things.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
      expect(result.message).toContain("we limit");
    });

    it('should detect "temporalmente restringida" (temporary)', () => {
      document.body.innerHTML = `
        <div>
          <p>Tu cuenta está temporalmente restringida.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
    });

    it("should detect permanent block message", () => {
      document.body.innerHTML = `
        <div>
          <p>Your account has been disabled for violating our terms.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("permanent");
    });

    it('should detect "blocked" in error message', () => {
      document.body.innerHTML = `
        <div>
          <p>You have been blocked from using this feature.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("permanent");
    });

    it("should detect restricted account warning", () => {
      document.body.innerHTML = `
        <div>
          <span>Your account is restricted from posting in groups.</span>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
    });

    it("should detect spam warning", () => {
      document.body.innerHTML = `
        <div>
          <p>This appears to be spam. You cannot post right now.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
    });

    it("should be case insensitive", () => {
      document.body.innerHTML = `
        <div>
          <p>WE LIMIT HOW OFTEN YOU CAN POST.</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
    });

    it("should ignore rate limit text in input fields (not displayed to user)", () => {
      document.body.innerHTML = `
        <div>
          <input type="hidden" value="We limit how often" />
          <p>All good here!</p>
        </div>
      `;

      const result = detectRateLimitWarning();

      // Should NOT detect because it's in a hidden input, not visible to user
      expect(result.detected).toBe(false);
    });

    it("should handle nested elements with warning", () => {
      document.body.innerHTML = `
        <div role="alert">
          <div>
            <span>
              <strong>Temporarily blocked</strong>
              <p>Try again later.</p>
            </span>
          </div>
        </div>
      `;

      const result = detectRateLimitWarning();

      expect(result.detected).toBe(true);
      expect(result.type).toBe("temporary");
    });
  });
});
