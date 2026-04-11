import type { Account } from "@social-pip/types";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
/**
 * @fileoverview Tests for AccountList organism
 */
// removed unused import
import { AccountList } from "./AccountList";

// Mock accounts for testing
const mockAccounts: Account[] = [
	{
		id: "acc_001",
		platform: "facebook",
		name: "Facebook Account",
		username: "fbuser",
		status: "active",
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-01T00:00:00Z"),
	},
	{
		id: "acc_002",
		platform: "instagram",
		name: "Instagram Account",
		username: "iguser",
		displayName: "IG Display",
		status: "active",
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		createdAt: new Date("2024-01-02T00:00:00Z"),
		updatedAt: new Date("2024-01-02T00:00:00Z"),
	},
	{
		id: "acc_003",
		platform: "twitter",
		name: "Twitter Account",
		username: "twuser",
		status: "inactive",
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		createdAt: new Date("2024-01-03T00:00:00Z"),
		updatedAt: new Date("2024-01-03T00:00:00Z"),
	},
	{
		id: "acc_004",
		platform: "facebook",
		name: "Another Facebook",
		username: "fbuser2",
		status: "active",
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		createdAt: new Date("2024-01-04T00:00:00Z"),
		updatedAt: new Date("2024-01-04T00:00:00Z"),
	},
	{
		id: "acc_005",
		platform: "tiktok",
		name: "TikTok Account",
		username: "ttuser",
		status: "active",
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		createdAt: new Date("2024-01-05T00:00:00Z"),
		updatedAt: new Date("2024-01-05T00:00:00Z"),
	},
];

describe("AccountList", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("grid rendering", () => {
		it("renders grid with all 5 accounts", () => {
			render(<AccountList accounts={mockAccounts} />);

			expect(screen.getByText("Facebook Account")).toBeDefined();
			expect(screen.getByText("Instagram Account")).toBeDefined();
			expect(screen.getByText("Twitter Account")).toBeDefined();
			expect(screen.getByText("Another Facebook")).toBeDefined();
			expect(screen.getByText("TikTok Account")).toBeDefined();
		});

		it("renders grid with correct responsive classes", () => {
			const { container } = render(<AccountList accounts={mockAccounts} />);

			const grid = container.querySelector(".grid");
			expect(grid?.className).toContain("grid-cols-1");
			expect(grid?.className).toContain("sm:grid-cols-2");
			expect(grid?.className).toContain("md:grid-cols-3");
			expect(grid?.className).toContain("lg:grid-cols-4");
		});
	});

	describe("platform filter", () => {
		it("filters by platform when dropdown is changed", async () => {
			const onEdit = vi.fn();
			render(<AccountList accounts={mockAccounts} onEdit={onEdit} />);

			// Initially all accounts are shown
			expect(screen.getByText("Instagram Account")).toBeDefined();

			// Select Facebook filter
			const select = screen.getByLabelText("Filter by platform");
			fireEvent.change(select, { target: { value: "facebook" } });

			// Should only show Facebook accounts
			expect(screen.getByText("Facebook Account")).toBeDefined();
			expect(screen.getByText("Another Facebook")).toBeDefined();
			expect(screen.queryByText("Instagram Account")).toBeNull();
			expect(screen.queryByText("Twitter Account")).toBeNull();
		});
	});

	describe("search functionality", () => {
		it("filters by username (debounced 300ms)", async () => {
			render(<AccountList accounts={mockAccounts} />);

			// Type in search
			const searchInput = screen.getByLabelText("Search accounts");
			fireEvent.change(searchInput, { target: { value: "fbuser" } });

			// Before debounce, should still show all
			expect(screen.getByText("Instagram Account")).toBeDefined();

			// Fast-forward 300ms and wrap in act
			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			// After debounce, should only show matching accounts
			await waitFor(() => {
				expect(screen.getByText("Facebook Account")).toBeDefined();
				expect(screen.queryByText("Instagram Account")).toBeNull();
			});
		});

		it("search is case-insensitive", async () => {
			render(<AccountList accounts={mockAccounts} />);

			const searchInput = screen.getByLabelText("Search accounts");
			fireEvent.change(searchInput, { target: { value: "FBUSER" } });

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			await waitFor(() => {
				expect(screen.getByText("Facebook Account")).toBeDefined();
			});
		});

		it("searches in displayName as well", async () => {
			render(<AccountList accounts={mockAccounts} />);

			const searchInput = screen.getByLabelText("Search accounts");
			fireEvent.change(searchInput, { target: { value: "IG Display" } });

			await act(async () => {
				vi.advanceTimersByTime(300);
			});

			await waitFor(() => {
				expect(screen.getByText("Instagram Account")).toBeDefined();
			});
		});
	});

	describe("empty state", () => {
		it("shows empty state when no accounts match filter", () => {
			render(<AccountList accounts={mockAccounts} />);

			const select = screen.getByLabelText("Filter by platform");
			fireEvent.change(select, { target: { value: "telegram" } });

			expect(
				screen.getByText("No accounts found matching your filters"),
			).toBeDefined();
		});

		it("shows Add button in empty state", () => {
			const onAdd = vi.fn();
			render(<AccountList accounts={[]} onAdd={onAdd} />);

			const addButton = screen.getByText("Add Account");
			expect(addButton).toBeDefined();

			fireEvent.click(addButton);
			expect(onAdd).toHaveBeenCalled();
		});

		it("shows different message when no accounts exist at all", () => {
			render(<AccountList accounts={[]} />);

			expect(screen.getByText("No accounts yet")).toBeDefined();
		});
	});

	describe("loading skeleton", () => {
		it("shows 6 skeleton cards when loading", () => {
			const { container } = render(<AccountList accounts={[]} loading />);

			const skeletons = container.querySelectorAll(".animate-pulse");
			// 1 for filter bar (w-40), 1 for search (w-64), 6 for cards
			expect(skeletons.length).toBeGreaterThanOrEqual(6);
		});

		it("does not show accounts when loading", () => {
			render(<AccountList accounts={mockAccounts} loading />);

			expect(screen.queryByText("Facebook Account")).toBeNull();
		});
	});

	describe("action handlers", () => {
		it("calls onEdit with correct id", () => {
			const onEdit = vi.fn();
			render(<AccountList accounts={mockAccounts} onEdit={onEdit} />);

			// Find the first account card and click edit
			const card = screen.getByRole("button", { name: /Facebook Account/ });
			fireEvent.mouseEnter(card);

			const editButton = screen.getAllByLabelText("Edit account")[0];
			fireEvent.click(editButton);

			expect(onEdit).toHaveBeenCalledWith("acc_001");
		});

		it("calls onDelete with correct id", () => {
			const onDelete = vi.fn();
			render(<AccountList accounts={mockAccounts} onDelete={onDelete} />);

			const card = screen.getByRole("button", { name: /Facebook Account/ });
			fireEvent.mouseEnter(card);

			const deleteButton = screen.getAllByLabelText("Delete account")[0];
			fireEvent.click(deleteButton);

			expect(onDelete).toHaveBeenCalledWith("acc_001");
		});
	});
});
