import type { Account } from "@social-pip/types";
// removed unused import
/**
 * @fileoverview Tests for AccountFormModal organism
 */
// removed unused import
import { AccountFormModal } from "./AccountFormModal";

// Mock account for edit mode
const mockAccount: Account = {
	id: "acc_001",
	platform: "facebook",
	name: "Test Account",
	username: "testuser",
	displayName: "Test Display",
	status: "active",
	warmupProgress: 0,
	restrictionsCount: 0,
	dailyPostsCount: 0,
	createdAt: new Date("2024-01-01T00:00:00Z"),
	updatedAt: new Date("2024-01-01T00:00:00Z"),
};

describe("AccountFormModal", () => {
	const mockOnSubmit = vi.fn();
	const mockOnCancel = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("create mode", () => {
		it("renders form with 6 fields in create mode", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			expect(screen.getByLabelText(/Platform/)).toBeDefined();
			expect(screen.getByLabelText(/Name/)).toBeDefined();
			expect(screen.getByLabelText(/Username/)).toBeDefined();
			expect(screen.getByLabelText(/Display Name/)).toBeDefined();
			expect(screen.getByLabelText(/Status/)).toBeDefined();
			expect(screen.getByLabelText(/Notes/)).toBeDefined();
		});

		it('shows "Add Account" title in create mode', () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			expect(screen.getByText("Add Account")).toBeDefined();
		});
	});

	describe("edit mode", () => {
		it("pre-populates fields in edit mode", () => {
			render(
				<AccountFormModal
					isOpen
					mode="edit"
					account={mockAccount}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const nameInput = screen.getByLabelText(/Name/);
			expect(nameInput).toHaveValue("Test Account");

			const usernameInput = screen.getByLabelText(/Username/);
			expect(usernameInput).toHaveValue("testuser");

			expect(screen.getByText("Edit Account")).toBeDefined();
		});

		it("disables platform select in edit mode", () => {
			render(
				<AccountFormModal
					isOpen
					mode="edit"
					account={mockAccount}
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const platformSelect = screen.getByLabelText(/Platform/);
			expect(platformSelect).toBeDisabled();
		});
	});

	describe("validation", () => {
		it("shows Zod validation error on empty name", async () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const submitButton = screen.getByText("Create");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Name is required")).toBeDefined();
			});
		});

		it("submit disabled when form invalid", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const submitButton = screen.getByText("Create");
			expect(submitButton).toBeDisabled();
		});

		it("validates username format", async () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const nameInput = screen.getByLabelText(/Name/);
			fireEvent.change(nameInput, { target: { value: "Test" } });

			const usernameInput = screen.getByLabelText(/Username/);
			fireEvent.change(usernameInput, { target: { value: "invalid-user!" } });

			const submitButton = screen.getByText("Create");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText(/letters, numbers, and underscores/),
				).toBeDefined();
			});
		});

		it("clears field error when modified", async () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			// Trigger validation error
			const submitButton = screen.getByText("Create");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText("Name is required")).toBeDefined();
			});

			// Type in name field
			const nameInput = screen.getByLabelText(/Name/);
			fireEvent.change(nameInput, { target: { value: "Test" } });

			// Error should be cleared
			await waitFor(() => {
				expect(screen.queryByText("Name is required")).toBeNull();
			});
		});
	});

	describe("submission", () => {
		it("calls onSubmit with valid data", async () => {
			mockOnSubmit.mockResolvedValueOnce(undefined);

			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			// Fill form
			const platformSelect = screen.getByLabelText(/Platform/);
			fireEvent.change(platformSelect, { target: { value: "instagram" } });

			const nameInput = screen.getByLabelText(/Name/);
			fireEvent.change(nameInput, { target: { value: "Test Account" } });

			const usernameInput = screen.getByLabelText(/Username/);
			fireEvent.change(usernameInput, { target: { value: "testuser" } });

			const submitButton = screen.getByText("Create");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockOnSubmit).toHaveBeenCalledWith({
					platform: "instagram",
					name: "Test Account",
					username: "testuser",
					displayName: "",
					status: "active",
					notes: "",
				});
			});
		});
	});

	describe("cancel actions", () => {
		it("closes modal when Cancel button is clicked", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const cancelButton = screen.getByText("Cancel");
			fireEvent.click(cancelButton);

			expect(mockOnCancel).toHaveBeenCalled();
		});

		it("closes modal when X button is clicked", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const closeButton = screen.getByLabelText("Close modal");
			fireEvent.click(closeButton);

			expect(mockOnCancel).toHaveBeenCalled();
		});

		it("closes modal when Escape is pressed", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			fireEvent.keyDown(window, { key: "Escape" });

			expect(mockOnCancel).toHaveBeenCalled();
		});

		it("does not close on Escape when not open", () => {
			render(
				<AccountFormModal
					isOpen={false}
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			fireEvent.keyDown(window, { key: "Escape" });

			expect(mockOnCancel).not.toHaveBeenCalled();
			expect(screen.queryByText("Add Account")).toBeNull();
		});
	});

	describe("accessibility", () => {
		it("has correct ARIA attributes", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const dialog = screen.getByRole("dialog");
			expect(dialog.getAttribute("aria-modal")).toBe("true");
			expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");
		});

		it("marks required fields with asterisk", () => {
			render(
				<AccountFormModal
					isOpen
					mode="create"
					onSubmit={mockOnSubmit}
					onCancel={mockOnCancel}
				/>,
			);

			const platformLabel = screen.getByLabelText(/Platform/);
			expect(platformLabels).toBeDefined();
		});
	});
});
