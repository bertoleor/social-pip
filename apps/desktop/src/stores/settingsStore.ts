import type { Settings } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  updateAIConfig: (config: Settings["aiConfig"]) => Promise<void>;
  toggleAntiBan: (enabled: boolean) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  setTheme: (theme: "light" | "dark" | "system") => Promise<void>;
}

function apiSettingsToSettings(apiSettings: Record<string, unknown>): Settings {
  return {
    id: apiSettings["id"] as string,
    aiConfig: apiSettings["ai_config"] as Settings["aiConfig"],
    antiBanEnabled: (apiSettings["anti_ban_enabled"] as boolean) ?? true,
    antiBanStrictMode: (apiSettings["anti_ban_strict_mode"] as boolean) ?? false,
    notificationsEnabled: (apiSettings["notifications_enabled"] as boolean) ?? true,
    soundEnabled: (apiSettings["sound_enabled"] as boolean) ?? true,
    autoStart: (apiSettings["auto_start"] as boolean) ?? false,
    theme: (apiSettings["theme"] as Settings["theme"]) ?? "system",
    language: (apiSettings["language"] as string) ?? "en",
    createdAt: new Date(apiSettings["created_at"] as string),
    updatedAt: new Date(apiSettings["updated_at"] as string),
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });

    try {
      const apiSettings = await invoke<Record<string, unknown>>("get_settings");
      const settings = apiSettingsToSettings(apiSettings);
      set({ settings, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, loading: false });
    }
  },

  updateSettings: async (updates: Partial<Settings>) => {
    const currentSettings = get().settings;
    if (currentSettings === null) return;

    const params: Record<string, string | boolean | number | Record<string, unknown>> = {};

    if (updates.antiBanEnabled !== undefined) {
      params["anti_ban_enabled"] = updates.antiBanEnabled;
    }
    if (updates.antiBanStrictMode !== undefined) {
      params["anti_ban_strict_mode"] = updates.antiBanStrictMode;
    }
    if (updates.notificationsEnabled !== undefined) {
      params["notifications_enabled"] = updates.notificationsEnabled;
    }
    if (updates.soundEnabled !== undefined) {
      params["sound_enabled"] = updates.soundEnabled;
    }
    if (updates.autoStart !== undefined) {
      params["auto_start"] = updates.autoStart;
    }
    if (updates.theme !== undefined) {
      params["theme"] = updates.theme;
    }
    if (updates.language !== undefined) {
      params["language"] = updates.language;
    }

    try {
      const apiSettings = await invoke<Record<string, unknown>>("update_settings", params);
      const settings = apiSettingsToSettings(apiSettings);
      set({ settings, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  updateAIConfig: async (config: Settings["aiConfig"]) => {
    try {
      const apiSettings = await invoke<Record<string, unknown>>("update_ai_config", {
        config:
          config !== undefined
            ? {
                provider: config.provider,
                api_key: config.apiKey,
                model: config.model,
                max_tokens: config.maxTokens,
                temperature: config.temperature,
              }
            : null,
      });
      const settings = apiSettingsToSettings(apiSettings);
      set({ settings, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  toggleAntiBan: async (enabled: boolean) => {
    await get().updateSettings({ antiBanEnabled: enabled });
  },

  toggleNotifications: async (enabled: boolean) => {
    await get().updateSettings({ notificationsEnabled: enabled });
  },

  setTheme: async (theme: "light" | "dark" | "system") => {
    await get().updateSettings({ theme });
  },
}));
