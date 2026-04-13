import { waitFor } from "@testing-library/react"

export async function waitForStoreState<T>(
	store: { getState: () => T },
	predicate: (state: T) => boolean,
	timeout = 1000,
): Promise<void> {
	await waitFor(
		() => {
			if (!predicate(store.getState())) {
				throw new Error("Store state predicate not met")
			}
		},
		{ timeout },
	)
}

export async function waitForInvoke(
	mock: { mock: { calls: [string, unknown[]][] } },
	command: string,
	timeout = 1000,
): Promise<void> {
	await waitFor(
		() => {
			const calls = mock.mock.calls
			const found = calls.some(([cmd]) => cmd === command)
			if (!found) {
				throw new Error(`invoke not called with ${command}`)
			}
		},
		{ timeout },
	)
}

export async function waitForNextTick(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, 0)
	})
}

export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
