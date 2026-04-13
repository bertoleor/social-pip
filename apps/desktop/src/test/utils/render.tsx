import { render, type RenderOptions, type RenderResult } from "@testing-library/react"
import type { ReactElement } from "react"

export function renderWithProviders(
	ui: ReactElement,
	options: Omit<RenderOptions, "wrapper"> = {},
): RenderResult {
	return render(ui, options)
}

export * from "@testing-library/react"
export { renderWithProviders as render }
