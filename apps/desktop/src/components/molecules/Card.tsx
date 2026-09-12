/**
 * U3.4: Card with hover elevation and dark mode support
 */
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  children: ReactNode;
  className?: string;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const shadowStyles = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export function Card({
  padding = "md",
  shadow = "sm",
  hoverable = false,
  children,
  className,
  ...props
}: CardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "bg-surface rounded-lg border border-border",
        "dark:bg-surface-elevated dark:border-border",
        paddingStyles[padding],
        shadowStyles[shadow],
        hoverable && "hover:shadow-lg transition-shadow cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
