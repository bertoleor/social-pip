import type { Platform } from "@social-pip/types";
/**
 * @fileoverview AntiBanDashboard - Dashboard organism for anti-ban monitoring
 */
import { useState } from "react";
import { useAntiBan } from "../../hooks/useAntiBan";
import { Button } from "../atoms/Button";
import { AntiBanStatsCard } from "../molecules/AntiBanStatsCard";
import { Card } from "../molecules/Card";

export interface AntiBanDashboardProps {
  defaultPlatform?: Platform;
  refreshInterval?: number;
}

const PLATFORMS: Platform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "threads",
  "telegram",
  "whatsapp",
];

function formatPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    threads: "Threads",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
  };
  return labels[platform];
}

export function AntiBanDashboard({
  defaultPlatform = "facebook",
  refreshInterval,
}: AntiBanDashboardProps): React.ReactElement {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(defaultPlatform);
  const { stats, loading, error, initAntiBan } = useAntiBan({
    platform: selectedPlatform,
    refreshInterval,
  });

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlatform(e.target.value as Platform);
  };

  const handleRetry = () => {
    initAntiBan(selectedPlatform);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Anti-Ban Status</h2>
        <select
          aria-label="Select platform"
          value={selectedPlatform}
          onChange={handlePlatformChange}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {formatPlatformLabel(platform)}
            </option>
          ))}
        </select>
      </div>

      {loading && !stats && (
        <Card>
          <div data-testid="antiban-loading" className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Loading anti-ban stats...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="primary" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {stats && !loading && <AntiBanStatsCard stats={stats} platform={selectedPlatform} />}
    </div>
  );
}
