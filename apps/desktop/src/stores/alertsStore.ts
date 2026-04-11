import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export interface Alert {
  id: string;
  alert_type: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  platform: string | null;
  account_id: string | null;
  message: string;
  details: unknown;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
}

export interface AlertStats {
  total_alerts: number;
  unresolved: number;
  critical: number;
  warnings: number;
  last_24h: number;
  last_hour: number;
}

export interface AlertsState {
  alerts: Alert[];
  stats: AlertStats | null;
  loading: boolean;
  error: string | null;
  initAlerts: () => Promise<void>;
  loadAlerts: (limit?: number, severityFilter?: string | null) => Promise<void>;
  createAlert: (
    alertType: string,
    severity: string,
    message: string,
    platform?: string,
    accountId?: string
  ) => Promise<Alert>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  reset: () => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  stats: null,
  loading: false,
  error: null,

  initAlerts: async () => {
    set({ loading: true, error: null });

    try {
      const stats = await invoke<AlertStats>("init_alert_system");
      set({ stats, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, loading: false, stats: null });
    }
  },

  loadAlerts: async (limit = 50, severityFilter = null) => {
    try {
      const alerts = await invoke<Alert[]>("get_alerts", {
        limit,
        severityFilter,
      });
      set({ alerts, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  createAlert: async (
    alertType: string,
    severity: string,
    message: string,
    platform?: string,
    accountId?: string
  ) => {
    const alert = await invoke<Alert>("create_alert", {
      alertType,
      severity,
      message,
      platform: platform ?? null,
      accountId: accountId ?? null,
    });

    const currentAlerts = get().alerts;
    set({ alerts: [alert, ...currentAlerts], error: null });

    return alert;
  },

  acknowledgeAlert: async (alertId: string) => {
    await invoke("acknowledge_alert", { alertId });

    const currentAlerts = get().alerts;
    const updatedAlerts = currentAlerts.map((alert) =>
      alert.id === alertId
        ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
        : alert
    );
    set({ alerts: updatedAlerts, error: null });
  },

  resolveAlert: async (alertId: string) => {
    await invoke("resolve_alert", { alertId });

    const currentAlerts = get().alerts;
    const updatedAlerts = currentAlerts.map((alert) =>
      alert.id === alertId
        ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
        : alert
    );
    set({ alerts: updatedAlerts, error: null });
  },

  refreshStats: async () => {
    try {
      const stats = await invoke<AlertStats>("get_alert_stats");
      set({ stats, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  reset: () => {
    set({ alerts: [], stats: null, loading: false, error: null });
  },
}));
