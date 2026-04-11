import { useAlerts } from "@/hooks/useAlerts";
import { AlertList } from "./AlertList";
import { Button } from "../atoms/Button";

export interface MonitoringDashboardProps {
  refreshInterval?: number;
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}): React.ReactElement {
  return (
    <div className={`p-4 rounded-lg ${color}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function MonitoringDashboard({
  refreshInterval = 30000,
}: MonitoringDashboardProps): React.ReactElement {
  const { stats, refresh } = useAlerts({ refreshInterval });

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">System Monitoring</h2>
        <Button variant="secondary" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Alerts"
            value={stats.total_alerts}
            color="bg-gray-50"
          />
          <StatCard
            title="Unresolved"
            value={stats.unresolved}
            color="bg-yellow-50"
          />
          <StatCard
            title="Critical"
            value={stats.critical}
            color="bg-red-50"
          />
          <StatCard
            title="Warnings"
            value={stats.warnings}
            color="bg-orange-50"
          />
          <StatCard
            title="Last 24h"
            value={stats.last_24h}
            color="bg-blue-50"
          />
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Alerts</h3>
        <AlertList limit={10} />
      </div>
    </div>
  );
}

import React from "react";
