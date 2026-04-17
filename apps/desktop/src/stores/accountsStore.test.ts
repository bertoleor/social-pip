import type {
  Account,
  AccountFilter,
  CreateAccountInput,
  UpdateAccountInput,
} from "@social-pip/types";
import { act } from "@testing-library/react";
/**
 * @fileoverview Tests for enhanced accountsStore with CRUD operations
 */
// removed unused import
import { useAccountsStore } from "./accountsStore";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);

// Mock accounts for testing
const mockAccount1: Account = {
  id: "acc_001",
  platform: "facebook",
  name: "Test Account 1",
  username: "testuser1",
  status: "active",
  warmupProgress: 0,
  restrictionsCount: 0,
  dailyPostsCount: 0,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

const mockAccount2: Account = {
  id: "acc_002",
  platform: "instagram",
  name: "Test Account 2",
  username: "testuser2",
  status: "active",
  warmupProgress: 0,
  restrictionsCount: 0,
  dailyPostsCount: 0,
  createdAt: new Date("2024-01-02T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
};

const mockAccount3: Account = {
  id: "acc_003",
  platform: "tiktok",
  name: "Test Account 3",
  username: "testuser3",
  status: "inactive",
  warmupProgress: 0,
  restrictionsCount: 0,
  dailyPostsCount: 0,
  createdAt: new Date("2024-01-03T00:00:00Z"),
  updatedAt: new Date("2024-01-03T00:00:00Z"),
};

describe("useAccountsStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAccountsStore.setState({
      accounts: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has empty accounts array by default", () => {
      const state = useAccountsStore.getState();
      expect(state.accounts).toEqual([]);
    });

    it("has selectedId set to null by default", () => {
      const state = useAccountsStore.getState();
      expect(state.selectedId).toBeNull();
    });

    it("has loading set to false by default", () => {
      const state = useAccountsStore.getState();
      expect(state.loading).toBe(false);
    });

    it("has error set to null by default", () => {
      const state = useAccountsStore.getState();
      expect(state.error).toBeNull();
    });

    it("has filter set to null by default", () => {
      const state = useAccountsStore.getState();
      expect(state.filter).toBeNull();
    });
  });

  describe("fetchAccounts", () => {
    it("invokes Tauri get_accounts and populates state", async () => {
      mockInvoke.mockResolvedValueOnce([mockAccount1, mockAccount2]);

      await act(async () => {
        await useAccountsStore.getState().fetchAccounts();
      });

      const state = useAccountsStore.getState();
      expect(mockInvoke).toHaveBeenCalledWith("get_accounts", {});
      expect(state.accounts).toHaveLength(2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets loading to true during fetch", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const promise = act(async () => {
        await useAccountsStore.getState().fetchAccounts();
      });

      // Check loading state is true during fetch
      expect(useAccountsStore.getState().loading).toBe(true);

      await promise;
    });

    it("handles errors and sets error state", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"));

      await act(async () => {
        await useAccountsStore.getState().fetchAccounts();
      });

      const state = useAccountsStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.loading).toBe(false);
    });

    it("passes filter params to Tauri invoke", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const filter: AccountFilter = { platform: "facebook" };

      await act(async () => {
        await useAccountsStore.getState().fetchAccounts(filter);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_accounts", {
        platform: "facebook",
      });
    });

    it("sorts accounts by createdAt descending", async () => {
      // Return accounts in reverse chronological order
      mockInvoke.mockResolvedValueOnce([mockAccount3, mockAccount1, mockAccount2]);

      await act(async () => {
        await useAccountsStore.getState().fetchAccounts();
      });

      const state = useAccountsStore.getState();
      // Should be sorted by createdAt descending
      expect(state.accounts[0].id).toBe("acc_003"); // 2024-01-03
      expect(state.accounts[1].id).toBe("acc_002"); // 2024-01-02
      expect(state.accounts[2].id).toBe("acc_001"); // 2024-01-01
    });
  });

  describe("createAccount", () => {
    it("optimistically adds temp account and replaces on success", async () => {
      const newAccount: Account = {
        id: "acc_new",
        platform: "twitter",
        name: "New Account",
        username: "newuser",
        status: "active",
        warmupProgress: 0,
        restrictionsCount: 0,
        dailyPostsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up existing accounts
      useAccountsStore.setState({ accounts: [mockAccount1] });

      // Mock successful create
      mockInvoke.mockResolvedValueOnce(newAccount);

      const input: CreateAccountInput = {
        platform: "twitter",
        name: "New Account",
        username: "newuser",
      };

      let result: Account | undefined;
      await act(async () => {
        result = await useAccountsStore.getState().createAccount(input);
      });

      // Verify the created account is returned
      expect(result).toEqual(newAccount);

      // Verify Tauri was called with correct params
      expect(mockInvoke).toHaveBeenCalledWith("create_account", {
        data: {
          platform: "twitter",
          name: "New Account",
          username: "newuser",
          display_name: undefined,
          avatar_url: undefined,
          chrome_profile_path: undefined,
          status: "active",
          notes: undefined,
        },
      });

      // Verify temp account was replaced
      const state = useAccountsStore.getState();
      expect(state.accounts.find((a) => a.id === "acc_new")).toBeDefined();
      expect(state.accounts.find((a) => a.id.startsWith("temp_"))).toBeUndefined();
    });

    it("rolls back on error", async () => {
      useAccountsStore.setState({ accounts: [mockAccount1] });

      mockInvoke.mockRejectedValueOnce(new Error("Create failed"));

      const input: CreateAccountInput = {
        platform: "twitter",
        name: "New Account",
      };

      await act(async () => {
        try {
          await useAccountsStore.getState().createAccount(input);
        } catch (error) {
          // Expected
        }
      });

      // Verify rollback - should still have only original account
      const state = useAccountsStore.getState();
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe("acc_001");
      expect(state.error).toBe("Create failed");
    });
  });

  describe("updateAccount", () => {
    it("optimistically updates account in place", async () => {
      useAccountsStore.setState({ accounts: [mockAccount1, mockAccount2] });

      const updatedAccount: Account = {
        ...mockAccount1,
        name: "Updated Name",
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(updatedAccount);

      const input: UpdateAccountInput = {
        name: "Updated Name",
      };

      let result: Account | undefined;
      await act(async () => {
        result = await useAccountsStore.getState().updateAccount("acc_001", input);
      });

      expect(result).toEqual(updatedAccount);

      const state = useAccountsStore.getState();
      const updated = state.accounts.find((a) => a.id === "acc_001");
      expect(updated?.name).toBe("Updated Name");
    });

    it("rolls back on error", async () => {
      useAccountsStore.setState({ accounts: [mockAccount1] });

      mockInvoke.mockRejectedValueOnce(new Error("Update failed"));

      try {
        await act(async () => {
          await useAccountsStore.getState().updateAccount("acc_001", { name: "Updated" });
        });
      } catch {
        // Expected
      }

      // Verify rollback
      const state = useAccountsStore.getState();
      expect(state.accounts[0].name).toBe("Test Account 1"); // Original name
      expect(state.error).toBe("Update failed");
    });

    it("throws error for non-existent account", async () => {
      useAccountsStore.setState({ accounts: [] });

      await expect(
        useAccountsStore.getState().updateAccount("nonexistent", { name: "Updated" }),
      ).rejects.toThrow("Account not found");
    });
  });

  describe("deleteAccount", () => {
    it("optimistically removes from state", async () => {
      useAccountsStore.setState({ accounts: [mockAccount1, mockAccount2] });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAccountsStore.getState().deleteAccount("acc_001");
      });

      const state = useAccountsStore.getState();
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe("acc_002");
    });

    it("rolls back on error", async () => {
      useAccountsStore.setState({ accounts: [mockAccount1, mockAccount2] });

      mockInvoke.mockRejectedValueOnce(new Error("Delete failed"));

      await act(async () => {
        try {
          await useAccountsStore.getState().deleteAccount("acc_001");
        } catch {
          // Expected
        }
      });

      // Verify rollback
      const state = useAccountsStore.getState();
      expect(state.accounts).toHaveLength(2);
      expect(state.error).toBe("Delete failed");
    });

    it("clears selectedId if deleted account was selected", async () => {
      useAccountsStore.setState({
        accounts: [mockAccount1, mockAccount2],
        selectedId: "acc_001",
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAccountsStore.getState().deleteAccount("acc_001");
      });

      const state = useAccountsStore.getState();
      expect(state.selectedId).toBeNull();
    });

    it("does not affect selectedId if different account was deleted", async () => {
      useAccountsStore.setState({
        accounts: [mockAccount1, mockAccount2],
        selectedId: "acc_002",
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAccountsStore.getState().deleteAccount("acc_001");
      });

      const state = useAccountsStore.getState();
      expect(state.selectedId).toBe("acc_002");
    });
  });

  describe("setFilter", () => {
    it("updates filter state", () => {
      const filter: AccountFilter = { platform: "facebook" };

      act(() => {
        useAccountsStore.getState().setFilter(filter);
      });

      const state = useAccountsStore.getState();
      expect(state.filter).toEqual(filter);
    });

    it("merges with existing filter", () => {
      useAccountsStore.setState({ filter: { platform: "facebook" } });

      act(() => {
        useAccountsStore.getState().setFilter({ status: "active" });
      });

      const state = useAccountsStore.getState();
      expect(state.filter).toEqual({ platform: "facebook", status: "active" });
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      useAccountsStore.setState({ error: "Some error" });

      act(() => {
        useAccountsStore.getState().clearError();
      });

      expect(useAccountsStore.getState().error).toBeNull();
    });
  });

  describe("selectAccount", () => {
    it("sets selectedId to the given account id", () => {
      act(() => {
        useAccountsStore.getState().selectAccount("acc_001");
      });

      expect(useAccountsStore.getState().selectedId).toBe("acc_001");
    });

    it("can deselect account by setting to null", () => {
      useAccountsStore.setState({ selectedId: "acc_001" });

      act(() => {
        useAccountsStore.getState().selectAccount(null);
      });

      expect(useAccountsStore.getState().selectedId).toBeNull();
    });
  });

  describe("type imports", () => {
    it("uses Account type from @social-pip/types", () => {
      // This test verifies the import is correct
      const account: Account = {
        id: "test",
        name: "Test",
        platform: "facebook",
        status: "active",
        warmupProgress: 0,
        restrictionsCount: 0,
        dailyPostsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      useAccountsStore.setState({ accounts: [account] });
      const stored = useAccountsStore.getState().accounts[0];
      expect(stored).toBeDefined();
      expect(stored?.platform).toBe("facebook");
    });
  });
});
