import { describe, it, expect } from 'vitest'
import {
  PLATFORM_PRIORITIES,
  getPlatformPriority,
  isPostingPlatform,
  extractPlatformFromAccount,
  platformMatchesAccount,
  validatePlatformTargets,
  type PostingPlatform,
  type PlatformTarget,
} from '../platform'

describe('PLATFORM_PRIORITIES', () => {
  it('should define facebook_groups with priority 0', () => {
    expect(PLATFORM_PRIORITIES.facebook_groups).toBe(0)
  })

  it('should define facebook_pages with priority 10', () => {
    expect(PLATFORM_PRIORITIES.facebook_pages).toBe(10)
  })

  it('should define instagram with priority 20', () => {
    expect(PLATFORM_PRIORITIES.instagram).toBe(20)
  })

  it('should define twitter with priority 30', () => {
    expect(PLATFORM_PRIORITIES.twitter).toBe(30)
  })

  it('should define linkedin with priority 40', () => {
    expect(PLATFORM_PRIORITIES.linkedin).toBe(40)
  })

  it('should have 5 platform priorities defined', () => {
    const keys = Object.keys(PLATFORM_PRIORITIES)
    expect(keys).toHaveLength(5)
  })
})

describe('getPlatformPriority', () => {
  it('should return 0 for facebook_groups', () => {
    expect(getPlatformPriority('facebook_groups')).toBe(0)
  })

  it('should return 20 for instagram', () => {
    expect(getPlatformPriority('instagram')).toBe(20)
  })

  it('should return 99 for unknown platform', () => {
    expect(getPlatformPriority('unknown_platform' as PostingPlatform)).toBe(99)
  })
})

describe('isPostingPlatform', () => {
  it('should return true for valid platform', () => {
    expect(isPostingPlatform('facebook_groups')).toBe(true)
    expect(isPostingPlatform('instagram')).toBe(true)
    expect(isPostingPlatform('linkedin')).toBe(true)
  })

  it('should return false for invalid platform', () => {
    expect(isPostingPlatform('invalid_platform')).toBe(false)
    expect(isPostingPlatform('')).toBe(false)
    expect(isPostingPlatform('facebook')).toBe(false)
  })
})

describe('PlatformTarget', () => {
  it('should create valid PlatformTarget', () => {
    const target: PlatformTarget = {
      platform: 'facebook_groups',
      accountId: 'acc_123',
      targets: ['group_1', 'group_2'],
    }
    expect(target.platform).toBe('facebook_groups')
    expect(target.accountId).toBe('acc_123')
    expect(target.targets).toHaveLength(2)
  })

  it('should allow optional priority override', () => {
    const target: PlatformTarget = {
      platform: 'instagram',
      accountId: 'acc_456',
      targets: ['profile_1'],
      priority: 5,
    }
    expect(target.priority).toBe(5)
  })
})

describe('extractPlatformFromAccount', () => {
  it('should extract facebook from fb_ prefix', () => {
    expect(extractPlatformFromAccount('fb_123')).toBe('facebook')
  })

  it('should extract facebook from facebook_ prefix', () => {
    expect(extractPlatformFromAccount('facebook_456')).toBe('facebook')
  })

  it('should extract instagram from ig_ prefix', () => {
    expect(extractPlatformFromAccount('ig_789')).toBe('instagram')
  })

  it('should extract instagram from instagram_ prefix', () => {
    expect(extractPlatformFromAccount('instagram_abc')).toBe('instagram')
  })

  it('should extract twitter from tw_ prefix', () => {
    expect(extractPlatformFromAccount('tw_123')).toBe('twitter')
  })

  it('should extract linkedin from li_ prefix', () => {
    expect(extractPlatformFromAccount('li_456')).toBe('linkedin')
  })

  it('should return unknown for unrecognized prefix', () => {
    expect(extractPlatformFromAccount('unknown_id')).toBe('unknown')
  })
})

describe('platformMatchesAccount', () => {
  it('should match facebook_groups with facebook account', () => {
    expect(platformMatchesAccount('facebook_groups', 'facebook')).toBe(true)
  })

  it('should match facebook_pages with facebook account', () => {
    expect(platformMatchesAccount('facebook_pages', 'facebook')).toBe(true)
  })

  it('should match instagram with instagram account', () => {
    expect(platformMatchesAccount('instagram', 'instagram')).toBe(true)
  })

  it('should not match instagram with facebook account', () => {
    expect(platformMatchesAccount('instagram', 'facebook')).toBe(false)
  })

  it('should allow any platform for unknown account', () => {
    expect(platformMatchesAccount('facebook_groups', 'unknown')).toBe(true)
    expect(platformMatchesAccount('instagram', 'unknown')).toBe(true)
  })
})

describe('validatePlatformTargets', () => {
  it('should return valid for matching platforms', () => {
    const result = validatePlatformTargets('fb_123', [
      { platform: 'facebook_groups', accountId: 'fb_123', targets: ['g1'] },
      { platform: 'facebook_pages', accountId: 'fb_123', targets: ['p1'] },
    ])
    expect(result.valid).toBe(true)
  })

  it('should return error for empty targets array', () => {
    const result = validatePlatformTargets('fb_123', [
      { platform: 'facebook_groups', accountId: 'fb_123', targets: [] },
    ])
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Targets cannot be empty')
    }
  })

  it('should return error for platform mismatch', () => {
    const result = validatePlatformTargets('fb_123', [
      { platform: 'instagram', accountId: 'fb_123', targets: ['p1'] },
    ])
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('does not match target platform')
    }
  })

  it('should return error for empty platforms array', () => {
    const result = validatePlatformTargets('fb_123', [])
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('At least one platform target is required')
    }
  })

  it('should allow unknown account platform', () => {
    const result = validatePlatformTargets('unknown_account', [
      { platform: 'facebook_groups', accountId: 'unknown_account', targets: ['g1'] },
    ])
    expect(result.valid).toBe(true)
  })
})
