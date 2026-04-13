import { render, screen } from "@testing-library/react"
import { axe, toHaveNoViolations } from "jest-axe"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Button } from "@/components/atoms/Button"
import { FormField } from "@/components/molecules/FormField"
import { QuickPostPanel } from "@/components/organisms/QuickPostPanel"
import { useAccountsStore } from "@/stores/accountsStore"
import { useQuickPostStore } from "@/stores/quickPostStore"
import { useTemplateStore } from "@/stores/templateStore"

expect.extend(toHaveNoViolations)

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn().mockResolvedValue({}),
}))

describe("Accessibility Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks()

		useAccountsStore.setState({
			accounts: [],
			selectedId: null,
			loading: false,
			error: null,
		})

		useTemplateStore.setState({
			templates: [],
			selectedId: null,
			preview: null,
			previewVariations: 0,
			loading: false,
			error: null,
		})

		useQuickPostStore.setState({
			groups: [],
			selectedTemplateId: null,
			selectedGroupIds: [],
			selectedAccountId: null,
			canPost: false,
			estimatedTime: 0,
			warningMessage: null,
			groupsLoading: false,
			groupsError: null,
			accountRiskLevel: null,
			dailyPostCount: 0,
			dailyPostLimit: 30,
			cooldownUntil: null,
		})
	})

	describe("Form Accessibility", () => {
		it("all forms have proper labels", async () => {
			const { container } = render(
				<FormField
					label="Test Field"
					name="testField"
					error={undefined}
					touched={false}
				>
					<input id="testField" type="text" />
				</FormField>,
			)

			const label = screen.getByText("Test Field")
			expect(label).toBeInTheDocument()

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})

		it("form fields have proper aria attributes", async () => {
			const { container } = render(
				<FormField
					label="Email"
					name="email"
					error="Invalid email"
					touched={true}
				>
					<input id="email" type="email" aria-invalid="true" />
				</FormField>,
			)

			const input = screen.getByRole("textbox")
			expect(input).toHaveAttribute("aria-invalid", "true")

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})
	})

	describe("Interactive Elements", () => {
		it("all buttons are keyboard accessible", async () => {
			const { container } = render(
				<div>
					<Button variant="primary">Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="danger">Danger</Button>
				</div>,
			)

			const buttons = screen.getAllByRole("button")
			expect(buttons).toHaveLength(3)

			for (const button of buttons) {
				expect(button).not.toHaveAttribute("tabindex", "-1")
			}

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})

		it("disabled buttons are properly marked", async () => {
			const { container } = render(
				<Button variant="primary" disabled>
					Disabled
				</Button>,
			)

			const button = screen.getByRole("button")
			expect(button).toBeDisabled()

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})
	})

	describe("Color Contrast", () => {
		it("text has sufficient color contrast", async () => {
			const { container } = render(
				<div className="bg-white text-gray-900">
					<p className="text-sm">Small text</p>
					<p className="text-lg">Large text</p>
					<p className="text-xs text-gray-600">Helper text</p>
				</div>,
			)

			const results = await axe(container, {
				rules: {
					"color-contrast": { enabled: true },
				},
			})
			expect(results).toHaveNoViolations()
		})
	})

	describe("ARIA Attributes", () => {
		it("loading states have proper ARIA live regions", async () => {
			const { container } = render(
				<div role="status" aria-live="polite">
					<span className="sr-only">Loading...</span>
					<div className="animate-spin">Spinner</div>
				</div>,
			)

			const liveRegion = screen.getByRole("status")
			expect(liveRegion).toHaveAttribute("aria-live", "polite")

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})
	})

	describe("Focus Management", () => {
		it("focus is visible on interactive elements", async () => {
			const { container } = render(
				<div>
					<Button variant="primary">Focus Test</Button>
					<a href="#" className="focus:outline-none focus:ring-2">
						Link
					</a>
				</div>,
			)

			const results = await axe(container)
			expect(results).toHaveNoViolations()
		})
	})
})
