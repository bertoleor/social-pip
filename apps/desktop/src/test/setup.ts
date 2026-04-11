import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

class MockAbortSignal {
	aborted = false;
	private _listeners: Array<() => void> = [];

	static abort(): MockAbortSignal {
		const signal = new MockAbortSignal();
		signal.aborted = true;
		return signal;
	}

	static timeout(_ms: number): MockAbortSignal {
		const signal = new MockAbortSignal();
		return signal;
	}

	addEventListener(_type: string, listener: () => void): void {
		this._listeners.push(listener);
	}

	removeEventListener(_type: string, listener: () => void): void {
		this._listeners = this._listeners.filter((l) => l !== listener);
	}

	_abort(): void {
		this.aborted = true;
		for (const listener of this._listeners) {
			listener();
		}
	}
}

class MockAbortController {
	signal = new MockAbortSignal() as unknown as AbortSignal;

	abort(): void {
		(this.signal as unknown as MockAbortSignal)._abort();
	}
}

globalThis.AbortSignal =
	MockAbortSignal as unknown as typeof globalThis.AbortSignal;
globalThis.AbortController =
	MockAbortController as unknown as typeof globalThis.AbortController;
