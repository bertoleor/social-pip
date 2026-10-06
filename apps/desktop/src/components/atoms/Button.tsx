/**
 * U3.1: Button with semantic tokens and dark mode support
 * Variants: primary (bg-primary-600), secondary (bg-surface), outline, ghost, danger (bg-error)
 */

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-muted/50 dark:bg-surface-elevated dark:hover:bg-muted/30",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/50 dark:border-border dark:hover:bg-muted/30",
  ghost: "bg-transparent text-foreground hover:bg-muted/50 dark:hover:bg-muted/30",
  danger: "bg-error text-white hover:bg-error/90 dark:bg-error dark:hover:bg-error/80",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  className,
  onClick,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={isDisabled ? undefined : onClick}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" data-testid="button-spinner" />}
      {children}
    </button>
  );
}
