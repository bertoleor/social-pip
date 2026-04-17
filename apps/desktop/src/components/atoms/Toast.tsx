import { cn } from "@/lib/utils";
import type { ToastType } from "@/stores/toastStore";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import type { HTMLAttributes } from "react";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: () => void;
}

interface ToastConfig {
  icon: React.ReactNode;
  bgColorClass: string;
  borderColorClass: string;
  iconColorClass: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" data-testid="toast-icon-success" />,
    bgColorClass: "bg-green-50",
    borderColorClass: "border-green-200",
    iconColorClass: "text-green-600",
  },
  error: {
    icon: <XCircle className="w-5 h-5" data-testid="toast-icon-error" />,
    bgColorClass: "bg-red-50",
    borderColorClass: "border-red-200",
    iconColorClass: "text-red-600",
  },
  info: {
    icon: <Info className="w-5 h-5" data-testid="toast-icon-info" />,
    bgColorClass: "bg-blue-50",
    borderColorClass: "border-blue-200",
    iconColorClass: "text-blue-600",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" data-testid="toast-icon-warning" />,
    bgColorClass: "bg-yellow-50",
    borderColorClass: "border-yellow-200",
    iconColorClass: "text-yellow-600",
  },
};

export function Toast({
  id,
  type,
  message,
  onDismiss,
  className,
  ...props
}: ToastProps): React.ReactElement {
  const config = toastConfigs[type];

  return (
    <div
      data-testid={`toast-${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg",
        config.bgColorClass,
        config.borderColorClass,
        className,
      )}
      {...props}
    >
      <div className={cn("flex-shrink-0", config.iconColorClass)}>{config.icon}</div>

      <p className="flex-grow text-sm text-gray-900">{message}</p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
