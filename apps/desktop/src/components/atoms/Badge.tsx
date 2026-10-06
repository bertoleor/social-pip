/**
 * U3.3: Badge with semantic color variants
 * default, success, warning, error, info — mapped to semantic tokens
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-muted/20 text-foreground dark:bg-muted/30",
  success: "bg-success/10 text-success dark:bg-success/20",
  warning: "bg-warning/10 text-warning dark:bg-warning/20",
  error: "bg-error/10 text-error dark:bg-error/20",
  info: "bg-info/10 text-info dark:bg-info/20",
  neutral: "bg-muted/40 text-muted-foreground dark:bg-muted/50",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
