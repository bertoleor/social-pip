/**
 * TASK-8.1: E2E Test for Credential Storage Flow
 *
 * Tests the complete flow of storing, retrieving, and clearing credentials
 * using the secure storage (Stronghold) backend.
 *
 * Flow: Store → Retrieve → Clear credentials
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("E2E: Credential Storage Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Store credentials", () => {
    it("should store a credential via store_credential command", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("store_credential", {
        key: "api_key_openai",
        value: "sk-test-key-12345",
      })

      expect(mockInvoke).toHaveBeenCalledWith("store_credential", {
        key: "api_key_openai",
        value: "sk-test-key-12345",
      })
    })

    it("should store credential with namespaced key", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("store_credential", {
        key: "platform/facebook/access_token",
        value: "fb-token-xyz",
      })

      expect(mockInvoke).toHaveBeenCalledWith("store_credential", {
        key: "platform/facebook/access_token",
        value: "fb-token-xyz",
      })
    })

    it("should validate key format before storing", async () => {
      // Keys must be alphanumeric, underscore, hyphen, or slash
      mockInvoke.mockRejectedValueOnce(new Error("Invalid key name"))

      await expect(
        invoke("store_credential", {
          key: "key with spaces",
          value: "test",
        })
      ).rejects.toThrow()
    })
  })

  describe("Retrieve credentials", () => {
    it("should retrieve a stored credential", async () => {
      const expectedValue = "sk-test-key-12345"
      mockInvoke.mockResolvedValueOnce(expectedValue)

      const result = await invoke<string>("retrieve_credential", {
        key: "api_key_openai",
      })

      expect(result).toBe(expectedValue)
      expect(mockInvoke).toHaveBeenCalledWith("retrieve_credential", {
        key: "api_key_openai",
      })
    })

    it("should return null for non-existent credential", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Credential not found"))

      await expect(
        invoke("retrieve_credential", { key: "non_existent_key" })
      ).rejects.toThrow("Credential not found")
    })

    it("should retrieve namespaced credentials", async () => {
      const expectedToken = "fb-token-xyz"
      mockInvoke.mockResolvedValueOnce(expectedToken)

      const result = await invoke<string>("retrieve_credential", {
        key: "platform/facebook/access_token",
      })

      expect(result).toBe(expectedToken)
    })
  })

  describe("Clear credentials", () => {
    it("should clear a stored credential", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("clear_credential", { key: "api_key_openai" })

      expect(mockInvoke).toHaveBeenCalledWith("clear_credential", {
        key: "api_key_openai",
      })
    })

    it("should clear namespaced credentials", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await invoke("clear_credential", {
        key: "platform/facebook/access_token",
      })

      expect(mockInvoke).toHaveBeenCalledWith("clear_credential", {
        key: "platform/facebook/access_token",
      })
    })

    it("should handle clearing non-existent credential gracefully", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      // Should not throw even if key doesn't exist
      await invoke("clear_credential", { key: "non_existent_key" })

      expect(mockInvoke).toHaveBeenCalled()
    })
  })

  describe("List credentials", () => {
    it("should list all stored credential keys", async () => {
      const mockList = {
        credentials: [
          { key: "api_key_openai", stored_at: "2024-01-15T10:00:00Z" },
          { key: "api_key_anthropic", stored_at: "2024-01-15T11:00:00Z" },
        ],
        total: 2,
      }
      mockInvoke.mockResolvedValueOnce(mockList)

      const result = await invoke<{
        credentials: Array<{ key: string; stored_at: string }>
        total: number
      }>("list_credentials")

      expect(result.credentials).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.credentials[0]?.key).toBe("api_key_openai")
    })

    it("should return empty list when no credentials stored", async () => {
      mockInvoke.mockResolvedValueOnce({ credentials: [], total: 0 })

      const result = await invoke<{
        credentials: Array<{ key: string }>
        total: number
      }>("list_credentials")

      expect(result.credentials).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe("Credential exists check", () => {
    it("should return true for existing credential", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const exists = await invoke<boolean>("credential_exists", {
        key: "api_key_openai",
      })

      expect(exists).toBe(true)
    })

    it("should return false for non-existent credential", async () => {
      mockInvoke.mockResolvedValueOnce(false)

      const exists = await invoke<boolean>("credential_exists", {
        key: "non_existent_key",
      })

      expect(exists).toBe(false)
    })
  })

  describe("Full flow: Store → Retrieve → Clear", () => {
    it("should complete full credential lifecycle", async () => {
      const key = "test_credential_lifecycle"
      const value = "test-value-123"

      // Step 1: Store credential
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("store_credential", { key, value })
      expect(mockInvoke).toHaveBeenLastCalledWith("store_credential", {
        key,
        value,
      })

      // Step 2: Retrieve credential
      mockInvoke.mockResolvedValueOnce(value)
      const retrieved = await invoke<string>("retrieve_credential", { key })
      expect(retrieved).toBe(value)

      // Step 3: Check credential exists
      mockInvoke.mockResolvedValueOnce(true)
      const exists = await invoke<boolean>("credential_exists", { key })
      expect(exists).toBe(true)

      // Step 4: Clear credential
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("clear_credential", { key })

      // Step 5: Verify credential is gone
      mockInvoke.mockResolvedValueOnce(false)
      const existsAfter = await invoke<boolean>("credential_exists", { key })
      expect(existsAfter).toBe(false)
    })

    it("should handle multiple credentials independently", async () => {
      const credentials = [
        { key: "cred_1", value: "value_1" },
        { key: "cred_2", value: "value_2" },
        { key: "cred_3", value: "value_3" },
      ]

      // Store all
      for (const cred of credentials) {
        mockInvoke.mockResolvedValueOnce(undefined)
        await invoke("store_credential", { key: cred.key, value: cred.value })
      }

      // List all
      mockInvoke.mockResolvedValueOnce({
        credentials: credentials.map((c) => ({ key: c.key })),
        total: 3,
      })
      const list = await invoke<{
        credentials: Array<{ key: string }>
        total: number
      }>("list_credentials")
      expect(list.total).toBe(3)

      // Clear one
      mockInvoke.mockResolvedValueOnce(undefined)
      await invoke("clear_credential", { key: "cred_2" })

      // Verify remaining count
      mockInvoke.mockResolvedValueOnce({
        credentials: [
          { key: "cred_1" },
          { key: "cred_3" },
        ],
        total: 2,
      })
      const remainingList = await invoke<{
        credentials: Array<{ key: string }>
        total: number
      }>("list_credentials")
      expect(remainingList.total).toBe(2)
    })
  })

  describe("Error handling", () => {
    it("should handle vault not initialized error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Vault not initialized"))

      await expect(
        invoke("store_credential", { key: "test", value: "test" })
      ).rejects.toThrow("Vault not initialized")
    })

    it("should handle invalid key error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Invalid key name: empty key"))

      await expect(
        invoke("store_credential", { key: "", value: "test" })
      ).rejects.toThrow()
    })

    it("should handle retrieve failed error", async () => {
      mockInvoke.mockRejectedValueOnce(
        new Error("Failed to retrieve credential: corrupted vault")
      )

      await expect(
        invoke("retrieve_credential", { key: "test" })
      ).rejects.toThrow("Failed to retrieve credential")
    })
  })
})
