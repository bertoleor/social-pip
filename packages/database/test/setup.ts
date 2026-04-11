import { beforeEach, vi } from 'vitest'

// Global setup - runs before each test
beforeEach(() => {
	// Reset all mocks between tests
	vi.clearAllMocks()
})

// Mock hoisting for Prisma
vi.mock('@prisma/client', () => {
	return {
		PrismaClient: vi.fn(() => ({
			account: {
				create: vi.fn(),
				findUnique: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
			post: {
				create: vi.fn(),
				findUnique: vi.fn(),
				findMany: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
			$transaction: vi.fn(),
			$connect: vi.fn(),
			$disconnect: vi.fn(),
		})),
	}
})
