/**
 * @fileoverview AntiBanStatsCard - Stats display molecule
 */
import type { Platform } from "@social-pip/types";
import type { AntiBanStats } from "@social-pip/types";
import {
	AntiBanWarningBadge,
	type RiskLevel,
} from "../atoms/AntiBanWarningBadge";
import { Card } from "./Card";

export interface AntiBanStatsCardProps {
	stats: AntiBanStats;
	platform: Platform;
}

function calculateRiskLevel(stats: AntiBanStats): RiskLevel {
	const hourlyPct =
		(stats.hourly_count / stats.config.hourly_action_limit) * 100;
	const dailyPct = (stats.daily_count / stats.config.daily_action_limit) * 100;

	if (hourlyPct > 80 || dailyPct > 80) return "high";
	if (hourlyPct > 50 || dailyPct > 50) return "medium";
	return "low";
}

function formatPlatformName(platform: Platform): string {
	const names: Record<Platform, string> = {
		facebook: "Facebook",
		instagram: "Instagram",
		tiktok: "TikTok",
		twitter: "Twitter",
		linkedin: "LinkedIn",
		threads: "Threads",
		telegram: "Telegram",
		whatsapp: "WhatsApp",
	};
	return names[platform] ?? platform;
}

interface MetricItemProps {
	value: string;
	label: string;
}

function MetricItem({ value, label }: MetricItemProps): React.ReactElement {
	return (
		<li className="flex flex-col">
			<span className="text-2xl font-bold text-gray-900">{value}</span>
			<span className="text-sm text-gray-500">{label}</span>
		</li>
	);
}

export function AntiBanStatsCard({
	stats,
	platform,
}: AntiBanStatsCardProps): React.ReactElement {
	const riskLevel = calculateRiskLevel(stats);
	const platformName = formatPlatformName(platform);

	const hourlyValue = `${stats.hourly_count}/${stats.config.hourly_action_limit}`;
	const dailyValue = `${stats.daily_count}/${stats.config.daily_action_limit}`;
	const successRate = `${Math.round(stats.success_rate * 100)}%`;
	const batchValue = `${stats.batch_count}/${stats.config.batch_size}`;

	return (
		<Card data-testid="antiban-stats-card">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						{platformName}
					</h3>
					<AntiBanWarningBadge riskLevel={riskLevel} stats={stats} />
				</div>

				<ul className="grid grid-cols-2 gap-4">
					<MetricItem value={hourlyValue} label="actions this hour" />
					<MetricItem value={dailyValue} label="actions today" />
					<MetricItem value={successRate} label="success rate" />
					<MetricItem value={batchValue} label="batch progress" />
				</ul>
			</div>
		</Card>
	);
}
