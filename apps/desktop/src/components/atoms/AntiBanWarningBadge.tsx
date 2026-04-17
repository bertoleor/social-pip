import type { AntiBanStats } from "@social-pip/types";
/**
 * @fileoverview AntiBanWarningBadge - Risk level indicator atom
 */
import { AlertCircle, AlertTriangle, Check } from "lucide-react";
import { Badge } from "./Badge";

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
    <Badge
      variant={config.variant}
      size="md"
      className="inline-flex items-center gap-1.5"
      title={tooltip}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
