import { z } from "zod";

export class HostResponseError extends Error {
  constructor(
    public readonly messageType: string,
    message: string,
  ) {
    super(message);
    this.name = "HostResponseError";
  }
}

export const MIN_DELAY_MS = 0;
export const MAX_DELAY_MS = 600_000; // 10 minutes

const booleanResponseSchema = z.boolean();

export function parseHostBoolean(messageType: string, raw: unknown): boolean {
  const parsed = booleanResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HostResponseError(
      messageType,
      `native host response was not a boolean: ${JSON.stringify(raw)}`,
    );
  }
  return parsed.data;
}

const delayResponseSchema = z.number().finite();

export function parseHostDelayMs(messageType: string, raw: unknown): number {
  const parsed = delayResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HostResponseError(
      messageType,
      `native host response was not a finite number: ${JSON.stringify(raw)}`,
    );
  }
  return Math.min(Math.max(parsed.data, MIN_DELAY_MS), MAX_DELAY_MS);
}