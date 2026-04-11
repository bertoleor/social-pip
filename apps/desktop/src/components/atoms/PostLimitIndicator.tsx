import { cn } from "@/lib/utils";

export interface PostLimitIndicatorProps {
	current: number;
	limit: number;
	type: "daily" | "hourly";
	className?: string;
}

function getPercentage(current: number, limit: number): number {
	if (limit === 0) return 100;
	return Math.min(100, Math.round((current / limit) * 100));
}

function getColorClass(percentage: number): string {
	if (percentage >= 95) return "bg-red-500";
	if (percentage >= 80) return "bg-yellow-500";
	return "bg-green-500";
}

export function PostLimitIndicator({
	current,
	limit,
	type,
	className,
}: PostLimitIndicatorProps): React.ReactElement {
	const percentage = getPercentage(current, limit);
	const colorClass = getColorClass(percentage);
	const label = type === "daily" ? "posts today" : "posts this hour";

	return (
		<div className={cn("space-y-1", className)}>
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium">
					{current}/{limit}
					<span className="text-gray-500 ml-1">({percentage}%)</span>
				</span>
				<span className="text-gray-500">{label}</span>
			</div>
			<div
				className="h-2 bg-gray-200 rounded-full overflow-hidden"
				role="progressbar"
				aria-valuenow={percentage}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`${type} posts: ${current} of ${limit}`}
			>
				<div
					className={cn("h-full transition-all duration-300", colorClass)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
