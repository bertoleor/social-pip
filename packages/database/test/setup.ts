import { beforeEach, vi } from 'vitest'

// Global setup - runs before each test
beforeEach(() => {
	// Reset all mocks between tests
	vi.clearAllMocks()
})

// Mock hoisting for Prisma
// HISTÓRICO: PrismaClient se mockea como clase newable (vi.fn con función
// constructora) porque src/client.ts hace `new PrismaClient(...)`; una arrow
// fn como implementación tira "TypeError: ... is not a constructor".
vi.mock('@prisma/client', () => {
	const prismaClientInstance = {
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
	}
	return {
		PrismaClient: vi.fn(function () {
			return prismaClientInstance
		}),
	}
})
