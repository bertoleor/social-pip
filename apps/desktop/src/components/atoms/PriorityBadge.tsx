import { PLATFORM_PRIORITIES, type PostingPlatform } from "@social-pip/types";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PriorityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  priority: number;
  platform?: PostingPlatform;
  size?: "sm" | "md";
}

function getPriorityVariant(priority: number): "error" | "warning" | "neutral" {
  if (priority === 0) return "error";
  if (priority <= 20) return "warning";
  return "neutral";
}

function getPriorityLabel(priority: number): string {
  if (priority === 0) return "Critical";
  if (priority <= 10) return "High";
  if (priority <= 20) return "Medium";
  return "Low";
}

const variantStyles = {
  error: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-orange-100 text-orange-700 border-orange-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-sm",
};

export function PriorityBadge({
  priority,
  platform,
  size = "sm",
  className,
  ...props
}: PriorityBadgeProps): React.ReactElement {
  const variant = getPriorityVariant(priority);
  const label = getPriorityLabel(priority);
  const displayPriority = platform ? PLATFORM_PRIORITIES[platform] : priority;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-md border",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      <span className="font-mono">{displayPriority}</span>
      <span className="sr-only">{label} priority</span>
    </span>
  );
}

export function getPriorityColor(priority: number): string {
  if (priority === 0) return "#DC2626";
  if (priority <= 20) return "#F97316";
  return "#6B7280";
}
