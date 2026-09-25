/**
 * In-memory task queue for the Social-Pip extension service worker.
 *
 * Security gate FR-07: post content and media URLs (ValidatedTask.content /
 * ValidatedTask.mediaUrls) must NEVER be written to chrome.storage.local,
 * which is unencrypted at rest and readable by anything with profile-storage
 * access. The queue therefore lives only in service-worker memory and is
 * emptied as tasks are removed/processed — no disk, no extension storage.
 *
 * NOTE (lifecycle): a MV3 service worker can be torn down at any time, which
 * loses a still-queued task. That is an accepted trade-off of FR-07: better a
 * dropped task than post content persisted in plaintext. Producers re-submit.
 */
import type { ValidatedTask } from "./taskSchema";

export type TaskMessage = ValidatedTask;

// Hard cap so an enqueue flood cannot grow the in-memory list unboundedly.
export const MAX_QUEUE_LENGTH = 1000;

// Single in-memory source of truth. Never persisted.
let taskQueue: TaskMessage[] = [];

export function getTaskQueue(): TaskMessage[] {
  return taskQueue;
}

/** Returns false (and refrains from enqueueing) when the queue is full. */
export function addTaskToQueue(task: TaskMessage): boolean {
  if (taskQueue.length >= MAX_QUEUE_LENGTH) {
    return false;
  }
  taskQueue.push(task);
  return true;
}

export function removeTaskFromQueue(taskId: string): void {
  taskQueue = taskQueue.filter((t) => t.id !== taskId);
}

export function clearTaskQueue(): void {
  taskQueue = [];
}

export function taskQueueLength(): number {
  return taskQueue.length;
}
