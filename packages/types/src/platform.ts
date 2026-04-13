export type PostingPlatform =
  | 'facebook_groups'
  | 'facebook_pages'
  | 'instagram'
  | 'twitter'
  | 'linkedin'

export const PLATFORM_PRIORITIES: Record<PostingPlatform, number> = {
  facebook_groups: 0,
  facebook_pages: 10,
  instagram: 20,
  twitter: 30,
  linkedin: 40,
}

export function getPlatformPriority(platform: PostingPlatform): number {
  return PLATFORM_PRIORITIES[platform] ?? 99
}

export function isPostingPlatform(value: unknown): value is PostingPlatform {
  if (typeof value !== 'string') return false
  return Object.keys(PLATFORM_PRIORITIES).includes(value)
}

export interface PlatformTarget {
  platform: PostingPlatform
  accountId: string
  targets: string[]
  priority?: number
}

export function extractPlatformFromAccount(accountId: string): string {
  if (accountId.startsWith('fb_') || accountId.startsWith('facebook_')) {
    return 'facebook'
  }
  if (accountId.startsWith('ig_') || accountId.startsWith('instagram_')) {
    return 'instagram'
  }
  if (accountId.startsWith('tw_') || accountId.startsWith('twitter_')) {
    return 'twitter'
  }
  if (accountId.startsWith('li_') || accountId.startsWith('linkedin_')) {
    return 'linkedin'
  }
  return 'unknown'
}

export function platformMatchesAccount(targetPlatform: PostingPlatform, accountPlatform: string): boolean {
  if (accountPlatform === 'unknown') {
    return true
  }
  const targetBase = getPlatformBase(targetPlatform)
  return targetBase === accountPlatform
}

function getPlatformBase(platform: PostingPlatform): string {
  switch (platform) {
    case 'facebook_groups':
    case 'facebook_pages':
      return 'facebook'
    default:
      return platform
  }
}

export function validatePlatformTargets(
  accountId: string,
  targets: PlatformTarget[],
): { valid: true } | { valid: false; error: string } {
  if (targets.length === 0) {
    return { valid: false, error: 'At least one platform target is required' }
  }

  for (const target of targets) {
    if (target.targets.length === 0) {
      return {
        valid: false,
        error: `Targets cannot be empty for platform ${target.platform}`,
      }
    }
  }

  const accountPlatform = extractPlatformFromAccount(accountId)
  for (const target of targets) {
    if (!platformMatchesAccount(target.platform, accountPlatform)) {
      return {
        valid: false,
        error: `Account platform (${accountPlatform}) does not match target platform (${target.platform})`,
      }
    }
  }

  return { valid: true }
}
