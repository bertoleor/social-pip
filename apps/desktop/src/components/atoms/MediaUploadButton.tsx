import type { Platform } from "@social-pip/types";
import { ImagePlus } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMediaUpload } from "../../hooks/useMediaUpload";

export interface MediaUploadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  platform: Platform;
  maxFiles?: number;
}

export function MediaUploadButton({
  platform,
  maxFiles,
  className,
  disabled,
  ...props
}: MediaUploadButtonProps): React.ReactElement {
  const { openFilePicker, isUploading } = useMediaUpload({ platform, maxFiles });

  const handleClick = () => {
    if (!disabled && !isUploading) {
      openFilePicker();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || isUploading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
        "bg-primary text-white hover:bg-primary/90",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      onClick={handleClick}
      aria-label="Upload image"
      {...props}
    >
      <ImagePlus className="w-4 h-4" />
      <span>Add Image</span>
    </button>
  );
}
