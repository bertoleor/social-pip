/**
 * @fileoverview Tests for useTheme hook
 * Verifies theme synchronization with the DOM
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    // Reset store and DOM
    useUIStore.setState({ theme: "system" });
    document.documentElement.classList.remove("dark");
  });

  describe("dark theme application", () => {
    it("adds .dark class to documentElement when theme is dark", () => {
      useUIStore.setState({ theme: "dark" });

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("light theme application", () => {
    it("removes .dark class from documentElement when theme is light", () => {
      document.documentElement.classList.add("dark");
      useUIStore.setState({ theme: "light" });

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("system theme resolution", () => {
    it("adds .dark class when system prefers dark and theme is system", () => {
      // Mock matchMedia to return dark preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      useUIStore.setState({ theme: "system" });

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes .dark class when system prefers light and theme is system", () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      Object.defineProperty(window, "matchMedia", {
        value: mockMatchMedia,
        writable: true,
      });

      useUIStore.setState({ theme: "system" });

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("theme changes", () => {
    it("updates DOM class when theme changes in store", () => {
      const { rerender } = renderHook(() => useTheme());

      // Start with light
      act(() => {
        useUIStore.getState().setTheme("light");
      });
      rerender();
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      // Switch to dark
      act(() => {
        useUIStore.getState().setTheme("dark");
      });
      rerender();
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
