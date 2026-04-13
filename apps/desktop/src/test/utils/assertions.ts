import { expect } from "vitest"

declare module "vitest" {
	interface Assertion {
		toHaveBeenInvokedWith(command: string, args?: Record<string, unknown>): void
		toBeValidUuid(): void
		toBeIsoDate(): void
	}
}

expect.extend({
	toHaveBeenInvokedWith(
		received: { mock: { calls: [string, unknown[]][] } },
		command: string,
		args?: Record<string, unknown>,
	) {
		const calls = received.mock.calls
		const match = calls.find(([cmd]) => cmd === command)
		if (!match) {
			return {
				pass: false,
				message: () => `expected invoke to be called with "${command}"`,
			}
		}
		if (args !== undefined && match[1] !== undefined && typeof match[1] === "object" && match[1] !== null && !Array.isArray(match[1])) {
			const actualArgs = match[1] as unknown as Record<string, unknown>
			const keys = Object.keys(args)
			for (const key of keys) {
				if (actualArgs[key] !== args[key]) {
					return {
						pass: false,
						message: () =>
							`expected invoke "${command}" to be called with ${JSON.stringify(args)}, got ${JSON.stringify(actualArgs)}`,
					}
				}
			}
		}
		return { pass: true, message: () => "" }
	},

	toBeValidUuid(received: string) {
		const uuidRegex =
			/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
		return {
			pass: uuidRegex.test(received),
			message: () => `expected "${received}" to be a valid UUID`,
		}
	},

	toBeIsoDate(received: string) {
		const date = new Date(received)
		return {
			pass: !Number.isNaN(date.getTime()) && date.toISOString() === received,
			message: () => `expected "${received}" to be a valid ISO date string`,
		}
	},
})

export { expect }
