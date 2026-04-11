import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@social-pip/types";

export interface PostStatusBadgeProps {
	status: PostStatus;
	className?: string;
}

const STATUS_CONFIG: Record<
	PostStatus,
	{ variant: "success" | "warning" | "error" | "neutral"; label: string }
> = {
	draft: { variant: "neutral", label: "Draft" },
	scheduled: { variant: "warning", label: "Scheduled" },
	published: { variant: "success", label: "Published" },
	failed: { variant: "error", label: "Failed" },
};

export function PostStatusBadge({
	status,
	className,
}: PostStatusBadgeProps): React.ReactElement {
	const config = STATUS_CONFIG[status];

	return (
		<Badge variant={config.variant} className={cn("text-xs", className)}>
			{config.label}
		</Badge>
	);
}
