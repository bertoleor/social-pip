import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Tests for sessionStore — backend session/connectivity guard state.
 * Covers FR-10: fail-close on unauthenticated invoke, credential expiry, connectivity.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  classifyProbeError,
  isAuthExpiryError,
  SESSION_PROBE_COMMAND,
  useSessionStore,
} from "./sessionStore";

const mockedInvoke = vi.mocked(invoke);

describe("sessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      status: "checking",
      error: null,
      lastCheckedAt: null,
    });
    mockedInvoke.mockReset();
  });

  describe("classifyProbeError / isAuthExpiryError", () => {
    it("classifies credential/session expiry messages as expired", () => {
      expect(isAuthExpiryError("Authentication expired for platform")).toBe(true);
      expect(isAuthExpiryError("Session expired")).toBe(true);
      expect(isAuthExpiryError("Invalid credential")).toBe(true);
      expect(classifyProbeError("Authentication expired")).toBe("expired");
    });

    it("classifies generic/network failures as unreachable", () => {
      expect(isAuthExpiryError("failed to connect to backend")).toBe(false);
      expect(classifyProbeError("backend connection refused")).toBe("unreachable");
    });
  });

  describe("checkSession", () => {
    it("probes the registered session command and sets connected on success", async () => {
      mockedInvoke.mockResolvedValue({ enabled: true });

      const status = await useSessionStore.getState().checkSession();

      expect(mockedInvoke).toHaveBeenCalledWith(SESSION_PROBE_COMMAND);
      expect(status).toBe("connected");
      expect(useSessionStore.getState().status).toBe("connected");
      expect(useSessionStore.getState().error).toBeNull();
    });

    it("fail-closes to expired when the probe rejects with a session/credential error", async () => {
      mockedInvoke.mockRejectedValue("Authentication expired");

      const status = await useSessionStore.getState().checkSession();

      expect(status).toBe("expired");
      expect(useSessionStore.getState().error).toBe("Authentication expired");
    });

    it("fail-closes to unreachable when the probe rejects with a connectivity error", async () => {
      mockedInvoke.mockRejectedValue(new Error("backend unreachable"));

      const status = await useSessionStore.getState().checkSession();

      expect(status).toBe("unreachable");
      expect(useSessionStore.getState().error).toBe("backend unreachable");
    });

    it("flips to checking while a probe is in flight", async () => {
      let resolveProbe: (v: unknown) => void = () => undefined;
      mockedInvoke.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveProbe = resolve;
          }),
      );

      const inflight = useSessionStore.getState().checkSession();
      expect(useSessionStore.getState().status).toBe("checking");

      resolveProbe({ enabled: true });
      await inflight;
      expect(useSessionStore.getState().status).toBe("connected");
    });
  });

  describe("reportAuthFailure", () => {
    it("fail-closes to expired on a reported credential-expiry event", () => {
      useSessionStore.getState().reportAuthFailure("Session expired for facebook");

      expect(useSessionStore.getState().status).toBe("expired");
      expect(useSessionStore.getState().error).toBe("Session expired for facebook");
    });
  });

  describe("reset", () => {
    it("returns the store to the checking state", () => {
      useSessionStore.setState({ status: "expired", error: "boom" });
      useSessionStore.getState().reset();

      expect(useSessionStore.getState().status).toBe("checking");
      expect(useSessionStore.getState().error).toBeNull();
    });
  });
});
