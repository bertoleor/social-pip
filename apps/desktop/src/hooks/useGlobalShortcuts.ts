import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";

export const SHORTCUT_EVENTS = {
  NEW_POST: "shortcut:new-post",
  SAVE: "shortcut:save",
  QUIT: "shortcut:quit",
  SETTINGS: "shortcut:settings",
} as const;

export interface ShortcutEventPayload {
  shortcut_id: string;
  event_name: string;
}

export interface ShortcutHandlers {
  onNewPost: () => void;
  onSave: () => void;
  onQuit: () => void;
  onSettings: () => void;
}

export interface UseGlobalShortcutsOptions {
  enabled?: boolean;
  onNewPost?: () => void;
  onSave?: () => void;
  onQuit?: () => void;
  onSettings?: () => void;
}

export interface UseGlobalShortcutsReturn {
  isListening: boolean;
  handlers: ShortcutHandlers;
}

export function useGlobalShortcuts(
  options: UseGlobalShortcutsOptions = {},
): UseGlobalShortcutsReturn {
  const { enabled = true, onNewPost, onSave, onQuit, onSettings } = options;

  const [isListening, setIsListening] = useState(false);

  const handlers: ShortcutHandlers = useMemo(
    () => ({
      onNewPost: (): void => {
        onNewPost?.();
      },
      onSave: (): void => {
        onSave?.();
      },
      onQuit: (): void => {
        onQuit?.();
      },
      onSettings: (): void => {
        onSettings?.();
      },
    }),
    [onNewPost, onSave, onQuit, onSettings],
  );

  useEffect(() => {
    if (!enabled) {
      setIsListening(false);
      return;
    }

    const unlisteners: UnlistenFn[] = [];

    async function setupListeners() {
      try {
        const unlistenNewPost = await listen<ShortcutEventPayload>(SHORTCUT_EVENTS.NEW_POST, () => {
          handlers.onNewPost();
        });
        unlisteners.push(unlistenNewPost);

        const unlistenSave = await listen<ShortcutEventPayload>(SHORTCUT_EVENTS.SAVE, () => {
          handlers.onSave();
        });
        unlisteners.push(unlistenSave);

        const unlistenQuit = await listen<ShortcutEventPayload>(SHORTCUT_EVENTS.QUIT, () => {
          handlers.onQuit();
        });
        unlisteners.push(unlistenQuit);

        const unlistenSettings = await listen<ShortcutEventPayload>(
          SHORTCUT_EVENTS.SETTINGS,
          () => {
            handlers.onSettings();
          },
        );
        unlisteners.push(unlistenSettings);

        setIsListening(true);
      } catch (error) {
        console.error("Failed to register global shortcuts:", error);
        setIsListening(false);
      }
    }

    setupListeners();

    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
      setIsListening(false);
    };
  }, [enabled, handlers]);

  return {
    isListening,
    handlers,
  };
}
