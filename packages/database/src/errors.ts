/**
 * Custom error classes for database operations
 * Provides typed errors for better error handling and user feedback
 */

export class RecordNotFoundError extends Error {
	constructor(
		public readonly entity: string,
		public readonly id: string,
	) {
		super(`${entity} not found with id: ${id}`)
		this.name = 'RecordNotFoundError'
	}
}

export class UniqueConstraintError extends Error {
	constructor(
		public readonly constraint: string,
		public readonly value: string,
	) {
		super(`Unique constraint violation: ${constraint} with value '${value}' already exists`)
		this.name = 'UniqueConstraintError'
	}
}

export class ForeignKeyError extends Error {
	constructor(
		public readonly field: string,
		public readonly value: string,
	) {
		super(`Foreign key violation: ${field} with value '${value}' does not exist`)
		this.name = 'ForeignKeyError'
	}
}

export class DatabaseError extends Error {
	constructor(
		message: string,
		public readonly originalError?: unknown,
	) {
		super(message)
		this.name = 'DatabaseError'
	}
}

/**
 * Type guard to check if an error is a Prisma error
 */
export function isPrismaError(error: unknown): error is { code: string; meta?: { target?: string[] } } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error
	)
}

/**
 * Maps Prisma errors to typed database errors
 */
export function mapPrismaError(error: unknown, entity: string, id?: string): never {
	if (!isPrismaError(error)) {
		throw new DatabaseError('Unknown database error', error)
	}

	switch (error.code) {
		case 'P2025':
			throw new RecordNotFoundError(entity, id ?? 'unknown')
		case 'P2002': {
			const target = error.meta?.target?.[0] ?? 'unknown'
			throw new UniqueConstraintError(target, 'duplicate')
		}
		case 'P2003':
		case 'P2016': {
			const field = error.meta?.target?.[0] ?? 'unknown'
			throw new ForeignKeyError(field, id ?? 'unknown')
		}
		default:
			throw new DatabaseError(`Database operation failed: ${error.code}`, error)
	}
}
