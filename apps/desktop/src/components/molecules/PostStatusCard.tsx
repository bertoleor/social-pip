import { cn } from "@/lib/utils";
/**
 * @fileoverview PostStatusCard - Card showing single job status
 */
import { Check, Clock, ExternalLink, Loader2, Minus, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../atoms/Button";

export type PostJobStatus =
	| "pending"
	| "posting"
	| "success"
	| "failed"
	| "skipped";

export interface PostStatusCardProps {
	job: {
		id: string;
		groupName: string;
		status: PostJobStatus;
		duration?: number; // ms
		postUrl?: string;
		error?: {
			category: string;
			message: string;
			retryable: boolean;
		};
		retryCount?: number;
	};
	onRetry?: (jobId: string) => void;
	className?: string;
}

const statusConfig: Record<
	PostJobStatus,
	{ icon: ReactNode; colorClass: string }
> = {
	pending: {
		icon: <Clock className="w-5 h-5" data-testid="status-icon-pending" />,
		colorClass: "text-gray-400",
	},
	posting: {
		icon: (
			<Loader2
				className="w-5 h-5 animate-spin"
				data-testid="status-icon-posting"
			/>
		),
		colorClass: "text-blue-500",
	},
	success: {
		icon: <Check className="w-5 h-5" data-testid="status-icon-success" />,
		colorClass: "text-green-500",
	},
	failed: {
		icon: <X className="w-5 h-5" data-testid="status-icon-failed" />,
		colorClass: "text-red-500",
	},
	skipped: {
		icon: <Minus className="w-5 h-5" data-testid="status-icon-skipped" />,
		colorClass: "text-gray-400",
	},
};

export function PostStatusCard({
	job,
	onRetry,
	className,
}: PostStatusCardProps): React.ReactElement {
	const config = statusConfig[job.status];
	const isComplete =
		job.status === "success" ||
		job.status === "failed" ||
		job.status === "skipped";
	const showRetry = job.status === "failed" && job.error?.retryable && onRetry;
	const showRetryCount = job.retryCount !== undefined && job.retryCount > 0;

	return (
		<div
			data-testid="post-status-card"
			className={cn(
				"bg-white rounded-lg border border-gray-200 p-4 shadow-sm",
				className,
			)}
		>
			<div className="flex items-start gap-3">
				{/* Status Icon */}
				<div className={cn("flex-shrink-0", config.colorClass)}>
					{config.icon}
				</div>

				{/* Content */}
				<div className="flex-grow min-w-0">
					{/* Group Name */}
					<h3 className="text-sm font-medium text-gray-900 truncate">
						{job.groupName}
					</h3>

					{/* Duration */}
					{isComplete && job.duration !== undefined && (
						<p className="text-xs text-gray-500 mt-1">
							{(job.duration / 1000).toFixed(1)}s
						</p>
					)}

					{/* Post URL */}
					{job.status === "success" && job.postUrl && (
						<a
							href={job.postUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
						>
							View post
							<ExternalLink className="w-3 h-3" />
						</a>
					)}

					{/* Error Message */}
					{job.status === "failed" && job.error && (
						<p className="text-xs text-red-600 mt-1">{job.error.message}</p>
					)}

					{/* Retry Count */}
					{showRetryCount && (
						<p className="text-xs text-gray-500 mt-1">Retry {job.retryCount}</p>
					)}
				</div>

				{/* Retry Button */}
				{showRetry && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onRetry?.(job.id)}
						className="flex-shrink-0"
					>
						Retry
					</Button>
				)}
			</div>
		</div>
	);
}
