/**
 * FR-05 native host response validation tests (RED-first).
 * Responses from chrome.runtime.connectNative() are untrusted: they were cast
 * (`as number` / `as boolean`) and consumed as raw truthiness, letting a
 * malicious/corrupt host schedule arbitrarily. Rules enforced:
 *   - check_can_post / should_break -> bare boolean (fail closed otherwise)
 *   - get_next_delay -> finite number, clamped into [MIN_DELAY_MS, MAX_DELAY_MS]
 */
import { describe, expect, it } from "vitest";
import {
  HostResponseError,
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  parseHostBoolean,
  parseHostDelayMs,
} from "./nativeHostSchema";

describe("parseHostBoolean (check_can_post / should_break)", () => {
  it("accepts a real boolean and returns it", () => {
    expect(parseHostBoolean("check_can_post", true)).toBe(true);
    expect(parseHostBoolean("should_break", false)).toBe(false);
  });

  it("rejects a truthy string instead of coalescing", () => {
    expect(() => parseHostBoolean("check_can_post", "true")).toThrow(
      HostResponseError,
    );
  });

  it("rejects an object / number / null / undefined", () => {
    expect(() => parseHostBoolean("check_can_post", {})).toThrow(
      HostResponseError,
    );
    expect(() => parseHostBoolean("should_break", 1)).toThrow(
      HostResponseError,
    );
    expect(() => parseHostBoolean("should_break", null)).toThrow(
      HostResponseError,
    );
    expect(() => parseHostBoolean("should_break", undefined)).toThrow(
      HostResponseError,
    );
  });

  it("throws HostResponseError with the message type", () => {
    try {
      parseHostBoolean("check_can_post", "maybe");
      throw new Error("should not reach here");
    } catch (error) {
      expect(error).toBeInstanceOf(HostResponseError);
      if (error instanceof HostResponseError) {
        expect(error.messageType).toBe("check_can_post");
      }
    }
  });
});

describe("parseHostDelayMs (get_next_delay)", () => {
  it("returns a normal finite delay unchanged", () => {
    expect(parseHostDelayMs("get_next_delay", 60_000)).toBe(60_000);
  });

  it("clamps a huge delay down to MAX_DELAY_MS", () => {
    expect(parseHostDelayMs("get_next_delay", 2 ** 53)).toBe(MAX_DELAY_MS);
    expect(parseHostDelayMs("get_next_delay", 99_999_999_999)).toBe(
      MAX_DELAY_MS,
    );
  });

  it("clamps a negative delay up to MIN_DELAY_MS", () => {
    expect(parseHostDelayMs("get_next_delay", -50_000)).toBe(MIN_DELAY_MS);
  });

  it("rejects a numeric string instead of coercing", () => {
    expect(() => parseHostDelayMs("get_next_delay", "5000")).toThrow(
      HostResponseError,
    );
  });

  it("rejects NaN / Infinity / non-number", () => {
    expect(() => parseHostDelayMs("get_next_delay", NaN)).toThrow(
      HostResponseError,
    );
    expect(() => parseHostDelayMs("get_next_delay", Infinity)).toThrow(
      HostResponseError,
    );
    expect(() => parseHostDelayMs("get_next_delay", null)).toThrow(
      HostResponseError,
    );
  });

  it("keeps zero (valid floor) and returns it", () => {
    expect(parseHostDelayMs("get_next_delay", 0)).toBe(0);
  });
});