import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "./uiStore";

describe("useUIStore", () => {
	beforeEach(() => {
		// Reset store to initial state before each test
		useUIStore.setState({
			sidebarOpen: true,
			theme: "system",
		});
	});

	describe("initial state", () => {
		it("has sidebarOpen set to true by default", () => {
			const state = useUIStore.getState();
			expect(state.sidebarOpen).toBe(true);
		});

		it("has theme set to system by default", () => {
			const state = useUIStore.getState();
			expect(state.theme).toBe("system");
		});
	});

	describe("toggleSidebar", () => {
		it("toggles sidebarOpen from true to false", () => {
			expect(useUIStore.getState().sidebarOpen).toBe(true);

			act(() => {
				useUIStore.getState().toggleSidebar();
			});

			expect(useUIStore.getState().sidebarOpen).toBe(false);
		});

		it("toggles sidebarOpen from false to true", () => {
			useUIStore.setState({ sidebarOpen: false });

			act(() => {
				useUIStore.getState().toggleSidebar();
			});

			expect(useUIStore.getState().sidebarOpen).toBe(true);
		});

		it("can be called multiple times", () => {
			act(() => {
				useUIStore.getState().toggleSidebar();
			});
			expect(useUIStore.getState().sidebarOpen).toBe(false);

			act(() => {
				useUIStore.getState().toggleSidebar();
			});
			expect(useUIStore.getState().sidebarOpen).toBe(true);

			act(() => {
				useUIStore.getState().toggleSidebar();
			});
			expect(useUIStore.getState().sidebarOpen).toBe(false);
		});
	});

	describe("setTheme", () => {
		it("sets theme to light", () => {
			act(() => {
				useUIStore.getState().setTheme("light");
			});

			expect(useUIStore.getState().theme).toBe("light");
		});

		it("sets theme to dark", () => {
			act(() => {
				useUIStore.getState().setTheme("dark");
			});

			expect(useUIStore.getState().theme).toBe("dark");
		});

		it("sets theme to system", () => {
			useUIStore.setState({ theme: "light" });

			act(() => {
				useUIStore.getState().setTheme("system");
			});

			expect(useUIStore.getState().theme).toBe("system");
		});

		it("updates theme multiple times", () => {
			act(() => {
				useUIStore.getState().setTheme("light");
			});
			expect(useUIStore.getState().theme).toBe("light");

			act(() => {
				useUIStore.getState().setTheme("dark");
			});
			expect(useUIStore.getState().theme).toBe("dark");

			act(() => {
				useUIStore.getState().setTheme("system");
			});
			expect(useUIStore.getState().theme).toBe("system");
		});
	});

	describe("state updates", () => {
		it("sidebarOpen state updates correctly", () => {
			const initial = useUIStore.getState().sidebarOpen;

			useUIStore.setState({ sidebarOpen: false });
			expect(useUIStore.getState().sidebarOpen).toBe(false);

			useUIStore.setState({ sidebarOpen: true });
			expect(useUIStore.getState().sidebarOpen).toBe(true);

			// Restore initial state
			useUIStore.setState({ sidebarOpen: initial });
		});

		it("theme state updates correctly", () => {
			useUIStore.setState({ theme: "dark" });
			expect(useUIStore.getState().theme).toBe("dark");

			useUIStore.setState({ theme: "light" });
			expect(useUIStore.getState().theme).toBe("light");

			useUIStore.setState({ theme: "system" });
			expect(useUIStore.getState().theme).toBe("system");
		});
	});

	describe("type safety", () => {
		it("only accepts valid theme values", () => {
			// TypeScript enforces this at compile time
			// Runtime test to verify state accepts valid values
			act(() => {
				useUIStore.getState().setTheme("light");
			});
			expect(useUIStore.getState().theme).toBe("light");

			act(() => {
				useUIStore.getState().setTheme("dark");
			});
			expect(useUIStore.getState().theme).toBe("dark");

			act(() => {
				useUIStore.getState().setTheme("system");
			});
			expect(useUIStore.getState().theme).toBe("system");
		});
	});
});
