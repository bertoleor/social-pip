/**
 * @fileoverview Router configuration tests
 * Tests route setup and route definitions
 */
import { describe, expect, it } from "vitest";
import { routes } from "./index";

describe("Router Configuration", () => {
	describe("Route Definitions", () => {
		it("defines the root route (/)", () => {
			const rootRoute = routes.find((r) => r.path === "/");
			expect(rootRoute).toBeDefined();
			expect(rootRoute?.lazy).toBeDefined();
		});

		it("defines the accounts route (/accounts)", () => {
			const accountsRoute = routes.find((r) => r.path === "/accounts");
			expect(accountsRoute).toBeDefined();
			expect(accountsRoute?.lazy).toBeDefined();
		});

		it("defines the posts route (/posts)", () => {
			const postsRoute = routes.find((r) => r.path === "/posts");
			expect(postsRoute).toBeDefined();
			expect(postsRoute?.lazy).toBeDefined();
		});

		it("defines the schedule route (/schedule)", () => {
			const scheduleRoute = routes.find((r) => r.path === "/schedule");
			expect(scheduleRoute).toBeDefined();
			expect(scheduleRoute?.lazy).toBeDefined();
		});

		it("defines the analytics route (/analytics)", () => {
			const analyticsRoute = routes.find((r) => r.path === "/analytics");
			expect(analyticsRoute).toBeDefined();
			expect(analyticsRoute?.lazy).toBeDefined();
		});

		it("defines the settings route (/settings)", () => {
			const settingsRoute = routes.find((r) => r.path === "/settings");
			expect(settingsRoute).toBeDefined();
			expect(settingsRoute?.lazy).toBeDefined();
		});

		it("defines a catch-all 404 route (*)", () => {
			const notFoundRoute = routes.find((r) => r.path === "*");
			expect(notFoundRoute).toBeDefined();
			expect(notFoundRoute?.lazy).toBeDefined();
		});
	});

	describe("Route Structure", () => {
		it("has exactly 7 routes defined", () => {
			expect(routes).toHaveLength(7);
		});

		it("all routes use lazy loading", () => {
			const allLazy = routes.every((route) => typeof route.lazy === "function");
			expect(allLazy).toBe(true);
		});

		it("route paths are unique", () => {
			const paths = routes.map((r) => r.path);
			const uniquePaths = new Set(paths);
			expect(uniquePaths.size).toBe(paths.length);
		});
	});
});
