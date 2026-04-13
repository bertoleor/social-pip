import { invoke } from "@tauri-apps/api/core"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AlertList } from "@/components/organisms/AlertList"
import { useAlertsStore } from "@/stores/alertsStore"

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("Alerts Flow Integration", () => {
	const user = userEvent.setup()

	const mockAlert = {
		id: "alert-1",
		alert_type: "rate_limit",
		severity: "WARNING" as const,
		platform: "facebook",
		account_id: "account-1",
		message: "Rate limit approaching",
		details: { threshold: 80 },
		timestamp: new Date().toISOString(),
		acknowledged: false,
		acknowledged_at: null,
		resolved: false,
		resolved_at: null,
	}

	const mockCriticalAlert = {
		id: "alert-2",
		alert_type: "account_banned",
		severity: "CRITICAL" as const,
		platform: "instagram",
		account_id: "account-2",
		message: "Account has been banned",
		details: { reason: "suspicious_activity" },
		timestamp: new Date().toISOString(),
		acknowledged: false,
		acknowledged_at: null,
		resolved: false,
		resolved_at: null,
	}

	beforeEach(() => {
		vi.clearAllMocks()

		useAlertsStore.setState({
			alerts: [],
			stats: null,
			loading: false,
			error: null,
		})

mockInvoke.mockImplementation(async (command: string, args?: Record<string, unknown>) => {
      if (command === "get_alerts") {
        const currentAlerts = useAlertsStore.getState().alerts
        return currentAlerts.length > 0 ? currentAlerts : []
      }
      if (command === "create_alert") {
        return {
          id: "alert-new",
          alert_type: args?.alertType ?? "unknown",
          severity: args?.severity ?? "INFO",
          platform: args?.platform ?? null,
          account_id: args?.accountId ?? null,
          message: args?.message ?? "",
          details: null,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          acknowledged_at: null,
          resolved: false,
          resolved_at: null,
        }
      }
      if (command === "acknowledge_alert") return undefined
      if (command === "resolve_alert") return undefined
      if (command === "init_alert_system") {
        return {
          total_alerts: 1,
          unresolved: 1,
          critical: 0,
          warnings: 1,
          last_24h: 1,
          last_hour: 0,
        }
      }
      return {}
    })
	})

	describe("Action triggers alert - useAlerts creates alert - AlertList displays", () => {
		it("should display alerts in AlertList component", async () => {
			useAlertsStore.setState({ alerts: [mockAlert] })

			render(<AlertList />)

			await waitFor(() => {
				expect(screen.getByTestId("alert-list")).toBeInTheDocument()
				expect(screen.getByText("Rate limit approaching")).toBeInTheDocument()
			})
		})

		it("should create alert via store and display in list", async () => {
			render(<AlertList />)

			await act(async () => {
				await useAlertsStore.getState().createAlert(
					"test_alert",
					"WARNING",
					"Test warning message",
					"facebook",
				)
			})

			await waitFor(() => {
				const state = useAlertsStore.getState()
				expect(state.alerts).toHaveLength(1)
			})
		})

		it("should show severity badge with correct styling", async () => {
			useAlertsStore.setState({ alerts: [mockCriticalAlert] })

			render(<AlertList />)

			await waitFor(() => {
				const badge = screen.getByTestId("severity-badge-CRITICAL")
				expect(badge).toBeInTheDocument()
				expect(badge).toHaveTextContent("CRITICAL")
			})
		})
	})

	describe("Auto-dismiss timing - alert removal", () => {
		it("should acknowledge alert when acknowledge button clicked", async () => {
			useAlertsStore.setState({ alerts: [mockAlert] })

			render(<AlertList showAcknowledge />)

			await waitFor(() => {
				expect(screen.getByText("Acknowledge")).toBeInTheDocument()
			})

			await user.click(screen.getByText("Acknowledge"))

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("acknowledge_alert", {
					alertId: "alert-1",
				})
			})
		})

		it("should resolve alert when resolve button clicked", async () => {
			useAlertsStore.setState({ alerts: [mockAlert] })

			render(<AlertList />)

			await waitFor(() => {
				expect(screen.getByText("Resolve")).toBeInTheDocument()
			})

			await user.click(screen.getByText("Resolve"))

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("resolve_alert", {
					alertId: "alert-1",
				})
			})
		})

		it("should update alert state after acknowledgment", async () => {
			useAlertsStore.setState({ alerts: [mockAlert] })

			render(<AlertList showAcknowledge />)

			await act(async () => {
				await useAlertsStore.getState().acknowledgeAlert("alert-1")
			})

			await waitFor(() => {
				const state = useAlertsStore.getState()
				const alert = state.alerts.find((a) => a.id === "alert-1")
				expect(alert?.acknowledged).toBe(true)
			})
		})

		it("should hide acknowledge button for acknowledged alerts", async () => {
			const acknowledgedAlert = { ...mockAlert, acknowledged: true }
			useAlertsStore.setState({ alerts: [acknowledgedAlert] })

			render(<AlertList showAcknowledge />)

			await waitFor(() => {
				expect(screen.queryByText("Acknowledge")).not.toBeInTheDocument()
			})
		})
	})

	describe("Alert filtering and loading states", () => {
		it("should show loading state", async () => {
			useAlertsStore.setState({ loading: true })

			render(<AlertList />)

			expect(screen.getByTestId("alert-list-loading")).toBeInTheDocument()
		})

		it("should show empty state when no alerts", async () => {
			useAlertsStore.setState({ alerts: [], loading: false })

			render(<AlertList />)

			await waitFor(() => {
				expect(screen.getByText("No alerts to display")).toBeInTheDocument()
			})
		})

		it("should filter by severity", async () => {
			useAlertsStore.setState({ alerts: [mockAlert, mockCriticalAlert] })

			render(<AlertList severityFilter="CRITICAL" />)

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
					limit: 50,
					severityFilter: "CRITICAL",
				})
			})
		})

		it("should limit number of alerts displayed", async () => {
			render(<AlertList limit={10} />)

			await waitFor(() => {
				expect(mockInvoke).toHaveBeenCalledWith("get_alerts", {
					limit: 10,
					severityFilter: null,
				})
			})
		})
	})
})
