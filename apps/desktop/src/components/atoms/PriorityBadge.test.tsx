import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge, getPriorityColor } from './PriorityBadge'

describe('PriorityBadge', () => {
	describe('rendering', () => {
		it('should render priority number', () => {
			render(<PriorityBadge priority={0} />)
			expect(screen.getByText('0')).toBeInTheDocument()
		})

		it('should render priority 10', () => {
			render(<PriorityBadge priority={10} />)
			expect(screen.getByText('10')).toBeInTheDocument()
		})

		it('should render priority 20', () => {
			render(<PriorityBadge priority={20} />)
			expect(screen.getByText('20')).toBeInTheDocument()
		})

		it('should render priority 99', () => {
			render(<PriorityBadge priority={99} />)
			expect(screen.getByText('99')).toBeInTheDocument()
		})
	})

	describe('variants', () => {
		it('should have critical variant for priority 0', () => {
			const { container } = render(<PriorityBadge priority={0} />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('bg-red-100')
			expect(badge?.className).toContain('text-red-700')
		})

		it('should have high variant for priority 10', () => {
			const { container } = render(<PriorityBadge priority={10} />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('bg-orange-100')
			expect(badge?.className).toContain('text-orange-700')
		})

		it('should have medium variant for priority 20', () => {
			const { container } = render(<PriorityBadge priority={20} />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('bg-orange-100')
			expect(badge?.className).toContain('text-orange-700')
		})

		it('should have neutral variant for priority 99', () => {
			const { container } = render(<PriorityBadge priority={99} />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('bg-gray-100')
			expect(badge?.className).toContain('text-gray-600')
		})
	})

	describe('sizes', () => {
		it('should render small size by default', () => {
			const { container } = render(<PriorityBadge priority={0} />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('text-xs')
		})

		it('should render medium size when specified', () => {
			const { container } = render(<PriorityBadge priority={0} size="md" />)
			const badge = container.querySelector('span')
			expect(badge?.className).toContain('text-sm')
		})
	})

	describe('with platform', () => {
		it('should display platform priority when provided', () => {
			render(<PriorityBadge priority={0} platform="facebook_groups" />)
			expect(screen.getByText('0')).toBeInTheDocument()
		})

		it('should display instagram priority', () => {
			render(<PriorityBadge priority={20} platform="instagram" />)
			expect(screen.getByText('20')).toBeInTheDocument()
		})

		it('should display twitter priority', () => {
			render(<PriorityBadge priority={30} platform="twitter" />)
			expect(screen.getByText('30')).toBeInTheDocument()
		})
	})

	describe('accessibility', () => {
		it('should have screen reader text', () => {
			render(<PriorityBadge priority={0} />)
			expect(screen.getByText('Critical priority')).toBeInTheDocument()
		})
	})
})

describe('getPriorityColor', () => {
	it('should return red for priority 0', () => {
		expect(getPriorityColor(0)).toBe('#DC2626')
	})

	it('should return orange for priority 10', () => {
		expect(getPriorityColor(10)).toBe('#F97316')
	})

	it('should return orange for priority 20', () => {
		expect(getPriorityColor(20)).toBe('#F97316')
	})

	it('should return gray for priority 99', () => {
		expect(getPriorityColor(99)).toBe('#6B7280')
	})
})
