/**
 * @file In-memory task queue (security gate FR-07).
 * TDD: RED phase - context is that the queue previously persisted full
 * TaskMessage objects (incl. content/mediaUrls) to chrome.storage.local,
 * which is unencrypted at rest. The required behavior: the queue lives only
 * in service-worker memory and is emptied as tasks are removed — no
 * chrome.storage.local call, so post content/URLs never touch disk.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addTaskToQueue,
  clearTaskQueue,
  getTaskQueue,
  removeTaskFromQueue,
  taskQueueLength,
} from "./queue";
import type { ValidatedTask } from "./taskSchema";

// Ensure the module under test never depends on global chrome.storage.
vi.stubGlobal("chrome", undefined);

afterEach(() => {
  clearTaskQueue();
  vi.restoreAllMocks();
});

function makeTask(over: Partial<ValidatedTask> = {}): ValidatedTask {
  return {
    id: "task-1",
    type: "add_task",
    platform: "facebook",
    action: "post_group",
    content: "sensitive post body",
    mediaUrls: ["https://cdn.example.com/img.jpg"],
    accountId: "acc-1",
    timestamp: 1700000000000,
    ...over,
  };
}

describe("in-memory task queue (FR-07)", () => {
  it("stores the full task (incl. content/media) in memory", () => {
    addTaskToQueue(makeTask());
    expect(taskQueueLength()).toBe(1);
    const q = getTaskQueue();
    expect(q[0].content).toBe("sensitive post body");
    expect(q[0].mediaUrls).toEqual(["https://cdn.example.com/img.jpg"]);
  });

  it("removes a task by id and shrinks the queue", () => {
    addTaskToQueue(makeTask({ id: "a" }));
    addTaskToQueue(makeTask({ id: "b" }));
    removeTaskFromQueue("a");
    expect(taskQueueLength()).toBe(1);
    expect(getTaskQueue()[0].id).toBe("b");
  });

  it("clears the queue completely", () => {
    addTaskToQueue(makeTask({ id: "a" }));
    addTaskToQueue(makeTask({ id: "b" }));
    clearTaskQueue();
    expect(taskQueueLength()).toBe(0);
  });

  it("is purely in-memory: never calls chrome.storage.local", () => {
    // Guard: the whole point of FR-07 is that no content/media is persisted.
    // The module runs with chrome stubbed to undefined (see top of file); if
    // storage were referenced this would throw. Enqueue + dequeue round-trips
    // prove the queue works with zero storage dependency.
    expect(() => addTaskToQueue(makeTask())).not.toThrow();
    expect(() => removeTaskFromQueue("task-1")).not.toThrow();
    expect(taskQueueLength()).toBe(0);
  });
});
