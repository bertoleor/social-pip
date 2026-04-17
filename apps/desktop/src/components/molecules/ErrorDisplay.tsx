import { cn } from "@/lib/utils";
/**
 * @fileoverview ErrorDisplay - Formatted error message display
 */
import { AlertCircle, AlertTriangle, Ban, Lock, Search, Wifi, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../atoms/Button";

export type ErrorCategory =
  | "rate_limit"
  | "auth_expired"
  | "group_not_found"
  | "permission_denied"
  | "network_error"
  | "facebook_changed"
  | "spam_detected"
  | "unknown";

export interface ErrorDisplayProps {
  error: {
    category: ErrorCategory;
    message: string;
    retryable: boolean;
  };
  onRetry?: () => void;
  className?: string;
}

type ErrorSeverity = "critical" | "recoverable" | "info";

interface ErrorConfig {
  icon: ReactNode;
  severity: ErrorSeverity;
  colorClass: string;
  bgColorClass: string;
  label: string;
}

const errorConfigs: Record<ErrorCategory, ErrorConfig> = {
  rate_limit: {
    icon: <AlertTriangle className="w-5 h-5" data-testid="error-icon-rate_limit" />,
    severity: "recoverable",
    colorClass: "text-yellow-600",
    bgColorClass: "bg-yellow-50",
    label: "Rate Limit",
  },
  auth_expired: {
    icon: <Lock className="w-5 h-5" data-testid="error-icon-auth_expired" />,
    severity: "critical",
    colorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    label: "Authentication Required",
  },
  group_not_found: {
    icon: <Search className="w-5 h-5" data-testid="error-icon-group_not_found" />,
    severity: "critical",
    colorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    label: "Group Not Found",
  },
  permission_denied: {
    icon: <XCircle className="w-5 h-5" data-testid="error-icon-permission_denied" />,
    severity: "critical",
    colorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    label: "Permission Denied",
  },
  network_error: {
    icon: <Wifi className="w-5 h-5" data-testid="error-icon-network_error" />,
    severity: "recoverable",
    colorClass: "text-yellow-600",
    bgColorClass: "bg-yellow-50",
    label: "Network Error",
  },
  facebook_changed: {
    icon: <AlertCircle className="w-5 h-5" data-testid="error-icon-facebook_changed" />,
    severity: "critical",
    colorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    label: "Facebook Changed",
  },
  spam_detected: {
    icon: <Ban className="w-5 h-5" data-testid="error-icon-spam_detected" />,
    severity: "critical",
    colorClass: "text-red-600",
    bgColorClass: "bg-red-50",
    label: "Spam Detected",
  },
  unknown: {
    icon: <AlertCircle className="w-5 h-5" data-testid="error-icon-unknown" />,
    severity: "info",
    colorClass: "text-gray-500",
    bgColorClass: "bg-gray-50",
    label: "Unknown Error",
  },
};

export function ErrorDisplay({ error, onRetry, className }: ErrorDisplayProps): React.ReactElement {
  const config = errorConfigs[error.category];
  const showRetry = error.retryable && onRetry;

  return (
    <div
      data-testid="error-display"
      className={cn(
        "rounded-lg border p-4",
        config.bgColorClass,
        config.severity === "critical" && "border-red-200",
        config.severity === "recoverable" && "border-yellow-200",
        config.severity === "info" && "border-gray-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0", config.colorClass)}>{config.icon}</div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          {/* Category Label */}
          <p className={cn("text-xs font-medium", config.colorClass)}>{config.label}</p>

          {/* Error Message */}
          <p className="text-sm text-gray-900 mt-1">{error.message}</p>
        </div>

        {/* Retry Button */}
        {showRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="flex-shrink-0">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
