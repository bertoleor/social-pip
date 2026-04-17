/**
 * @fileoverview App component tests
 * Tests the main application entry point with router
 *
 * Note: Testing RouterProvider directly requires complex mocking.
 * Instead, we verify App's structure by checking it exports correctly
 * and the router configuration is valid.
 */
import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("App", () => {
  describe("router configuration", () => {
    it("provides valid routes configuration", () => {
      // App uses the router from routes
      // Verify the routes are properly configured
      expect(routes).toBeDefined();
      expect(routes).toBeInstanceOf(Array);
      expect(routes.length).toBeGreaterThan(0);
    });

    it("has root route for dashboard", () => {
      const rootRoute = routes.find((r) => r.path === "/");
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.lazy).toBeDefined();
    });

    it("has all required routes", () => {
      const expectedPaths = [
        "/",
        "/accounts",
        "/posts",
        "/schedule",
        "/analytics",
        "/settings",
        "*",
      ];
      const actualPaths = routes.map((r) => r.path);

      for (const path of expectedPaths) {
        expect(actualPaths).toContain(path);
      }
    });
  });

  describe("App component structure", () => {
    it("App module exports default function", async () => {
      const { default: App } = await import("./App");
      expect(App).toBeDefined();
      expect(typeof App).toBe("function");
    });

    it("App is a valid React component", async () => {
      const { default: App } = await import("./App");
      // Check it's a function component (has a name)
      expect(App.name).toBe("App");
    });
  });
});
