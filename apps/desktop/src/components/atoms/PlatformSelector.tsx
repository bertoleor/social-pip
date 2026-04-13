import { cn } from "@/lib/utils";
import {
	type PostingPlatform,
	type PlatformTarget,
	getPlatformPriority,
} from "@social-pip/types";
import { Check, Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "./Button";

export interface PlatformSelectorProps {
	selectedPlatforms: PlatformTarget[];
	onPlatformsChange: (targets: PlatformTarget[]) => void;
	accountId: string;
	disabled?: boolean;
	className?: string;
}

interface PlatformOption {
	platform: PostingPlatform;
	priority: number;
	label: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
	{ platform: "facebook_groups", priority: 0, label: "Facebook Groups" },
	{ platform: "facebook_pages", priority: 10, label: "Facebook Pages" },
	{ platform: "instagram", priority: 20, label: "Instagram" },
	{ platform: "twitter", priority: 30, label: "Twitter/X" },
	{ platform: "linkedin", priority: 40, label: "LinkedIn" },
];

const PLATFORM_COLORS: Record<PostingPlatform, string> = {
	facebook_groups: "#1877F2",
	facebook_pages: "#1877F2",
	instagram: "#E4405F",
	twitter: "#1DA1F2",
	linkedin: "#0A66C2",
};

export function PlatformSelector({
	selectedPlatforms,
	onPlatformsChange,
	accountId,
	disabled = false,
	className,
}: PlatformSelectorProps): React.ReactElement {
	const [isOpen, setIsOpen] = useState(false);

	const selectedPlatformSet = useMemo(() => {
		return new Set(selectedPlatforms.map((p) => p.platform));
	}, [selectedPlatforms]);

	const sortedPlatforms = useMemo(() => {
		return [...selectedPlatforms].sort(
			(a, b) => (a.priority ?? getPlatformPriority(a.platform)) - (b.priority ?? getPlatformPriority(b.platform)),
		);
	}, [selectedPlatforms]);

	const handleToggle = useCallback(
		(platform: PostingPlatform) => {
			if (selectedPlatformSet.has(platform)) {
				onPlatformsChange(selectedPlatforms.filter((p) => p.platform !== platform));
			} else {
				const newTarget: PlatformTarget = {
					platform,
					accountId,
					targets: [],
					priority: getPlatformPriority(platform),
				};
				const newPlatforms = [...selectedPlatforms, newTarget].sort(
					(a, b) =>
						(a.priority ?? getPlatformPriority(a.platform)) - (b.priority ?? getPlatformPriority(b.platform)),
				);
				onPlatformsChange(newPlatforms);
			}
		},
		[selectedPlatforms, selectedPlatformSet, accountId, onPlatformsChange],
	);

	const handleRemove = useCallback(
		(platform: PostingPlatform) => {
			onPlatformsChange(selectedPlatforms.filter((p) => p.platform !== platform));
		},
		[selectedPlatforms, onPlatformsChange],
	);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex flex-wrap gap-2">
				{sortedPlatforms.map((target) => (
					<SelectedPlatformChip
						key={target.platform}
						platform={target.platform}
						priority={target.priority ?? getPlatformPriority(target.platform)}
						onRemove={() => handleRemove(target.platform)}
						disabled={disabled}
					/>
				))}

				<Button
					variant="outline"
					size="sm"
					onClick={() => setIsOpen(!isOpen)}
					disabled={disabled}
					className="h-8"
				>
					<Plus className="h-4 w-4 mr-1" />
					Add Platform
				</Button>
			</div>

			{isOpen && (
				<div className="border rounded-lg p-2 bg-white shadow-sm">
					<div className="grid grid-cols-2 gap-2">
						{PLATFORM_OPTIONS.map((option) => {
							const isSelected = selectedPlatformSet.has(option.platform);
							return (
								<button
									key={option.platform}
									type="button"
									onClick={() => handleToggle(option.platform)}
									disabled={disabled}
									className={cn(
										"flex items-center gap-2 p-2 rounded-md text-left transition-colors",
										isSelected
											? "bg-blue-50 border-2 border-blue-300"
											: "bg-gray-50 border border-gray-200 hover:border-gray-300",
										disabled && "opacity-50 cursor-not-allowed",
									)}
								>
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: PLATFORM_COLORS[option.platform] }}
									/>
									<div className="flex-1">
										<div className="text-sm font-medium">{option.label}</div>
										<div className="text-xs text-gray-500">Priority: {option.priority}</div>
									</div>
									{isSelected && <Check className="h-4 w-4 text-blue-600" />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

interface SelectedPlatformChipProps {
	platform: PostingPlatform;
	priority: number;
	onRemove: () => void;
	disabled?: boolean;
}

function SelectedPlatformChip({
	platform,
	priority,
	onRemove,
	disabled,
}: SelectedPlatformChipProps): React.ReactElement {
	const label = PLATFORM_OPTIONS.find((o) => o.platform === platform)?.label ?? platform;
	const color = PLATFORM_COLORS[platform];

	return (
		<div
			className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium"
			style={{
				backgroundColor: `${color}15`,
				border: `1px solid ${color}40`,
				color: color,
			}}
		>
			<div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
			<span>{label}</span>
			<span className="text-xs opacity-70">({priority})</span>
			<button
				type="button"
				onClick={onRemove}
				disabled={disabled}
				className="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors disabled:opacity-50"
				aria-label={`Remove ${label}`}
			>
				<X className="h-3 w-3" />
			</button>
		</div>
	);
}

export { PLATFORM_OPTIONS, PLATFORM_COLORS };
