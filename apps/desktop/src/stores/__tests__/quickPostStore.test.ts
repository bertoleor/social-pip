import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
import { usePostingStore } from "../postingStore";
import { useQuickPostStore } from "../quickPostStore";
import { useTemplateStore } from "../templateStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockGroup1 = { id: "group-1", name: "Test Group 1" };
const mockGroup2 = { id: "group-2", name: "Test Group 2" };

const mockTemplate = {
  id: "template-1",
  name: "Test Template",
  sector: "test",
  platforms: ["facebook"],
  content: "Test content",
  variants: [],
  imagePaths: [],
  includeLink: false,
  useCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: "session-1",
  status: "running",
  accountId: "acc-1",
  totalJobs: 1,
  completedJobs: 0,
  successfulJobs: 0,
  failedJobs: 0,
  configSnapshot: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("useQuickPostStore", () => {
  beforeEach(() => {
    useQuickPostStore.setState({
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
    });
    useTemplateStore.setState({
      templates: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: null,
      preview: null,
      previewVariations: 0,
      previewValidation: null,
    });
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      mediaFiles: [],
      mediaValidation: new Map(),
      platformTargets: [],
    });
    vi.clearAllMocks();
  });

  describe("State Initialization", () => {
    it("should have correct initial state", () => {
      const state = useQuickPostStore.getState();
      expect(state.selectedTemplateId).toBeNull();
      expect(state.selectedGroupIds).toEqual([]);
      expect(state.selectedAccountId).toBeNull();
      expect(state.canPost).toBe(false);
      expect(state.estimatedTime).toBe(0);
      expect(state.warningMessage).toBeNull();
      expect(state.groups).toEqual([]);
      expect(state.groupsLoading).toBe(false);
      expect(state.groupsError).toBeNull();
      expect(state.accountRiskLevel).toBeNull();
      expect(state.dailyPostCount).toBe(0);
      expect(state.dailyPostLimit).toBe(30);
      expect(state.cooldownUntil).toBeNull();
    });

    it("should have all required action methods", () => {
      const state = useQuickPostStore.getState();
      expect(typeof state.setSelectedTemplate).toBe("function");
      expect(typeof state.setSelectedGroups).toBe("function");
      expect(typeof state.toggleGroup).toBe("function");
      expect(typeof state.setSelectedAccount).toBe("function");
      expect(typeof state.fetchGroups).toBe("function");
      expect(typeof state.checkAccountSafety).toBe("function");
      expect(typeof state.startPosting).toBe("function");
      expect(typeof state.updateCanPost).toBe("function");
      expect(typeof state.calculateEstimatedTime).toBe("function");
    });
  });

  describe("setSelectedTemplate", () => {
    it("should update selectedTemplateId", () => {
      act(() => {
        useQuickPostStore.getState().setSelectedTemplate("template-1");
      });

      const state = useQuickPostStore.getState();
      expect(state.selectedTemplateId).toBe("template-1");
    });

    it("should call updateCanPost after setting template", () => {
      const updateCanPostSpy = vi.spyOn(useQuickPostStore.getState(), "updateCanPost");

      act(() => {
        useQuickPostStore.getState().setSelectedTemplate("template-1");
      });

      expect(updateCanPostSpy).toHaveBeenCalled();
    });

    it("should set templateId to null when null is passed", () => {
      useQuickPostStore.setState({ selectedTemplateId: "template-1" });

      act(() => {
        useQuickPostStore.getState().setSelectedTemplate(null);
      });

      expect(useQuickPostStore.getState().selectedTemplateId).toBeNull();
    });

    it("should call templateStore.selectTemplate when id is provided", () => {
      useTemplateStore.setState({ templates: [mockTemplate] });
      const selectTemplateSpy = vi.spyOn(useTemplateStore.getState(), "selectTemplate");

      act(() => {
        useQuickPostStore.getState().setSelectedTemplate("template-1");
      });

      expect(selectTemplateSpy).toHaveBeenCalledWith("template-1");
    });

    it("should not call templateStore.selectTemplate when id is null", () => {
      const selectTemplateSpy = vi.spyOn(useTemplateStore.getState(), "selectTemplate");

      act(() => {
        useQuickPostStore.getState().setSelectedTemplate(null);
      });

      expect(selectTemplateSpy).not.toHaveBeenCalled();
    });
  });

  describe("setSelectedGroups", () => {
    it("should update selectedGroupIds", () => {
      act(() => {
        useQuickPostStore.getState().setSelectedGroups(["g1", "g2"]);
      });

      const state = useQuickPostStore.getState();
      expect(state.selectedGroupIds).toEqual(["g1", "g2"]);
    });

    it("should call updateCanPost after setting groups", () => {
      const updateCanPostSpy = vi.spyOn(useQuickPostStore.getState(), "updateCanPost");

      act(() => {
        useQuickPostStore.getState().setSelectedGroups(["g1"]);
      });

      expect(updateCanPostSpy).toHaveBeenCalled();
    });

    it("should call calculateEstimatedTime after setting groups", () => {
      const calcTimeSpy = vi.spyOn(useQuickPostStore.getState(), "calculateEstimatedTime");

      act(() => {
        useQuickPostStore.getState().setSelectedGroups(["g1", "g2"]);
      });

      expect(calcTimeSpy).toHaveBeenCalled();
    });

    it("should replace existing group selection", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["old-group"] });

      act(() => {
        useQuickPostStore.getState().setSelectedGroups(["new-group"]);
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toEqual(["new-group"]);
    });
  });

  describe("toggleGroup", () => {
    it("should add group ID when not present", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["a", "b"] });

      act(() => {
        useQuickPostStore.getState().toggleGroup("c");
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toEqual(["a", "b", "c"]);
    });

    it("should remove group ID when present", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["a", "b", "c"] });

      act(() => {
        useQuickPostStore.getState().toggleGroup("b");
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toEqual(["a", "c"]);
    });

    it("should add first group to empty selection", () => {
      useQuickPostStore.setState({ selectedGroupIds: [] });

      act(() => {
        useQuickPostStore.getState().toggleGroup("first");
      });

      expect(useQuickPostStore.getState().selectedGroupIds).toEqual(["first"]);
    });

    it("should call updateCanPost after toggle", () => {
      const updateCanPostSpy = vi.spyOn(useQuickPostStore.getState(), "updateCanPost");

      act(() => {
        useQuickPostStore.getState().toggleGroup("g1");
      });

      expect(updateCanPostSpy).toHaveBeenCalled();
    });

    it("should call calculateEstimatedTime after toggle", () => {
      const calcTimeSpy = vi.spyOn(useQuickPostStore.getState(), "calculateEstimatedTime");

      act(() => {
        useQuickPostStore.getState().toggleGroup("g1");
      });

      expect(calcTimeSpy).toHaveBeenCalled();
    });
  });

  describe("fetchGroups - success path", () => {
    it("should set groups on success", async () => {
      mockInvoke.mockResolvedValueOnce([mockGroup1, mockGroup2]);

      await act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      const state = useQuickPostStore.getState();
      expect(state.groups).toEqual([mockGroup1, mockGroup2]);
      expect(state.groupsLoading).toBe(false);
      expect(state.groupsError).toBeNull();
    });

    it("should invoke get_groups_for_posting command", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_groups_for_posting");
    });

    it("should set groupsLoading to true during fetch", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const promise = act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      expect(useQuickPostStore.getState().groupsLoading).toBe(true);

      await promise;
    });
  });

  describe("fetchGroups - error handling", () => {
    it("should set groupsError on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network failed"));

      await act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      const state = useQuickPostStore.getState();
      expect(state.groupsError).toBe("Network failed");
      expect(state.groupsLoading).toBe(false);
    });

    it("should handle non-Error throws", async () => {
      mockInvoke.mockRejectedValueOnce("String error");

      await act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      const state = useQuickPostStore.getState();
      expect(state.groupsError).toBe("String error");
    });

    it("should clear groupsError on successful fetch after failure", async () => {
      useQuickPostStore.setState({ groupsError: "Previous error" });
      mockInvoke.mockResolvedValueOnce([mockGroup1]);

      await act(async () => {
        await useQuickPostStore.getState().fetchGroups();
      });

      expect(useQuickPostStore.getState().groupsError).toBeNull();
    });
  });

  describe("checkAccountSafety", () => {
    it("should update risk level from response", async () => {
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "HIGH",
        dailyPostCount: 15,
        dailyPostLimit: 30,
        cooldownUntil: null,
        canPost: true,
        warningMessage: null,
      });

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-1");
      });

      const state = useQuickPostStore.getState();
      expect(state.accountRiskLevel).toBe("HIGH");
      expect(state.dailyPostCount).toBe(15);
    });

    it("should parse cooldownUntil as Date", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        cooldownUntil: futureDate,
        canPost: true,
        warningMessage: null,
      });

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-1");
      });

      const state = useQuickPostStore.getState();
      expect(state.cooldownUntil).toBeInstanceOf(Date);
    });

    it("should set cooldownUntil to null when not provided", async () => {
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        cooldownUntil: null,
        canPost: true,
        warningMessage: null,
      });

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-1");
      });

      expect(useQuickPostStore.getState().cooldownUntil).toBeNull();
    });

    it("should call updateCanPost after safety check", async () => {
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        cooldownUntil: null,
        canPost: true,
        warningMessage: null,
      });

      const updateCanPostSpy = vi.spyOn(useQuickPostStore.getState(), "updateCanPost");

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-1");
      });

      expect(updateCanPostSpy).toHaveBeenCalled();
    });

    it("should handle checkAccountSafety errors silently", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Safety check failed"));

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-1");
      });

      const state = useQuickPostStore.getState();
      expect(state.accountRiskLevel).toBeNull();
    });

    it("should invoke check_account_posting_safety with accountId", async () => {
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        canPost: true,
      });

      await act(async () => {
        await useQuickPostStore.getState().checkAccountSafety("acc-123");
      });

      expect(mockInvoke).toHaveBeenCalledWith("check_account_posting_safety", {
        accountId: "acc-123",
      });
    });
  });

  describe("startPosting", () => {
    it("should throw when no account selected", async () => {
      useQuickPostStore.setState({
        selectedAccountId: null,
        selectedGroupIds: ["g1"],
      });

      await expect(useQuickPostStore.getState().startPosting()).rejects.toThrow(
        "Missing required selections",
      );
    });

    it("should throw when no groups selected", async () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: [],
      });

      await expect(useQuickPostStore.getState().startPosting()).rejects.toThrow(
        "Missing required selections",
      );
    });

    it("should throw when media validation failed", async () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
      });
      usePostingStore.setState({
        mediaFiles: [
          {
            id: "f1",
            path: "/test",
            fileName: "test.jpg",
            fileSize: 1000,
            format: "jpg",
            validationStatus: "invalid",
          },
        ],
        mediaValidation: new Map([
          [
            "f1",
            {
              valid: false,
              errors: [{ code: "SIZE", message: "Too large", platform: "facebook" }],
              warnings: [],
              fileId: "f1",
            },
          ],
        ]),
      });

      await expect(useQuickPostStore.getState().startPosting()).rejects.toThrow(
        "Media validation failed",
      );
    });

    it("should call postingStore.startSession with correct params", async () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1", "g2"],
        selectedTemplateId: "template-1",
      });
      useTemplateStore.setState({
        templates: [{ ...mockTemplate, id: "template-1" }],
        preview: { content: "Preview content", variation: 1, seed: 123 },
      });
      mockInvoke.mockResolvedValueOnce(mockSession);

      const startSessionSpy = vi.spyOn(usePostingStore.getState(), "startSession");

      await act(async () => {
        await useQuickPostStore.getState().startPosting();
      });

      expect(startSessionSpy).toHaveBeenCalledWith({
        templateId: "template-1",
        accountId: "acc-1",
        groupIds: ["g1", "g2"],
        content: "Preview content",
        mediaPaths: undefined,
      });
    });

    it("should increment template use count after posting", async () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "template-1",
      });
      useTemplateStore.setState({
        templates: [{ ...mockTemplate, id: "template-1" }],
        preview: { content: "Preview", variation: 1, seed: 123 },
      });
      mockInvoke.mockResolvedValueOnce(mockSession);

      const incrementSpy = vi.spyOn(useTemplateStore.getState(), "incrementUseCount");

      await act(async () => {
        await useQuickPostStore.getState().startPosting();
      });

      expect(incrementSpy).toHaveBeenCalledWith("template-1");
    });

    it("should clear media after successful posting", async () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
      });
      usePostingStore.setState({
        mediaFiles: [
          {
            id: "f1",
            path: "/test",
            fileName: "test.jpg",
            fileSize: 1000,
            format: "jpg",
            validationStatus: "valid",
          },
        ],
        mediaValidation: new Map(),
      });
      mockInvoke.mockResolvedValueOnce(mockSession);

      await act(async () => {
        await useQuickPostStore.getState().startPosting();
      });

      expect(usePostingStore.getState().mediaFiles).toEqual([]);
    });
  });

  describe("updateCanPost - edge cases", () => {
    it("should set canPost false when no template and no preview", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: null,
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      expect(useQuickPostStore.getState().canPost).toBe(false);
    });

    it("should set canPost false when no groups selected", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: [],
        selectedTemplateId: "t1",
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      expect(useQuickPostStore.getState().canPost).toBe(false);
    });

    it("should set canPost false when no account selected", () => {
      useQuickPostStore.setState({
        selectedAccountId: null,
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      expect(useQuickPostStore.getState().canPost).toBe(false);
    });

    it("should set canPost false when risk is CRITICAL", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        accountRiskLevel: "CRITICAL",
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      const state = useQuickPostStore.getState();
      expect(state.canPost).toBe(false);
      expect(state.warningMessage).toContain("CRITICAL");
    });

    it("should set canPost false when daily limit reached", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        dailyPostCount: 30,
        dailyPostLimit: 30,
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      const state = useQuickPostStore.getState();
      expect(state.canPost).toBe(false);
      expect(state.warningMessage).toContain("Daily post limit");
    });

    it("should set canPost false when in cooldown", () => {
      const futureDate = new Date(Date.now() + 3600000);
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        cooldownUntil: futureDate,
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      const state = useQuickPostStore.getState();
      expect(state.canPost).toBe(false);
      expect(state.warningMessage).toContain("cooldown");
    });

    it("should set canPost true when all conditions pass", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        accountRiskLevel: "LOW",
        dailyPostCount: 5,
        dailyPostLimit: 30,
      });
      useTemplateStore.setState({
        preview: { content: "Test", variation: 1, seed: 123 },
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      expect(useQuickPostStore.getState().canPost).toBe(true);
    });

    it("should accumulate multiple warnings", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        accountRiskLevel: "CRITICAL",
        dailyPostCount: 30,
        dailyPostLimit: 30,
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      const state = useQuickPostStore.getState();
      expect(state.warningMessage).toContain("CRITICAL");
      expect(state.warningMessage).toContain("Daily post limit");
    });

    it("should clear warningMessage when can post", () => {
      useQuickPostStore.setState({
        selectedAccountId: "acc-1",
        selectedGroupIds: ["g1"],
        selectedTemplateId: "t1",
        accountRiskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        cooldownUntil: null,
        warningMessage: "Old warning",
      });
      useTemplateStore.setState({
        preview: { content: "Test", variation: 1, seed: 123 },
      });

      act(() => {
        useQuickPostStore.getState().updateCanPost();
      });

      expect(useQuickPostStore.getState().warningMessage).toBeNull();
    });
  });

  describe("calculateEstimatedTime - batch break math", () => {
    it("should return 0 when no groups selected", () => {
      useQuickPostStore.setState({ selectedGroupIds: [] });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(0);
    });

    it("should calculate time for single group (no batch break)", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["g1"] });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(180);
    });

    it("should calculate time for 3 groups (no batch break)", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["g1", "g2", "g3"] });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(540);
    });

    it("should add batch break for 4 groups", () => {
      useQuickPostStore.setState({ selectedGroupIds: ["g1", "g2", "g3", "g4"] });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(2520);
    });

    it("should calculate batch breaks correctly for 7 groups", () => {
      useQuickPostStore.setState({
        selectedGroupIds: ["g1", "g2", "g3", "g4", "g5", "g6", "g7"],
      });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(4860);
    });

    it("should calculate multiple batch breaks for 10 groups", () => {
      useQuickPostStore.setState({
        selectedGroupIds: ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10"],
      });

      act(() => {
        useQuickPostStore.getState().calculateEstimatedTime();
      });

      expect(useQuickPostStore.getState().estimatedTime).toBe(7200);
    });
  });

  describe("setSelectedAccount", () => {
    it("should update selectedAccountId", () => {
      act(() => {
        useQuickPostStore.getState().setSelectedAccount("acc-1");
      });

      expect(useQuickPostStore.getState().selectedAccountId).toBe("acc-1");
    });

    it("should call updateCanPost after setting account", () => {
      const updateCanPostSpy = vi.spyOn(useQuickPostStore.getState(), "updateCanPost");

      act(() => {
        useQuickPostStore.getState().setSelectedAccount("acc-1");
      });

      expect(updateCanPostSpy).toHaveBeenCalled();
    });

    it("should call checkAccountSafety when account id provided", async () => {
      mockInvoke.mockResolvedValueOnce({
        riskLevel: "LOW",
        dailyPostCount: 0,
        dailyPostLimit: 30,
        canPost: true,
      });

      await act(async () => {
        useQuickPostStore.getState().setSelectedAccount("acc-1");
      });

      expect(mockInvoke).toHaveBeenCalledWith("check_account_posting_safety", {
        accountId: "acc-1",
      });
    });

    it("should not call checkAccountSafety when null is provided", () => {
      act(() => {
        useQuickPostStore.getState().setSelectedAccount(null);
      });

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });
});
