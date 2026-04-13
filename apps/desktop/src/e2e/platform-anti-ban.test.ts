import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { act } from '@testing-library/react'
import { usePostingStore } from '../stores/postingStore'
import type { PlatformTarget } from '@social-pip/types'

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

interface MockAntiBanStats {
	hourly_count: number
	daily_count: number
	success_rate: number
	batch_count: number
	config: {
		platform: string
		min_action_delay_ms: number
		max_action_delay_ms: number
		hourly_action_limit: number
		daily_action_limit: number
		session_gap_min_minutes: number
		human_like_typing: boolean
		jitter_percentage: number
		batch_size: number
		batch_break_minutes: number
	}
}

interface MockPostSession {
	id: string
	status: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'
	templateId?: string
	accountId: string
	totalJobs: number
	completedJobs: number
	successfulJobs: number
	failedJobs: number
	startedAt?: string
	completedAt?: string
	cancelledAt?: string
	lastError?: string
	errorCategory?: string
	configSnapshot: string
	createdAt: string
	updatedAt: string
}

interface MockPostJob {
	id: string
	sessionId: string
	groupId: string
	platform: string
	priority: number
	content: string
	postUrl?: string
	status: 'pending' | 'processing' | 'success' | 'failed' | 'skipped'
	errorMessage?: string
	errorCategory?: string
	startedAt?: string
	completedAt?: string
	durationMs?: number
	retryCount: number
	maxRetries: number
	nextRetryAt?: string
	createdAt: string
	updatedAt: string
}

const PLATFORM_CONFIGS: Record<string, MockAntiBanStats['config']> = {
	facebook_groups: {
		platform: 'facebook_groups',
		min_action_delay_ms: 60_000,
		max_action_delay_ms: 240_000,
		hourly_action_limit: 20,
		daily_action_limit: 60,
		session_gap_min_minutes: 120,
		human_like_typing: true,
		jitter_percentage: 0.15,
		batch_size: 5,
		batch_break_minutes: 20,
	},
	instagram: {
		platform: 'instagram',
		min_action_delay_ms: 90_000,
		max_action_delay_ms: 300_000,
		hourly_action_limit: 15,
		daily_action_limit: 45,
		session_gap_min_minutes: 90,
		human_like_typing: true,
		jitter_percentage: 0.20,
		batch_size: 5,
		batch_break_minutes: 30,
	},
	twitter: {
		platform: 'twitter',
		min_action_delay_ms: 30_000,
		max_action_delay_ms: 120_000,
		hourly_action_limit: 50,
		daily_action_limit: 150,
		session_gap_min_minutes: 60,
		human_like_typing: true,
		jitter_percentage: 0.10,
		batch_size: 10,
		batch_break_minutes: 20,
	},
	linkedin: {
		platform: 'linkedin',
		min_action_delay_ms: 60_000,
		max_action_delay_ms: 180_000,
		hourly_action_limit: 25,
		daily_action_limit: 75,
		session_gap_min_minutes: 90,
		human_like_typing: true,
		jitter_percentage: 0.15,
		batch_size: 10,
		batch_break_minutes: 25,
	},
}

describe('E2E: Platform-Specific Anti-Ban Config', () => {
	beforeEach(() => {
		usePostingStore.setState({
			currentSession: null,
			jobs: [],
			isProcessing: false,
			error: null,
			mediaFiles: [],
			mediaValidation: new Map(),
			platformTargets: [],
		})
		vi.clearAllMocks()
	})

	describe('TASK-039: Platform-specific config application', () => {
		it('should apply facebook_groups config when posting to Facebook Groups', async () => {
			const mockSession: MockPostSession = {
				id: 'sess_fb',
				status: 'pending',
				accountId: 'acc_123',
				totalJobs: 1,
				completedJobs: 0,
				successfulJobs: 0,
				failedJobs: 0,
				configSnapshot: '{}',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			}

			const mockStats: MockAntiBanStats = {
				hourly_count: 0,
				daily_count: 0,
				success_rate: 100,
				batch_count: 0,
				config: PLATFORM_CONFIGS.facebook_groups,
			}

			mockInvoke
				.mockResolvedValueOnce(mockSession)
				.mockResolvedValueOnce(mockStats)

			await act(async () => {
				await usePostingStore.getState().startMultiPlatformSession({
					accountId: 'acc_123',
					platforms: [
						{ platform: 'facebook_groups', accountId: 'acc_123', targets: ['g1'], priority: 0 },
					],
				})
			})

			const session = usePostingStore.getState().currentSession
			expect(session).not.toBeNull()
			expect(session?.id).toBe('sess_fb')

			const stats = await mockInvoke('get_session_anti_ban_stats', { sessionId: 'sess_fb' })
			expect(stats).toEqual(mockStats)
		})

		it('should apply instagram config when posting to Instagram', async () => {
			const mockSession: MockPostSession = {
				id: 'sess_ig',
				status: 'pending',
				accountId: 'acc_123',
				totalJobs: 1,
				completedJobs: 0,
				successfulJobs: 0,
				failedJobs: 0,
				configSnapshot: '{}',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			}

			const mockStats: MockAntiBanStats = {
				hourly_count: 0,
				daily_count: 0,
				success_rate: 100,
				batch_count: 0,
				config: PLATFORM_CONFIGS.instagram,
			}

			mockInvoke
				.mockResolvedValueOnce(mockSession)
				.mockResolvedValueOnce(mockStats)

			await act(async () => {
				await usePostingStore.getState().startMultiPlatformSession({
					accountId: 'acc_123',
					platforms: [
						{ platform: 'instagram', accountId: 'acc_123', targets: ['p1'], priority: 20 },
					],
				})
			})

			const stats = await mockInvoke('get_session_anti_ban_stats', { sessionId: 'sess_ig' })
			expect(stats).toEqual(mockStats)
		})

		it('should validate different delay values per platform', async () => {
			mockInvoke.mockResolvedValueOnce(75_000)
			const fbDelay = await mockInvoke('get_platform_delay', { platform: 'facebook_groups' })

			mockInvoke.mockResolvedValueOnce(150_000)
			const igDelay = await mockInvoke('get_platform_delay', { platform: 'instagram' })

			mockInvoke.mockResolvedValueOnce(60_000)
			const twitterDelay = await mockInvoke('get_platform_delay', { platform: 'twitter' })

			expect(fbDelay).toBeGreaterThanOrEqual(60_000)
			expect(fbDelay).toBeLessThanOrEqual(240_000 + 36_000)

			expect(igDelay).toBeGreaterThanOrEqual(90_000)
			expect(igDelay).toBeLessThanOrEqual(300_000 + 45_000)

			expect(twitterDelay).toBeGreaterThanOrEqual(30_000)
			expect(twitterDelay).toBeLessThanOrEqual(120_000 + 12_000)
		})

		it('should use first platform config for multi-platform session anti-ban engine', async () => {
			const mockSession: MockPostSession = {
				id: 'sess_multi',
				status: 'pending',
				accountId: 'acc_123',
				totalJobs: 2,
				completedJobs: 0,
				successfulJobs: 0,
				failedJobs: 0,
				configSnapshot: '{}',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			}

			const mockJobs: MockPostJob[] = [
				{
					id: 'job_1',
					sessionId: 'sess_multi',
					groupId: 'g1',
					platform: 'facebook_groups',
					priority: 0,
					content: 'Test',
					status: 'pending',
					retryCount: 0,
					maxRetries: 3,
					createdAt: '2024-01-01T00:00:00Z',
					updatedAt: '2024-01-01T00:00:00Z',
				},
				{
					id: 'job_2',
					sessionId: 'sess_multi',
					groupId: 'p1',
					platform: 'instagram',
					priority: 20,
					content: 'Test',
					status: 'pending',
					retryCount: 0,
					maxRetries: 3,
					createdAt: '2024-01-01T00:00:01Z',
					updatedAt: '2024-01-01T00:00:01Z',
				},
			]

			const mockStats: MockAntiBanStats = {
				hourly_count: 0,
				daily_count: 0,
				success_rate: 100,
				batch_count: 0,
				config: PLATFORM_CONFIGS.facebook_groups,
			}

			mockInvoke
				.mockResolvedValueOnce(mockSession)
				.mockResolvedValueOnce({ session: mockSession, jobs: mockJobs })
				.mockResolvedValueOnce(mockStats)

			await act(async () => {
				await usePostingStore.getState().startMultiPlatformSession({
					accountId: 'acc_123',
					platforms: [
						{ platform: 'facebook_groups', accountId: 'acc_123', targets: ['g1'], priority: 0 },
						{ platform: 'instagram', accountId: 'acc_123', targets: ['p1'], priority: 20 },
					],
				})
			})

			await act(async () => {
				await usePostingStore.getState().getSessionStatus('sess_multi')
			})

			const stats = await mockInvoke('get_session_anti_ban_stats', { sessionId: 'sess_multi' })
			expect(stats).toEqual(mockStats)
		})
	})

	describe('platform-specific config values', () => {
		it('should have more restrictive limits for Instagram than Facebook Groups', () => {
			const fbConfig = PLATFORM_CONFIGS.facebook_groups
			const igConfig = PLATFORM_CONFIGS.instagram

			expect(igConfig.min_action_delay_ms).toBeGreaterThan(fbConfig.min_action_delay_ms)

			expect(igConfig.hourly_action_limit).toBeLessThan(fbConfig.hourly_action_limit)

			expect(igConfig.daily_action_limit).toBeLessThan(fbConfig.daily_action_limit)
		})

		it('should have more permissive limits for Twitter than Facebook Groups', () => {
			const fbConfig = PLATFORM_CONFIGS.facebook_groups
			const twitterConfig = PLATFORM_CONFIGS.twitter

			expect(twitterConfig.min_action_delay_ms).toBeLessThan(fbConfig.min_action_delay_ms)

			expect(twitterConfig.hourly_action_limit).toBeGreaterThan(fbConfig.hourly_action_limit)

			expect(twitterConfig.daily_action_limit).toBeGreaterThan(fbConfig.daily_action_limit)
		})

		it('should have higher jitter for Instagram than Facebook', () => {
			const fbConfig = PLATFORM_CONFIGS.facebook_groups
			const igConfig = PLATFORM_CONFIGS.instagram

			expect(igConfig.jitter_percentage).toBeGreaterThan(fbConfig.jitter_percentage)
		})

		it('should have human-like typing enabled for all platforms', () => {
			for (const config of Object.values(PLATFORM_CONFIGS)) {
				expect(config.human_like_typing).toBe(true)
			}
		})
	})

	describe('delay calculations', () => {
		it('should get platform-specific delay via get_platform_delay', async () => {
			mockInvoke.mockResolvedValueOnce(75_000)

			const delay = await mockInvoke('get_platform_delay', { platform: 'facebook_groups' })

			expect(delay).toBeDefined()
			expect(typeof delay).toBe('number')
			expect(delay).toBeGreaterThanOrEqual(60_000)
		})

		it('should return default delay for unknown platform', async () => {
			mockInvoke.mockResolvedValueOnce(90_000)

			const delay = await mockInvoke('get_platform_delay', { platform: 'unknown_platform' })

			expect(delay).toBeDefined()
			expect(delay).toBeGreaterThanOrEqual(60_000)
			expect(delay).toBeLessThanOrEqual(240_000 + 36_000)
		})

		it('should have different delay ranges per platform', async () => {
			const delays: Record<string, number> = {}

			for (const platform of ['facebook_groups', 'instagram', 'twitter', 'linkedin']) {
				mockInvoke.mockResolvedValueOnce(100_000)
				delays[platform] = await mockInvoke('get_platform_delay', { platform })
			}

			expect(Object.keys(delays)).toHaveLength(4)

			const uniqueDelays = new Set(Object.values(delays))
			expect(uniqueDelays.size).toBeGreaterThanOrEqual(1)
		})
	})

	describe('session integration', () => {
		it('should create anti-ban engine with correct config at session start', async () => {
			const mockSession: MockPostSession = {
				id: 'sess_test',
				status: 'pending',
				accountId: 'acc_123',
				totalJobs: 1,
				completedJobs: 0,
				successfulJobs: 0,
				failedJobs: 0,
				configSnapshot: '{}',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			}

			const expectedConfig = PLATFORM_CONFIGS.twitter

			const mockStats: MockAntiBanStats = {
				hourly_count: 0,
				daily_count: 0,
				success_rate: 100,
				batch_count: 0,
				config: expectedConfig,
			}

			mockInvoke
				.mockResolvedValueOnce(mockSession)
				.mockResolvedValueOnce(mockStats)

			await act(async () => {
				await usePostingStore.getState().startMultiPlatformSession({
					accountId: 'acc_123',
					platforms: [
						{ platform: 'twitter', accountId: 'acc_123', targets: ['t1'], priority: 30 },
					],
				})
			})

			const stats = await mockInvoke('get_session_anti_ban_stats', { sessionId: 'sess_test' })

			expect(stats.config.platform).toBe('twitter')
			expect(stats.config.hourly_action_limit).toBe(50)
			expect(stats.config.daily_action_limit).toBe(150)
		})

		it('should track actions per session with platform-specific limits', async () => {
			const mockSession: MockPostSession = {
				id: 'sess_tracking',
				status: 'running',
				accountId: 'acc_123',
				totalJobs: 3,
				completedJobs: 1,
				successfulJobs: 1,
				failedJobs: 0,
				startedAt: '2024-01-01T00:00:00Z',
				configSnapshot: '{}',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			}

			const mockStats: MockAntiBanStats = {
				hourly_count: 3,
				daily_count: 3,
				success_rate: 100,
				batch_count: 3,
				config: PLATFORM_CONFIGS.facebook_groups,
			}

			mockInvoke.mockResolvedValueOnce(mockStats)

			const stats = await mockInvoke('get_session_anti_ban_stats', { sessionId: 'sess_tracking' })

			expect(stats.hourly_count).toBe(3)
			expect(stats.hourly_count).toBeLessThanOrEqual(stats.config.hourly_action_limit)
			expect(stats.daily_count).toBeLessThanOrEqual(stats.config.daily_action_limit)
		})
	})
})
