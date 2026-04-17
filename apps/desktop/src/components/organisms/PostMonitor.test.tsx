import { PostMonitor } from "@/components/organisms/PostMonitor";
import * as postingStore from "@/stores/postingStore";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

vi.mock("@/hooks/usePostingEvents", () => ({
  usePostingEvents: vi.fn(() => ({
    isConnected: true,
    error: null,
  })),
}));

const mockSession = {
  id: "session_001",
  status: "running" as const,
  accountId: "acc_001",
  totalJobs: 5,
  completedJobs: 2,
  successfulJobs: 2,
  failedJobs: 0,
  configSnapshot: "{}",
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:05:00Z"),
};

const mockCompletedSession = {
  id: "session_002",
  status: "completed" as const,
  accountId: "acc_001",
  totalJobs: 5,
  completedJobs: 5,
  successfulJobs: 5,
  failedJobs: 0,
  configSnapshot: "{}",
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:10:00Z"),
};

const mockCancelledSession = {
  id: "session_003",
  status: "cancelled" as const,
  accountId: "acc_001",
  totalJobs: 5,
  completedJobs: 3,
  successfulJobs: 3,
  failedJobs: 0,
  cancelledAt: new Date("2026-04-15T10:07:00Z"),
  configSnapshot: "{}",
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:07:00Z"),
};

const mockSessionWithFailures = {
  id: "session_004",
  status: "completed" as const,
  accountId: "acc_001",
  totalJobs: 5,
  completedJobs: 5,
  successfulJobs: 3,
  failedJobs: 2,
  configSnapshot: "{}",
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:10:00Z"),
};

const mockSuccessJob = {
  id: "job_001",
  sessionId: "session_001",
  groupId: "group_001",
  platform: "facebook",
  priority: 1,
  content: "Test post content",
  status: "success" as const,
  postUrl: "https://facebook.com/posts/123",
  durationMs: 5000,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:00:05Z"),
};

const mockPendingJob = {
  id: "job_002",
  sessionId: "session_001",
  groupId: "group_001",
  platform: "facebook",
  priority: 2,
  content: "Test post content 2",
  status: "pending" as const,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:00:00Z"),
};

const mockProcessingJob = {
  id: "job_003",
  sessionId: "session_001",
  groupId: "group_002",
  platform: "facebook",
  priority: 3,
  content: "Test post content 3",
  status: "processing" as const,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:00:00Z"),
};

const mockFailedJob = {
  id: "job_004",
  sessionId: "session_001",
  groupId: "group_003",
  platform: "facebook",
  priority: 4,
  content: "Test post content 4",
  status: "failed" as const,
  errorMessage: "Rate limit exceeded",
  errorCategory: "rate_limit",
  durationMs: 3000,
  retryCount: 3,
  maxRetries: 3,
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:00:03Z"),
};

const mockSkippedJob = {
  id: "job_005",
  sessionId: "session_001",
  groupId: "group_004",
  platform: "facebook",
  priority: 5,
  content: "Test post content 5",
  status: "skipped" as const,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date("2026-04-15T10:00:00Z"),
  updatedAt: new Date("2026-04-15T10:00:00Z"),
};

describe("PostMonitor", () => {
  const mockOnCancel = vi.fn();
  const mockOnRetryFailed = vi.fn();
  let mockCancelSession: ReturnType<typeof vi.fn>;
  let mockRefreshJobs: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCancelSession = vi.fn().mockResolvedValue(undefined);
    mockRefreshJobs = vi.fn().mockResolvedValue(undefined);
  });

  describe("status display", () => {
    it("shows no session message when no active session", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: null,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId={null} />);

      expect(screen.getByText("No posting session active")).toBeInTheDocument();
    });

    it("shows posting progress header when session is active", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText("Posting Progress")).toBeInTheDocument();
    });
  });

  describe("progress tracking", () => {
    it("shows progress bar with correct value", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("shows completed vs total jobs count", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText("2 of 5 posted")).toBeInTheDocument();
    });

    it("shows 100% progress when complete", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockCompletedSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_002" />);

      expect(screen.getByText("5 of 5 posted")).toBeInTheDocument();
    });
  });

  describe("job counts display", () => {
    it("shows success count", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob, { ...mockSuccessJob, id: "job_002" }],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText(/2 success/)).toBeInTheDocument();
    });

    it("shows failed count when there are failures", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob, mockFailedJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText(/1 failed/)).toBeInTheDocument();
    });

    it("does not show failed count when zero failures", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    });

    it("shows pending count when there are pending jobs", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob, mockPendingJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText(/1 pending/)).toBeInTheDocument();
    });

    it("shows processing count when jobs are processing", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob, mockProcessingJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText(/1 processing/)).toBeInTheDocument();
    });

    it("shows skipped count when jobs are skipped", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockSuccessJob, mockSkippedJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByText(/1 skipped/)).toBeInTheDocument();
    });
  });

  describe("error display", () => {
    it("shows error message for failed jobs", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSessionWithFailures,
        jobs: [mockFailedJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_004" />);

      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });

    it("shows completion message with failed count", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: {
          ...mockSessionWithFailures,
          failedJobs: 2,
        },
        jobs: [mockFailedJob, { ...mockFailedJob, id: "job_006" }],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_004" />);

      expect(screen.getByText(/Completed with 2 failed posts/)).toBeInTheDocument();
    });
  });

  describe("cancel action", () => {
    it("shows cancel button when session is running", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" onCancel={mockOnCancel} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not show cancel button when session is complete", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockCompletedSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_002" />);

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("calls cancelSession when cancel button clicked", async () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      const user = userEvent.setup();
      render(<PostMonitor sessionId="session_001" onCancel={mockOnCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockCancelSession).toHaveBeenCalled();
    });
  });

  describe("retry action", () => {
    it("shows retry controls when session complete with failures", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSessionWithFailures,
        jobs: [mockFailedJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_004" onRetryFailed={mockOnRetryFailed} />);

      expect(screen.getByTestId("retry-controls")).toBeInTheDocument();
    });

    it("does not show retry controls when session is running", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [mockFailedJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.queryByTestId("retry-controls")).not.toBeInTheDocument();
    });

    it("does not show retry controls when no failures", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockCompletedSession,
        jobs: [mockSuccessJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_002" />);

      expect(screen.queryByTestId("retry-controls")).not.toBeInTheDocument();
    });
  });

  describe("completion states", () => {
    it("shows success message when all posts complete successfully", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockCompletedSession,
        jobs: [mockSuccessJob],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_002" />);

      expect(screen.getByText("All posts completed successfully!")).toBeInTheDocument();
    });

    it("shows cancelled message when session is cancelled", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockCancelledSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_003" />);

      expect(screen.getByText("Posting session cancelled")).toBeInTheDocument();
    });

    it("shows completion with failures message", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSessionWithFailures,
        jobs: [mockFailedJob, { ...mockFailedJob, id: "job_006" }],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_004" />);

      expect(screen.getByText(/Completed with 2 failed posts/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      expect(screen.getByRole("heading", { name: "Posting Progress" })).toBeInTheDocument();
    });

    it("cancel button has proper styling for visibility", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toHaveClass("text-red-600");
    });
  });

  describe("custom className", () => {
    it("applies custom className to container", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: mockSession,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId="session_001" className="custom-monitor" />);

      const container = screen.getByText("Posting Progress").closest(".custom-monitor");
      expect(container).toBeInTheDocument();
    });

    it("applies custom className to no session message", () => {
      vi.spyOn(postingStore, "usePostingStore").mockImplementation(() => ({
        currentSession: null,
        jobs: [],
        cancelSession: mockCancelSession,
        refreshJobs: mockRefreshJobs,
      }));

      render(<PostMonitor sessionId={null} className="custom-class" />);

      const card = screen.getByText("No posting session active").closest(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });
});
