import { act, renderHook } from "@testing-library/react";
import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { useAccountsStore } from "@/stores/accountsStore";
/**
 * @fileoverview Tests for useAccounts hook
 */
// removed unused import
import { useAccounts } from "./useAccounts";

// Mock dependencies
vi.mock("@/stores/accountsStore", () => ({
  useAccountsStore: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/dialog", () => ({
  confirm: vi.fn(),
}));

const mockToast = vi.mocked(toast);
const mockConfirm = vi.mocked(confirm);

describe("useAccounts", () => {
  const mockFetchAccounts = vi.fn();
  const mockCreateAccount = vi.fn();
  const mockUpdateAccount = vi.fn();
  const mockDeleteAccount = vi.fn();
  const mockSelectAccount = vi.fn();
  const mockSetFilter = vi.fn();
  const mockClearError = vi.fn();

  const mockAccount = {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAccountsStore).mockReturnValue({
      accounts: [mockAccount],
      loading: false,
      error: null,
      selectedId: null,
      fetchAccounts: mockFetchAccounts,
      createAccount: mockCreateAccount,
      updateAccount: mockUpdateAccount,
      deleteAccount: mockDeleteAccount,
      selectAccount: mockSelectAccount,
      setFilter: mockSetFilter,
      clearError: mockClearError,
    });
  });

  describe("initial fetch", () => {
    it("fetches accounts on mount", () => {
      renderHook(() => useAccounts());

      expect(mockFetchAccounts).toHaveBeenCalled();
    });
  });

  describe("createAccount", () => {
    it("creates account and shows success toast", async () => {
      mockCreateAccount.mockResolvedValueOnce(mockAccount);

      const { result } = renderHook(() => useAccounts());

      let created: Awaited<ReturnType<typeof result.current.createAccount>>;

      await act(async () => {
        created = await result.current.createAccount({
          platform: "facebook",
          name: "Test",
        });
      });

      expect(mockCreateAccount).toHaveBeenCalledWith({
        platform: "facebook",
        name: "Test",
      });
      expect(mockToast.success).toHaveBeenCalledWith('Account "Test Account" created successfully');
      expect(created!).toEqual(mockAccount);
    });

    it("shows error toast on create failure", async () => {
      mockCreateAccount.mockRejectedValueOnce(new Error("Create failed"));

      const { result } = renderHook(() => useAccounts());

      await act(async () => {
        await result.current.createAccount({
          platform: "facebook",
          name: "Test",
        });
      });

      expect(mockToast.error).toHaveBeenCalledWith("Create failed");
    });
  });

  describe("updateAccount", () => {
    it("updates account and shows success toast", async () => {
      mockUpdateAccount.mockResolvedValueOnce({
        ...mockAccount,
        name: "Updated",
      });

      const { result } = renderHook(() => useAccounts());

      await act(async () => {
        await result.current.updateAccount("acc_001", { name: "Updated" });
      });

      expect(mockUpdateAccount).toHaveBeenCalledWith("acc_001", {
        name: "Updated",
      });
      expect(mockToast.success).toHaveBeenCalled();
    });

    it("shows error toast on update failure", async () => {
      mockUpdateAccount.mockRejectedValueOnce(new Error("Update failed"));

      const { result } = renderHook(() => useAccounts());

      await act(async () => {
        await result.current.updateAccount("acc_001", { name: "Updated" });
      });

      expect(mockToast.error).toHaveBeenCalledWith("Update failed");
    });
  });

  describe("deleteAccount", () => {
    it("shows confirmation dialog before deleting", async () => {
      mockConfirm.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAccounts());

      await act(async () => {
        await result.current.deleteAccount("acc_001");
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Account"?',
        "This action cannot be undone.",
      );
      expect(mockDeleteAccount).not.toHaveBeenCalled();
    });

    it("deletes account after confirmation and shows toast", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockDeleteAccount.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAccounts());

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteAccount("acc_001");
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteAccount).toHaveBeenCalledWith("acc_001");
      expect(mockToast.success).toHaveBeenCalled();
      expect(deleted).toBe(true);
    });

    it("shows error toast on delete failure", async () => {
      mockConfirm.mockResolvedValueOnce(true);
      mockDeleteAccount.mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useAccounts());

      let deleted = true;
      await act(async () => {
        deleted = await result.current.deleteAccount("acc_001");
      });

      expect(mockToast.error).toHaveBeenCalledWith("Delete failed");
      expect(deleted).toBe(false);
    });

    it("uses fallback name for unknown account", async () => {
      mockConfirm.mockResolvedValueOnce(false);

      vi.mocked(useAccountsStore).mockReturnValue({
        accounts: [],
        loading: false,
        error: null,
        selectedId: null,
        fetchAccounts: mockFetchAccounts,
        createAccount: mockCreateAccount,
        updateAccount: mockUpdateAccount,
        deleteAccount: mockDeleteAccount,
        selectAccount: mockSelectAccount,
        setFilter: mockSetFilter,
        clearError: mockClearError,
      });

      const { result } = renderHook(() => useAccounts());

      await act(async () => {
        await result.current.deleteAccount("unknown");
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "this account"?',
        "This action cannot be undone.",
      );
    });
  });

  describe("return values", () => {
    it("returns accounts from store", () => {
      const { result } = renderHook(() => useAccounts());

      expect(result.current.accounts).toEqual([mockAccount]);
    });

    it("returns loading state from store", () => {
      const { result } = renderHook(() => useAccounts());

      expect(result.current.loading).toBe(false);
    });

    it("returns error state from store", () => {
      const { result } = renderHook(() => useAccounts());

      expect(result.current.error).toBeNull();
    });
  });
});
