import type { PrismaClient } from '@prisma/client'
import { mapPrismaError } from '../errors'

/**
 * Account filter interface for querying accounts
 */
export interface AccountFilter {
	platform?: string
	status?: string
	limit?: number
	offset?: number
}

/**
 * Input for creating a new account
 */
export interface CreateAccountInput {
	name: string
	platform: string
	username?: string
	displayName?: string
	avatarUrl?: string
	chromeProfilePath?: string
}

/**
 * Input for updating an existing account
 */
export interface UpdateAccountInput {
	name?: string
	displayName?: string
	avatarUrl?: string
	chromeProfilePath?: string
	status?: string
	warmupProgress?: number
}

/**
 * Creates a new account with default values
 * 
 * @param input - Account creation data
 * @param client - Prisma client instance (optional, uses singleton by default)
 * @returns Created account
 * @throws UniqueConstraintError if platform+username combination already exists
 */
export async function createAccount(
	input: CreateAccountInput,
	client?: PrismaClient
): Promise<any> {
	const prisma = client ?? (await import('../client')).prisma
	
	try {
		return await prisma.account.create({
			data: {
				name: input.name,
				platform: input.platform,
				username: input.username,
				displayName: input.displayName,
				avatarUrl: input.avatarUrl,
				chromeProfilePath: input.chromeProfilePath,
				status: 'ACTIVE',
				warmupProgress: 0,
			}
		})
	} catch (error) {
		throw mapPrismaError(error, 'Account')
	}
}

/**
 * Retrieves a single account by ID
 * 
 * @param id - Account ID
 * @param client - Prisma client instance (optional)
 * @returns Account or null if not found
 */
export async function getAccount(
	id: string,
	client?: PrismaClient
): Promise<any | null> {
	const prisma = client ?? (await import('../client')).prisma
	
	return prisma.account.findUnique({
		where: { id }
	})
}

/**
 * Retrieves multiple accounts with optional filtering and pagination
 * 
 * @param filter - Filter criteria (platform, status, limit, offset)
 * @param client - Prisma client instance (optional)
 * @returns Array of accounts
 */
export async function getAccounts(
	filter?: AccountFilter,
	client?: PrismaClient
): Promise<any[]> {
	const prisma = client ?? (await import('../client')).prisma
	
	return prisma.account.findMany({
		where: {
			platform: filter?.platform,
			status: filter?.status,
		},
		orderBy: { createdAt: 'desc' },
		take: filter?.limit,
		skip: filter?.offset,
	})
}

/**
 * Updates an existing account
 * 
 * @param id - Account ID to update
 * @param input - Update data
 * @param client - Prisma client instance (optional)
 * @returns Updated account
 * @throws RecordNotFoundError if account doesn't exist
 */
export async function updateAccount(
	id: string,
	input: UpdateAccountInput,
	client?: PrismaClient
): Promise<any> {
	const prisma = client ?? (await import('../client')).prisma
	
	try {
		return await prisma.account.update({
			where: { id },
			data: input
		})
	} catch (error) {
		throw mapPrismaError(error, 'Account', id)
	}
}

/**
 * Deletes an account (cascade deletes related posts)
 * Idempotent - succeeds even if account doesn't exist
 * 
 * @param id - Account ID to delete
 * @param client - Prisma client instance (optional)
 */
export async function deleteAccount(
	id: string,
	client?: PrismaClient
): Promise<void> {
	const prisma = client ?? (await import('../client')).prisma
	
	try {
		await prisma.account.delete({
			where: { id }
		})
	} catch (error) {
		// Idempotent: ignore "not found" errors
		if ((error as any)?.code !== 'P2025') {
			throw mapPrismaError(error, 'Account', id)
		}
	}
}
