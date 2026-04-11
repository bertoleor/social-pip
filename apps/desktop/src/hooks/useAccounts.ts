import { confirm } from "@/lib/dialog";
import { toast } from "@/lib/toast";
import { useAccountsStore } from "@/stores/accountsStore";
import type {
	Account,
	AccountFilter,
	CreateAccountInput,
	UpdateAccountInput,
} from "@social-pip/types";
/**
 * @fileoverview useAccounts hook - wraps accountsStore with toast notifications
 */
import { useCallback, useEffect } from "react";

export interface UseAccountsReturn {
	accounts: Account[];
	loading: boolean;
	error: string | null;
	selectedId: string | null;
	fetchAccounts: (filter?: AccountFilter) => Promise<void>;
	createAccount: (data: CreateAccountInput) => Promise<Account | null>;
	updateAccount: (
		id: string,
		data: UpdateAccountInput,
	) => Promise<Account | null>;
	deleteAccount: (id: string) => Promise<boolean>;
	selectAccount: (id: string | null) => void;
	setFilter: (filter: AccountFilter) => void;
	clearError: () => void;
}

/**
 * useAccounts hook
 *
 * Provides a convenient interface for account operations with:
 * - Automatic fetch on mount
 * - Toast notifications for success/error
 * - Delete confirmation dialog
 *
 * @example
 * ```tsx
 * const { accounts, loading, createAccount, deleteAccount } = useAccounts()
 *
 * // Create account (shows toast)
 * await createAccount({ platform: 'facebook', name: 'My Account' })
 *
 * // Delete account (shows confirmation + toast)
 * await deleteAccount(accountId)
 * ```
 */
export function useAccounts(): UseAccountsReturn {
	const {
		accounts,
		loading,
		error,
		selectedId,
		fetchAccounts,
		createAccount: storeCreate,
		updateAccount: storeUpdate,
		deleteAccount: storeDelete,
		selectAccount,
		setFilter,
		clearError,
	} = useAccountsStore();

	// Fetch accounts on mount
	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	// Create account with toast
	const createAccount = useCallback(
		async (data: CreateAccountInput): Promise<Account | null> => {
			try {
				const account = await storeCreate(data);
				toast.success(`Account "${account.name}" created successfully`);
				return account;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to create account";
				toast.error(message);
				return null;
			}
		},
		[storeCreate],
	);

	// Update account with toast
	const updateAccount = useCallback(
		async (id: string, data: UpdateAccountInput): Promise<Account | null> => {
			try {
				const account = await storeUpdate(id, data);
				toast.success(`Account "${account.name}" updated successfully`);
				return account;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to update account";
				toast.error(message);
				return null;
			}
		},
		[storeUpdate],
	);

	// Delete account with confirmation and toast
	const deleteAccount = useCallback(
		async (id: string): Promise<boolean> => {
			const account = accounts.find((a) => a.id === id);
			const accountName = account?.name ?? "this account";

			// Show confirmation dialog
			const confirmed = await confirm(
				`Are you sure you want to delete "${accountName}"?`,
				"This action cannot be undone.",
			);

			if (!confirmed) {
				return false;
			}

			try {
				await storeDelete(id);
				toast.success(`Account "${accountName}" deleted`);
				return true;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to delete account";
				toast.error(message);
				return false;
			}
		},
		[accounts, storeDelete],
	);

	return {
		accounts,
		loading,
		error,
		selectedId,
		fetchAccounts,
		createAccount,
		updateAccount,
		deleteAccount,
		selectAccount,
		setFilter,
		clearError,
	};
}
