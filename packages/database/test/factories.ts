import type { Prisma } from '@prisma/client'

/**
 * Test data factory for Account inputs
 */
export interface CreateAccountInput {
	name: string
	platform: string
	username?: string
	displayName?: string
	avatarUrl?: string
	chromeProfilePath?: string
	status?: string
	warmupProgress?: number
}

export function createAccountInput(
	overrides?: Partial<CreateAccountInput>,
): CreateAccountInput {
	const timestamp = Date.now()
	return {
		name: 'Test Account',
		platform: 'FACEBOOK',
		username: `test_user_${timestamp}`,
		displayName: 'Test User',
		status: 'ACTIVE',
		...overrides,
	}
}

/**
 * Test data factory for Post inputs
 */
export interface CreatePostInput {
	content: string
	platform: string
	accountId: string
	mediaUrls?: string[]
	hashtags?: string[]
	scheduledAt?: Date
	status?: string
}

export function createPostInput(
	accountId: string,
	overrides?: Partial<CreatePostInput>,
): CreatePostInput {
	return {
		content: 'Test post content',
		platform: 'FACEBOOK',
		accountId,
		mediaUrls: [],
		hashtags: ['test'],
		status: 'DRAFT',
		...overrides,
	}
}

/**
 * Test data factory for Account entity
 */
export function createTestAccount(
	id: string,
	overrides?: Partial<CreateAccountInput & { id: string }>,
) {
	const timestamp = new Date()
	return {
		id,
		name: 'Test Account',
		platform: 'FACEBOOK',
		username: `test_user_${id}`,
		displayName: 'Test User',
		avatarUrl: null,
		chromeProfilePath: null,
		status: 'ACTIVE',
		warmupProgress: 0,
		restrictionsCount: 0,
		dailyPostsCount: 0,
		lastResetDate: null,
		createdAt: timestamp,
		updatedAt: timestamp,
		lastUsedAt: null,
		...overrides,
	}
}

/**
 * Test data factory for Post entity
 */
export function createTestPost(
	id: string,
	accountId: string,
	overrides?: Partial<CreatePostInput & { id: string }>,
) {
	const timestamp = new Date()
	return {
		id,
		content: 'Test post content',
		mediaUrls: '[]',
		platform: 'FACEBOOK',
		status: 'DRAFT',
		altCaptions: '[]',
		currentCaption: null,
		hashtags: '[]',
		scheduledAt: null,
		variance: 15,
		publishedAt: null,
		externalId: null,
		errorMessage: null,
		accountId,
		createdAt: timestamp,
		updatedAt: timestamp,
		...overrides,
	}
}
