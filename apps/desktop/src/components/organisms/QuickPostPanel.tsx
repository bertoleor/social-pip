/**
 * QuickPostPanel - Main posting interface
 */

import { Button } from "@/components/atoms/Button";
import { PostLimitIndicator } from "@/components/atoms/PostLimitIndicator";
import { RiskBadge } from "@/components/atoms/RiskBadge";
import { Card } from "@/components/molecules/Card";
import {
	type GroupForSelection,
	GroupSelector,
} from "@/components/molecules/GroupSelector";
import { SpintaxPreview } from "@/components/molecules/SpintaxPreview";
import { TemplateSelector } from "@/components/molecules/TemplateSelector";
import { cn } from "@/lib/utils";
import { useAccountsStore } from "@/stores/accountsStore";
import { useQuickPostStore } from "@/stores/quickPostStore";
import { useTemplateStore } from "@/stores/templateStore";
import { useEffect } from "react";

// ============================================================================
// Types
// ============================================================================

export interface QuickPostPanelProps {
	className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function QuickPostPanel({
	className,
}: QuickPostPanelProps): React.ReactElement {
	// Store state
	const {
		selectedTemplateId,
		selectedGroupIds,
		selectedAccountId,
		canPost,
		estimatedTime,
		warningMessage,
		groups,
		groupsLoading,
		groupsError,
		accountRiskLevel,
		dailyPostCount,
		dailyPostLimit,
		cooldownUntil,
		setSelectedTemplate,
		setSelectedGroups,
		setSelectedAccount,
		fetchGroups,
		checkAccountSafety,
		startPosting,
		updateCanPost,
		calculateEstimatedTime,
	} = useQuickPostStore();

	const {
		templates,
		preview,
		previewVariations,
		selectTemplate,
		cycleVariation,
	} = useTemplateStore();
	const { accounts } = useAccountsStore();

	// Fetch groups on mount
	useEffect(() => {
		void fetchGroups();
	}, [fetchGroups]);

	// Update canPost when selection changes
	useEffect(() => {
		updateCanPost();
	}, [
		selectedTemplateId,
		selectedGroupIds,
		selectedAccountId,
		cooldownUntil,
		accountRiskLevel,
		updateCanPost,
	]);

	// Calculate estimated time when groups change
	useEffect(() => {
		calculateEstimatedTime();
	}, [selectedGroupIds, calculateEstimatedTime]);

	// Check account safety when account changes
	useEffect(() => {
		if (selectedAccountId) {
			void checkAccountSafety(selectedAccountId);
		}
	}, [selectedAccountId, checkAccountSafety]);

	// Format estimated time
	const formatEstimatedTime = (seconds: number): string => {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0
			? `${minutes} min ${remainingSeconds}s`
			: `${minutes} min`;
	};

	// Check if cooldown is active
	const isCooldownActive =
		cooldownUntil && new Date(cooldownUntil) > new Date();

	// Handle template selection
	const handleTemplateSelect = (template: { id: string }) => {
		setSelectedTemplate(template.id);
		selectTemplate(template.id);
	};

	// Handle Post button click
	const handlePostClick = () => {
		if (canPost) {
			void startPosting();
		}
	};

	// Convert groups to GroupForSelection format
	const groupsForSelection: GroupForSelection[] = groups.map((g) => ({
		id: g.id,
		name: g.name,
		memberCount: g.memberCount ?? null,
		privacy: g.privacy ?? "public",
		lastPostedAt: g.lastPostedAt,
	}));

	return (
		<div className={cn("space-y-6", className)}>
			{/* Warning Banner */}
			{warningMessage && (
				<div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<span className="text-yellow-600">⚠️</span>
					<span className="text-sm text-yellow-800">{warningMessage}</span>
				</div>
			)}

			{/* Cooldown Banner */}
			{isCooldownActive && (
				<div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
					<span className="text-orange-600">⏱️</span>
					<span className="text-sm text-orange-800">
						Account in cooldown until{" "}
						{new Date(cooldownUntil!).toLocaleTimeString()}
					</span>
				</div>
			)}

			{/* Template Selection */}
			<Card className="p-4 space-y-3">
				<h3 className="font-medium text-gray-900">Select Template</h3>
				<TemplateSelector
					templates={templates}
					onSelect={handleTemplateSelect}
					className="w-full"
				/>
			</Card>

			{/* Group Selection */}
			<Card className="p-4 space-y-3">
				<h3 className="font-medium text-gray-900">Select Groups</h3>
				{groupsError && <p className="text-sm text-red-600">{groupsError}</p>}
				<GroupSelector
					groups={groupsForSelection}
					selectedIds={selectedGroupIds}
					onChange={setSelectedGroups}
					disabled={groupsLoading}
				/>
				{groupsLoading && (
					<p className="text-sm text-gray-500">Loading groups...</p>
				)}
			</Card>

			{/* Account Selection */}
			<Card className="p-4 space-y-3">
				<h3 className="font-medium text-gray-900">Select Account</h3>
				<div className="space-y-2">
					{accounts.map((account) => (
						<label
							key={account.id}
							className={cn(
								"flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
								selectedAccountId === account.id
									? "border-primary bg-primary/5"
									: "border-gray-200 hover:border-gray-300",
							)}
						>
							<input
								type="radio"
								name="account"
								checked={selectedAccountId === account.id}
								onChange={() => setSelectedAccount(account.id)}
								className="w-4 h-4 text-primary focus:ring-primary/50"
							/>
							<div className="flex-1">
								<span className="font-medium text-sm">
									{account.name ?? account.platform}
								</span>
							</div>
							{accountRiskLevel && selectedAccountId === account.id && (
								<RiskBadge level={accountRiskLevel} size="sm" />
							)}
						</label>
					))}
				</div>

				{/* Post Limits */}
				{selectedAccountId && (
					<div className="pt-3 border-t border-gray-200">
						<PostLimitIndicator
							current={dailyPostCount}
							limit={dailyPostLimit}
							type="daily"
						/>
					</div>
				)}
			</Card>

			{/* Preview */}
			<Card className="p-4 space-y-3">
				<h3 className="font-medium text-gray-900">Preview</h3>
				<SpintaxPreview
					content={preview?.content ?? ""}
					variationsCount={previewVariations ?? 1}
					onCycleVariation={cycleVariation}
				/>
			</Card>

			{/* Estimated Time */}
			{estimatedTime > 0 && selectedGroupIds.length > 0 && (
				<div className="flex items-center justify-between text-sm text-gray-600">
					<span>Estimated time:</span>
					<span className="font-medium">
						{formatEstimatedTime(estimatedTime)}
					</span>
				</div>
			)}

			{/* Post Button */}
			<Button
				variant="primary"
				size="lg"
				disabled={!canPost}
				onClick={handlePostClick}
				className="w-full"
			>
				{canPost
					? "Post to Selected Groups"
					: "Complete All Selections to Post"}
			</Button>

			{/* Selection Summary */}
			{canPost && (
				<p className="text-xs text-gray-500 text-center">
					Ready to post to {selectedGroupIds.length} group
					{selectedGroupIds.length !== 1 ? "s" : ""}
				</p>
			)}
		</div>
	);
}
