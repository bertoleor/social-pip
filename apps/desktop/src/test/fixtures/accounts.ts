import type { Account, AccountStatus, Platform } from "@social-pip/types";

interface CreateAccountFixtureOptions {
  id?: string;
  platform?: Platform;
  name?: string;
  username?: string;
  status?: AccountStatus;
  warmupProgress?: number;
  restrictionsCount?: number;
  dailyPostsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createAccountFixture(options: CreateAccountFixtureOptions = {}): Account {
  return {
    id: options.id ?? "acc_test001",
    platform: options.platform ?? "facebook",
    name: options.name ?? "Test Account",
    username: options.username ?? "testuser",
    status: options.status ?? "active",
    warmupProgress: options.warmupProgress ?? 0,
    restrictionsCount: options.restrictionsCount ?? 0,
    dailyPostsCount: options.dailyPostsCount ?? 0,
    createdAt: options.createdAt ?? new Date("2026-04-01T00:00:00Z"),
    updatedAt: options.updatedAt ?? new Date("2026-04-01T00:00:00Z"),
  };
}

export function createAccountFixtures(
  count: number,
  options: CreateAccountFixtureOptions = {},
): Account[] {
  return Array.from({ length: count }, (_, index) => {
    const platformIndex = index % 4;
    const platforms: Platform[] = ["facebook", "instagram", "twitter", "linkedin"];
    return createAccountFixture({
      ...options,
      id: options.id ? `${options.id}_${index}` : `acc_test${String(index + 1).padStart(3, "0")}`,
      platform: options.platform ?? platforms[platformIndex],
      name: options.name ?? `Test Account ${index + 1}`,
      username: options.username ?? `testuser${index + 1}`,
    });
  });
}

export const mockActiveAccount = createAccountFixture({
  id: "acc_active",
  status: "active",
  dailyPostsCount: 5,
});

export const mockPausedAccount = createAccountFixture({
  id: "acc_paused",
  status: "inactive",
  warmupProgress: 50,
});

export const mockRestrictedAccount = createAccountFixture({
  id: "acc_restricted",
  status: "restricted",
  restrictionsCount: 2,
});

export const mockFacebookAccount = createAccountFixture({
  id: "acc_facebook",
  platform: "facebook",
  name: "FB Business Page",
});

export const mockInstagramAccount = createAccountFixture({
  id: "acc_instagram",
  platform: "instagram",
  name: "IG Creator Account",
});

export const mockTwitterAccount = createAccountFixture({
  id: "acc_twitter",
  platform: "twitter",
  name: "Twitter Profile",
});

export const mockLinkedinAccount = createAccountFixture({
  id: "acc_linkedin",
  platform: "linkedin",
  name: "LinkedIn Company Page",
});
