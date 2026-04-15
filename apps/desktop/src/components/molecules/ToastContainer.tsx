import { cn } from "@/lib/utils";
import type { Toast as ToastType } from "@/stores/toastStore";
import { useToastStore } from "@/stores/toastStore";
import { useEffect, useRef } from "react";
import { Toast } from "../atoms/Toast";

export interface ToastContainerProps {
  className?: string;
}

const AUTO_DISMISS_MS = 5000;

export function ToastContainer({
  className,
}: ToastContainerProps): React.ReactElement {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    toasts.forEach((toast) => {
      if (!timeoutRefs.current.has(toast.id)) {
        const timeoutId = setTimeout(() => {
          removeToast(toast.id);
          timeoutRefs.current.delete(toast.id);
        }, AUTO_DISMISS_MS);

        timeoutRefs.current.set(toast.id, timeoutId);
      }
    });

    const currentIds = new Set(toasts.map((t) => t.id));
    timeoutRefs.current.forEach((_, id) => {
      if (!currentIds.has(id)) {
        const timeoutId = timeoutRefs.current.get(id);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutRefs.current.delete(id);
      }
    });
  }, [toasts, removeToast]);

  const handleDismiss = (toastId: string) => {
    const timeoutId = timeoutRefs.current.get(toastId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(toastId);
    }
    removeToast(toastId);
  };

  return (
    <div
      data-testid="toast-container"
      aria-label="Notifications"
      className={cn(
        "fixed top-4 right-4 z-50",
        "flex flex-col gap-2",
        "w-80 max-w-[calc(100vw-2rem)]",
        "pointer-events-none",
        className
      )}
    >
      {toasts.map((toast: ToastType) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={() => handleDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
