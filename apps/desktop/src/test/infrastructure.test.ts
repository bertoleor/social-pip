import { describe, expect, it } from "vitest";

describe("Test Infrastructure", () => {
	it("vitest is configured correctly", () => {
		expect(true).toBe(true);
	});

	it("globals are available", () => {
		// This verifies vitest globals work
		expect(describe).toBeDefined();
		expect(it).toBeDefined();
		expect(expect).toBeDefined();
	});
});
