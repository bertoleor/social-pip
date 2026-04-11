import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { createMockPrisma } from '../../test/mocks/prisma'
import { createAccountInput, createTestAccount } from '../../test/factories'

// Import the operations we're about to create
import { createAccount, getAccount, getAccounts, updateAccount, deleteAccount } from '../operations/account'

describe('Account CRUD Operations', () => {
	let mockPrisma: PrismaClient

	beforeEach(() => {
		mockPrisma = createMockPrisma()
	})

	describe('createAccount', () => {
		it('RED: should create an account with default values', async () => {
			// Setup
			const input = createAccountInput()
			const expected = createTestAccount('clx123', input)
			
			vi.mocked(mockPrisma.account.create).mockResolvedValue(expected)

			// Execute
			const result = await createAccount(input, mockPrisma)

			// Assert
			expect(result).toBeDefined()
			expect(result.name).toBe(input.name)
			expect(result.platform).toBe(input.platform)
			expect(result.status).toBe('ACTIVE')
			expect(mockPrisma.account.create).toHaveBeenCalledWith({
				data: {
					name: input.name,
					platform: input.platform,
					username: input.username,
					displayName: input.displayName,
					status: 'ACTIVE',
					warmupProgress: 0,
				}
			})
		})

		it('RED: should throw UniqueConstraintError on duplicate platform+username', async () => {
			// Setup
			const input = createAccountInput()
			
			vi.mocked(mockPrisma.account.create).mockRejectedValue({
				code: 'P2002',
				meta: { target: ['platform', 'username'] }
			})

			// Execute & Assert
			await expect(createAccount(input, mockPrisma))
				.rejects.toThrow('Unique constraint violation')
		})
	})

	describe('getAccount', () => {
		it('RED: should return account when found', async () => {
			// Setup
			const expected = createTestAccount('clx123')
			
			vi.mocked(mockPrisma.account.findUnique).mockResolvedValue(expected)

			// Execute
			const result = await getAccount('clx123', mockPrisma)

			// Assert
			expect(result).toBeDefined()
			expect(result?.id).toBe('clx123')
			expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
				where: { id: 'clx123' }
			})
		})

		it('RED: should return null when not found', async () => {
			// Setup
			vi.mocked(mockPrisma.account.findUnique).mockResolvedValue(null)

			// Execute
			const result = await getAccount('nonexistent', mockPrisma)

			// Assert
			expect(result).toBeNull()
		})
	})

	describe('getAccounts', () => {
		it('RED: should filter by platform and status', async () => {
			// Setup
			const accounts = [
				createTestAccount('clx1', { platform: 'FACEBOOK', status: 'ACTIVE' }),
				createTestAccount('clx2', { platform: 'FACEBOOK', status: 'ACTIVE' }),
			]
			
			vi.mocked(mockPrisma.account.findMany).mockResolvedValue(accounts)

			// Execute
			const result = await getAccounts({ platform: 'FACEBOOK', status: 'ACTIVE' }, mockPrisma)

			// Assert
			expect(result).toHaveLength(2)
			expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
				where: {
					platform: 'FACEBOOK',
					status: 'ACTIVE',
				},
				orderBy: { createdAt: 'desc' }
			})
		})

		it('RED: should apply pagination with limit and offset', async () => {
			// Setup
			const accounts = [createTestAccount('clx1')]
			
			vi.mocked(mockPrisma.account.findMany).mockResolvedValue(accounts)

			// Execute
			const result = await getAccounts({ limit: 5, offset: 10 }, mockPrisma)

			// Assert
			expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
				where: {},
				orderBy: { createdAt: 'desc' },
				take: 5,
				skip: 10,
			})
		})
	})

	describe('updateAccount', () => {
		it('RED: should update account fields', async () => {
			// Setup
			const existing = createTestAccount('clx123')
			const updated = { ...existing, name: 'Updated Name' }
			
			vi.mocked(mockPrisma.account.update).mockResolvedValue(updated)

			// Execute
			const result = await updateAccount('clx123', { name: 'Updated Name' }, mockPrisma)

			// Assert
			expect(result.name).toBe('Updated Name')
			expect(mockPrisma.account.update).toHaveBeenCalledWith({
				where: { id: 'clx123' },
				data: { name: 'Updated Name' }
			})
		})

		it('RED: should throw RecordNotFoundError when account not found', async () => {
			// Setup
			vi.mocked(mockPrisma.account.update).mockRejectedValue({
				code: 'P2025'
			})

			// Execute & Assert
			await expect(updateAccount('nonexistent', { name: 'Test' }, mockPrisma))
				.rejects.toThrow('Account not found')
		})
	})

	describe('deleteAccount', () => {
		it('RED: should delete account (cascade deletes posts)', async () => {
			// Setup
			const existing = createTestAccount('clx123')
			
			vi.mocked(mockPrisma.account.delete).mockResolvedValue(existing)

			// Execute
			await deleteAccount('clx123', mockPrisma)

			// Assert
			expect(mockPrisma.account.delete).toHaveBeenCalledWith({
				where: { id: 'clx123' }
			})
		})

		it('RED: should succeed idempotently when account not found', async () => {
			// Setup - P2025 is "Record not found" but delete is idempotent
			vi.mocked(mockPrisma.account.delete).mockRejectedValue({
				code: 'P2025'
			})

			// Execute - should NOT throw
			await expect(deleteAccount('nonexistent', mockPrisma)).resolves.not.toThrow()
		})
	})
})
