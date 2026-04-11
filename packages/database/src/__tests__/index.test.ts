import { describe, it, expect } from 'vitest'
import { prisma, getPrismaClient } from '../index'

describe('Database Package - Module Resolution', () => {
	it('should export prisma client singleton', () => {
		expect(prisma).toBeDefined()
		expect(prisma.account).toBeDefined()
		expect(prisma.post).toBeDefined()
	})

	it('should export getPrismaClient factory', () => {
		expect(getPrismaClient).toBeDefined()
		expect(typeof getPrismaClient).toBe('function')
	})

	it('should return singleton when no override provided', () => {
		const client = getPrismaClient()
		expect(client).toBe(prisma)
	})
})
