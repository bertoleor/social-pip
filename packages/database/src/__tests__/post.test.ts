import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { createMockPrisma } from '../../test/mocks/prisma'
import { createPostInput, createTestPost, createTestAccount } from '../../test/factories'

// Import the operations we're about to create
import { createPost, getPost, getPosts, updatePost, deletePost } from '../operations/post'

describe('Post CRUD Operations', () => {
	let mockPrisma: PrismaClient
	const accountId = 'acc123'

	beforeEach(() => {
		mockPrisma = createMockPrisma()
	})

	describe('createPost', () => {
		it('RED: should create a post with default values', async () => {
			// Setup
			const input = createPostInput(accountId)
			const expected = createTestPost('post123', accountId)
			
			vi.mocked(mockPrisma.post.create).mockResolvedValue(expected)

			// Execute
			const result = await createPost(input, mockPrisma)

			// Assert
			expect(result).toBeDefined()
			expect(result.content).toBe(input.content)
			expect(result.status).toBe('DRAFT')
			expect(mockPrisma.post.create).toHaveBeenCalledWith({
				data: {
					content: input.content,
					platform: input.platform,
					accountId: input.accountId,
					mediaUrls: '[]',
					hashtags: '["test"]',
					status: 'DRAFT',
					scheduledAt: undefined,
				}
			})
		})

		it('RED: should throw ForeignKeyError when accountId not found', async () => {
			// Setup
			const input = createPostInput('nonexistent')
			
			vi.mocked(mockPrisma.post.create).mockRejectedValue({
				code: 'P2003',
				meta: { target: ['accountId'] }
			})

			// Execute & Assert
			await expect(createPost(input, mockPrisma))
				.rejects.toThrow('Foreign key violation')
		})
	})

	describe('getPost', () => {
		it('RED: should return post when found', async () => {
			// Setup
			const expected = createTestPost('post123', accountId)
			
			vi.mocked(mockPrisma.post.findUnique).mockResolvedValue(expected)

			// Execute
			const result = await getPost('post123', mockPrisma)

			// Assert
			expect(result).toBeDefined()
			expect(result?.id).toBe('post123')
			expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
				where: { id: 'post123' }
			})
		})

		it('RED: should return null when not found', async () => {
			// Setup
			vi.mocked(mockPrisma.post.findUnique).mockResolvedValue(null)

			// Execute
			const result = await getPost('nonexistent', mockPrisma)

			// Assert
			expect(result).toBeNull()
		})
	})

	describe('getPosts', () => {
		it('RED: should filter by accountId', async () => {
			// Setup
			const posts = [
				createTestPost('p1', accountId),
				createTestPost('p2', accountId),
			]
			
			vi.mocked(mockPrisma.post.findMany).mockResolvedValue(posts)

			// Execute
			const result = await getPosts({ accountId }, mockPrisma)

			// Assert
			expect(result).toHaveLength(2)
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: { accountId },
				orderBy: { createdAt: 'desc' }
			})
		})

		it('RED: should filter by status', async () => {
			// Setup
			const posts = [createTestPost('p1', accountId, { status: 'SCHEDULED' })]
			
			vi.mocked(mockPrisma.post.findMany).mockResolvedValue(posts)

			// Execute
			const result = await getPosts({ status: 'SCHEDULED' }, mockPrisma)

			// Assert
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: { status: 'SCHEDULED' },
				orderBy: { createdAt: 'desc' }
			})
		})

		it('RED: should filter by scheduledAfter date', async () => {
			// Setup
			const date = new Date('2026-01-01')
			const posts = [createTestPost('p1', accountId)]
			
			vi.mocked(mockPrisma.post.findMany).mockResolvedValue(posts)

			// Execute
			const result = await getPosts({ scheduledAfter: date }, mockPrisma)

			// Assert
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					scheduledAt: { gte: date }
				},
				orderBy: { createdAt: 'desc' }
			})
		})

		it('RED: should apply pagination', async () => {
			// Setup
			const posts = [createTestPost('p1', accountId)]
			
			vi.mocked(mockPrisma.post.findMany).mockResolvedValue(posts)

			// Execute
			const result = await getPosts({ limit: 10, offset: 5 }, mockPrisma)

			// Assert
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {},
				orderBy: { createdAt: 'desc' },
				take: 10,
				skip: 5,
			})
		})
	})

	describe('updatePost', () => {
		it('RED: should update post fields', async () => {
			// Setup
			const existing = createTestPost('post123', accountId)
			const updated = { ...existing, status: 'SCHEDULED', scheduledAt: new Date() }
			
			vi.mocked(mockPrisma.post.update).mockResolvedValue(updated)

			// Execute
			const result = await updatePost('post123', { status: 'SCHEDULED', scheduledAt: new Date() }, mockPrisma)

			// Assert
			expect(result.status).toBe('SCHEDULED')
		})

		it('RED: should throw RecordNotFoundError when post not found', async () => {
			// Setup
			vi.mocked(mockPrisma.post.update).mockRejectedValue({
				code: 'P2025'
			})

			// Execute & Assert
			await expect(updatePost('nonexistent', { status: 'SCHEDULED' }, mockPrisma))
				.rejects.toThrow('Post not found')
		})
	})

	describe('deletePost', () => {
		it('RED: should delete post', async () => {
			// Setup
			const existing = createTestPost('post123', accountId)
			
			vi.mocked(mockPrisma.post.delete).mockResolvedValue(existing)

			// Execute
			await deletePost('post123', mockPrisma)

			// Assert
			expect(mockPrisma.post.delete).toHaveBeenCalledWith({
				where: { id: 'post123' }
			})
		})

		it('RED: should succeed idempotently when post not found', async () => {
			// Setup
			vi.mocked(mockPrisma.post.delete).mockRejectedValue({
				code: 'P2025'
			})

			// Execute - should NOT throw
			await expect(deletePost('nonexistent', mockPrisma)).resolves.not.toThrow()
		})
	})
})
