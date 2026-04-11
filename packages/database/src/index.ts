// Database Package Exports
// Main entry point for @social-pip/database

// Client
export { prisma, getPrismaClient } from './client'
export type { PrismaClient } from '@prisma/client'

// Errors
export {
	RecordNotFoundError,
	UniqueConstraintError,
	ForeignKeyError,
	DatabaseError,
	mapPrismaError,
	isPrismaError,
} from './errors'

// Operations - Account
export {
	createAccount,
	getAccount,
	getAccounts,
	updateAccount,
	deleteAccount,
} from './operations/account'
export type {
	AccountFilter,
	CreateAccountInput,
	UpdateAccountInput,
} from './operations/account'

// Operations - Post
export {
	createPost,
	getPost,
	getPosts,
	updatePost,
	deletePost,
} from './operations/post'
export type {
	PostFilter,
	CreatePostInput,
	UpdatePostInput,
} from './operations/post'

// Types (re-exported from Prisma)
export type { Account, Post, Schedule, Prisma } from '@prisma/client'
