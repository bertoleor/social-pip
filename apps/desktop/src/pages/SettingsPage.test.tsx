import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Settings } from "@social-pip/types";
import SettingsPage from "./SettingsPage";

vi.mock("@/hooks/useSettings", () => ({
	useSettings: vi.fn(),
}));

vi.mock("@/components/atoms/Button", () => ({
	Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button onClick={onClick}>{children}</button>
	),
}));

vi.mock("@/components/molecules/Card", () => ({
	Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<div className={className}>{children}</div>
	),
}));

import { useSettings } from "@/hooks/useSettings";

const mockUseSettings = vi.mocked(useSettings);

const mockSettings: Settings = {
	id: "settings-1",
	theme: "system",
	antiBanEnabled: true,
	antiBanStrictMode: false,
	notificationsEnabled: true,
	soundEnabled: true,
	autoStart: false,
	language: "en",
	aiConfig: {
		provider: "nim",
		apiKey: "",
	},
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("SettingsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSettings.mockReturnValue({
			settings: mockSettings,
			loading: false,
			error: null,
			fetchSettings: vi.fn(),
			updateSettings: vi.fn(),
			updateAIConfig: vi.fn(),
			toggleAntiBan: vi.fn(),
			toggleNotifications: vi.fn(),
			setTheme: vi.fn(),
		});
	});

	describe("rendering", () => {
		it("renders the page container", () => {
			render(<SettingsPage />);

			expect(screen.getByTestId("page-settings")).toBeInTheDocument();
		});

		it("renders the page title", () => {
			render(<SettingsPage />);

			expect(
				screen.getByRole("heading", { name: "Settings" }),
			).toBeInTheDocument();
		});

		it("renders description", () => {
			render(<SettingsPage />);

			expect(
				screen.getByText(/configure application settings and preferences/i),
			).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has proper heading structure", () => {
			render(<SettingsPage />);

			const heading = screen.getByRole("heading", { level: 1 });
			expect(heading).toHaveTextContent("Settings");
		});
	});
});
