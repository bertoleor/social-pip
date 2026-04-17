import { vi } from "vitest";

export function createMockQuickPostState(
  overrides: Partial<{
    selectedTemplateId: string | null;
    selectedGroupIds: string[];
    selectedAccountId: string | null;
    canPost: boolean;
    estimatedTime: number;
    warningMessage: string | null;
    groups: Array<{ id: string; name: string }>;
    groupsLoading: boolean;
    groupsError: string | null;
    accountRiskLevel: string | null;
    dailyPostCount: number;
    dailyPostLimit: number;
    cooldownUntil: Date | null;
    setSelectedTemplate: ReturnType<typeof vi.fn>;
    setSelectedGroups: ReturnType<typeof vi.fn>;
    toggleGroup: ReturnType<typeof vi.fn>;
    setSelectedAccount: ReturnType<typeof vi.fn>;
    fetchGroups: ReturnType<typeof vi.fn>;
    checkAccountSafety: ReturnType<typeof vi.fn>;
    startPosting: ReturnType<typeof vi.fn>;
    updateCanPost: ReturnType<typeof vi.fn>;
    calculateEstimatedTime: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    selectedTemplateId: null,
    selectedGroupIds: [],
    selectedAccountId: null,
    canPost: false,
    estimatedTime: 0,
    warningMessage: null,
    groups: [],
    groupsLoading: false,
    groupsError: null,
    accountRiskLevel: null,
    dailyPostCount: 0,
    dailyPostLimit: 30,
    cooldownUntil: null,
    setSelectedTemplate: vi.fn(),
    setSelectedGroups: vi.fn(),
    toggleGroup: vi.fn(),
    setSelectedAccount: vi.fn(),
    fetchGroups: vi.fn().mockResolvedValue(undefined),
    checkAccountSafety: vi.fn().mockResolvedValue(undefined),
    startPosting: vi.fn().mockResolvedValue(undefined),
    updateCanPost: vi.fn(),
    calculateEstimatedTime: vi.fn(),
    ...overrides,
  };
}

export function createMockSettingsState(
  overrides: Partial<{
    settings: {
      id: string;
      antiBanEnabled: boolean;
      theme: string;
      notificationsEnabled: boolean;
    } | null;
    loading: boolean;
    error: string | null;
    fetchSettings: ReturnType<typeof vi.fn>;
    updateSettings: ReturnType<typeof vi.fn>;
    updateAIConfig: ReturnType<typeof vi.fn>;
    toggleAntiBan: ReturnType<typeof vi.fn>;
    toggleNotifications: ReturnType<typeof vi.fn>;
    setTheme: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    settings: null,
    loading: false,
    error: null,
    fetchSettings: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    updateAIConfig: vi.fn().mockResolvedValue(undefined),
    toggleAntiBan: vi.fn().mockResolvedValue(undefined),
    toggleNotifications: vi.fn().mockResolvedValue(undefined),
    setTheme: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockAlertsState(
  overrides: Partial<{
    alerts: Array<{
      id: string;
      type: string;
      message: string;
      severity: string;
      createdAt: Date;
      isRead: boolean;
    }>;
    loading: boolean;
    error: string | null;
    fetchAlerts: ReturnType<typeof vi.fn>;
    dismissAlert: ReturnType<typeof vi.fn>;
    dismissAll: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    alerts: [],
    loading: false,
    error: null,
    fetchAlerts: vi.fn().mockResolvedValue(undefined),
    dismissAlert: vi.fn().mockResolvedValue(undefined),
    dismissAll: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export function createMockAccountsState(
  overrides: Partial<{
    accounts: Array<{
      id: string;
      platform: string;
      name: string;
      username: string;
      status: string;
    }>;
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    fetchAccounts: ReturnType<typeof vi.fn>;
    createAccount: ReturnType<typeof vi.fn>;
    updateAccount: ReturnType<typeof vi.fn>;
    deleteAccount: ReturnType<typeof vi.fn>;
    selectAccount: ReturnType<typeof vi.fn>;
    setFilter: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    accounts: [],
    selectedId: null,
    loading: false,
    error: null,
    fetchAccounts: vi.fn().mockResolvedValue(undefined),
    createAccount: vi.fn().mockResolvedValue({}),
    updateAccount: vi.fn().mockResolvedValue({}),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    selectAccount: vi.fn(),
    setFilter: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

export function createMockPostsState(
  overrides: Partial<{
    posts: Array<{
      id: string;
      content: string;
      platform: string;
      status: string;
    }>;
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    fetchPosts: ReturnType<typeof vi.fn>;
    createPost: ReturnType<typeof vi.fn>;
    updatePost: ReturnType<typeof vi.fn>;
    deletePost: ReturnType<typeof vi.fn>;
    selectPost: ReturnType<typeof vi.fn>;
    setFilter: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    posts: [],
    selectedId: null,
    loading: false,
    error: null,
    fetchPosts: vi.fn().mockResolvedValue(undefined),
    createPost: vi.fn().mockResolvedValue({}),
    updatePost: vi.fn().mockResolvedValue({}),
    deletePost: vi.fn().mockResolvedValue(undefined),
    selectPost: vi.fn(),
    setFilter: vi.fn(),
    ...overrides,
  };
}

export function createMockScheduleState(
  overrides: Partial<{
    schedules: Array<{
      id: string;
      scheduledAt: Date;
      status: string;
      postId: string;
      accountId: string;
    }>;
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    fetchSchedules: ReturnType<typeof vi.fn>;
    schedulePost: ReturnType<typeof vi.fn>;
    cancelSchedule: ReturnType<typeof vi.fn>;
    updateSchedule: ReturnType<typeof vi.fn>;
    selectSchedule: ReturnType<typeof vi.fn>;
    setFilter: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    schedules: [],
    selectedId: null,
    loading: false,
    error: null,
    fetchSchedules: vi.fn().mockResolvedValue(undefined),
    schedulePost: vi.fn().mockResolvedValue({}),
    cancelSchedule: vi.fn().mockResolvedValue(undefined),
    updateSchedule: vi.fn().mockResolvedValue({}),
    selectSchedule: vi.fn(),
    setFilter: vi.fn(),
    ...overrides,
  };
}
