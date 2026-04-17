/**
 * @fileoverview RetryControls - Controls for retrying failed posts
 */
import { cn } from "@/lib/utils";
import { Button } from "../atoms/Button";

export interface RetryControlsProps {
  failedCount: number;
  maxRetries: number;
  currentRetries: number;
  onRetryAll: () => void;
  disabled?: boolean;
  className?: string;
}

export function RetryControls({
  failedCount,
  maxRetries,
  currentRetries,
  onRetryAll,
  disabled = false,
  className,
}: RetryControlsProps): React.ReactElement | null {
  // Don't render if no failures
  if (failedCount === 0) {
    return null;
  }

  const retriesRemaining = maxRetries - currentRetries;
  const isMaxRetriesReached = retriesRemaining <= 0;
  const isDisabled = disabled || isMaxRetriesReached;

  return (
    <div
      data-testid="retry-controls"
      className={cn("bg-yellow-50 border border-yellow-200 rounded-lg p-4", className)}
    >
      <div className="flex items-center justify-between">
        {/* Status Message */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-yellow-800">
            <strong>{failedCount} failed</strong>
          </span>
          <span className="text-sm text-yellow-700">{retriesRemaining} retries remaining</span>
        </div>

        {/* Retry All Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRetryAll}
          disabled={isDisabled}
          className="flex-shrink-0"
        >
          Retry All
        </Button>
      </div>
    </div>
  );
}
