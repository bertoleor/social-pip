import { toast } from "@/lib/toast"
import type { Settings } from "@social-pip/types"
import { act, renderHook } from "@testing-library/react"
import { useSettings } from "./useSettings"

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

const mockToast = vi.mocked(toast)

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
}

const mockStoreState = {
  settings: null as Settings | null,
  loading: false,
  error: null as string | null,
  fetchSettings: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn().mockResolvedValue(undefined),
  updateAIConfig: vi.fn().mockResolvedValue(undefined),
  toggleAntiBan: vi.fn().mockResolvedValue(undefined),
  toggleNotifications: vi.fn().mockResolvedValue(undefined),
  setTheme: vi.fn().mockResolvedValue(undefined),
}

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: (selector?: (state: typeof mockStoreState) => unknown) => 
    selector ? selector(mockStoreState) : mockStoreState,
}))

describe("useSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.settings = null
    mockStoreState.loading = false
    mockStoreState.error = null
    mockStoreState.fetchSettings = vi.fn().mockResolvedValue(undefined)
    mockStoreState.updateSettings = vi.fn().mockResolvedValue(undefined)
    mockStoreState.updateAIConfig = vi.fn().mockResolvedValue(undefined)
    mockStoreState.toggleAntiBan = vi.fn().mockResolvedValue(undefined)
    mockStoreState.toggleNotifications = vi.fn().mockResolvedValue(undefined)
    mockStoreState.setTheme = vi.fn().mockResolvedValue(undefined)
  })

  describe("returns settings store state", () => {
    it("should return settings from store", () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      expect(result.current.settings).toEqual(mockSettings)
    })

    it("should return null settings when not loaded", () => {
      mockStoreState.settings = null

      const { result } = renderHook(() => useSettings())

      expect(result.current.settings).toBeNull()
    })

    it("should return loading state", () => {
      mockStoreState.loading = true

      const { result } = renderHook(() => useSettings())

      expect(result.current.loading).toBe(true)
    })

    it("should return error state", () => {
      mockStoreState.error = "Failed to load"

      const { result } = renderHook(() => useSettings())

      expect(result.current.error).toBe("Failed to load")
    })
  })

  describe("returns settings store actions", () => {
    it("should return fetchSettings action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.fetchSettings).toBe("function")
    })

    it("should return updateSettings action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.updateSettings).toBe("function")
    })

    it("should return updateAIConfig action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.updateAIConfig).toBe("function")
    })

    it("should return toggleAntiBan action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.toggleAntiBan).toBe("function")
    })

    it("should return toggleNotifications action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.toggleNotifications).toBe("function")
    })

    it("should return setTheme action", () => {
      const { result } = renderHook(() => useSettings())

      expect(typeof result.current.setTheme).toBe("function")
    })
  })

  describe("handles loading states", () => {
    it("should show loading during fetch", () => {
      mockStoreState.loading = true

      const { result } = renderHook(() => useSettings())

      expect(result.current.loading).toBe(true)
    })

    it("should reflect loading false after fetch completes", () => {
      mockStoreState.settings = mockSettings
      mockStoreState.loading = false

      const { result } = renderHook(() => useSettings())

      expect(result.current.loading).toBe(false)
    })
  })

  describe("handles error states", () => {
    it("should reflect error from store", () => {
      mockStoreState.error = "Connection failed"

      const { result } = renderHook(() => useSettings())

      expect(result.current.error).toBe("Connection failed")
    })

    it("should reflect null error when no error", () => {
      mockStoreState.settings = mockSettings
      mockStoreState.error = null

      const { result } = renderHook(() => useSettings())

      expect(result.current.error).toBeNull()
    })
  })

  describe("updateSettings success toast", () => {
    it("should show success toast on successful update", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        const success = await result.current.updateSettings({ theme: "light" })
        expect(success).toBe(true)
      })

      expect(mockToast.success).toHaveBeenCalledWith("Settings updated")
    })

    it("should call store updateSettings with correct params", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.updateSettings({ theme: "light" })
      })

      expect(mockStoreState.updateSettings).toHaveBeenCalledWith({
        theme: "light",
      })
    })

    it("should return true on successful update", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      let success: boolean
      await act(async () => {
        success = await result.current.updateSettings({ theme: "light" })
      })

      expect(success!).toBe(true)
    })
  })

  describe("updateSettings error toast", () => {
    it("should show error toast on failed update", async () => {
      mockStoreState.settings = mockSettings
      mockStoreState.updateSettings = vi
        .fn()
        .mockRejectedValue(new Error("Update failed"))

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        const success = await result.current.updateSettings({ theme: "light" })
        expect(success).toBe(false)
      })

      expect(mockToast.error).toHaveBeenCalledWith("Update failed")
    })

    it("should handle non-Error rejection", async () => {
      mockStoreState.settings = mockSettings
      mockStoreState.updateSettings = vi.fn().mockRejectedValue("Network error")

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.updateSettings({ theme: "light" })
      })

      expect(mockToast.error).toHaveBeenCalledWith("Failed to update settings")
    })

    it("should return false on failed update", async () => {
      mockStoreState.settings = mockSettings
      mockStoreState.updateSettings = vi
        .fn()
        .mockRejectedValue(new Error("Update failed"))

      const { result } = renderHook(() => useSettings())

      let success: boolean
      await act(async () => {
        success = await result.current.updateSettings({ theme: "light" })
      })

      expect(success!).toBe(false)
    })
  })

  describe("updateAIConfig", () => {
    it("should show success toast on successful AI config update", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        const success = await result.current.updateAIConfig({
          provider: "anthropic",
          apiKey: "new-key",
          model: "claude-3",
          maxTokens: 2000,
          temperature: 0.5,
        })
        expect(success).toBe(true)
      })

      expect(mockToast.success).toHaveBeenCalledWith("AI configuration updated")
    })

    it("should show error toast on failed AI config update", async () => {
      mockStoreState.settings = mockSettings
      mockStoreState.updateAIConfig = vi
        .fn()
        .mockRejectedValue(new Error("AI config update failed"))

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.updateAIConfig({
          provider: "test",
          apiKey: "key",
          model: "model",
          maxTokens: 100,
          temperature: 0.5,
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith("AI config update failed")
    })
  })

  describe("toggleAntiBan", () => {
    it("should show enabled toast when enabling anti-ban", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.toggleAntiBan(true)
      })

      expect(mockToast.success).toHaveBeenCalledWith("Anti-ban enabled")
    })

    it("should show disabled toast when disabling anti-ban", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.toggleAntiBan(false)
      })

      expect(mockToast.success).toHaveBeenCalledWith("Anti-ban disabled")
    })
  })

  describe("toggleNotifications", () => {
    it("should show enabled toast when enabling notifications", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.toggleNotifications(true)
      })

      expect(mockToast.success).toHaveBeenCalledWith("Notifications enabled")
    })

    it("should show disabled toast when disabling notifications", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.toggleNotifications(false)
      })

      expect(mockToast.success).toHaveBeenCalledWith("Notifications disabled")
    })
  })

  describe("setTheme", () => {
    it("should return true on successful theme change", async () => {
      mockStoreState.settings = mockSettings

      const { result } = renderHook(() => useSettings())

      let success: boolean
      await act(async () => {
        success = await result.current.setTheme("light")
      })

      expect(success!).toBe(true)
    })

    it("should show error toast on failed theme change", async () => {
      mockStoreState.settings = mockSettings
      mockStoreState.setTheme = vi
        .fn()
        .mockRejectedValue(new Error("Theme change failed"))

      const { result } = renderHook(() => useSettings())

      await act(async () => {
        await result.current.setTheme("light")
      })

      expect(mockToast.error).toHaveBeenCalledWith("Theme change failed")
    })
  })
})
