import type { Settings } from "@social-pip/types";
import { useCallback, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useSettingsStore } from "@/stores/settingsStore";

export interface UseSettingsReturn {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  updateAIConfig: (config: Settings["aiConfig"]) => Promise<boolean>;
  toggleAntiBan: (enabled: boolean) => Promise<boolean>;
  toggleNotifications: (enabled: boolean) => Promise<boolean>;
  setTheme: (theme: "light" | "dark" | "system") => Promise<boolean>;
}

export function useSettings(): UseSettingsReturn {
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings: storeUpdateSettings,
    updateAIConfig: storeUpdateAIConfig,
    toggleAntiBan: storeToggleAntiBan,
    toggleNotifications: storeToggleNotifications,
    setTheme: storeSetTheme,
  } = useSettingsStore();

  useEffect(() => {
    if (settings === null) {
      fetchSettings().catch((err) => {
        console.error("Failed to fetch settings:", err);
      });
    }
  }, [settings, fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>): Promise<boolean> => {
      try {
        await storeUpdateSettings(updates);
        toast.success("Settings updated");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update settings";
        toast.error(message);
        return false;
      }
    },
    [storeUpdateSettings],
  );

  const updateAIConfig = useCallback(
    async (config: Settings["aiConfig"]): Promise<boolean> => {
      try {
        await storeUpdateAIConfig(config);
        toast.success("AI configuration updated");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update AI config";
        toast.error(message);
        return false;
      }
    },
    [storeUpdateAIConfig],
  );

  const toggleAntiBan = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      try {
        await storeToggleAntiBan(enabled);
        toast.success(enabled ? "Anti-ban enabled" : "Anti-ban disabled");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to toggle anti-ban";
        toast.error(message);
        return false;
      }
    },
    [storeToggleAntiBan],
  );

  const toggleNotifications = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      try {
        await storeToggleNotifications(enabled);
        toast.success(enabled ? "Notifications enabled" : "Notifications disabled");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to toggle notifications";
        toast.error(message);
        return false;
      }
    },
    [storeToggleNotifications],
  );

  const setTheme = useCallback(
    async (theme: "light" | "dark" | "system"): Promise<boolean> => {
      try {
        await storeSetTheme(theme);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to set theme";
        toast.error(message);
        return false;
      }
    },
    [storeSetTheme],
  );

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateAIConfig,
    toggleAntiBan,
    toggleNotifications,
    setTheme,
  };
}
