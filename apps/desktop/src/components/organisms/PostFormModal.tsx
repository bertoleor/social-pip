import { Button } from "@/components/atoms/Button";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { cn } from "@/lib/utils";
import type {
  CreatePostInput,
  Platform,
  Post,
  PostStatus,
  UpdatePostInput,
} from "@social-pip/types";
import { Calendar, Hash, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export interface PostFormModalProps {
  post?: Post;
  accountId?: string;
  onSubmit: (data: CreatePostInput | UpdatePostInput) => Promise<void>;
  onClose: () => void;
  className?: string;
}

const PLATFORMS: Platform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "threads",
  "telegram",
  "whatsapp",
];

const STATUS_OPTIONS: Array<{ value: PostStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

export function PostFormModal({
  post,
  accountId,
  onSubmit,
  onClose,
  className,
}: PostFormModalProps): React.ReactElement {
  const [content, setContent] = useState(post?.content ?? "");
  const [platform, setPlatform] = useState<Platform>(post?.platform ?? "facebook");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [scheduledAt, setScheduledAt] = useState<string>(
    post?.scheduledAt !== undefined ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
  );
  const [hashtags, setHashtags] = useState<string>(post?.hashtags.join(", ") ?? "");
  const [loading, setLoading] = useState(false);

  const isEditMode = post !== undefined;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hashtagArray = hashtags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter((tag) => tag.length > 0);

      if (isEditMode) {
        await onSubmit({
          content,
          hashtags: hashtagArray,
          status,
          scheduledAt:
            status === "scheduled" && scheduledAt.length > 0 ? new Date(scheduledAt) : undefined,
        });
      } else {
        await onSubmit({
          accountId: accountId ?? "",
          platform,
          content,
          hashtags: hashtagArray,
          status,
          scheduledAt:
            status === "scheduled" && scheduledAt.length > 0 ? new Date(scheduledAt) : undefined,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-form-title"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="post-form-title" className="text-lg font-semibold">
            {isEditMode ? "Edit Post" : "Create Post"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                      platform === p
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <PlatformIcon platform={p} size="sm" />
                    <span className="capitalize text-sm">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Write your post content..."
              required
            />
          </div>

          <div>
            <label htmlFor="hashtags" className="block text-sm font-medium mb-1">
              <Hash className="h-4 w-4 inline mr-1" />
              Hashtags (comma-separated)
            </label>
            <input
              id="hashtags"
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="marketing, social, growth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-colors",
                    status === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {status === "scheduled" && (
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Scheduled Date & Time
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
