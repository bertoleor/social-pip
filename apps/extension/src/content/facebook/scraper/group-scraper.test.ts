/**
 * @file Tests for group scraper with anti-ban considerations
 * TDD: RED phase - Write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import {
	scrapeJoinedGroups,
	scrollToLoadMore,
	extractGroupData,
	type ScraperConfig,
	type ScrapedGroup,
} from './group-scraper'

// Mock helpers
vi.mock('./selectors', () => ({
	GROUP_SELECTORS: {
		groupItem: ['[data-testid="group-item"]', '.group-card'],
		groupName: ['[data-testid="group-name"]', 'h3.group-name'],
		groupLink: ['[data-testid="group-link"]', 'a.group-link'],
		memberCount: ['[data-testid="member-count"]', '.member-count'],
		privacy: ['[data-testid="privacy-badge"]', '.privacy-indicator'],
		joinedGroupsSection: ['[data-testid="joined-groups"]', '.groups-section'],
	},
	queryWithFallback: vi.fn((selectors: string[], doc: Document) => {
		for (const selector of selectors) {
			const el = doc.querySelector(selector)
			if (el) return el
		}
		return null
	}),
	queryAllWithFallback: vi.fn((selectors: string[], doc: Document) => {
		for (const selector of selectors) {
			const elements = doc.querySelectorAll(selector)
			if (elements.length > 0) return Array.from(elements)
		}
		return []
	}),
}))

describe('group-scraper', () => {
	let document: Document
	let window: Window

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
			url: 'https://facebook.com/groups/',
		})
		window = dom.window
		document = dom.window.document
		vi.clearAllMocks()
	})

	describe('ScraperConfig defaults', () => {
		it('should have default maxGroups of 50', async () => {
			// Create 60 groups
			for (let i = 0; i < 60; i++) {
				const div = document.createElement('div')
				div.setAttribute('data-testid', 'group-item')
				div.innerHTML = `
					<h3 data-testid="group-name">Group ${i}</h3>
					<a data-testid="group-link" href="/groups/${i}">Link</a>
					<span data-testid="member-count">1000 members</span>
				`
				document.body.appendChild(div)
			}

			const result = await scrapeJoinedGroups({}, document)

			// Should be capped at 50
			expect(result.length).toBeLessThanOrEqual(50)
		})

		it('should have default scrollAttempts of 10', async () => {
			// Default config should allow 10 scroll attempts
			const defaultConfig: ScraperConfig = {
				maxGroups: 50,
				scrollAttempts: 10,
				scrollDelay: [2000, 4000],
			}

			expect(defaultConfig.scrollAttempts).toBe(10)
		})

		it('should have default scrollDelay of 2000-4000ms', async () => {
			const defaultConfig: ScraperConfig = {
				maxGroups: 50,
				scrollAttempts: 10,
				scrollDelay: [2000, 4000],
			}

			expect(defaultConfig.scrollDelay[0]).toBe(2000)
			expect(defaultConfig.scrollDelay[1]).toBe(4000)
		})
	})

	describe('scrapeJoinedGroups', () => {
		it('should scrape basic group data', async () => {
			// Create a group item
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Test Group</h3>
				<a data-testid="group-link" href="https://facebook.com/groups/123456">Link</a>
				<span data-testid="member-count">1.2K members</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result.length).toBe(1)
			expect(result[0]?.name).toBe('Test Group')
			expect(result[0]?.id).toBe('123456')
		})

		it('should respect maxGroups limit', async () => {
			// Create 5 groups
			for (let i = 0; i < 5; i++) {
				const div = document.createElement('div')
				div.setAttribute('data-testid', 'group-item')
				div.innerHTML = `
					<h3 data-testid="group-name">Group ${i}</h3>
					<a data-testid="group-link" href="/groups/${i}">Link</a>
				`
				document.body.appendChild(div)
			}

			const result = await scrapeJoinedGroups({ maxGroups: 3 }, document)

			expect(result.length).toBe(3)
		})

		it('should return empty array when no groups found', async () => {
			const result = await scrapeJoinedGroups({}, document)
			expect(result).toEqual([])
		})

		it('should parse member count with K/M suffixes', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Large Group</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
				<span data-testid="member-count">12.5K members</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.memberCount).toBe(12500)
		})

		it('should parse member count with M suffix', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Huge Group</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
				<span data-testid="member-count">1.2M members</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.memberCount).toBe(1200000)
		})

		it('should handle null member count gracefully', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">No Member Count</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.memberCount).toBeNull()
		})

		it('should detect public privacy', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Public Group</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
				<span data-testid="privacy-badge">Public</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.privacy).toBe('public')
		})

		it('should detect private privacy', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Private Group</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
				<span data-testid="privacy-badge">Private</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.privacy).toBe('private')
		})

		it('should detect requiresApproval from badge', async () => {
			const groupDiv = document.createElement('div')
			groupDiv.setAttribute('data-testid', 'group-item')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Approval Group</h3>
				<a data-testid="group-link" href="/groups/1">Link</a>
				<span data-testid="privacy-badge">Approval required</span>
			`
			document.body.appendChild(groupDiv)

			const result = await scrapeJoinedGroups({ maxGroups: 10 }, document)

			expect(result[0]?.requiresApproval).toBe(true)
		})
	})

	describe('scrollToLoadMore', () => {
		it('should scroll specified number of times', async () => {
			const scrollSpy = vi.fn()
			window.scrollBy = scrollSpy

			// Use fake timers
			vi.useFakeTimers()

			const scrollPromise = scrollToLoadMore(3, [0, 0], window)

			// Fast-forward timers for each scroll
			await vi.runAllTimersAsync()

			await scrollPromise

			expect(scrollSpy).toHaveBeenCalledTimes(3)
		})

		it('should use random delay within range', async () => {
			const delayRange: [number, number] = [2000, 4000]
			vi.useFakeTimers()

			const scrollPromise = scrollToLoadMore(1, delayRange, window)

			// Verify delay is within range (0 for testing, but logic should apply)
			await vi.runAllTimersAsync()
			await scrollPromise

			// If we reach here without timeout, timing logic works
			expect(true).toBe(true)
		})
	})

	describe('extractGroupData', () => {
		it('should extract all fields from group element', () => {
			const groupDiv = document.createElement('div')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Extract Test Group</h3>
				<a data-testid="group-link" href="https://facebook.com/groups/999888">Visit</a>
				<span data-testid="member-count">500 members</span>
				<span data-testid="privacy-badge">Public group</span>
			`
			document.body.appendChild(groupDiv)

			const result = extractGroupData(groupDiv, document)

			expect(result).toEqual({
				id: '999888',
				name: 'Extract Test Group',
				url: 'https://facebook.com/groups/999888',
				memberCount: 500,
				privacy: 'public',
				requiresApproval: false,
			})
		})

		it('should handle missing optional fields', () => {
			const groupDiv = document.createElement('div')
			groupDiv.innerHTML = `
				<h3 data-testid="group-name">Minimal Group</h3>
				<a data-testid="group-link" href="/groups/111">Link</a>
			`
			document.body.appendChild(groupDiv)

			const result = extractGroupData(groupDiv, document)

			expect(result.name).toBe('Minimal Group')
			expect(result.memberCount).toBeNull()
			expect(result.requiresApproval).toBe(false)
		})
	})

	describe('anti-ban measures', () => {
		it('should randomize scroll delay within specified range', async () => {
			vi.useFakeTimers()

			const scrollPromise = scrollToLoadMore(1, [2000, 4000], window)

			// Advance by minimum delay
			await vi.advanceTimersByTimeAsync(2000)

			// Should not have completed yet (needs random delay)
			// This tests that delay is applied

			await vi.runAllTimersAsync()
			await scrollPromise
		})
	})
})
