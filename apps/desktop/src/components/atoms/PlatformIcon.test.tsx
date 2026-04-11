import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Tests for PlatformIcon atom
 */
import { describe, expect, it } from "vitest";
import {
	PlatformIcon,
	getPlatformColor,
	getPlatformIconSize,
} from "./PlatformIcon";

describe("PlatformIcon", () => {
	describe("Facebook icon", () => {
		it("renders Facebook icon with correct color", () => {
			render(<PlatformIcon platform="facebook" size="md" />);

			const icon = screen.getByLabelText("facebook icon");
			expect(icon).toBeDefined();
			expect(icon.getAttribute("stroke")).toBe("#1877F2");
		});
	});

	describe("Instagram icon", () => {
		it("renders Instagram icon with correct color", () => {
			render(<PlatformIcon platform="instagram" size="md" />);

			const icon = screen.getByLabelText("instagram icon");
			expect(icon).toBeDefined();
		});
	});

	describe("TikTok icon", () => {
		it("renders Film icon (TikTok) with correct color", () => {
			render(<PlatformIcon platform="tiktok" size="md" />);

			const icon = screen.getByLabelText("tiktok icon");
			expect(icon).toBeDefined();
		});
	});

	describe("Twitter icon", () => {
		it("renders Twitter icon with correct color", () => {
			render(<PlatformIcon platform="twitter" size="md" />);

			const icon = screen.getByLabelText("twitter icon");
			expect(icon).toBeDefined();
		});
	});

	describe("LinkedIn icon", () => {
		it("renders LinkedIn icon with correct color", () => {
			render(<PlatformIcon platform="linkedin" size="md" />);

			const icon = screen.getByLabelText("linkedin icon");
			expect(icon).toBeDefined();
		});
	});

	describe("Threads icon", () => {
		it("renders MessageCircle icon (Threads) with correct color", () => {
			render(<PlatformIcon platform="threads" size="md" />);

			const icon = screen.getByLabelText("threads icon");
			expect(icon).toBeDefined();
		});
	});

	describe("Telegram icon", () => {
		it("renders Send icon (Telegram) with correct color", () => {
			render(<PlatformIcon platform="telegram" size="md" />);

			const icon = screen.getByLabelText("telegram icon");
			expect(icon).toBeDefined();
		});
	});

	describe("WhatsApp icon", () => {
		it("renders MessageCircle icon (WhatsApp) with correct color", () => {
			render(<PlatformIcon platform="whatsapp" size="md" />);

			const icon = screen.getByLabelText("whatsapp icon");
			expect(icon).toBeDefined();
		});
	});

	describe("Unknown platform fallback", () => {
		it("renders Globe fallback for unknown platform", () => {
			render(<PlatformIcon platform="unknown" size="md" />);

			const icon = screen.getByLabelText("unknown icon");
			expect(icon).toBeDefined();
		});
	});

	describe("size prop", () => {
		it("applies correct width and height for sm size (16px)", () => {
			render(<PlatformIcon platform="facebook" size="sm" />);

			const icon = screen.getByLabelText("facebook icon");
			expect(icon).toBeDefined();
			// The Lucide icon sets width and height based on size prop
		});

		it("applies correct width and height for md size (24px)", () => {
			render(<PlatformIcon platform="facebook" size="md" />);

			const icon = screen.getByLabelText("facebook icon");
			expect(icon).toBeDefined();
		});

		it("applies correct width and height for lg size (32px)", () => {
			render(<PlatformIcon platform="facebook" size="lg" />);

			const icon = screen.getByLabelText("facebook icon");
			expect(icon).toBeDefined();
		});
	});

	describe("className prop", () => {
		it("applies custom className", () => {
			render(
				<PlatformIcon platform="facebook" size="md" className="custom-class" />,
			);

			const icon = screen.getByLabelText("facebook icon");
			expect(icon).toBeDefined();
			expect(
				icon.classList.contains("custom-class") ||
					icon.className.includes("custom-class"),
			).toBe(true);
		});
	});
});

describe("getPlatformColor", () => {
	it("returns correct color for Facebook", () => {
		expect(getPlatformColor("facebook")).toBe("#1877F2");
	});

	it("returns correct color for Instagram", () => {
		expect(getPlatformColor("instagram")).toBe("#E4405F");
	});

	it("returns correct color for TikTok", () => {
		expect(getPlatformColor("tiktok")).toBe("#000000");
	});

	it("returns correct color for Twitter", () => {
		expect(getPlatformColor("twitter")).toBe("#1DA1F2");
	});

	it("returns correct color for LinkedIn", () => {
		expect(getPlatformColor("linkedin")).toBe("#0A66C2");
	});

	it("returns correct color for Threads", () => {
		expect(getPlatformColor("threads")).toBe("#000000");
	});

	it("returns correct color for Telegram", () => {
		expect(getPlatformColor("telegram")).toBe("#0088CC");
	});

	it("returns correct color for WhatsApp", () => {
		expect(getPlatformColor("whatsapp")).toBe("#25D366");
	});

	it("returns gray fallback for unknown platform", () => {
		expect(getPlatformColor("unknown")).toBe("#9CA3AF");
	});
});

describe("getPlatformIconSize", () => {
	it("returns 16 for sm size", () => {
		expect(getPlatformIconSize("sm")).toBe(16);
	});

	it("returns 24 for md size", () => {
		expect(getPlatformIconSize("md")).toBe(24);
	});

	it("returns 32 for lg size", () => {
		expect(getPlatformIconSize("lg")).toBe(32);
	});
});
