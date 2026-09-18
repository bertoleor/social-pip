// Regression test for FR-08 (content-script-authz).
// Verifies that runtime messages are only honored when the sender is our own
// extension (sender.id === chrome.runtime.id) running on a facebook.com tab
// (sender.url matches), and that unlisted actions are refused.
import { beforeAll, describe, expect, vi } from "vitest";

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | undefined;

let capturedListener: MessageListener | undefined;

// Chrome runtime mock: installed BEFORE the content script is imported,
// because it registers its listener at module top-level. vi.stubGlobal is used
// so that happy-dom's own window.chrome (if any) is fully replaced.
const runtimeMock = {
  runtime: {
    id: "mock-extension-id",
    onMessage: {
      addListener: vi.fn((fn: MessageListener) => {
        capturedListener = fn;
      }),
    },
  },
};

// Dispatch a message through the registered listener and await its response.
async function dispatch(
  message: unknown,
  senderOverride: Record<string, unknown> = {},
): Promise<unknown> {
  const handler = capturedListener as MessageListener;
  if (!handler) throw new Error("listener not registered — import the content script first");
  return new Promise((resolve) => {
    const sender = {
      id: runtimeMock.runtime.id,
      url: "https://www.facebook.com/groups/somegroup/",
      ...senderOverride,
    } as chrome.runtime.MessageSender;
    handler(message, sender, resolve);
  });
}

describe("content/facebook FR-08 sender authz", () => {
  beforeAll(async () => {
    vi.stubGlobal("chrome", runtimeMock);
    // The content script reads window.location only inside its handlers (not at
    // import time). Provide a minimal window so allowlisted paths can run under
    // the lighter node environment (happy-dom's worker hangs on this host).
    if (!(globalThis as Record<string, unknown>).window) {
      vi.stubGlobal("window", {
        location: new URL("https://www.facebook.com/groups/somegroup/"),
      });
    }
    if (!(globalThis as Record<string, unknown>).document) {
      vi.stubGlobal("document", {
        body: { innerText: "" },
      });
    }
    vi.resetModules();
    // Fresh import executes the module and registers the listener against our
    // mock.
    await import("./index");
  });

  it("rejects a sender whose url is not facebook.com", async () => {
    const resp = await dispatch(
      { action: "post_group", content: "hello" },
      { url: "https://evil.example.com/phish" },
    );
    expect(resp).toEqual({ success: false, error: "Unauthorized message sender" });
  });

  it("rejects a sender from a foreign extension id", async () => {
    const resp = await dispatch(
      { action: "post_group", content: "hello" },
      { id: "another-extension-id" },
    );
    expect(resp).toEqual({ success: false, error: "Unauthorized message sender" });
  });

  it("rejects a sender with a missing url", async () => {
    const resp = await dispatch({ action: "post_group" }, { url: undefined });
    expect(resp).toEqual({ success: false, error: "Unauthorized message sender" });
  });

  it("rejects actions outside the allowlist", async () => {
    const resp = await dispatch({ action: "rm -rf /" });
    expect(resp).toEqual({ success: false, error: "Unauthorized message sender" });
  });

  it("honors a trusted sender + allowlisted action without an authz rejection", async () => {
    // Valid extension id + facebook url => the authz gate admits it. We only
    // assert the response is NOT the authz error, proving the gate passed.
    const resp = await dispatch({ action: "check_status" });
    expect(resp).not.toEqual({
      success: false,
      error: "Unauthorized message sender",
    });
  });
});
