import type { Post } from "@social-pip/types";
import { Clock, FileText } from "lucide-react";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { PostStatusBadge } from "@/components/atoms/PostStatusBadge";
import { Card } from "@/components/molecules/Card";
import { MediaPreview } from "@/components/molecules/MediaPreview";
import { cn } from "@/lib/utils";
import { usePostingStore } from "@/stores/postingStore";

export interface PostPreviewProps {
  post?: Post;
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

export function PostPreview({ post, className }: PostPreviewProps): React.ReactElement {
  const { mediaFiles } = usePostingStore();

  if (post === undefined) {
    return <div className={cn("p-8 text-center text-gray-500", className)}>No post to preview</div>;
  }

  const scheduledStr = formatScheduledDate(post.scheduledAt);
  const charCount = post.content.length;
  const hasAttachedMedia = mediaFiles.length > 0;
  const hasPostMedia = post.mediaUrls.length > 0;

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={post.platform} size="md" />
            <PostStatusBadge status={post.status} />
          </div>
          {scheduledStr !== null && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{scheduledStr}</span>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-3 bg-gray-50">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {hasAttachedMedia && <MediaPreview />}

        {hasPostMedia && !hasAttachedMedia && (
          <div className="grid grid-cols-2 gap-2">
            {post.mediaUrls.slice(0, 4).map((url) => (
              <img
                key={url}
                src={url}
                alt="Post media"
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-blue-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{charCount} characters</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
