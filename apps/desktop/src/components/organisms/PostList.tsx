import { Button } from "@/components/atoms/Button";
import { PostCard } from "@/components/molecules/PostCard";
import { cn } from "@/lib/utils";
import type { Post } from "@social-pip/types";
import { Plus, Search } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

export interface PostListProps {
  posts: Post[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  onSelect?: (id: string) => void;
  className?: string;
}

const PLATFORM_OPTIONS: Array<{ value: string; label: string }> = [
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

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "failed", label: "Failed" },
];

export function PostList({
  posts,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  onSelect,
  className,
}: PostListProps): React.ReactElement {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (platformFilter !== "all" && post.platform !== platformFilter) {
        return false;
      }

      if (statusFilter !== "all" && post.status !== statusFilter) {
        return false;
      }

      if (searchQuery.length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesHashtags = post.hashtags.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesContent && !matchesHashtags) {
          return false;
        }
      }

      return true;
    });
  }, [posts, platformFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4 mb-4">
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded flex-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {["a", "b", "c", "d", "e", "f"].map((id) => (
            <div
              key={id}
              className="h-40 bg-gray-100 animate-pulse rounded-lg border border-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 mb-4">No posts yet</p>
          {onAdd !== undefined && (
            <Button onClick={onAdd} variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select
          value={platformFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPlatformFilter(e.target.value)}
          className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
          aria-label="Filter by platform"
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Search posts"
          />
        </div>

        {onAdd !== undefined && (
          <Button onClick={onAdd} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-gray-500">No posts match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={onEdit}
              onDelete={onDelete}
              onClick={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
