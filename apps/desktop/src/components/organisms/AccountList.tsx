import { Button } from "@/components/atoms/Button";
import { AccountCard } from "@/components/molecules/AccountCard";
import { cn } from "@/lib/utils";
import type { Account } from "@social-pip/types";
import { Plus, Search } from "lucide-react";
/**
 * @fileoverview AccountList organism - responsive grid with filter and search
 */
import {
	type ChangeEvent,
	useEffect,
	useMemo,
	useState,
} from "react";

export interface AccountListProps {
	accounts: Account[];
	loading?: boolean;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onAdd?: () => void;
	className?: string;
}

/**
 * Platform options for filter dropdown
 */
const PLATFORM_OPTIONS = [
	{ value: "all", label: "All Platforms" },
	{ value: "facebook", label: "Facebook" },
	{ value: "instagram", label: "Instagram" },
	{ value: "tiktok", label: "TikTok" },
	{ value: "twitter", label: "Twitter" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "threads", label: "Threads" },
	{ value: "telegram", label: "Telegram" },
	{ value: "whatsapp", label: "WhatsApp" },
];

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debouncedValue;
}

/**
 * AccountList component
 *
 * Displays accounts in a responsive grid with:
 * - Platform filter dropdown
 * - Username search input (debounced 300ms)
 * - Loading skeleton
 * - Empty state
 *
 * @example
 * ```tsx
 * <AccountList
 *   accounts={accounts}
 *   loading={isLoading}
 *   onEdit={(id) => openEditModal(id)}
 *   onDelete={(id) => confirmDelete(id)}
 *   onAdd={() => openCreateModal()}
 * />
 * ```
 */
export function AccountList({
	accounts,
	loading = false,
	onEdit,
	onDelete,
	onAdd,
	className,
}: AccountListProps): React.ReactElement {
	const [platformFilter, setPlatformFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearch = useDebounce(searchQuery, 300);

	// Filter accounts based on platform and search
	const filteredAccounts = useMemo(() => {
		return accounts.filter((account) => {
			// Platform filter
			if (platformFilter !== "all" && account.platform !== platformFilter) {
				return false;
			}

			// Search filter (case-insensitive)
			if (debouncedSearch) {
				const query = debouncedSearch.toLowerCase();
				const matchesName = account.name.toLowerCase().includes(query);
				const matchesUsername =
					account.username?.toLowerCase().includes(query) ?? false;
				const matchesDisplay =
					account.displayName?.toLowerCase().includes(query) ?? false;

				if (!matchesName && !matchesUsername && !matchesDisplay) {
					return false;
				}
			}

			return true;
		});
	}, [accounts, platformFilter, debouncedSearch]);

	const handlePlatformChange = (e: ChangeEvent<HTMLSelectElement>) => {
		setPlatformFilter(e.target.value);
	};

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	// Render loading skeleton
	if (loading) {
		return (
			<div className={cn("space-y-4", className)}>
				{/* Filter bar skeleton */}
				<div className="flex gap-4 mb-4">
					<div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
					<div className="h-10 w-64 bg-gray-200 animate-pulse rounded flex-1" />
				</div>

				{/* Skeleton cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="h-32 bg-gray-100 animate-pulse rounded-lg border border-gray-200"
						/>
					))}
				</div>
			</div>
		);
	}

	// Render empty state
	if (filteredAccounts.length === 0) {
		return (
			<div className={cn("space-y-4", className)}>
				{/* Filter bar */}
				<div className="flex flex-col sm:flex-row gap-4 mb-4">
					<select
						value={platformFilter}
						onChange={handlePlatformChange}
						className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
						aria-label="Filter by platform"
					>
						{PLATFORM_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search by username..."
							value={searchQuery}
							onChange={handleSearchChange}
							className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
							aria-label="Search accounts"
						/>
					</div>
				</div>

				{/* Empty state */}
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-gray-500 mb-4">
						{searchQuery || platformFilter !== "all"
							? "No accounts found matching your filters"
							: "No accounts yet"}
					</p>
					{onAdd && (
						<Button onClick={onAdd} variant="primary">
							<Plus className="h-4 w-4 mr-2" />
							Add Account
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Filter bar */}
			<div className="flex flex-col sm:flex-row gap-4 mb-4">
				<select
					value={platformFilter}
					onChange={handlePlatformChange}
					className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
					aria-label="Filter by platform"
				>
					{PLATFORM_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search by username..."
						value={searchQuery}
						onChange={handleSearchChange}
						className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
						aria-label="Search accounts"
					/>
				</div>
			</div>

			{/* Account grid - responsive 1/2/3/4 columns */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{filteredAccounts.map((account) => (
					<AccountCard
						key={account.id}
						account={account}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
