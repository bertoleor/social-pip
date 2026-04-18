import { cn } from "@/lib/utils";
import type { AntiBanStats } from "@social-pip/types";
/**
 * @fileoverview AntiBanWarningBadge - Risk level indicator atom
 */
import { AlertCircle, AlertTriangle, Check } from "lucide-react";

export type RiskLevel = "low" | "medium" | "high";

export interface AntiBanWarningBadgeProps {
  riskLevel: RiskLevel;
  stats?: AntiBanStats;
}

const riskConfig = {
  low: {
    label: "Safe",
    variant: "success" as const,
    icon: Check,
    ariaLabel: "Low risk: Safe to post",
  },
  medium: {
    label: "Caution",
    variant: "warning" as const,
    icon: AlertTriangle,
    ariaLabel: "Medium risk: Proceed with caution",
  },
  high: {
    label: "Stop",
    variant: "error" as const,
    icon: AlertCircle,
    ariaLabel: "High risk: Stop posting recommended",
  },
};

function buildTooltip(stats: AntiBanStats | undefined, riskLevel: RiskLevel): string | undefined {
  if (!stats) return undefined;

  const hourlyPct = Math.round((stats.hourly_count / stats.config.hourly_action_limit) * 100);
  const dailyPct = Math.round((stats.daily_count / stats.config.daily_action_limit) * 100);

  const lines = [
    `Hourly: ${stats.hourly_count}/${stats.config.hourly_action_limit} (${hourlyPct}%)`,
    `Daily: ${stats.daily_count}/${stats.config.daily_action_limit} (${dailyPct}%)`,
  ];

  if (riskLevel === "high") {
    lines.push("Take a break recommended");
  }

  return lines.join("\n");
}

export function AntiBanWarningBadge({
  riskLevel,
  stats,
}: AntiBanWarningBadgeProps): React.ReactElement {
  const config = riskConfig[riskLevel];
  const Icon = config.icon;
  const tooltip = buildTooltip(stats, riskLevel);

  return (
    <output
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full px-2.5 py-1 text-sm",
        riskLevel === "low" && "bg-green-100 text-green-700",
        riskLevel === "medium" && "bg-yellow-100 text-yellow-700",
        riskLevel === "high" && "bg-red-100 text-red-700",
      )}
      title={tooltip}
      aria-label={config.ariaLabel}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </output>
  );
}
