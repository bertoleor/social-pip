import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Check, Clock } from "lucide-react";
import type { HTMLAttributes } from "react";

type ValidationStatus = "pending" | "valid" | "invalid" | "warning";

interface ValidationError {
  code: string;
  message: string;
}

export interface MediaConstraintBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: ValidationStatus;
  errors?: ValidationError[];
}

const statusConfig: Record<
  ValidationStatus,
  { icon: typeof Check; label: string; className: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-gray-100 text-gray-700",
  },
  valid: {
    icon: Check,
    label: "Valid",
    className: "bg-green-100 text-green-700",
  },
  invalid: {
    icon: AlertCircle,
    label: "Invalid",
    className: "bg-red-100 text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className: "bg-yellow-100 text-yellow-700",
  },
};

export function MediaConstraintBadge({
  status,
  errors,
  className,
  ...props
}: MediaConstraintBadgeProps): React.ReactElement {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
        config.className,
        className,
      )}
      {...props}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      {errors && errors.length > 0 && (
        <span className="sr-only">{errors.map((e) => e.message).join(", ")}</span>
      )}
    </span>
  );
}
