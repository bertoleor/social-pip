import type { Schedule, ScheduleFilter, UpdateScheduleData } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Schedule store - Zustand state management for post scheduling
 */
import { create } from "zustand";

// State interface
export interface ScheduleState {
  schedules: Schedule[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  filter: ScheduleFilter;
  fetchSchedules: (filter?: ScheduleFilter) => Promise<void>;
  schedulePost: (postId: string, scheduledAt: Date, variance?: number) => Promise<Schedule>;
  cancelSchedule: (scheduleId: string) => Promise<void>;
  updateSchedule: (scheduleId: string, data: UpdateScheduleData) => Promise<Schedule>;
  selectSchedule: (id: string | null) => void;
  setFilter: (filter: ScheduleFilter) => void;
}

// Helper to convert filter to invoke params
function filterToParams(filter: ScheduleFilter): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {};

  if (filter.accountId !== undefined) {
    params["account_id"] = filter.accountId;
  }
  if (filter.status !== undefined) {
    params["status"] = filter.status;
  }
  if (filter.from !== undefined) {
    params["from"] = filter.from.toISOString();
  }
  if (filter.to !== undefined) {
    params["to"] = filter.to.toISOString();
  }

  return params;
}

// Helper to sort schedules by scheduledAt ascending
function sortSchedules(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort((a, b) => {
    const dateA = new Date(a.scheduledAt).getTime();
    const dateB = new Date(b.scheduledAt).getTime();
    return dateA - dateB;
  });
}

// Store implementation
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  selectedId: null,
  loading: false,
  error: null,
  filter: {},

  fetchSchedules: async (filter?: ScheduleFilter) => {
    const currentFilter = filter ?? get().filter;
    set({ loading: true, error: null });

    try {
      const params = filterToParams(currentFilter);
      const schedules = await invoke<Schedule[]>("get_schedules", params);
      set({
        schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        error: errorMessage,
        loading: false,
        // Keep existing schedules on failure
      });
    }
  },

  schedulePost: async (postId: string, scheduledAt: Date, variance?: number) => {
    try {
      const schedule = await invoke<Schedule>("schedule_post", {
        post_id: postId,
        scheduled_at: scheduledAt.toISOString(),
        variance: variance ?? 15,
      });

      // Add new schedule and sort
      const currentSchedules = get().schedules;
      const updatedSchedules = sortSchedules([...currentSchedules, schedule]);

      set({
        schedules: updatedSchedules,
        error: null,
      });

      return schedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  cancelSchedule: async (scheduleId: string) => {
    try {
      await invoke<void>("cancel_schedule", {
        schedule_id: scheduleId,
      });

      // Remove schedule from state
      const currentSchedules = get().schedules;
      const updatedSchedules = currentSchedules.filter((s) => s.id !== scheduleId);

      // Clear selectedId if it matches
      const currentSelectedId = get().selectedId;
      const newSelectedId = currentSelectedId === scheduleId ? null : currentSelectedId;

      set({
        schedules: updatedSchedules,
        selectedId: newSelectedId,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  updateSchedule: async (scheduleId: string, data: UpdateScheduleData) => {
    const params: Record<string, string | number | undefined> = {
      schedule_id: scheduleId,
    };

    if (data.scheduledAt !== undefined) {
      params["scheduled_at"] = data.scheduledAt.toISOString();
    }
    if (data.variance !== undefined) {
      params["variance"] = data.variance;
    }

    try {
      const schedule = await invoke<Schedule>("update_schedule", params);

      // Update schedule in state and resort
      const currentSchedules = get().schedules;
      const updatedSchedules = currentSchedules.map((s) => (s.id === scheduleId ? schedule : s));
      const sortedSchedules = sortSchedules(updatedSchedules);

      set({
        schedules: sortedSchedules,
        error: null,
      });

      return schedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  selectSchedule: (id: string | null) => {
    set({ selectedId: id });
  },

  setFilter: (filter: ScheduleFilter) => {
    const currentFilter = get().filter;
    set({ filter: { ...currentFilter, ...filter } });
  },
}));
