import type { PrismaClient } from '@prisma/client'
import { mapPrismaError } from '../errors'

/**
 * Post filter interface for querying posts
 */
export interface PostFilter {
	platform?: string
	status?: string
	accountId?: string
	scheduledAfter?: Date
	limit?: number
	offset?: number
}

/**
 * Input for creating a new post
 */
export interface CreatePostInput {
	content: string
	platform: string
	accountId: string
	mediaUrls?: string[]
	hashtags?: string[]
	scheduledAt?: Date
}

/**
 * Input for updating an existing post
 */
export interface UpdatePostInput {
	content?: string
	mediaUrls?: string[]
	hashtags?: string[]
	status?: string
	scheduledAt?: Date | null
	publishedAt?: Date
	externalId?: string
	errorMessage?: string
}

/**
 * Creates a new post with default values
 * 
 * @param input - Post creation data
 * @param client - Prisma client instance (optional)
 * @returns Created post
 * @throws ForeignKeyError if accountId doesn't exist
 */
export async function createPost(
	input: CreatePostInput,
	client?: PrismaClient
): Promise<any> {
	const prisma = client ?? (await import('../client')).prisma
	
	try {
		return await prisma.post.create({
			data: {
				content: input.content,
				platform: input.platform,
				accountId: input.accountId,
				mediaUrls: JSON.stringify(input.mediaUrls ?? []),
				hashtags: JSON.stringify(input.hashtags ?? []),
				status: 'DRAFT',
				scheduledAt: input.scheduledAt,
			}
		})
	} catch (error) {
		throw mapPrismaError(error, 'Post')
	}
}

/**
 * Retrieves a single post by ID
 * 
 * @param id - Post ID
 * @param client - Prisma client instance (optional)
 * @returns Post or null if not found
 */
export async function getPost(
	id: string,
	client?: PrismaClient
): Promise<any | null> {
	const prisma = client ?? (await import('../client')).prisma
	
	return prisma.post.findUnique({
		where: { id }
	})
}

/**
 * Retrieves multiple posts with optional filtering and pagination
 * 
 * @param filter - Filter criteria
 * @param client - Prisma client instance (optional)
 * @returns Array of posts
 */
export async function getPosts(
	filter?: PostFilter,
	client?: PrismaClient
): Promise<any[]> {
	const prisma = client ?? (await import('../client')).prisma
	
	const where: any = {}
	
	if (filter?.platform) where.platform = filter.platform
	if (filter?.status) where.status = filter.status
	if (filter?.accountId) where.accountId = filter.accountId
	if (filter?.scheduledAfter) where.scheduledAt = { gte: filter.scheduledAfter }
	
	return prisma.post.findMany({
		where,
		orderBy: { createdAt: 'desc' },
		take: filter?.limit,
		skip: filter?.offset,
	})
}

/**
 * Updates an existing post
 * 
 * @param id - Post ID to update
 * @param input - Update data
 * @param client - Prisma client instance (optional)
 * @returns Updated post
 * @throws RecordNotFoundError if post doesn't exist
 */
export async function updatePost(
	id: string,
	input: UpdatePostInput,
	client?: PrismaClient
): Promise<any> {
	const prisma = client ?? (await import('../client')).prisma
	
	const data: any = {}
	
	if (input.content !== undefined) data.content = input.content
	if (input.mediaUrls !== undefined) data.mediaUrls = JSON.stringify(input.mediaUrls)
	if (input.hashtags !== undefined) data.hashtags = JSON.stringify(input.hashtags)
	if (input.status !== undefined) data.status = input.status
	if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt
	if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt
	if (input.externalId !== undefined) data.externalId = input.externalId
	if (input.errorMessage !== undefined) data.errorMessage = input.errorMessage
	
	try {
		return await prisma.post.update({
			where: { id },
			data
		})
	} catch (error) {
		throw mapPrismaError(error, 'Post', id)
	}
}

/**
 * Deletes a post (cascade deletes related schedules)
 * Idempotent - succeeds even if post doesn't exist
 * 
 * @param id - Post ID to delete
 * @param client - Prisma client instance (optional)
 */
export async function deletePost(
	id: string,
	client?: PrismaClient
): Promise<void> {
	const prisma = client ?? (await import('../client')).prisma
	
	try {
		await prisma.post.delete({
			where: { id }
		})
	} catch (error) {
		// Idempotent: ignore "not found" errors
		if ((error as any)?.code !== 'P2025') {
			throw mapPrismaError(error, 'Post', id)
		}
	}
}
