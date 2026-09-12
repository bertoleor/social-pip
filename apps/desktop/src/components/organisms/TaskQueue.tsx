import { Button } from "@/components/atoms/Button";
import { PlatformIcon } from "@/components/atoms/PlatformIcon";
import { TaskStatusIndicator } from "@/components/atoms/TaskStatusIndicator";
import { cn } from "@/lib/utils";
import type { Task } from "@social-pip/types";
import { Clock, Play, RefreshCw, XCircle } from "lucide-react";
import { type ChangeEvent, useState } from "react";

export interface TaskQueueProps {
  tasks: Task[];
  loading?: boolean;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function TaskCard({
  task,
  onCancel,
  onRetry,
  onSelect,
  isSelected,
}: {
  task: Task;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected: boolean;
}): React.ReactElement {
  const handleCancel = (): void => {
    if (onCancel !== undefined) {
      onCancel(task.id);
    }
  };

  const handleRetry = (): void => {
    if (onRetry !== undefined) {
      onRetry(task.id);
    }
  };

  const handleSelect = (): void => {
    if (onSelect !== undefined) {
      onSelect(task.id);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300 bg-white",
      )}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleSelect();
        }
      }}
      // biome-ignore lint/a11y/useSemanticElements: role="button" is intentional for custom styling requirements
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={task.platform} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm capitalize">{task.type}</span>
              <TaskStatusIndicator status={task.status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(task.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.status === "pending" || task.status === "running" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              aria-label="Cancel task"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          ) : null}

          {task.status === "failed" && onRetry !== undefined ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              aria-label="Retry task"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {task.status === "running" ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Play className="h-3 w-3 animate-pulse" />
            <span>Processing...</span>
          </div>
        </div>
      ) : null}

      {task.errorMessage !== undefined ? (
        <div className="mt-2 text-xs text-red-600">{task.errorMessage}</div>
      ) : null}
    </div>
  );
}

export function TaskQueue({
  tasks,
  loading = false,
  onCancel,
  onRetry,
  onSelect,
  selectedId,
  className,
}: TaskQueueProps): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-4 mb-4">
          <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeletons are static and don't reorder
              key={i}
              className="h-24 bg-gray-100 animate-pulse rounded-lg border border-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="flex flex-col items-center">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No tasks in queue</p>
          <p className="text-sm text-gray-400 mt-1">Tasks will appear here when scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks match your filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCancel={onCancel}
              onRetry={onRetry}
              onSelect={onSelect}
              isSelected={task.id === selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
