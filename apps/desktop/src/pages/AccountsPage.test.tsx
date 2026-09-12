import type { Account, CreateAccountInput, UpdateAccountInput } from "@social-pip/types";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import AccountsPage from "./AccountsPage";

vi.mock("@/hooks/useAccounts", () => ({
  useAccounts: vi.fn(),
}));

vi.mock("@/components/templates/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

interface MockAccountListProps {
  accounts: Account[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

vi.mock("@/components/organisms/AccountList", () => ({
  AccountList: ({ accounts, onEdit, onDelete, onAdd }: MockAccountListProps) => (
    <div data-testid="account-list">
      {accounts.map((account: Account) => (
        <div key={account.id} data-testid={`account-${account.id}`}>
          <span>{account.name}</span>
          <button type="button" onClick={() => onEdit(account.id)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(account.id)}>
            Delete
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd} data-testid="add-button">
        Add
      </button>
    </div>
  ),
}));

interface MockAccountFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  onSubmit: (data: CreateAccountInput | UpdateAccountInput) => void;
  onCancel: () => void;
}

vi.mock("@/components/organisms/AccountFormModal", () => ({
  AccountFormModal: ({ isOpen, mode, onSubmit, onCancel }: MockAccountFormModalProps) => {
    if (!isOpen) return null;
    return (
      <div data-testid="form-modal" data-mode={mode}>
        <button type="button" onClick={onCancel} data-testid="cancel-button">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ platform: "facebook", name: "Test" })}
          data-testid="submit-button"
        >
          Submit
        </button>
      </div>
    );
  },
}));

interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

vi.mock("@/components/atoms/Button", () => ({
  Button: ({ children, onClick }: MockButtonProps) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { useAccounts } from "@/hooks/useAccounts";

const mockUseAccounts = vi.mocked(useAccounts);

describe("AccountsPage", () => {
  const mockAccounts: Account[] = [
    {
      id: "acc_001",
      platform: "facebook",
      name: "Test Account",
      username: "testuser",
      status: "active",
      warmupProgress: 0,
      restrictionsCount: 0,
      dailyPostsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCreateAccount = vi.fn();
  const mockUpdateAccount = vi.fn();
  const mockDeleteAccount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccounts.mockReturnValue({
      accounts: mockAccounts,
      loading: false,
      error: null,
      selectedId: null,
      fetchAccounts: vi.fn(),
      createAccount: mockCreateAccount,
      updateAccount: mockUpdateAccount,
      deleteAccount: mockDeleteAccount,
      selectAccount: vi.fn(),
      setFilter: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders within MainLayout with AccountList", () => {
      render(<AccountsPage />);

      expect(screen.getByTestId("main-layout")).toBeDefined();
      expect(screen.getByTestId("account-list")).toBeDefined();
    });

    it("displays page title and description", () => {
      render(<AccountsPage />);

      expect(screen.getByRole("heading", { name: "Accounts" })).toBeDefined();
      expect(screen.getByText(/manage your social media accounts/i)).toBeDefined();
    });

    it("shows Add Account button in header", () => {
      render(<AccountsPage />);

      expect(screen.getByText("Add Account")).toBeDefined();
    });
  });

  describe("create flow", () => {
    it("opens modal in create mode when Add Account clicked", async () => {
      const user = userEvent.setup();
      render(<AccountsPage />);

      const addButton = screen.getByText("Add Account");
      await user.click(addButton);

      const modal = screen.getByTestId("form-modal");
      expect(modal).toBeDefined();
      expect(modal.getAttribute("data-mode")).toBe("create");
    });

    it("creates account on modal submit", async () => {
      const user = userEvent.setup();
      mockCreateAccount.mockResolvedValueOnce(mockAccounts[0]);

      render(<AccountsPage />);

      await user.click(screen.getByText("Add Account"));
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalledWith({
          platform: "facebook",
          name: "Test",
        });
      });
    });
  });

  describe("edit flow", () => {
    it("opens modal in edit mode when Edit clicked from card", async () => {
      const user = userEvent.setup();
      render(<AccountsPage />);

      const editButton = screen.getAllByText("Edit")[0];
      await user.click(editButton);

      const modal = screen.getByTestId("form-modal");
      expect(modal).toBeDefined();
      expect(modal.getAttribute("data-mode")).toBe("edit");
    });

    it("updates account on modal submit", async () => {
      const user = userEvent.setup();
      mockUpdateAccount.mockResolvedValueOnce(mockAccounts[0]);

      render(<AccountsPage />);

      await user.click(screen.getAllByText("Edit")[0]);
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockUpdateAccount).toHaveBeenCalledWith("acc_001", {
          platform: "facebook",
          name: "Test",
        });
      });
    });
  });

  describe("delete flow", () => {
    it("calls deleteAccount when Delete clicked from card", async () => {
      const user = userEvent.setup();
      mockDeleteAccount.mockResolvedValueOnce(true);

      render(<AccountsPage />);

      const deleteButton = screen.getAllByText("Delete")[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalledWith("acc_001");
      });
    });
  });

  describe("modal state", () => {
    it("closes modal on cancel", async () => {
      const user = userEvent.setup();
      render(<AccountsPage />);

      await user.click(screen.getByText("Add Account"));
      expect(screen.getByTestId("form-modal")).toBeDefined();

      await user.click(screen.getByTestId("cancel-button"));
      expect(screen.queryByTestId("form-modal")).toBeNull();
    });

    it("closes modal after successful submit", async () => {
      const user = userEvent.setup();
      mockCreateAccount.mockResolvedValueOnce(mockAccounts[0]);

      render(<AccountsPage />);

      await user.click(screen.getByText("Add Account"));
      await user.click(screen.getByTestId("submit-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("form-modal")).toBeNull();
      });
    });
  });
});
