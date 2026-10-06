import { X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface MediaThumbnailProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  thumbnailUrl: string;
  fileName: string;
  onRemove: (id: string) => void;
  validationStatus?: "pending" | "valid" | "invalid" | "warning";
}

export function MediaThumbnail({
  id,
  thumbnailUrl,
  fileName,
  onRemove,
  validationStatus,
  className,
  ...props
}: MediaThumbnailProps): React.ReactElement {
  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden",
        "border border-gray-200 bg-gray-50",
        className,
      )}
      {...props}
    >
      <img src={thumbnailUrl} alt={fileName} className="w-full h-24 object-cover" />

      <button
        type="button"
        onClick={() => onRemove(id)}
        className={cn(
          "absolute top-1 right-1",
          "w-6 h-6 rounded-full",
          "bg-black/60 text-white",
          "flex items-center justify-center",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white",
        )}
        aria-label={`Remove ${fileName}`}
      >
        <X className="w-4 h-4" />
      </button>

      {validationStatus && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            "h-1",
            validationStatus === "valid" && "bg-green-500",
            validationStatus === "invalid" && "bg-red-500",
            validationStatus === "warning" && "bg-yellow-500",
            validationStatus === "pending" && "bg-gray-400",
          )}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
        <p className="text-xs text-white truncate">{fileName}</p>
      </div>
    </div>
  );
}
