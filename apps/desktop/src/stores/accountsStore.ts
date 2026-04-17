import type {
  Account,
  AccountFilter,
  AccountStatus,
  CreateAccountInput,
  Platform,
  UpdateAccountInput,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Enhanced accounts store - Zustand state management for account CRUD
 */
import { create } from "zustand";

// State interface
export interface AccountsState {
  accounts: Account[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  filter: AccountFilter | null;

  // Actions
  fetchAccounts: (filter?: AccountFilter) => Promise<void>;
  createAccount: (data: CreateAccountInput) => Promise<Account>;
  updateAccount: (id: string, data: UpdateAccountInput) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  selectAccount: (id: string | null) => void;
  setFilter: (filter: AccountFilter) => void;
  clearError: () => void;
}

// Helper to convert filter to invoke params
function filterToParams(filter: AccountFilter | null): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  if (filter?.platform !== undefined) {
    params["platform"] = filter["platform"];
  }
  if (filter?.status !== undefined) {
    params["status"] = filter["status"];
  }
  if (filter?.search !== undefined) {
    params["search"] = filter["search"];
  }

  return params;
}

// Helper to sort accounts by createdAt descending
function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order
  });
}

// Store implementation
export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  selectedId: null,
  loading: false,
  error: null,
  filter: null,

  fetchAccounts: async (filter?: AccountFilter) => {
    const currentFilter = filter ?? get().filter ?? undefined;
    set({ loading: true, error: null });

    try {
      const params = filterToParams(currentFilter ?? null);
      const accounts = await invoke<Account[]>("get_accounts", params);
      set({
        accounts: sortAccounts(accounts),
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        error: errorMessage,
        loading: false,
        // Keep existing accounts on failure
      });
    }
  },

  createAccount: async (data: CreateAccountInput) => {
    // Generate temp ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    const now = new Date();

    // Create temp account for optimistic update
    const tempAccount: Account = {
      id: tempId,
      name: data.name,
      platform: data.platform as Platform,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      chromeProfilePath: data.chromeProfilePath,
      status: (data.status ?? "active") as AccountStatus,
      warmupProgress: 0,
      restrictionsCount: 0,
      dailyPostsCount: 0,
      lastResetDate: undefined,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: undefined,
    };

    // 1. Optimistic update
    const currentAccounts = get().accounts;
    set({
      accounts: sortAccounts([tempAccount, ...currentAccounts]),
      loading: true,
    });

    try {
      // 2. Call Tauri
      const account = await invoke<Account>("create_account", {
        data: {
          platform: data.platform,
          name: data.name,
          username: data.username,
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
          chrome_profile_path: data.chromeProfilePath,
          status: data.status ?? "active",
          notes: data.notes,
        },
      });

      // 3. Replace temp with real
      set((state) => ({
        accounts: sortAccounts(state.accounts.map((a) => (a.id === tempId ? account : a))),
        loading: false,
        error: null,
      }));

      return account;
    } catch (error) {
      // 4. Rollback on error
      const errorMessage = error instanceof Error ? error.message : String(error);
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== tempId),
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  },

  updateAccount: async (id: string, data: UpdateAccountInput) => {
    // 1. Store current state for rollback
    const currentAccounts = get().accounts;
    const currentAccount = currentAccounts.find((a) => a.id === id);

    if (!currentAccount) {
      throw new Error(`Account not found: ${id}`);
    }

    // 2. Optimistic update
    const updatedAccount: Account = {
      ...currentAccount,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.chromeProfilePath !== undefined && {
        chromeProfilePath: data.chromeProfilePath,
      }),
      ...(data.status !== undefined && {
        status: data.status as AccountStatus,
      }),
      updatedAt: new Date(),
    };

    set((state) => ({
      accounts: sortAccounts(state.accounts.map((a) => (a.id === id ? updatedAccount : a))),
    }));

    try {
      // 3. Call Tauri
      const account = await invoke<Account>("update_account", {
        id,
        data: {
          name: data.name,
          username: data.username,
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
          chrome_profile_path: data.chromeProfilePath,
          status: data.status,
          notes: data.notes,
        },
      });

      // 4. Update with server response
      set((state) => ({
        accounts: sortAccounts(state.accounts.map((a) => (a.id === id ? account : a))),
        error: null,
      }));

      return account;
    } catch (error) {
      // 5. Rollback on error
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        accounts: currentAccounts,
        error: errorMessage,
      });
      throw error;
    }
  },

  deleteAccount: async (id: string) => {
    // 1. Store current state for rollback
    const currentAccounts = get().accounts;
    const currentSelectedId = get().selectedId;

    // 2. Optimistic removal
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));

    try {
      // 3. Call Tauri
      await invoke<void>("delete_account", { id });

      // 4. Success - state already updated
      set({ error: null });
    } catch (error) {
      // 5. Rollback on error
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        accounts: currentAccounts,
        selectedId: currentSelectedId,
        error: errorMessage,
      });
      throw error;
    }
  },

  selectAccount: (id: string | null) => {
    set({ selectedId: id });
  },

  setFilter: (filter: AccountFilter) => {
    const currentFilter = get().filter;
    set({ filter: currentFilter ? { ...currentFilter, ...filter } : filter });
  },

  clearError: () => {
    set({ error: null });
  },
}));
