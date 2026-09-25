/**
 * @file Security gate tests for the task payload schema (FR-01).
 * Race the sandbox against the allowlists: only well-formed, explicitly
 * allowed task payloads may reach the queue.
 */
import { describe, expect, it } from "vitest";
import { ALLOWED_ACTIONS, ALLOWED_PLATFORMS, addTaskMessageSchema } from "./taskSchema";

const baseTask = {
  id: "abc-123",
  type: "add_task",
  platform: "facebook",
  action: "post_group",
  content: "Hello world",
  accountId: "fb_100",
  timestamp: 1700000000000,
} as const;

function wrap(task: unknown) {
  return { type: "add_task", task };
}

describe("taskSchema (FR-01 payload validation)", () => {
  it("accepts a fully valid add_task payload", () => {
    const msg = wrap({
      ...baseTask,
      mediaUrls: ["https://cdn.example.com/img.jpg"],
      target: "https://facebook.com/groups/123",
    });
    const res = addTaskMessageSchema.safeParse(msg);
    expect(res.success).toBe(true);
  });

  it("accepts a minimal valid task (no optional fields)", () => {
    const res = addTaskMessageSchema.safeParse(wrap(baseTask));
    expect(res.success).toBe(true);
  });

  it("is strict: rejects unknown keys", () => {
    const res = addTaskMessageSchema.safeParse(
      wrap({ ...baseTask, __proto__: { polluted: true }, extra: "x" }),
    );
    expect(res.success).toBe(false);
  });

  it("rejects a platform outside the allowlist", () => {
    const res = addTaskMessageSchema.safeParse(wrap({ ...baseTask, platform: "unknown-site" }));
    expect(res.success).toBe(false);
  });

  it("rejects an action outside the allowlist", () => {
    const res = addTaskMessageSchema.safeParse(wrap({ ...baseTask, action: "delete_account" }));
    expect(res.success).toBe(false);
  });

  it("rejects oversized content", () => {
    const res = addTaskMessageSchema.safeParse(wrap({ ...baseTask, content: "x".repeat(5001) }));
    expect(res.success).toBe(false);
  });

  it("rejects non-http(s) mediaUrls (data:, file:, javascript:)", () => {
    for (const url of [
      "data:text/plain;base64,ABC",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "blob:https://x/y",
    ]) {
      const res = addTaskMessageSchema.safeParse(wrap({ ...baseTask, mediaUrls: [url] }));
      expect(res.success).toBe(false);
    }
  });

  it("rejects a mediaUrls list above the cap", () => {
    const many = Array.from({ length: 11 }, (_, i) => `https://x.com/${i}.jpg`);
    const res = addTaskMessageSchema.safeParse(wrap({ ...baseTask, mediaUrls: many }));
    expect(res.success).toBe(false);
  });

  it("rejects a non-object message", () => {
    expect(addTaskMessageSchema.safeParse("add_task").success).toBe(false);
    expect(addTaskMessageSchema.safeParse(null).success).toBe(false);
  });

  it("keeps platform and action allowlists coherent with the content script", () => {
    // post_group / execute_post are the actions content/facebook handles.
    expect([...ALLOWED_ACTIONS]).toEqual(["post_group", "execute_post"]);
    expect([...ALLOWED_PLATFORMS]).toEqual(["facebook"]);
  });
});
