import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn() utility", () => {
	describe("basic class merging", () => {
		it("merges multiple classes", () => {
			expect(cn("px-4", "py-2")).toBe("px-4 py-2");
		});

		it("handles single class", () => {
			expect(cn("text-center")).toBe("text-center");
		});

		it("handles empty inputs", () => {
			expect(cn()).toBe("");
		});
	});

	describe("conflicting class resolution", () => {
		it("last conflicting class wins (tailwind-merge)", () => {
			// tailwind-merge ensures last wins
			expect(cn("px-4", "px-2")).toBe("px-2");
		});

		it("resolves multiple conflicts", () => {
			expect(cn("p-4", "m-2", "p-8")).toBe("m-2 p-8");
		});

		it("keeps non-conflicting classes", () => {
			expect(cn("text-sm", "font-bold", "text-lg")).toBe("font-bold text-lg");
		});
	});

	describe("conditional classes", () => {
		it("includes class when condition is true", () => {
			const isActive = true;
			expect(cn("base", isActive && "active")).toBe("base active");
		});

		it("excludes class when condition is false", () => {
			const isActive = false;
			expect(cn("base", isActive && "active")).toBe("base");
		});

		it("handles mixed conditions", () => {
			const isLoading = false;
			const isError = true;
			expect(cn("btn", isLoading && "loading", isError && "error")).toBe(
				"btn error",
			);
		});
	});

	describe("falsy value filtering", () => {
		it("filters null values", () => {
			expect(cn("class", null, "other")).toBe("class other");
		});

		it("filters undefined values", () => {
			expect(cn("class", undefined)).toBe("class");
		});

		it("filters false values", () => {
			expect(cn("class", false)).toBe("class");
		});

		it("filters all falsy values together", () => {
			expect(cn("valid", null, undefined, false, "also-valid")).toBe(
				"valid also-valid",
			);
		});
	});

	describe("complex scenarios", () => {
		it("handles arrays of classes", () => {
			expect(cn(["px-4", "py-2"], "bg-white")).toBe("px-4 py-2 bg-white");
		});

		it("handles nested arrays", () => {
			expect(cn(["base", .nested], "end")).toBe("base nested end");
		});

		it("handles objects with boolean values", () => {
			expect(
				cn({
					active: true,
					disabled: false,
					loading: true,
				}),
			).toBe("active loading");
		});
	});
});
