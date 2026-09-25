// Social-Pip Extension - Zod schemas for runtime message payloads.
// Security gate (FR-01): every task payload that enters the queue is
// parsed/enforced here BEFORE it can be dispatched to the active tab.
import { z } from "zod";

// ---------------------------------------------------------------------------
// Platform / action allowlists (kept explicit so a new integration needs a
// deliberate PR to extend, not just an unvalidated runtime message).
export const ALLOWED_PLATFORMS = ["facebook"] as const;
export const ALLOWED_ACTIONS = ["post_group", "execute_post"] as const;

// Origin allowlist used by the sender checks in background/index.ts.
export const ALLOWED_WEB_ORIGINS = ["facebook.com", "www.facebook.com"] as const;

const PLATFORM_ENUM = z.enum(ALLOWED_PLATFORMS);
const ACTION_ENUM = z.enum(ALLOWED_ACTIONS);

// Content length is a bounded string so a deflated/“kaboom” payload cannot
// force the worker or a native-messaging hop to allocate unbounded memory.
const CONTENT_MAX = 5000;
const TARGET_MAX = 2048;

// mediaUrls must be plain http(s) — no data:, file:, blob:, javascript: or
// other schemes. This is the allowlist that stops a payload from pointing the
// content script's fetch() at arbitrary local resources or exfil targets.
const MEDIA_URL = z
  .string()
  .url()
  .refine((u) => {
    try {
      const scheme = new URL(u).protocol;
      return scheme === "http:" || scheme === "https:";
    } catch {
      return false;
    }
  }, "mediaUrls must use http(s) only");

// Schema for the `task` object carried by { type: "add_task", task }.
// .strict() rejects unknown keys so a mutation/pollution payload is refused
// instead of silently stripped into the queue.
export const taskSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.literal("add_task"),
    platform: PLATFORM_ENUM,
    action: ACTION_ENUM,
    content: z.string().max(CONTENT_MAX).optional(),
    mediaUrls: z.array(MEDIA_URL).max(10).optional(),
    target: z.string().max(TARGET_MAX).optional(),
    accountId: z.string().min(1).max(256),
    timestamp: z.number().int().nonnegative(),
  })
  .strict();

export type ValidatedTask = z.infer<typeof taskSchema>;

// Full shape accepted on the onMessage wire.
export const addTaskMessageSchema = z
  .object({
    type: z.literal("add_task"),
    task: taskSchema,
  })
  .strict();

export type AddTaskMessage = z.infer<typeof addTaskMessageSchema>;
