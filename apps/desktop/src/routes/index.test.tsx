import { SessionGuard } from "@/components/route/SessionGuard";
/**
 * @fileoverview Router configuration tests
 * Tests route setup and route definitions, including the FR-10 session guard wrapper.
 */
import { describe, expect, it } from "vitest";
import { createAppRouter, routes } from "./index";

describe("Router Configuration", () => {
  describe("Session Guard (FR-10)", () => {
    const guardRoute = routes[0];

    it("wraps all application routes in an auth/session guard", () => {
      expect(routes).toHaveLength(2); // guarded app + not-found fallback
      expect(guardRoute.Component).toBe(SessionGuard);
    });

    it("exposes every protected page as a child of the guard", () => {
      expect(guardRoute.children).toHaveLength(6);
      const paths = guardRoute.children?.map((r) => r.path);
      expect(paths).toEqual(["/", "/accounts", "/posts", "/schedule", "/analytics", "/settings"]);
    });

    it("keeps all guarded children lazy-loaded", () => {
      const children = guardRoute.children ?? [];
      expect(children.every((route) => typeof route.lazy === "function")).toBe(true);
    });
  });

  describe("Route Definitions (under guarded layout)", () => {
    const guardedChildren = routes[0]?.children ?? [];

    it("defines the root route (/) under the guard", () => {
      const rootRoute = guardedChildren.find((r) => r.path === "/");
      expect(rootRoute).toBeDefined();
      expect(rootRoute?.lazy).toBeDefined();
    });

    it("defines the accounts route (/accounts) under the guard", () => {
      const accountsRoute = guardedChildren.find((r) => r.path === "/accounts");
      expect(accountsRoute).toBeDefined();
      expect(accountsRoute?.lazy).toBeDefined();
    });

    it("defines the posts, schedule, analytics and settings routes under the guard", () => {
      for (const p of ["/posts", "/schedule", "/analytics", "/settings"]) {
        expect(guardedChildren.find((r) => r.path === p)?.lazy).toBeDefined();
      }
    });

    it("defines a catch-all 404 route (*) outside the guard", () => {
      const notFoundRoute = routes.find((r) => r.path === "*");
      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute?.lazy).toBeDefined();
    });
  });

  describe("Route Structure", () => {
    const guardedChildren = routes[0]?.children ?? [];

    it("all guarded routes use lazy loading", () => {
      const allLazy = guardedChildren.every((route) => typeof route.lazy === "function");
      expect(allLazy).toBe(true);
    });

    it("guarded route paths are unique", () => {
      const paths = guardedChildren.map((r) => r.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });

    it("router factory still builds from the guarded route tree", () => {
      expect(createAppRouter).toBeDefined();
    });
  });
});
