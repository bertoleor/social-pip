import { useAlertsStore } from "@/stores/alertsStore";
import { Button } from "../atoms/Button";

export interface AlertListProps {
  limit?: number;
  severityFilter?: string;
  showAcknowledge?: boolean;
  onAlertAcknowledge?: (alertId: string) => void;
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const SEVERITY_CLASSES: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

function getSeverityClasses(severity: string): string {
  return SEVERITY_CLASSES[severity] ?? "bg-blue-100 text-blue-800";
}

export function AlertList({
  limit = 50,
  severityFilter,
  showAcknowledge = true,
  onAlertAcknowledge,
}: AlertListProps): React.ReactElement {
  const {
    alerts: storeAlerts,
    loading,
    acknowledgeAlert,
    resolveAlert,
    loadAlerts,
  } = useAlertsStore();

  const alerts = storeAlerts ?? [];

  React.useEffect(() => {
    loadAlerts(limit, severityFilter ?? null);
  }, [limit, severityFilter, loadAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    onAlertAcknowledge?.(alertId);
  };

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId);
  };

  if (loading) {
    return (
      <div data-testid="alert-list-loading" className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No alerts to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="alert-list">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="border rounded-lg p-4 bg-white shadow-sm"
          data-testid={`alert-item-${alert.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  data-testid={`severity-badge-${alert.severity}`}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityClasses(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                {alert.platform && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {alert.platform}
                  </span>
                )}
              </div>
              <p className="text-gray-900 text-sm">{alert.message}</p>
              <p data-testid="alert-timestamp" className="text-xs text-gray-400 mt-1">
                {formatRelativeTime(alert.timestamp)}
              </p>
            </div>

            <div className="flex gap-2 ml-4">
              {showAcknowledge && !alert.acknowledged && (
                <Button variant="secondary" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                  Acknowledge
                </Button>
              )}
              {!alert.resolved && (
                <Button variant="primary" size="sm" onClick={() => handleResolve(alert.id)}>
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import React from "react";
