import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlatformSelector, PLATFORM_OPTIONS, PLATFORM_COLORS } from './PlatformSelector'
import type { PlatformTarget } from '@social-pip/types'

describe('PlatformSelector', () => {
	const mockOnPlatformsChange = vi.fn()
	const accountId = 'acc_123'

	beforeEach(() => {
		mockOnPlatformsChange.mockClear()
	})

	describe('rendering', () => {
		it('should render add platform button', () => {
			render(
				<PlatformSelector
					selectedPlatforms={[]}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			expect(screen.getByText('Add Platform')).toBeInTheDocument()
		})

		it('should render selected platforms as chips', () => {
			const platforms: PlatformTarget[] = [
				{ platform: 'facebook_groups', accountId, targets: [], priority: 0 },
				{ platform: 'instagram', accountId, targets: [], priority: 20 },
			]

			render(
				<PlatformSelector
					selectedPlatforms={platforms}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			expect(screen.getByText('Facebook Groups')).toBeInTheDocument()
			expect(screen.getByText('Instagram')).toBeInTheDocument()
		})

		it('should show priority numbers in chips', () => {
			const platforms: PlatformTarget[] = [
				{ platform: 'facebook_groups', accountId, targets: [], priority: 0 },
			]

			render(
				<PlatformSelector
					selectedPlatforms={platforms}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			expect(screen.getByText('(0)')).toBeInTheDocument()
		})
	})

	describe('interactions', () => {
		it('should open dropdown when clicking add platform button', () => {
			render(
				<PlatformSelector
					selectedPlatforms={[]}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			fireEvent.click(screen.getByText('Add Platform'))

			expect(screen.getByText('Facebook Pages')).toBeInTheDocument()
			expect(screen.getByText('Twitter/X')).toBeInTheDocument()
		})

		it('should add platform when clicking unselected option', () => {
			render(
				<PlatformSelector
					selectedPlatforms={[]}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			fireEvent.click(screen.getByText('Add Platform'))
			fireEvent.click(screen.getByText('Facebook Groups'))

			expect(mockOnPlatformsChange).toHaveBeenCalledWith([
				expect.objectContaining({
					platform: 'facebook_groups',
					accountId,
					priority: 0,
				}),
			])
		})

		it('should remove platform when clicking remove button', () => {
			const platforms: PlatformTarget[] = [
				{ platform: 'facebook_groups', accountId, targets: [], priority: 0 },
			]

			render(
				<PlatformSelector
					selectedPlatforms={platforms}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			fireEvent.click(screen.getByLabelText('Remove Facebook Groups'))

			expect(mockOnPlatformsChange).toHaveBeenCalledWith([])
		})

it('should toggle platform selection in dropdown', () => {
    const platforms: PlatformTarget[] = [
      { platform: 'facebook_groups', accountId, targets: [], priority: 0 },
    ]

    render(
      <PlatformSelector
        selectedPlatforms={platforms}
        onPlatformsChange={mockOnPlatformsChange}
        accountId={accountId}
      />,
    )

    fireEvent.click(screen.getByText('Add Platform'))
    const dropdownOption = screen.getAllByText('Facebook Groups').find(el => el.closest('button')?.classList.contains('bg-blue-50'))
    fireEvent.click(dropdownOption!)

    expect(mockOnPlatformsChange).toHaveBeenCalledWith([])
  })
	})

	describe('sorting', () => {
		it('should display platforms sorted by priority', () => {
			const platforms: PlatformTarget[] = [
				{ platform: 'instagram', accountId, targets: [], priority: 20 },
				{ platform: 'facebook_groups', accountId, targets: [], priority: 0 },
			]

			render(
				<PlatformSelector
					selectedPlatforms={platforms}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
				/>,
			)

			const chips = screen.getAllByRole('button', { name: /Remove/ })
			expect(chips[0]).toHaveAttribute('aria-label', 'Remove Facebook Groups')
			expect(chips[1]).toHaveAttribute('aria-label', 'Remove Instagram')
		})
	})

	describe('disabled state', () => {
		it('should disable add button when disabled', () => {
			render(
				<PlatformSelector
					selectedPlatforms={[]}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
					disabled
				/>,
			)

			expect(screen.getByText('Add Platform')).toBeDisabled()
		})

		it('should disable remove buttons when disabled', () => {
			const platforms: PlatformTarget[] = [
				{ platform: 'facebook_groups', accountId, targets: [], priority: 0 },
			]

			render(
				<PlatformSelector
					selectedPlatforms={platforms}
					onPlatformsChange={mockOnPlatformsChange}
					accountId={accountId}
					disabled
				/>,
			)

			expect(screen.getByLabelText('Remove Facebook Groups')).toBeDisabled()
		})
	})
})

describe('PLATFORM_OPTIONS', () => {
	it('should have 5 platform options', () => {
		expect(PLATFORM_OPTIONS).toHaveLength(5)
	})

	it('should have correct priority for facebook_groups', () => {
		const fb = PLATFORM_OPTIONS.find((o) => o.platform === 'facebook_groups')
		expect(fb?.priority).toBe(0)
	})

	it('should have correct priority for instagram', () => {
		const ig = PLATFORM_OPTIONS.find((o) => o.platform === 'instagram')
		expect(ig?.priority).toBe(20)
	})
})

describe('PLATFORM_COLORS', () => {
	it('should have color for facebook_groups', () => {
		expect(PLATFORM_COLORS.facebook_groups).toBe('#1877F2')
	})

	it('should have color for instagram', () => {
		expect(PLATFORM_COLORS.instagram).toBe('#E4405F')
	})

	it('should have color for all platforms', () => {
		const platforms: Array<keyof typeof PLATFORM_COLORS> = [
			'facebook_groups',
			'facebook_pages',
			'instagram',
			'twitter',
			'linkedin',
		]

		for (const platform of platforms) {
			expect(PLATFORM_COLORS[platform]).toBeDefined()
		}
	})
})
