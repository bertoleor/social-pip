import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@social-pip/types";

export interface TaskStatusIndicatorProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  {
    variant: "success" | "warning" | "error" | "info" | "neutral";
    label: string;
  }
> = {
  pending: { variant: "neutral", label: "Pending" },
  running: { variant: "info", label: "Running" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "error", label: "Failed" },
  cancelled: { variant: "warning", label: "Cancelled" },
};

export function TaskStatusIndicator({
  status,
  className,
}: TaskStatusIndicatorProps): React.ReactElement {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn("text-xs", className)}>
      {config.label}
    </Badge>
  );
}
