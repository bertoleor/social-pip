import { cn } from "@/lib/utils";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
  className?: string;
}

const riskStyles = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function RiskBadge({ level, size = "md", className }: RiskBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        riskStyles[level],
        sizeStyles[size],
        className,
      )}
      role="status"
      aria-label={`Risk level: ${level}`}
    >
      {level}
    </span>
  );
}
