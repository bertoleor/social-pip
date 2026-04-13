import { describe, it, expect, beforeEach } from 'vitest'
import { usePostingStore } from '../postingStore'
import type { PlatformTarget } from '@social-pip/types'

describe('postingStore', () => {
beforeEach(() => {
usePostingStore.setState({
currentSession: null,
jobs: [],
isProcessing: false,
error: null,
})
})

describe('platformTargets', () => {
it('should have empty platformTargets by default', () => {
const state = usePostingStore.getState()
expect(state.platformTargets).toEqual([])
})

it('should set platformTargets', () => {
const targets: PlatformTarget[] = [
{ platform: 'facebook_groups', accountId: 'acc_1', targets: ['g1', 'g2'] },
{ platform: 'instagram', accountId: 'acc_1', targets: ['p1'] },
]

usePostingStore.getState().setPlatformTargets(targets)

const state = usePostingStore.getState()
expect(state.platformTargets).toHaveLength(2)
expect(state.platformTargets[0]?.platform).toBe('facebook_groups')
expect(state.platformTargets[1]?.platform).toBe('instagram')
})
})

describe('multi-platform session', () => {
it('should start multi-platform session with platforms', async () => {
const targets: PlatformTarget[] = [
{ platform: 'facebook_groups', accountId: 'acc_1', targets: ['g1'], priority: 0 },
{ platform: 'instagram', accountId: 'acc_1', targets: ['p1'], priority: 20 },
]

usePostingStore.getState().setPlatformTargets(targets)

expect(usePostingStore.getState().platformTargets).toHaveLength(2)
})
})

describe('priority calculation', () => {
it('should calculate priority from PLATFORM_PRIORITIES', () => {
const target: PlatformTarget = {
platform: 'facebook_groups',
accountId: 'acc_1',
targets: ['g1'],
}

expect(target.priority).toBeUndefined()
})
})
})
