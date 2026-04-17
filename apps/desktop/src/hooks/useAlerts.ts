import { useCallback, useEffect } from "react";
import { useAlertsStore } from "../stores/alertsStore";

export interface UseAlertsOptions {
  refreshInterval?: number;
}

export interface UseAlertsReturn {
  alerts: ReturnType<typeof useAlertsStore.getState>["alerts"];
  stats: ReturnType<typeof useAlertsStore.getState>["stats"];
  loading: ReturnType<typeof useAlertsStore.getState>["loading"];
  error: ReturnType<typeof useAlertsStore.getState>["error"];
  createAlert: (
    alertType: string,
    severity: string,
    message: string,
    platform?: string,
    accountId?: string,
  ) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { refreshInterval = 30000 } = options;

  const {
    alerts,
    stats,
    loading,
    error,
    initAlerts,
    loadAlerts,
    createAlert: storeCreateAlert,
    acknowledgeAlert: storeAcknowledgeAlert,
    resolveAlert: storeResolveAlert,
    refreshStats,
  } = useAlertsStore();

  useEffect(() => {
    initAlerts();
  }, [initAlerts]);

  useEffect(() => {
    if (stats === null) return;

    const intervalId = setInterval(() => {
      loadAlerts();
      refreshStats();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [stats, refreshInterval, loadAlerts, refreshStats]);

  const createAlert = useCallback(
    async (
      alertType: string,
      severity: string,
      message: string,
      platform?: string,
      accountId?: string,
    ) => {
      try {
        await storeCreateAlert(alertType, severity, message, platform, accountId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        useAlertsStore.setState({ error: errorMessage });
      }
    },
    [storeCreateAlert],
  );

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        await storeAcknowledgeAlert(alertId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        useAlertsStore.setState({ error: errorMessage });
      }
    },
    [storeAcknowledgeAlert],
  );

  const resolveAlert = useCallback(
    async (alertId: string) => {
      try {
        await storeResolveAlert(alertId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        useAlertsStore.setState({ error: errorMessage });
      }
    },
    [storeResolveAlert],
  );

  const refresh = useCallback(async () => {
    await loadAlerts();
    await refreshStats();
  }, [loadAlerts, refreshStats]);

  return {
    alerts,
    stats,
    loading,
    error,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    refresh,
  };
}
