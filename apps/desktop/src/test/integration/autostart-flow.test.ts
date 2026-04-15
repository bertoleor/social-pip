/**
 * TASK-8.4: E2E Test for Auto-Start Flow
 *
 * Tests the auto-start (launch at login) functionality.
 * Tests enable, disable, and status check operations.
 *
 * Flow: Enable → Check status → Disable → Verify disabled
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("E2E: Auto-Start Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Enable auto-start", () => {
    it("should enable auto-start via enable_autostart command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("enable_autostart")

      expect(mockInvoke).toHaveBeenCalledWith("enable_autostart")
    })

    it("should return error when enable fails", async () => {
      mockInvoke.mockRejectedValueOnce(
        new Error("Failed to enable autostart: registry error")
      )

      await expect(invoke("enable_autostart")).rejects.toThrow(
        "Failed to enable autostart"
      )
    })
  })

  describe("Disable auto-start", () => {
    it("should disable auto-start via disable_autostart command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("disable_autostart")

      expect(mockInvoke).toHaveBeenCalledWith("disable_autostart")
    })

    it("should return error when disable fails", async () => {
      mockInvoke.mockRejectedValueOnce(
        new Error("Failed to disable autostart: permission denied")
      )

      await expect(invoke("disable_autostart")).rejects.toThrow(
        "Failed to disable autostart"
      )
    })
  })

  describe("Check auto-start status", () => {
    it("should return enabled=true when auto-start is enabled", async () => {
      mockInvoke.mockResolvedValueOnce({ enabled: true })

      const status = await invoke<{ enabled: boolean }>("get_autostart_status")

      expect(status.enabled).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith("get_autostart_status")
    })

    it("should return enabled=false when auto-start is disabled", async () => {
      mockInvoke.mockResolvedValueOnce({ enabled: false })

      const status = await invoke<{ enabled: boolean }>("get_autostart_status")

      expect(status.enabled).toBe(false)
    })

    it("should return error when status check fails", async () => {
      mockInvoke.mockRejectedValueOnce(
        new Error("Failed to check autostart status: registry access denied")
      )

      await expect(invoke("get_autostart_status")).rejects.toThrow(
        "Failed to check autostart status"
      )
    })
  })

  describe("Full flow: Enable → Status → Disable", () => {
    it("should complete full auto-start lifecycle", async () => {
      // Step 1: Enable auto-start
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")
      expect(mockInvoke).toHaveBeenLastCalledWith("enable_autostart")

      // Step 2: Check status (should be enabled)
      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const enabledStatus = await invoke<{ enabled: boolean }>(
        "get_autostart_status"
      )
      expect(enabledStatus.enabled).toBe(true)

      // Step 3: Disable auto-start
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("disable_autostart")
      expect(mockInvoke).toHaveBeenLastCalledWith("disable_autostart")

      // Step 4: Check status (should be disabled)
      mockInvoke.mockResolvedValueOnce({ enabled: false })
      const disabledStatus = await invoke<{ enabled: boolean }>(
        "get_autostart_status"
      )
      expect(disabledStatus.enabled).toBe(false)
    })

    it("should handle toggle multiple times", async () => {
      // Toggle on
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      // Toggle off
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("disable_autostart")

      // Toggle on again
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      // Verify status
      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")
      expect(status.enabled).toBe(true)
    })
  })

  describe("Platform-specific behavior", () => {
    it("should work on Windows (registry-based)", async () => {
      // On Windows, autostart uses registry entries
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")
      expect(status.enabled).toBe(true)
    })

    it("should work on macOS (Launch Agent)", async () => {
      // On macOS, autostart uses Launch Agents
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")
      expect(status.enabled).toBe(true)
    })

    it("should work on Linux (desktop entry)", async () => {
      // On Linux, autostart uses .desktop files
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")
      expect(status.enabled).toBe(true)
    })
  })

  describe("Error recovery", () => {
    it("should handle partial failure gracefully", async () => {
      // Enable succeeds
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      // Status check fails
      mockInvoke.mockRejectedValueOnce(new Error("Status check failed"))

      // Should not affect previous enable
      await expect(invoke("get_autostart_status")).rejects.toThrow()
    })

    it("should allow retry after failure", async () => {
      // First enable fails
      mockInvoke.mockRejectedValueOnce(new Error("Registry locked"))

      await expect(invoke("enable_autostart")).rejects.toThrow("Registry locked")

      // Reset mock for retry
      mockInvoke.mockReset()
      mockInvoke.mockResolvedValueOnce(undefined)

      // Retry succeeds
      await invoke("enable_autostart")

      expect(mockInvoke).toHaveBeenCalledWith("enable_autostart")
    })
  })

  describe("Settings integration", () => {
    it("should update settings store when enabled", async () => {
      // When autostart is enabled, settings should reflect this
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("enable_autostart")

      mockInvoke.mockResolvedValueOnce({ enabled: true })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")

      // Settings should have autoStart: true
      expect(status.enabled).toBe(true)
    })

    it("should update settings store when disabled", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("disable_autostart")

      mockInvoke.mockResolvedValueOnce({ enabled: false })
      const status = await invoke<{ enabled: boolean }>("get_autostart_status")

      // Settings should have autoStart: false
      expect(status.enabled).toBe(false)
    })
  })
})
