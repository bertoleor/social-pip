import { Button } from "@/components/atoms/Button";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { PostStatusBadge } from "@/components/atoms/PostStatusBadge";
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";
import type { Post } from "@social-pip/types";
import { Clock, Edit2, Trash2 } from "lucide-react";

export interface PostCardProps {
	post: Post;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onClick?: (id: string) => void;
	className?: string;
}

function formatScheduledDate(date: Date | undefined): string | null {
	if (date === undefined) return null;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

export function PostCard({
	post,
	onEdit,
	onDelete,
	onClick,
	className,
}: PostCardProps): React.ReactElement {
	const scheduledStr = formatScheduledDate(post.scheduledAt);
	const contentPreview =
		post.content.length > 100
			? `${post.content.substring(0, 100)}...`
			: post.content;

	return (
		<Card
			className={cn(
				"cursor-pointer hover:shadow-md transition-shadow",
				className,
			)}
			onClick={() => onClick?.(post.id)}
		>
			<div className="space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						<PlatformIcon platform={post.platform} size="sm" />
						<PostStatusBadge status={post.status} />
					</div>
					<div className="flex gap-1">
						{onEdit !== undefined && (
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									onEdit(post.id);
								}}
								aria-label="Edit post"
							>
								<Edit2 className="h-4 w-4" />
							</Button>
						)}
						{onDelete !== undefined && (
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(post.id);
								}}
								aria-label="Delete post"
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						)}
					</div>
				</div>

				<p className="text-sm text-gray-700 line-clamp-2">{contentPreview}</p>

				{post.hashtags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{post.hashtags.slice(0, 3).map((tag) => (
							<span key={tag} className="text-xs text-blue-600">
								#{tag}
							</span>
						))}
						{post.hashtags.length > 3 && (
							<span className="text-xs text-gray-400">
								+{post.hashtags.length - 3} more
							</span>
						)}
					</div>
				)}

				{scheduledStr !== null && (
					<div className="flex items-center gap-1 text-xs text-gray-500">
						<Clock className="h-3 w-3" />
						<span>{scheduledStr}</span>
					</div>
				)}

				{post.errorMessage !== undefined && (
					<p className="text-xs text-red-500 truncate">{post.errorMessage}</p>
				)}
			</div>
		</Card>
	);
}
