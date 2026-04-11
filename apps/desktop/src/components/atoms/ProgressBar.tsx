import { cn } from "@/lib/utils";

export interface ProgressBarProps {
	value: number;
	max?: number;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "success" | "warning" | "error";
	showLabel?: boolean;
	className?: string;
}

const sizeStyles = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

const variantStyles = {
	default: "bg-primary",
	success: "bg-green-500",
	warning: "bg-yellow-500",
	error: "bg-red-500",
};

export function ProgressBar({
	value,
	max = 100,
	size = "md",
	variant = "default",
	showLabel = false,
	className,
}: ProgressBarProps): React.ReactElement {
	const percentage = Math.min(
		100,
		Math.max(0, Math.round((value / max) * 100)),
	);

	return (
		<div className={cn("w-full", className)}>
			{showLabel && (
				<div className="flex justify-between text-xs text-gray-500 mb-1">
					<span>{percentage}%</span>
				</div>
			)}
			<div
				className={cn(
					"w-full bg-gray-200 rounded-full overflow-hidden",
					sizeStyles[size],
				)}
				role="progressbar"
				aria-valuenow={percentage}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className={cn(
						"h-full transition-all duration-300 ease-out",
						variantStyles[variant],
					)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
