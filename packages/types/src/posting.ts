import type { PlatformTarget } from './platform'

export interface StartMultiPlatformSessionInput {
  accountId: string
  platforms: PlatformTarget[]
  templateId?: string
  content?: string
}
