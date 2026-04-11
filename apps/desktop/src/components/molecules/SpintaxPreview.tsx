import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

export interface SpintaxPreviewProps {
	content: string;
	variationsCount: number;
	onCycleVariation?: () => void;
	className?: string;
}

export function SpintaxPreview({
	content,
	variationsCount,
	onCycleVariation,
	className,
}: SpintaxPreviewProps): React.ReactElement {
	if (!content) {
		return (
			<div
				className={cn(
					"p-4 text-center text-gray-500 bg-gray-50 rounded-lg",
					className,
				)}
			>
				No content to preview
			</div>
		);
	}

	const variationLabel = variationsCount === 1 ? "variation" : "variations";

	return (
		<div className={cn("space-y-3", className)}>
			{/* Header with variation count and cycle button */}
			<div className="flex items-center justify-between">
				<Badge variant="info" size="sm">
					{variationsCount} {variationLabel}
				</Badge>
				{variationsCount > 1 && onCycleVariation && (
					<Button variant="ghost" size="sm" onClick={onCycleVariation}>
						New Variation
					</Button>
				)}
			</div>

			{/* Preview content */}
			<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
				<p
					className={cn(
						"text-sm text-gray-700",
						content.length > 200 && "line-clamp-3",
					)}
				>
					{content}
				</p>
			</div>
		</div>
	);
}
