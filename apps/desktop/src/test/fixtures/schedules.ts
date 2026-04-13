import type { Schedule, ScheduleStatus } from "@social-pip/types"

interface CreateScheduleFixtureOptions {
	id?: string
	postId?: string
	accountId?: string
	scheduledAt?: Date
	variance?: number
	status?: ScheduleStatus
	attempts?: number
	maxAttempts?: number
	result?: string
	createdAt?: Date
	updatedAt?: Date
}

export function createScheduleFixture(options: CreateScheduleFixtureOptions = {}): Schedule {
	return {
		id: options.id ?? "sched_test001",
		postId: options.postId ?? "post_test001",
		accountId: options.accountId ?? "acc_test001",
		scheduledAt: options.scheduledAt ?? new Date("2026-04-15T10:00:00Z"),
		variance: options.variance ?? 15,
		status: options.status ?? "pending",
		attempts: options.attempts ?? 0,
		maxAttempts: options.maxAttempts ?? 3,
		result: options.result,
		createdAt: options.createdAt ?? new Date("2026-04-01T00:00:00Z"),
		updatedAt: options.updatedAt ?? new Date("2026-04-01T00:00:00Z"),
	}
}

export function createScheduleFixtures(count: number, options: CreateScheduleFixtureOptions = {}): Schedule[] {
	return Array.from({ length: count }, (_, index) => {
		const statuses: ScheduleStatus[] = ["pending", "running", "completed", "failed", "cancelled"]
		const hour = 10 + index
		return createScheduleFixture({
			...options,
			id: options.id ? `${options.id}_${index}` : `sched_test${String(index + 1).padStart(3, "0")}`,
			status: options.status ?? statuses[index % 5],
			scheduledAt: options.scheduledAt ?? new Date(`2026-04-15T${hour}:00:00Z`),
		})
	})
}

export const mockPendingSchedule = createScheduleFixture({
	id: "sched_pending",
	status: "pending",
	scheduledAt: new Date("2026-04-20T14:00:00Z"),
})

export const mockRunningSchedule = createScheduleFixture({
	id: "sched_running",
	status: "running",
	scheduledAt: new Date("2026-04-12T10:00:00Z"),
	attempts: 1,
})

export const mockCompletedSchedule = createScheduleFixture({
	id: "sched_completed",
	status: "completed",
	scheduledAt: new Date("2026-04-10T09:00:00Z"),
	result: "success",
})

export const mockFailedSchedule = createScheduleFixture({
	id: "sched_failed",
	status: "failed",
	scheduledAt: new Date("2026-04-10T11:00:00Z"),
	attempts: 3,
	result: "Error: Network timeout",
})

export const mockCancelledSchedule = createScheduleFixture({
	id: "sched_cancelled",
	status: "cancelled",
	scheduledAt: new Date("2026-04-10T12:00:00Z"),
})

export const mockTodaySchedule = createScheduleFixture({
	id: "sched_today",
	status: "pending",
	scheduledAt: new Date(Date.now() + 3600000),
})

export const mockTomorrowSchedule = createScheduleFixture({
	id: "sched_tomorrow",
	status: "pending",
	scheduledAt: new Date(Date.now() + 86400000),
})
