/**
 * @file Tests for versioned DOM selectors with fallbacks
 * TDD: RED phase - Write failing tests first
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import {
	GROUP_SELECTORS,
	queryWithFallback,
	queryAllWithFallback,
} from './selectors'

describe('selectors', () => {
	let document: Document

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
		document = dom.window.document
	})

	describe('GROUP_SELECTORS', () => {
		it('should have groupName selectors with fallbacks', () => {
			expect(GROUP_SELECTORS.groupName).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.groupName)).toBe(true)
			expect(GROUP_SELECTORS.groupName.length).toBeGreaterThanOrEqual(1)
		})

		it('should have groupLink selectors with fallbacks', () => {
			expect(GROUP_SELECTORS.groupLink).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.groupLink)).toBe(true)
			expect(GROUP_SELECTORS.groupLink.length).toBeGreaterThanOrEqual(1)
		})

		it('should have memberCount selectors with fallbacks', () => {
			expect(GROUP_SELECTORS.memberCount).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.memberCount)).toBe(true)
			expect(GROUP_SELECTORS.memberCount.length).toBeGreaterThanOrEqual(1)
		})

		it('should have privacy selectors with fallbacks', () => {
			expect(GROUP_SELECTORS.privacy).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.privacy)).toBe(true)
			expect(GROUP_SELECTORS.privacy.length).toBeGreaterThanOrEqual(1)
		})

		it('should have groupItem selectors for group listings', () => {
			expect(GROUP_SELECTORS.groupItem).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.groupItem)).toBe(true)
			expect(GROUP_SELECTORS.groupItem.length).toBeGreaterThanOrEqual(1)
		})

		it('should have joinedGroupsSection selector', () => {
			expect(GROUP_SELECTORS.joinedGroupsSection).toBeDefined()
			expect(Array.isArray(GROUP_SELECTORS.joinedGroupsSection)).toBe(true)
		})
	})

	describe('queryWithFallback', () => {
		it('should return element when first selector matches', () => {
			const div = document.createElement('div')
			div.setAttribute('data-testid', 'group-name')
			document.body.appendChild(div)

			const selectors = ['[data-testid="group-name"]', '.fallback']
			const result = queryWithFallback(selectors, document)

			expect(result).toBe(div)
		})

		it('should fallback to second selector if first fails', () => {
			const span = document.createElement('span')
			span.className = 'fallback'
			document.body.appendChild(span)

			const selectors = ['[data-testid="nonexistent"]', '.fallback']
			const result = queryWithFallback(selectors, document)

			expect(result).toBe(span)
		})

		it('should return null when no selectors match', () => {
			const selectors = ['[data-testid="nonexistent"]', '.also-nonexistent']
			const result = queryWithFallback(selectors, document)

			expect(result).toBeNull()
		})

		it('should handle empty selector array', () => {
			const result = queryWithFallback([], document)
			expect(result).toBeNull()
		})

		it('should work with Facebook v1 group name selector', () => {
			const h1 = document.createElement('h1')
			h1.setAttribute('data-testid', 'group-name')
			h1.textContent = 'Test Group'
			document.body.appendChild(h1)

			const result = queryWithFallback(GROUP_SELECTORS.groupName, document)
			expect(result).toBe(h1)
		})

		it('should work with Facebook v2 group name selector (fallback)', () => {
			const h1 = document.createElement('h1')
			h1.setAttribute('role', 'heading')
			const span = document.createElement('span')
			span.textContent = 'Fallback Group Name'
			h1.appendChild(span)
			document.body.appendChild(h1)

			const result = queryWithFallback(GROUP_SELECTORS.groupName, document)
			expect(result).toBe(span)
		})
	})

	describe('queryAllWithFallback', () => {
		it('should return all matching elements', () => {
			// Create multiple group items
			for (let i = 0; i < 3; i++) {
				const div = document.createElement('div')
				div.setAttribute('data-testid', 'group-item')
				document.body.appendChild(div)
			}

			const selectors = ['[data-testid="group-item"]', '.fallback']
			const result = queryAllWithFallback(selectors, document)

			expect(result.length).toBe(3)
		})

		it('should fallback to second selector if first returns empty', () => {
			const div1 = document.createElement('div')
			div1.className = 'group-card'
			const div2 = document.createElement('div')
			div2.className = 'group-card'
			document.body.appendChild(div1)
			document.body.appendChild(div2)

			const selectors = ['[data-testid="nonexistent"]', '.group-card']
			const result = queryAllWithFallback(selectors, document)

			expect(result.length).toBe(2)
		})

		it('should return empty array when no selectors match', () => {
			const selectors = ['[data-testid="nonexistent"]']
			const result = queryAllWithFallback(selectors, document)

			expect(result).toEqual([])
		})
	})
})
