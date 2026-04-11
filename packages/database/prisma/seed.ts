import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Clears all data from the database (atomic transaction)
 */
async function clearAll(): Promise<void> {
	await prisma.$transaction([
		prisma.antiBanEvent.deleteMany(),
		prisma.postLog.deleteMany(),
		prisma.schedule.deleteMany(),
		prisma.post.deleteMany(),
		prisma.account.deleteMany(),
	])
}

/**
 * Seeds the database with development data
 * - 5 accounts (different platforms)
 * - 10-15 posts per account with varied statuses
 */
async function seed(): Promise<void> {
	console.log('🌱 Starting seed...')

	// Clear existing data
	await clearAll()
	console.log('✓ Cleared existing data')

	// Create accounts
	const accounts = await Promise.all([
		prisma.account.create({
			data: {
				name: 'Facebook Business',
				platform: 'FACEBOOK',
				username: 'fb_business_2026',
				displayName: 'FB Business Account',
				status: 'ACTIVE',
				warmupProgress: 100,
			},
		}),
		prisma.account.create({
			data: {
				name: 'Instagram Personal',
				platform: 'INSTAGRAM',
				username: 'ig_personal_2026',
				displayName: 'IG Personal',
				status: 'ACTIVE',
				warmupProgress: 75,
			},
		}),
		prisma.account.create({
			data: {
				name: 'TikTok Creator',
				platform: 'TIKTOK',
				username: 'tiktok_creator_2026',
				displayName: 'TikTok Creator',
				status: 'WARMING_UP',
				warmupProgress: 30,
			},
		}),
		prisma.account.create({
			data: {
				name: 'Twitter Official',
				platform: 'TWITTER',
				username: 'twitter_official_2026',
				displayName: 'Twitter Official',
				status: 'ACTIVE',
				warmupProgress: 100,
			},
		}),
		prisma.account.create({
			data: {
				name: 'LinkedIn Professional',
				platform: 'LINKEDIN',
				username: 'linkedin_pro_2026',
				displayName: 'LinkedIn Pro',
				status: 'INACTIVE',
				warmupProgress: 50,
			},
		}),
	])
	console.log(`✓ Created ${accounts.length} accounts`)

	// Create posts for each account
	let totalPosts = 0
	for (const account of accounts) {
		const postsCount = account.platform === 'FACEBOOK' ? 15 : 10
		
		for (let i = 0; i < postsCount; i++) {
			const status = i < 3 ? 'DRAFT' : i < 6 ? 'SCHEDULED' : 'PUBLISHED'
			const scheduledAt = status === 'SCHEDULED' 
				? new Date(Date.now() + (i * 24 * 60 * 60 * 1000)) // Days from now
				: null
			
			await prisma.post.create({
				data: {
					content: `${account.platform} post #${i + 1} - Sample content for testing purposes. #testing #${account.platform.toLowerCase()}`,
					platform: account.platform,
					accountId: account.id,
					status,
					scheduledAt,
					hashtags: JSON.stringify(['testing', account.platform.toLowerCase()]),
					mediaUrls: JSON.stringify([]),
				},
			})
			totalPosts++
		}
	}
	console.log(`✓ Created ${totalPosts} posts`)

	console.log('✅ Seed completed successfully!')
}

// Run seed
seed()
	.catch((e) => {
		console.error('❌ Seed failed:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

export { clearAll, seed }
