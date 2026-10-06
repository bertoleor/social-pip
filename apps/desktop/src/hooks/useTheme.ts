/**
 * U2.3: useTheme hook
 *
 * Synchronizes useUIStore.theme to the DOM by adding/removing
 * the `.dark` class on document.documentElement.
 * Resolves "system" to actual mode via matchMedia.
 */

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";

/**
 * Resolves the effective theme (light/dark) from the stored preference.
 * "system" is resolved via matchMedia("(prefers-color-scheme: dark)").
 */
export function resolveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light"; // Fallback when matchMedia is unavailable
  }
  return theme;
}

/**
 * Hook that synchronizes the theme preference from useUIStore
 * to the DOM by adding/removing `.dark` class on documentElement.
 *
 * Also subscribes to system preference changes when theme is "system".
 */
export function useTheme(): void {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = resolveTheme(theme);

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Subscribe to system preference changes when theme is "system"
    if (theme === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent): void => {
        if (e.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    return undefined;
  }, [theme]);
}
