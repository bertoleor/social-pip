import { create } from "zustand";

// Type definition for theme values
export type Theme = "light" | "dark" | "system";

// State interface
export interface UIState {
	sidebarOpen: boolean;
	theme: Theme;
	toggleSidebar: () => void;
	setTheme: (theme: Theme) => void;
}

// Store implementation
export const useUIStore = create<UIState>((set) => ({
	sidebarOpen: true,
	theme: "system",
	toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
	setTheme: (theme) => set({ theme }),
}));
