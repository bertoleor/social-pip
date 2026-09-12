/**
 * @fileoverview Tests for design tokens defined in index.css @theme block
 * Verifies the token definitions are present in the CSS source.
 * Note: JSDOM cannot compute CSS custom properties, so we verify
 * the token source rather than computed styles.
 */
import { describe, expect, it } from "vitest";

// Read the CSS source to verify tokens are defined
async function getCssSource(): Promise<string> {
  const response = await fetch("/src/index.css");
  return response.text();
}

describe("Design Tokens", () => {
  describe("U1.1: @theme block", () => {
    it("defines primary color scale in @theme", async () => {
      const css = await getCssSource();
      expect(css).toContain("--color-primary-50");
      expect(css).toContain("--color-primary-500");
      expect(css).toContain("--color-primary-950");
    });

    it("defines accent color as Facebook blue", async () => {
      const css = await getCssSource();
      expect(css).toContain("--color-accent");
      expect(css).toContain("#1877f2");
    });

    it("defines semantic status colors", async () => {
      const css = await getCssSource();
      expect(css).toContain("--color-success");
      expect(css).toContain("--color-warning");
      expect(css).toContain("--color-error");
    });

    it("defines surface, background, and foreground tokens", async () => {
      const css = await getCssSource();
      expect(css).toContain("--color-surface");
      expect(css).toContain("--color-background");
      expect(css).toContain("--color-foreground");
    });

    it("defines typography scale", async () => {
      const css = await getCssSource();
      expect(css).toContain("--text-xs");
      expect(css).toContain("--text-sm");
      expect(css).toContain("--text-base");
      expect(css).toContain("--text-lg");
      expect(css).toContain("--text-xl");
      expect(css).toContain("--text-2xl");
    });

    it("defines font families", async () => {
      const css = await getCssSource();
      expect(css).toContain("--font-sans");
      expect(css).toContain("--font-mono");
    });

    it("defines radius scale", async () => {
      const css = await getCssSource();
      expect(css).toContain("--radius-sm");
      expect(css).toContain("--radius-md");
      expect(css).toContain("--radius-lg");
    });

    it("defines shadow scale", async () => {
      const css = await getCssSource();
      expect(css).toContain("--shadow-sm");
      expect(css).toContain("--shadow-md");
    });
  });

  describe("U1.2: Light mode CSS custom properties", () => {
    it("defines :root selector with light values", async () => {
      const css = await getCssSource();
      expect(css).toContain(":root");
      // Light mode surface is white
      expect(css).toMatch(/:root[^{]*\{[^}]--color-surface:\s*#ffffff/s);
    });
  });

  describe("U1.3: Dark mode CSS custom properties", () => {
    it("defines .dark selector for dark mode overrides", async () => {
      const css = await getCssSource();
      expect(css).toContain(".dark");
      // Dark mode surface should not be white
      expect(css).toMatch(/\.dark[^{]*\{[^}]--color-surface:\s*#1e293b/s);
    });
  });
});
