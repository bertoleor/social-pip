import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Tests for SessionGuard route guard.
 * FR-10: guard must fail-close on unauthenticated invoke, render loading while
 * checking, render children when session is connected, and surface retry UX.
 */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionStore } from "@/stores/sessionStore";
import { SessionGuard } from "./SessionGuard";

const mockedInvoke = vi.mocked(invoke);

function renderGuard(): void {
  const ui = (
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<SessionGuard />}>
          <Route path="/dashboard" element={<div data-testid="protected-content">PROTECTED</div>} />
        </Route>
        <Route path="/login" element={<div data-testid="login">LOGIN</div>} />
      </Routes>
    </MemoryRouter>
  ) as ReactElement;
  render(ui);
}

describe("SessionGuard", () => {
  beforeEach(() => {
    useSessionStore.setState({
      status: "checking",
      error: null,
      lastCheckedAt: null,
    });
    mockedInvoke.mockReset();
  });

  it("shows a loading state while the session is being checked", () => {
    mockedInvoke.mockImplementation(() => new Promise(() => undefined));

    renderGuard();

    expect(screen.getByTestId("session-guard-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders protected children when the backend session is connected", async () => {
    mockedInvoke.mockResolvedValue({ enabled: true });

    renderGuard();

    expect(await screen.findByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByTestId("session-guard-loading")).not.toBeInTheDocument();
  });

  it("fail-closes to a session-required screen when the invoke is unauthenticated (expired)", async () => {
    mockedInvoke.mockRejectedValue("Authentication expired for platform");

    renderGuard();

    expect(await screen.findByTestId("session-required")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("session-guard-loading")).not.toBeInTheDocument();
  });

  it("fail-closes when the backend is unreachable", async () => {
    mockedInvoke.mockRejectedValue(new Error("backend unreachable"));

    renderGuard();

    expect(await screen.findByTestId("session-required")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders the fail-closed screen with a retry that re-probes without navigating away", async () => {
    let attempts = 0;
    mockedInvoke.mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw "Session expired";
      }
      return { enabled: true };
    });

    renderGuard();

    const required = await screen.findByTestId("session-required");
    expect(required).toBeInTheDocument();

    const retry = screen.getByRole("button", { name: /retry/i });
    retry.click();

    expect(await screen.findByTestId("protected-content")).toBeInTheDocument();
    expect(attempts).toBe(2);
  }, 30000);

  it("exposes an outbox for the fail-closed message", async () => {
    mockedInvoke.mockRejectedValue("Session expired");

    renderGuard();

    const required = await screen.findByTestId("session-required");
    expect(required.textContent).toContain("Session expired");
  });
});
