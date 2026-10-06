/**
 * U7.1: MetricCard molecule
 * Card with icon, value, title, and change indicator
 */

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/molecules/Card";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  className,
}: MetricCardProps): React.ReactElement {
  return (
    <Card padding="md" shadow="sm" className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium mt-1",
                change.direction === "up" ? "text-success" : "text-error",
              )}
            >
              {change.direction === "up" ? "↑" : "↓"} {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center dark:bg-primary-500/10">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
    </Card>
  );
}
