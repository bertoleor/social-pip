import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

/**
 * Creates a mock Prisma client for unit testing
 * All CRUD methods are mocked with Vitest functions
 */
export function createMockPrisma(): PrismaClient {
	return {
		account: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn(),
		},
		post: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn(),
		},
		schedule: {
			create: vi.fn(),
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn(),
		},
		$transaction: vi.fn(async (fn) => {
			if (typeof fn === 'function') {
				return fn(createMockPrisma())
			}
			return Promise.all(fn)
		}),
		$connect: vi.fn(),
		$disconnect: vi.fn(),
	} as unknown as PrismaClient
}

/**
 * Resets all mocks on a Prisma client instance
 */
export function resetMockPrisma(client: PrismaClient): void {
	const accountMethods = client.account as Record<string, unknown>
	const postMethods = client.post as Record<string, unknown>
	const scheduleMethods = client.schedule as Record<string, unknown>

	for (const method of Object.values(accountMethods)) {
		if (vi.isMockFunction(method)) {
			method.mockClear()
		}
	}
	for (const method of Object.values(postMethods)) {
		if (vi.isMockFunction(method)) {
			method.mockClear()
		}
	}
	for (const method of Object.values(scheduleMethods)) {
		if (vi.isMockFunction(method)) {
			method.mockClear()
		}
	}
}
