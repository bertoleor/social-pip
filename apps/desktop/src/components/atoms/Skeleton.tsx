/**
 * U3.5: Skeleton atom component
 * Pulsing placeholder with variants: line (default), circle, card
 */
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant — line (default), circle, or card */
  variant?: "line" | "circle" | "card";
  /** Size in pixels (used for circle variant) */
  size?: number;
  className?: string;
}

/** Maps pixel sizes to Tailwind spacing classes */
const sizeMap: Record<number, string> = {
  24: "w-6 h-6",
  28: "w-7 h-7",
  32: "w-8 h-8",
  36: "w-9 h-9",
  40: "w-10 h-10",
  44: "w-11 h-11",
  48: "w-12 h-12",
  56: "w-14 h-14",
  64: "w-16 h-16",
};

function getSizeClass(size: number): string {
  if (sizeMap[size]) return sizeMap[size];
  // Fallback: use inline style for non-standard sizes
  return "";
}

const variantStyles = {
  line: "h-4 w-full rounded",
  circle: "rounded-full",
  card: "aspect-video w-full rounded-lg",
};

export function Skeleton({
  variant = "line",
  size = 32,
  className,
  style,
  ...props
}: SkeletonProps): React.ReactElement {
  const sizeClass = variant === "circle" ? getSizeClass(size) : "";

  return (
    <div
      data-testid="skeleton"
      className={cn("animate-pulse bg-muted/40", variantStyles[variant], sizeClass, className)}
      style={
        variant === "circle" && !sizeMap[size]
          ? { ...style, width: `${size}px`, height: `${size}px` }
          : style
      }
      {...props}
    />
  );
}
