import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview sessionStore — client-side session/connectivity state for the FR-10
 * route guard. Probes the Tauri backend and fail-closes to an expired/unreachable
 * state on unauthenticated invokes so protected routes render a session-required UX
 * instead of leaking the raw page.
 */
import { create } from "zustand";

/** Registered lightweight Tauri command used to probe backend session/connectivity. */
export const SESSION_PROBE_COMMAND = "get_autostart_status";

export type SessionStatus = "checking" | "connected" | "expired" | "unreachable";

/** Error substrings that indicate credential/session expiry (fail-close target). */
const AUTH_EXPIRY_PATTERNS = [
  /expired/i,
  /session/i,
  /credential/i,
  /authentication/i,
  /unauthor/i,
  /logged in/i,
  /login required/i,
  /token/i,
];

export function isAuthExpiryError(message: string): boolean {
  return AUTH_EXPIRY_PATTERNS.some((pattern) => pattern.test(message));
}

export function classifyProbeError(message: string): SessionStatus {
  return isAuthExpiryError(message) ? "expired" : "unreachable";
}

export type SessionState = {
  status: SessionStatus;
  error: string | null;
  lastCheckedAt: number | null;
  checkSession: () => Promise<SessionStatus>;
  reportAuthFailure: (message?: string) => void;
  reset: () => void;
};

export const useSessionStore = create<SessionState>()((set, get) => ({
  status: "checking",
  error: null,
  lastCheckedAt: null,

  checkSession: async () => {
    set({ status: "checking", error: null });

    try {
      await invoke(SESSION_PROBE_COMMAND);
      set({ status: "connected", lastCheckedAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = classifyProbeError(message);
      set({
        status,
        error: message,
        lastCheckedAt: Date.now(),
      });
    }

    return get().status;
  },

  reportAuthFailure: (message?: string) => {
    set({
      status: "expired",
      error: message ?? "Authentication/session expired",
    });
  },

  reset: () => {
    set({ status: "checking", error: null, lastCheckedAt: null });
  },
}));
