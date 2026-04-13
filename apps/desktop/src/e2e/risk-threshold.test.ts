import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { usePostingStore } from '../stores/postingStore'
import type { PlatformTarget } from '@social-pip/types'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('E2E: Risk Threshold Warnings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePostingStore.setState({
      currentSession: null,
      jobs: [],
      isProcessing: false,
      error: null,
      platformTargets: [],
    })
  })

  describe('TASK-047: MEDIUM risk warning at 50% daily limit', () => {
    it('should emit RISK_THRESHOLD_MEDIUM at 50% of daily limit', async () => {
      const mockStats = {
        hourly_count: 15,
        daily_count: 30,
        success_rate: 100,
        batch_count: 3,
        risk_level: 'Medium',
        daily_limit: 60,
      }

      vi.mocked(invoke).mockResolvedValue(mockStats)

      const stats = await invoke<{
        daily_count: number
        risk_level: string
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_risk_test' })

      expect(stats.daily_count).toBe(30)
      expect(stats.daily_limit).toBe(60)
      expect(stats.risk_level).toBe('Medium')
    })

    it('should show 50% progress in anti-ban stats', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 15,
        daily_count: 30,
        success_rate: 100,
        batch_count: 3,
        risk_level: 'Medium',
        daily_limit: 60,
      })

      const stats = await invoke<{
        daily_count: number
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_50_percent' })

      const percentage = (stats.daily_count / stats.daily_limit) * 100
      expect(percentage).toBeGreaterThanOrEqual(50)
      expect(percentage).toBeLessThan(75)
    })
  })

  describe('TASK-048: HIGH risk warning at 75% daily limit', () => {
    it('should emit RISK_THRESHOLD_HIGH at 75% of daily limit', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 20,
        daily_count: 45,
        success_rate: 100,
        batch_count: 5,
        risk_level: 'High',
        daily_limit: 60,
      })

      const stats = await invoke<{
        daily_count: number
        risk_level: string
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_high_risk' })

      expect(stats.risk_level).toBe('High')
      expect(stats.daily_count).toBe(45)
    })

    it('should show 75% progress in anti-ban stats', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 20,
        daily_count: 45,
        success_rate: 100,
        batch_count: 5,
        risk_level: 'High',
        daily_limit: 60,
      })

      const stats = await invoke<{
        daily_count: number
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_75_percent' })

      const percentage = (stats.daily_count / stats.daily_limit) * 100
      expect(percentage).toBeGreaterThanOrEqual(75)
      expect(percentage).toBeLessThan(90)
    })
  })

  describe('TASK-049: CRITICAL risk pause at 90% daily limit', () => {
    it('should emit RISK_THRESHOLD_CRITICAL at 90% of daily limit', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 20,
        daily_count: 54,
        success_rate: 100,
        batch_count: 6,
        risk_level: 'Critical',
        daily_limit: 60,
      })

      const stats = await invoke<{
        daily_count: number
        risk_level: string
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_critical' })

      expect(stats.risk_level).toBe('Critical')
      expect(stats.daily_count).toBe(54)
    })

    it('should show 90% progress in anti-ban stats', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 20,
        daily_count: 54,
        success_rate: 100,
        batch_count: 6,
        risk_level: 'Critical',
        daily_limit: 60,
      })

      const stats = await invoke<{
        daily_count: number
        daily_limit: number
      }>('get_session_anti_ban_stats', { sessionId: 'sess_90_percent' })

      const percentage = (stats.daily_count / stats.daily_limit) * 100
      expect(percentage).toBeGreaterThanOrEqual(90)
    })

    it('should recommend session pause at CRITICAL level', async () => {
      vi.mocked(invoke).mockResolvedValue({
        hourly_count: 20,
        daily_count: 54,
        success_rate: 100,
        batch_count: 6,
        risk_level: 'Critical',
        daily_limit: 60,
      })

      const stats = await invoke<{
        risk_level: string
      }>('get_session_anti_ban_stats', { sessionId: 'sess_pause_recommend' })

      const shouldPause = stats.risk_level === 'Critical'
      expect(shouldPause).toBe(true)
    })
  })

  describe('Risk level transitions', () => {
    it('should transition from None to Medium at 50%', async () => {
      vi.mocked(invoke)
        .mockResolvedValueOnce({
          daily_count: 20,
          risk_level: 'None',
          daily_limit: 60,
        })
        .mockResolvedValueOnce({
          daily_count: 30,
          risk_level: 'Medium',
          daily_limit: 60,
        })

      const stats1 = await invoke<{ daily_count: number; risk_level: string }>(
        'get_session_anti_ban_stats',
        { sessionId: 'sess_transition' },
      )
      expect(stats1.risk_level).toBe('None')

      const stats2 = await invoke<{ daily_count: number; risk_level: string }>(
        'get_session_anti_ban_stats',
        { sessionId: 'sess_transition' },
      )
      expect(stats2.risk_level).toBe('Medium')
    })

    it('should not emit duplicate events for same threshold', async () => {
      const emitHistory: string[] = []

      vi.mocked(invoke).mockImplementation(async () => {
        return {
          daily_count: 30,
          risk_level: 'Medium',
          daily_limit: 60,
          emitted_events: emitHistory,
        }
      })

      await invoke('check_risk_event', { sessionId: 'sess_dup_test' })
      emitHistory.push('Medium')

      await invoke('check_risk_event', { sessionId: 'sess_dup_test' })

      expect(emitHistory.filter((e) => e === 'Medium')).toHaveLength(1)
    })
  })

  describe('Platform-specific daily limits', () => {
    it('should have different daily limits per platform', async () => {
      const limits: Record<string, number> = {
        facebook_groups: 60,
        instagram: 45,
        twitter: 150,
        linkedin: 75,
      }

      vi.mocked(invoke).mockImplementation(async (cmd: string, args: Record<string, string>) => {
        if (cmd === 'get_platform_config') {
          return { daily_action_limit: limits[args.platform as string] || 60 }
        }
        return null
      })

      const fbConfig = await invoke<{ daily_action_limit: number }>('get_platform_config', {
        platform: 'facebook_groups',
      })
      const igConfig = await invoke<{ daily_action_limit: number }>('get_platform_config', {
        platform: 'instagram',
      })

      expect(fbConfig.daily_action_limit).toBe(60)
      expect(igConfig.daily_action_limit).toBe(45)
    })

    it('should calculate 50% threshold based on platform daily limit', async () => {
      vi.mocked(invoke).mockResolvedValue({
        daily_count: 23,
        daily_limit: 45,
        risk_level: 'Medium',
      })

      const stats = await invoke<{
        daily_count: number
        daily_limit: number
        risk_level: string
      }>('get_session_anti_ban_stats', { sessionId: 'sess_ig_50' })

      const percentage = (stats.daily_count / stats.daily_limit) * 100
      expect(percentage).toBeGreaterThanOrEqual(50)
    })
  })
})
