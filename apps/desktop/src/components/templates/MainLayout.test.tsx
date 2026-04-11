import { useUIStore } from "@/stores/uiStore";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { MainLayout } from "./MainLayout";

// Wrapper for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
	<BrowserRouter>{children}</BrowserRouter>
);

// Mock child component
const MockChild = () => <div data-testid="mock-child">Child Content</div>;

describe("MainLayout", () => {
	beforeEach(() => {
		// Reset store to initial state before each test
		useUIStore.setState({
			sidebarOpen: true,
			theme: "system",
		});
	});
	describe("rendering", () => {
		it("renders sidebar, header, and content areas", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			expect(screen.getByRole("navigation")).toBeInTheDocument(); // Sidebar
			expect(screen.getByRole("banner")).toBeInTheDocument(); // Header
			expect(screen.getByTestId("mock-child")).toBeInTheDocument(); // Content
		});

		it("renders children in content area", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<div data-testid="child-element">Test Content</div>
					</MainLayout>
				</RouterWrapper>,
			);

			expect(screen.getByTestId("child-element")).toBeInTheDocument();
			expect(screen.getByText("Test Content")).toBeInTheDocument();
		});

		it("renders as full height layout", () => {
			const { container } = render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const layout = container.querySelector(".h-screen");
			expect(layout).toHaveClass("flex");
		});
	});

	describe("sidebar", () => {
		it("renders navigation items", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			// Check for navigation structure
			const nav = screen.getByRole("navigation");
			expect(nav).toBeInTheDocument();
		});

		it("sidebar is visible by default", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const nav = screen.getByRole("navigation");
			expect(nav).toBeVisible();
		});
	});

	describe("sidebar toggle", () => {
		it("has toggle button in header", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			// Button shows "Close sidebar" when open
			const toggleButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});
			expect(toggleButton).toBeInTheDocument();
		});

		it("toggles sidebar visibility when button clicked", async () => {
			const user = userEvent.setup();

			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const toggleButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});
			const nav = screen.getByRole("navigation");

			// Sidebar visible initially
			expect(nav).toBeVisible();

			// Click to hide
			await user.click(toggleButton);

			// Check sidebar is now hidden (should have collapsed class or be invisible)
			// After collapse, nav might still exist but have different state
			expect(nav).toHaveClass("w-0"); // or similar collapsed state
		});

		it("toggles sidebar back to visible on second click", async () => {
			const user = userEvent.setup();

			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			// First close the sidebar
			const closeButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});
			const nav = screen.getByRole("navigation");

			// Hide
			await user.click(closeButton);
			expect(nav).toHaveClass("w-0");

			// Now button should say "Open sidebar"
			const openButton = screen.getByRole("button", { name: /open sidebar/i });

			// Show again
			await user.click(openButton);
			expect(nav).not.toHaveClass("w-0");
		});
	});

	describe("responsive behavior", () => {
		it("has responsive sidebar classes", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const nav = screen.getByRole("navigation");
			// Should have transition for smooth collapse
			expect(nav.className).toMatch(/transition/);
		});

		it("content area fills remaining space", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			// Main content should be flex-1 to fill space
			const main = screen.getByRole("main");
			expect(main).toHaveClass("flex-1");
		});
	});

	describe("header", () => {
		it("renders header with title", () => {
			render(
				<RouterWrapper>
					<MainLayout title="Dashboard">
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			expect(
				screen.getByRole("heading", { name: "Dashboard" }),
			).toBeInTheDocument();
		});

		it("renders header without title by default", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			// Header should exist even without title
			const header = screen.getByRole("banner");
			expect(header).toBeInTheDocument();
		});

		it("header contains toggle button", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const header = screen.getByRole("banner");
			const toggleButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});

			expect(header).toContainElement(toggleButton);
		});
	});

	describe("accessibility", () => {
		it("has proper ARIA landmarks", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			expect(screen.getByRole("navigation")).toBeInTheDocument();
			expect(screen.getByRole("banner")).toBeInTheDocument();
			expect(screen.getByRole("main")).toBeInTheDocument();
		});

		it("toggle button has accessible name", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const toggleButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});
			expect(toggleButton).toHaveAttribute("aria-label");
		});

		it("sidebar has aria-expanded when toggled", async () => {
			const user = userEvent.setup();

			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const toggleButton = screen.getByRole("button", {
				name: /close sidebar/i,
			});

			expect(toggleButton).toHaveAttribute("aria-expanded", "true");

			await user.click(toggleButton);
			expect(toggleButton).toHaveAttribute("aria-expanded", "false");
		});
	});

	describe("custom className", () => {
		it("accepts custom className on layout wrapper", () => {
			const { container } = render(
				<RouterWrapper>
					<MainLayout className="custom-layout">
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const layout = container.querySelector(".h-screen");
			expect(layout).toHaveClass("custom-layout");
		});
	});

	describe("navigation links", () => {
		it("renders navigation links for all pages", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			expect(
				screen.getByRole("link", { name: /dashboard/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: /accounts/i }),
			).toBeInTheDocument();
			expect(screen.getByRole("link", { name: /posts/i })).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: /schedule/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: /analytics/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: /settings/i }),
			).toBeInTheDocument();
		});

		it("dashboard link points to root path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
			expect(dashboardLink).toHaveAttribute("href", "/");
		});

		it("accounts link points to /accounts path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const accountsLink = screen.getByRole("link", { name: /accounts/i });
			expect(accountsLink).toHaveAttribute("href", "/accounts");
		});

		it("posts link points to /posts path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const postsLink = screen.getByRole("link", { name: /posts/i });
			expect(postsLink).toHaveAttribute("href", "/posts");
		});

		it("schedule link points to /schedule path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const scheduleLink = screen.getByRole("link", { name: /schedule/i });
			expect(scheduleLink).toHaveAttribute("href", "/schedule");
		});

		it("analytics link points to /analytics path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const analyticsLink = screen.getByRole("link", { name: /analytics/i });
			expect(analyticsLink).toHaveAttribute("href", "/analytics");
		});

		it("settings link points to /settings path", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const settingsLink = screen.getByRole("link", { name: /settings/i });
			expect(settingsLink).toHaveAttribute("href", "/settings");
		});

		it("all navigation links are in the sidebar", () => {
			render(
				<RouterWrapper>
					<MainLayout>
						<MockChild />
					</MainLayout>
				</RouterWrapper>,
			);

			const nav = screen.getByRole("navigation");
			const links = screen.getAllByRole("link");

			// All links should be within the navigation
			links.forEach((link) => {
				expect(nav).toContainElement(link);
			});
		});
	});
});
