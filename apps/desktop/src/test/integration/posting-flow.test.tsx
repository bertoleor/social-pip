import { invoke } from "@tauri-apps/api/core"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { QuickPostPanel } from "@/components/organisms/QuickPostPanel"
import { useAccountsStore } from "@/stores/accountsStore"
import { usePostingStore } from "@/stores/postingStore"
import { useQuickPostStore } from "@/stores/quickPostStore"
import { useTemplateStore } from "@/stores/templateStore"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

const mockConstraints = {
  platform: "facebook",
  maxImages: 10,
  maxSizeBytes: 4 * 1024 * 1024,
  allowedFormats: ["jpg", "png", "gif", "webp"],
  minDimensions: { width: 200, height: 200 },
  maxDimensions: { width: 2048, height: 2048 },
}

describe("Posting Flow Integration", () => {
  const user = userEvent.setup()

  const mockGroups = [
    { id: "group-1", name: "Test Group 1", memberCount: 100 },
    { id: "group-2", name: "Test Group 2", memberCount: 200 },
  ]

  const mockTemplates = [
    {
      id: "template-1",
      name: "Test Template",
      content: "Test content {spin:hello|hi|hey}",
      platforms: ["facebook"],
      sector: "general",
      variants: [],
      imagePaths: [],
      includeLink: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockAccounts = [
    {
      id: "account-1",
      platform: "facebook",
      name: "Test Account",
      username: "testuser",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()

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
    })

    useAccountsStore.setState({
      accounts: [],
      selectedId: null,
      loading: false,
      error: null,
    })

    useTemplateStore.setState({
      templates: [],
      selectedId: null,
      preview: null,
      previewVariations: 0,
      loading: false,
      error: null,
    })

    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      mediaFiles: [],
      mediaValidation: new Map(),
      platformTargets: [],
    })

    mockInvoke.mockImplementation(async (command: string) => {
      if (command === "get_groups_for_posting") return mockGroups
      if (command === "check_account_posting_safety") {
        return {
          riskLevel: "LOW",
          dailyPostCount: 0,
          dailyPostLimit: 30,
          canPost: true,
          warningMessage: null,
        }
      }
      if (command === "start_posting_session") {
        return {
          id: "session-1",
          status: "running",
          accountId: "account-1",
          totalJobs: 2,
          completedJobs: 0,
          successfulJobs: 0,
          failedJobs: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          configSnapshot: "{}",
        }
      }
      if (command === "get_platform_media_constraints") {
        return mockConstraints
      }
      return {}
    })
  })

  describe("User clicks Quick Post - state changes - UI updates", () => {
    it("should render QuickPostPanel and allow template selection", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })

      render(<QuickPostPanel />)

      await waitFor(() => {
        expect(screen.getByText("Select Template")).toBeInTheDocument()
      })

      expect(screen.getByText("Select Groups")).toBeInTheDocument()
      expect(screen.getByText("Select Account")).toBeInTheDocument()
    })

    it("should update store state when user selects template", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })

      render(<QuickPostPanel />)

      await waitFor(() => {
        expect(screen.getByText("Select Template")).toBeInTheDocument()
      })

      await act(async () => {
        useQuickPostStore.getState().setSelectedTemplate("template-1")
      })

      const state = useQuickPostStore.getState()
      expect(state.selectedTemplateId).toBe("template-1")
    })

    it("should update canPost when all selections are made", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })
      useQuickPostStore.setState({ groups: mockGroups })

      render(<QuickPostPanel />)

      await act(async () => {
        useQuickPostStore.getState().setSelectedTemplate("template-1")
        useQuickPostStore.getState().setSelectedGroups(["group-1"])
        useQuickPostStore.getState().setSelectedAccount("account-1")
      })

      await waitFor(() => {
        const state = useQuickPostStore.getState()
        expect(state.canPost).toBe(true)
      })
    })
  })

  describe("Media upload - validation - state propagation", () => {
    it("should track media files in posting store", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })

      render(<QuickPostPanel />)

      await act(async () => {
        usePostingStore.getState().addMediaFiles([
          {
            id: "media-1",
            path: "/test/image.jpg",
            fileName: "image.jpg",
            fileSize: 1024,
            format: "jpg",
            dimensions: { width: 1080, height: 1080 },
            thumbnailUrl: "blob:test",
            validationStatus: "valid",
          },
        ])
      })

      const state = usePostingStore.getState()
      expect(state.mediaFiles).toHaveLength(1)
      expect(state.mediaFiles[0]?.id).toBe("media-1")
    })

    it("should validate media and update validation state", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })

      render(<QuickPostPanel />)

      await act(async () => {
        usePostingStore.getState().addMediaFiles([
          {
            id: "media-1",
            path: "/test/image.jpg",
            fileName: "image.jpg",
            fileSize: 1024,
            format: "jpg",
            dimensions: { width: 1080, height: 1080 },
            thumbnailUrl: "blob:test",
            validationStatus: "valid",
          },
        ])

        usePostingStore.getState().setMediaValidation("media-1", {
          fileId: "media-1",
          valid: true,
          errors: [],
          warnings: [],
          platform: "facebook",
        })
      })

      const validationState = usePostingStore.getState().getMediaValidationState()
      expect(validationState).toBe("valid")
    })

    it("should block posting when media validation fails", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })
      useQuickPostStore.setState({
        groups: mockGroups,
        selectedTemplateId: "template-1",
        selectedGroupIds: ["group-1"],
        selectedAccountId: "account-1",
        canPost: true,
      })

      render(<QuickPostPanel />)

      await act(async () => {
        usePostingStore.getState().addMediaFiles([
          {
            id: "media-1",
            path: "/test/image.jpg",
            fileName: "image.jpg",
            fileSize: 1024,
            format: "jpg",
            dimensions: { width: 1080, height: 1080 },
            thumbnailUrl: "blob:test",
            validationStatus: "invalid",
          },
        ])

        usePostingStore.getState().setMediaValidation("media-1", {
          fileId: "media-1",
          valid: false,
          errors: [{ code: "file_too_large" as never, message: "File too large", platform: "facebook" }],
          warnings: [],
          platform: "facebook",
        })
      })

      await waitFor(() => {
        const postButton = screen.getByRole("button", { name: /fix media validation/i })
        expect(postButton).toBeDisabled()
      })
    })
  })

  describe("Post creation - scheduling - calendar update", () => {
    it("should start posting session when all validations pass", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })
      useQuickPostStore.setState({
        groups: mockGroups,
        selectedTemplateId: "template-1",
        selectedGroupIds: ["group-1", "group-2"],
        selectedAccountId: "account-1",
        canPost: true,
      })

      render(<QuickPostPanel />)

      await act(async () => {
        await useQuickPostStore.getState().startPosting()
      })

      expect(mockInvoke).toHaveBeenCalledWith(
        "start_posting_session",
        expect.objectContaining({
          config: expect.objectContaining({
            account_id: "account-1",
            group_ids: ["group-1", "group-2"],
          }),
        }),
      )
    })

    it("should update posting store with session data", async () => {
      useAccountsStore.setState({ accounts: mockAccounts })
      useTemplateStore.setState({ templates: mockTemplates })
      useQuickPostStore.setState({
        groups: mockGroups,
        selectedTemplateId: "template-1",
        selectedGroupIds: ["group-1"],
        selectedAccountId: "account-1",
        canPost: true,
      })

      render(<QuickPostPanel />)

      await act(async () => {
        await useQuickPostStore.getState().startPosting()
      })

      await waitFor(() => {
        const postingState = usePostingStore.getState()
        expect(postingState.currentSession).not.toBeNull()
        expect(postingState.currentSession?.id).toBe("session-1")
        expect(postingState.isProcessing).toBe(true)
      })
    })
  })
})
