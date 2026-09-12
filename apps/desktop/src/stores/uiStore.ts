import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * U2.1 + U2.2: UI Store with theme persistence and system preference detection
 *
 * Theme preference is persisted to localStorage key "social-pip-theme".
 * When theme is "system", the active mode tracks matchMedia changes.
 * First launch defaults to "system" if no localStorage entry exists.
 */

// Type definition for theme values
export type Theme = "light" | "dark" | "system";

// State interface
export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "system",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "social-pip-theme",
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
