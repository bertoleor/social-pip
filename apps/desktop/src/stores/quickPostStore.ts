import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Quick Post store - Combined state for the Quick Post panel
 * Integrates template, group, and account selection with posting state
 */
import { create } from "zustand";
import { usePostingStore } from "./postingStore";
import { useTemplateStore } from "./templateStore";

export interface GroupForSelection {
  id: string;
  name: string;
  memberCount?: number;
  privacy?: "public" | "private";
  lastPostedAt?: Date;
}

export interface QuickPostState {
  // Selection state
  selectedTemplateId: string | null;
  selectedGroupIds: string[];
  selectedAccountId: string | null;

  // Computed state
  canPost: boolean;
  estimatedTime: number; // in seconds
  warningMessage: string | null;

  // Groups (from scraper)
  groups: GroupForSelection[];
  groupsLoading: boolean;
  groupsError: string | null;

  // Account safety
  accountRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  dailyPostCount: number;
  dailyPostLimit: number;
  cooldownUntil: Date | null;

  // Actions
  setSelectedTemplate: (id: string | null) => void;
  setSelectedGroups: (ids: string[]) => void;
  toggleGroup: (id: string) => void;
  setSelectedAccount: (id: string | null) => void;

  // Groups
  fetchGroups: () => Promise<void>;

  // Account safety
  checkAccountSafety: (accountId: string) => Promise<void>;

  // Posting
  startPosting: () => Promise<void>;

  // Computed updates
  updateCanPost: () => void;
  calculateEstimatedTime: () => void;
}

export const useQuickPostStore = create<QuickPostState>((set, get) => ({
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

  setSelectedTemplate: (id) => {
    set({ selectedTemplateId: id });
    get().updateCanPost();

    // Also select in templateStore to generate preview
    if (id) {
      useTemplateStore.getState().selectTemplate(id);
    }
  },

  setSelectedGroups: (ids) => {
    set({ selectedGroupIds: ids });
    get().updateCanPost();
    get().calculateEstimatedTime();
  },

  toggleGroup: (id) => {
    const { selectedGroupIds } = get();
    const newSelection = selectedGroupIds.includes(id)
      ? selectedGroupIds.filter((g) => g !== id)
      : [...selectedGroupIds, id];

    set({ selectedGroupIds: newSelection });
    get().updateCanPost();
    get().calculateEstimatedTime();
  },

  setSelectedAccount: (id) => {
    set({ selectedAccountId: id });
    get().updateCanPost();

    if (id) {
      get().checkAccountSafety(id);
    }
  },

  fetchGroups: async () => {
    set({ groupsLoading: true, groupsError: null });

    try {
      const groups = await invoke<GroupForSelection[]>("get_groups_for_posting");
      set({ groups, groupsLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ groupsError: errorMessage, groupsLoading: false });
    }
  },

  checkAccountSafety: async (accountId) => {
    try {
      const safety = await invoke<{
        riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        dailyPostCount: number;
        dailyPostLimit: number;
        cooldownUntil: string | null;
        canPost: boolean;
        warningMessage: string | null;
      }>("check_account_posting_safety", { accountId });

      set({
        accountRiskLevel: safety.riskLevel,
        dailyPostCount: safety.dailyPostCount,
        dailyPostLimit: safety.dailyPostLimit,
        cooldownUntil: safety.cooldownUntil ? new Date(safety.cooldownUntil) : null,
        warningMessage: safety.warningMessage,
      });

      get().updateCanPost();
    } catch (error) {
      console.error("Failed to check account safety:", error);
    }
  },

  startPosting: async () => {
    const { selectedTemplateId, selectedGroupIds, selectedAccountId } = get();
    const templateStore = useTemplateStore.getState();
    const postingStore = usePostingStore.getState();

    if (!selectedAccountId || selectedGroupIds.length === 0) {
      throw new Error("Missing required selections");
    }

    const mediaValidationState = postingStore.getMediaValidationState();
    if (mediaValidationState === "invalid") {
      throw new Error("Media validation failed - fix errors before posting");
    }

    let content: string | undefined;
    if (selectedTemplateId) {
      const template = templateStore.templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        content = templateStore.preview?.content ?? template.content;
      }
    }

    const mediaPaths = postingStore.mediaFiles.map((f) => f.path);

    await postingStore.startSession({
      templateId: selectedTemplateId ?? undefined,
      accountId: selectedAccountId,
      groupIds: selectedGroupIds,
      content,
      mediaPaths: mediaPaths.length > 0 ? mediaPaths : undefined,
    });

    if (selectedTemplateId) {
      await templateStore.incrementUseCount(selectedTemplateId);
    }

    postingStore.clearMedia();
  },

  updateCanPost: () => {
    const {
      selectedTemplateId,
      selectedGroupIds,
      selectedAccountId,
      accountRiskLevel,
      dailyPostCount,
      dailyPostLimit,
      cooldownUntil,
    } = get();
    const templateStore = useTemplateStore.getState();

    let canPost = true;
    const warnings: string[] = [];

    // Check template selection (optional if custom content provided)
    if (!selectedTemplateId && !templateStore.preview?.content) {
      canPost = false;
    }

    // Check groups
    if (selectedGroupIds.length === 0) {
      canPost = false;
    }

    // Check account
    if (!selectedAccountId) {
      canPost = false;
    }

    // Check risk level
    if (accountRiskLevel === "CRITICAL") {
      canPost = false;
      warnings.push("Account risk level is CRITICAL");
    }

    // Check daily limit
    if (dailyPostCount >= dailyPostLimit) {
      canPost = false;
      warnings.push(`Daily post limit reached (${dailyPostCount}/${dailyPostLimit})`);
    }

    // Check cooldown
    if (cooldownUntil && new Date() < cooldownUntil) {
      canPost = false;
      const remaining = Math.ceil((cooldownUntil.getTime() - Date.now()) / 60000);
      warnings.push(`Account in cooldown for ${remaining} more minutes`);
    }

    set({
      canPost,
      warningMessage: warnings.length > 0 ? warnings.join(". ") : null,
    });
  },

  calculateEstimatedTime: () => {
    const { selectedGroupIds } = get();

    if (selectedGroupIds.length === 0) {
      set({ estimatedTime: 0 });
      return;
    }

    // Estimate: 2-4 min per group + batch breaks every 3 posts (30 min break)
    const baseTimePerGroup = 3 * 60; // 3 minutes in seconds
    const batchSize = 3;
    const batchBreakTime = 30 * 60; // 30 minutes in seconds

    const batchBreaks = Math.floor((selectedGroupIds.length - 1) / batchSize);
    const estimatedTime = selectedGroupIds.length * baseTimePerGroup + batchBreaks * batchBreakTime;

    set({ estimatedTime });
  },
}));
