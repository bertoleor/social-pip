import { useCallback } from "react";
import { useToastStore } from "@/stores/toastStore";

export interface UseToastReturn {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export function useToast(): UseToastReturn {
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearAll = useToastStore((state) => state.clearAll);

  const success = useCallback(
    (message: string) => {
      addToast({ type: "success", message });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string) => {
      addToast({ type: "error", message });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string) => {
      addToast({ type: "info", message });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string) => {
      addToast({ type: "warning", message });
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  const dismissAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return {
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  };
}
