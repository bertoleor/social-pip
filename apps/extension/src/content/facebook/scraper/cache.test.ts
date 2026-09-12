/**
 * @file Tests for Chrome storage cache with TTL
 * TDD: RED phase - Write failing tests first
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS, cacheGroups, clearGroupCache, getCachedGroups } from "./cache";
import type { ScrapedGroup } from "./group-scraper";

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

vi.stubGlobal("chrome", {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        if (typeof keys === "string") {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        if (typeof keys === "string") {
          delete mockStorage[keys];
        } else {
          for (const key of keys) {
            delete mockStorage[key];
          }
        }
        return Promise.resolve();
      }),
    },
  },
});

describe("cache", () => {
  const CACHE_KEY = "facebook_groups_cache";

  const mockGroups: ScrapedGroup[] = [
    {
      id: "123456",
      name: "Test Group 1",
      url: "https://facebook.com/groups/123456",
      memberCount: 1000,
      privacy: "public",
      requiresApproval: false,
    },
    {
      id: "789012",
      name: "Test Group 2",
      url: "https://facebook.com/groups/789012",
      memberCount: 500,
      privacy: "private",
      requiresApproval: true,
    },
  ];

  beforeEach(() => {
    // Clear mock storage before each test
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    vi.clearAllMocks();
  });

  describe("CACHE_TTL_MS", () => {
    it("should be 1 hour (3600000 ms)", () => {
      expect(CACHE_TTL_MS).toBe(60 * 60 * 1000);
    });
  });

  describe("getCachedGroups", () => {
    it("should return null when cache is empty", async () => {
      const result = await getCachedGroups();
      expect(result).toBeNull();
    });

    it("should return null when cache entry exists but is expired", async () => {
      // Set expired cache entry
      mockStorage[CACHE_KEY] = {
        groups: mockGroups,
        scrapedAt: new Date(Date.now() - CACHE_TTL_MS - 1000).toISOString(), // Expired 1 second ago
        version: 1,
      };

      const result = await getCachedGroups();
      expect(result).toBeNull();
    });

    it("should return groups when cache is valid", async () => {
      // Set valid cache entry
      mockStorage[CACHE_KEY] = {
        groups: mockGroups,
        scrapedAt: new Date(Date.now() - 1000).toISOString(), // Created 1 second ago
        version: 1,
      };

      const result = await getCachedGroups();
      expect(result).toEqual(mockGroups);
    });

    it("should return groups when cache is exactly at TTL boundary", async () => {
      // Set cache entry at exact TTL boundary (still valid)
      mockStorage[CACHE_KEY] = {
        groups: mockGroups,
        scrapedAt: new Date(Date.now() - CACHE_TTL_MS + 1000).toISOString(), // 1 second before expiry
        version: 1,
      };

      const result = await getCachedGroups();
      expect(result).toEqual(mockGroups);
    });

    it("should return null when cache entry has invalid structure", async () => {
      mockStorage[CACHE_KEY] = {
        // Missing groups field - should return null or undefined
        scrapedAt: new Date().toISOString(),
        version: 1,
      };

      const result = await getCachedGroups();
      expect(result).toBeFalsy(); // Returns null or undefined for invalid structure
    });
  });

  describe("cacheGroups", () => {
    it("should store groups with current timestamp", async () => {
      await cacheGroups(mockGroups);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(mockStorage[CACHE_KEY]).toBeDefined();

      const cached = mockStorage[CACHE_KEY] as {
        groups: ScrapedGroup[];
        scrapedAt: string;
        version: number;
      };
      expect(cached.groups).toEqual(mockGroups);
      expect(cached.version).toBe(1);
      expect(cached.scrapedAt).toBeDefined();
    });

    it("should overwrite existing cache", async () => {
      // Set initial cache
      mockStorage[CACHE_KEY] = {
        groups: [
          {
            id: "old",
            name: "Old Group",
            url: "",
            memberCount: 0,
            privacy: "public",
            requiresApproval: false,
          },
        ],
        scrapedAt: new Date(Date.now() - 10000).toISOString(),
        version: 1,
      };

      // Cache new groups
      await cacheGroups(mockGroups);

      const cached = mockStorage[CACHE_KEY] as {
        groups: ScrapedGroup[];
        scrapedAt: string;
        version: number;
      };
      expect(cached.groups).toEqual(mockGroups);
      expect(cached.groups.length).toBe(2);
    });

    it("should handle empty array", async () => {
      await cacheGroups([]);

      const cached = mockStorage[CACHE_KEY] as {
        groups: ScrapedGroup[];
        scrapedAt: string;
        version: number;
      };
      expect(cached.groups).toEqual([]);
    });
  });

  describe("clearGroupCache", () => {
    it("should remove cache entry", async () => {
      mockStorage[CACHE_KEY] = {
        groups: mockGroups,
        scrapedAt: new Date().toISOString(),
        version: 1,
      };

      await clearGroupCache();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(CACHE_KEY);
    });

    it("should not throw when cache does not exist", async () => {
      await expect(clearGroupCache()).resolves.not.toThrow();
    });
  });
});
