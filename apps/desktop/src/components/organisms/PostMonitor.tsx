import { Button } from "@/components/atoms/Button";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Card } from "@/components/molecules/Card";
import {
  type PostJobStatus as PostJobStatusUI,
  PostStatusCard,
} from "@/components/molecules/PostStatusCard";
import { RetryControls } from "@/components/molecules/RetryControls";
import { usePostingEvents } from "@/hooks/usePostingEvents";
import { cn } from "@/lib/utils";
import { type PostJobStatus, usePostingStore } from "@/stores/postingStore";

export interface PostMonitorProps {
  sessionId: string | null;
  onCancel?: () => void;
  onRetryFailed?: () => void;
  className?: string;
}

function mapJobStatus(status: PostJobStatus): PostJobStatusUI {
  if (status === "processing") return "posting";
  return status;
}

export function PostMonitor({
  sessionId,
  onCancel,
  onRetryFailed,
  className,
}: PostMonitorProps): React.ReactElement {
  const { currentSession, jobs, cancelSession, refreshJobs } = usePostingStore();

  usePostingEvents(sessionId, (event) => {
    console.log("[PostMonitor] Event received:", event.type);
  });

  const handleCancel = async () => {
    await cancelSession();
    onCancel?.();
  };

  const handleRetryFailed = async () => {
    await refreshJobs();
    onRetryFailed?.();
  };

  const progress = currentSession
    ? Math.round((currentSession.completedJobs / currentSession.totalJobs) * 100)
    : 0;
  const isRunning = currentSession?.status === "running";
  const isComplete =
    currentSession?.status === "completed" || currentSession?.status === "cancelled";

  const successCount = jobs.filter((j) => j.status === "success").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const skippedCount = jobs.filter((j) => j.status === "skipped").length;
  const pendingCount = jobs.filter((j) => j.status === "pending").length;
  const processingCount = jobs.filter((j) => j.status === "processing").length;

  if (!currentSession) {
    return (
      <Card className={cn("p-6 text-center text-gray-500", className)}>
        <p>No posting session active</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Posting Progress</h2>
        {isRunning && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="text-red-600 hover:bg-red-50"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <ProgressBar
          value={progress}
          max={100}
          size="lg"
          variant={progress >= 100 ? "success" : "default"}
          showLabel
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {currentSession.completedJobs} of {currentSession.totalJobs} posted
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-green-600">✓ {successCount} success</span>
        {failedCount > 0 && <span className="text-red-600">✗ {failedCount} failed</span>}
        {skippedCount > 0 && <span className="text-gray-500">− {skippedCount} skipped</span>}
        {pendingCount > 0 && <span className="text-gray-400">⏳ {pendingCount} pending</span>}
        {processingCount > 0 && (
          <span className="text-blue-500">⚡ {processingCount} processing</span>
        )}
      </div>

      {isComplete && failedCount > 0 && (
        <RetryControls
          failedCount={failedCount}
          maxRetries={3}
          currentRetries={0}
          onRetryAll={handleRetryFailed}
        />
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {jobs.map((job) => (
          <PostStatusCard
            key={job.id}
            job={{
              id: job.id,
              groupName: job.groupId,
              status: mapJobStatus(job.status),
              duration: job.durationMs,
              postUrl: job.postUrl,
              error: job.errorMessage
                ? {
                    category: job.errorCategory ?? "unknown",
                    message: job.errorMessage,
                    retryable: job.retryCount < job.maxRetries,
                  }
                : undefined,
              retryCount: job.retryCount,
            }}
            onRetry={handleRetryFailed}
          />
        ))}
      </div>

      {isComplete && (
        <div
          className={cn(
            "p-4 rounded-lg text-center",
            currentSession.status === "completed" && failedCount === 0
              ? "bg-green-50 text-green-800"
              : "bg-yellow-50 text-yellow-800",
          )}
        >
          {currentSession.status === "cancelled"
            ? "Posting session cancelled"
            : failedCount === 0
              ? "All posts completed successfully!"
              : `Completed with ${failedCount} failed post${failedCount !== 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}
