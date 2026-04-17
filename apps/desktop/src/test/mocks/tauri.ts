import { vi } from "vitest";

export interface MockInvokeConfig {
  [command: string]: unknown | (() => unknown);
}

const defaultResponses: MockInvokeConfig = {
  get_settings: {
    id: "1",
    anti_ban_enabled: true,
    theme: "dark",
    notifications_enabled: true,
  },
  init_alert_system: {
    total_alerts: 0,
    unresolved: 0,
    critical: 0,
    warnings: 0,
    last_24h: 0,
    last_hour: 0,
  },
  get_groups_for_posting: [],
  check_account_posting_safety: {
    riskLevel: "LOW",
    dailyPostCount: 0,
    dailyPostLimit: 30,
    canPost: true,
    warningMessage: null,
  },
  get_accounts: [],
  get_posts: [],
  get_schedules: [],
  get_templates: [],
};

export function createTauriMock(overrides: MockInvokeConfig = {}) {
  const responses = { ...defaultResponses, ...overrides };
  return vi.fn(async (command: string, args?: Record<string, unknown>) => {
    const handler = responses[command];
    if (typeof handler === "function") {
      return (handler as (args?: Record<string, unknown>) => unknown)(args);
    }
    return handler;
  });
}

let currentMock: ReturnType<typeof createTauriMock> | null = null;

export function mockTauriInvoke(overrides: MockInvokeConfig = {}) {
  const mock = createTauriMock(overrides);
  vi.mock("@tauri-apps/api/core", () => ({
    invoke: mock,
  }));
  currentMock = mock;
  return mock;
}

export function getTauriMock() {
  return currentMock;
}

export function resetTauriMock() {
  if (currentMock) {
    currentMock.mockClear();
  }
}
