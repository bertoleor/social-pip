import type { Settings } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import { useSettingsStore } from "./settingsStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockApiSettings = {
  id: "settings-1",
  ai_config: {
    provider: "openai",
    api_key: "test-key",
    model: "gpt-4",
    max_tokens: 1000,
    temperature: 0.7,
  },
  anti_ban_enabled: true,
  anti_ban_strict_mode: false,
  notifications_enabled: true,
  sound_enabled: true,
  auto_start: false,
  theme: "dark",
  language: "en",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockSettings: Settings = {
  id: "settings-1",
  aiConfig: {
    provider: "openai",
    apiKey: "test-key",
    model: "gpt-4",
    maxTokens: 1000,
    temperature: 0.7,
  },
  antiBanEnabled: true,
  antiBanStrictMode: false,
  notificationsEnabled: true,
  soundEnabled: true,
  autoStart: false,
  theme: "dark",
  language: "en",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

describe("useSettingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has settings set to null by default", () => {
      const state = useSettingsStore.getState();
      expect(state.settings).toBeNull();
    });

    it("has loading set to false by default", () => {
      const state = useSettingsStore.getState();
      expect(state.loading).toBe(false);
    });

    it("has error set to null by default", () => {
      const state = useSettingsStore.getState();
      expect(state.error).toBeNull();
    });

    it("has all required action methods", () => {
      const state = useSettingsStore.getState();
      expect(typeof state.fetchSettings).toBe("function");
      expect(typeof state.updateSettings).toBe("function");
      expect(typeof state.updateAIConfig).toBe("function");
      expect(typeof state.toggleAntiBan).toBe("function");
      expect(typeof state.toggleNotifications).toBe("function");
      expect(typeof state.setTheme).toBe("function");
    });
  });

  describe("apiSettingsToSettings - transformation", () => {
    it("should transform snake_case to camelCase", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings).not.toBeNull();
      expect(state.settings?.id).toBe("settings-1");
      expect(state.settings?.antiBanEnabled).toBe(true);
      expect(state.settings?.notificationsEnabled).toBe(true);
      expect(state.settings?.soundEnabled).toBe(true);
      expect(state.settings?.autoStart).toBe(false);
    });

    it("should parse date strings to Date objects", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings?.createdAt).toBeInstanceOf(Date);
      expect(state.settings?.updatedAt).toBeInstanceOf(Date);
    });

    it("should transform nested ai_config to aiConfig", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings?.aiConfig).toBeDefined();
      expect(state.settings?.aiConfig?.provider).toBe("openai");
      expect(state.settings?.aiConfig?.model).toBe("gpt-4");
    });

    it("should use default values for missing fields", async () => {
      mockInvoke.mockResolvedValueOnce({
        id: "settings-1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      });

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings?.antiBanEnabled).toBe(true);
      expect(state.settings?.notificationsEnabled).toBe(true);
      expect(state.settings?.theme).toBe("system");
      expect(state.settings?.language).toBe("en");
    });
  });

  describe("fetchSettings - success path", () => {
    it("should set settings on success", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings).not.toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should invoke get_settings command", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_settings");
    });

    it("should set loading to true during fetch", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockApiSettings), 100)),
      );

      const promise = act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      expect(useSettingsStore.getState().loading).toBe(true);

      await promise;
    });
  });

  describe("fetchSettings - error handling", () => {
    it("should set error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Failed to fetch"));

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.error).toBe("Failed to fetch");
      expect(state.loading).toBe(false);
    });

    it("should handle non-Error throws", async () => {
      mockInvoke.mockRejectedValueOnce("Network error");

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.error).toBe("Network error");
    });

    it("should clear error on successful fetch after failure", async () => {
      useSettingsStore.setState({ error: "Previous error" });
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      expect(useSettingsStore.getState().error).toBeNull();
    });
  });

  describe("updateSettings - partial updates", () => {
    it("should return early if settings is null", async () => {
      useSettingsStore.setState({ settings: null });

      await act(async () => {
        await useSettingsStore.getState().updateSettings({
          antiBanEnabled: true,
        });
      });

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("should send partial updates to backend", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        anti_ban_enabled: false,
      });

      await act(async () => {
        await useSettingsStore.getState().updateSettings({
          antiBanEnabled: false,
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        anti_ban_enabled: false,
      });
    });

    it("should handle multiple fields in single update", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        anti_ban_enabled: false,
        notifications_enabled: false,
      });

      await act(async () => {
        await useSettingsStore.getState().updateSettings({
          antiBanEnabled: false,
          notificationsEnabled: false,
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        anti_ban_enabled: false,
        notifications_enabled: false,
      });
    });

    it("should update settings state after successful update", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        anti_ban_enabled: false,
      });

      await act(async () => {
        await useSettingsStore.getState().updateSettings({
          antiBanEnabled: false,
        });
      });

      const state = useSettingsStore.getState();
      expect(state.settings?.antiBanEnabled).toBe(false);
    });

    it("should re-throw error on failure", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockRejectedValueOnce(new Error("Update failed"));

      await expect(
        useSettingsStore.getState().updateSettings({ antiBanEnabled: false }),
      ).rejects.toThrow("Update failed");
    });

    it("should set error state on failure", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockRejectedValueOnce(new Error("Update failed"));

      await act(async () => {
        try {
          await useSettingsStore.getState().updateSettings({
            antiBanEnabled: false,
          });
        } catch {
          // Expected
        }
      });

      expect(useSettingsStore.getState().error).toBe("Update failed");
    });
  });

  describe("updateAIConfig - nested config", () => {
    it("should send config with snake_case keys", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      const newConfig = {
        provider: "anthropic",
        apiKey: "new-key",
        model: "claude-3",
        maxTokens: 2000,
        temperature: 0.5,
      };

      await act(async () => {
        await useSettingsStore.getState().updateAIConfig(newConfig);
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_ai_config", {
        config: {
          provider: "anthropic",
          api_key: "new-key",
          model: "claude-3",
          max_tokens: 2000,
          temperature: 0.5,
        },
      });
    });

    it("should update settings state after successful config update", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        ai_config: {
          provider: "anthropic",
          api_key: "new-key",
          model: "claude-3",
          max_tokens: 2000,
          temperature: 0.5,
        },
      });

      await act(async () => {
        await useSettingsStore.getState().updateAIConfig({
          provider: "anthropic",
          apiKey: "new-key",
          model: "claude-3",
          maxTokens: 2000,
          temperature: 0.5,
        });
      });

      const state = useSettingsStore.getState();
      expect(state.settings?.aiConfig?.provider).toBe("anthropic");
    });

    it("should re-throw error on failure", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockRejectedValueOnce(new Error("Config update failed"));

      await expect(
        useSettingsStore.getState().updateAIConfig({
          provider: "test",
          apiKey: "key",
          model: "model",
          maxTokens: 100,
          temperature: 0.5,
        }),
      ).rejects.toThrow("Config update failed");
    });
  });

  describe("toggleAntiBan", () => {
    it("should call updateSettings with antiBanEnabled true", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        anti_ban_enabled: true,
      });

      await act(async () => {
        await useSettingsStore.getState().toggleAntiBan(true);
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        anti_ban_enabled: true,
      });
    });

    it("should call updateSettings with antiBanEnabled false", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        anti_ban_enabled: false,
      });

      await act(async () => {
        await useSettingsStore.getState().toggleAntiBan(false);
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        anti_ban_enabled: false,
      });
    });
  });

  describe("toggleNotifications", () => {
    it("should call updateSettings with notificationsEnabled true", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        notifications_enabled: true,
      });

      await act(async () => {
        await useSettingsStore.getState().toggleNotifications(true);
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        notifications_enabled: true,
      });
    });

    it("should call updateSettings with notificationsEnabled false", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        notifications_enabled: false,
      });

      await act(async () => {
        await useSettingsStore.getState().toggleNotifications(false);
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        notifications_enabled: false,
      });
    });
  });

  describe("setTheme", () => {
    it("should call updateSettings with light theme", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        theme: "light",
      });

      await act(async () => {
        await useSettingsStore.getState().setTheme("light");
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        theme: "light",
      });
    });

    it("should call updateSettings with dark theme", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        theme: "dark",
      });

      await act(async () => {
        await useSettingsStore.getState().setTheme("dark");
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        theme: "dark",
      });
    });

    it("should call updateSettings with system theme", async () => {
      useSettingsStore.setState({ settings: mockSettings });
      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        theme: "system",
      });

      await act(async () => {
        await useSettingsStore.getState().setTheme("system");
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
        theme: "system",
      });
    });
  });

  describe("State persistence", () => {
    it("should maintain settings state across multiple operations", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        theme: "light",
      });

      await act(async () => {
        await useSettingsStore.getState().setTheme("light");
      });

      const state = useSettingsStore.getState();
      expect(state.settings).not.toBeNull();
      expect(state.settings?.theme).toBe("light");
    });

    it("should not modify other settings when updating single field", async () => {
      mockInvoke.mockResolvedValueOnce(mockApiSettings);

      await act(async () => {
        await useSettingsStore.getState().fetchSettings();
      });

      const originalLanguage = useSettingsStore.getState().settings?.language;

      mockInvoke.mockResolvedValueOnce({
        ...mockApiSettings,
        theme: "light",
      });

      await act(async () => {
        await useSettingsStore.getState().setTheme("light");
      });

      expect(useSettingsStore.getState().settings?.language).toBe(originalLanguage);
    });
  });
});
