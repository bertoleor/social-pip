import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma client singleton
 * Prevents multiple connections in development (hot reload)
 * Thread-safe for Tauri desktop app
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	})

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma
}

/**
 * Factory function for Prisma client
 * Allows test injection and custom configurations
 *
 * @param override - Optional PrismaClient instance to use instead of singleton
 * @returns PrismaClient instance
 */
export function getPrismaClient(override?: PrismaClient): PrismaClient {
	return override ?? prisma
}

export default prisma
