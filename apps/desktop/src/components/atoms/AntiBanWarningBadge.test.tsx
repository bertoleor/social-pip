import type { AntiBanStats } from "@social-pip/types";
import { render, screen } from "@testing-library/react";
/**
 * @fileoverview AntiBanWarningBadge atom tests (TDD)
 */
import { describe, expect, it } from "vitest";
import { AntiBanWarningBadge } from "./AntiBanWarningBadge";

// Mock AntiBanStats for testing
const mockAntiBanStats: AntiBanStats = {
  hourly_count: 5,
  daily_count: 25,
  success_rate: 0.95,
  batch_count: 3,
  config: {
    platform: "facebook",
    min_action_delay_ms: 60000,
    max_action_delay_ms: 240000,
    hourly_action_limit: 50,
    daily_action_limit: 300,
    batch_size: 10,
    batch_break_minutes: 20,
  },
};

describe("AntiBanWarningBadge", () => {
  describe("low risk", () => {
    it('renders green badge with "Safe" label', () => {
      render(<AntiBanWarningBadge riskLevel="low" />);

      const badge = screen.getByText("Safe");
      expect(badge).toBeInTheDocument();
      expect(badge.closest("span")).toHaveClass("bg-green-100");
      expect(badge.closest("span")).toHaveClass("text-green-700");
    });

    it("shows checkmark icon for low risk", () => {
      render(<AntiBanWarningBadge riskLevel="low" />);

      // Check that checkmark icon is rendered (lucide-react Check)
      const badge = screen.getByText("Safe").parentElement;
      expect(badge?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("medium risk", () => {
    it('renders yellow badge with "Caution" label', () => {
      render(<AntiBanWarningBadge riskLevel="medium" />);

      const badge = screen.getByText("Caution");
      expect(badge).toBeInTheDocument();
      expect(badge.closest("span")).toHaveClass("bg-yellow-100");
      expect(badge.closest("span")).toHaveClass("text-yellow-700");
    });

    it("shows warning icon for medium risk", () => {
      render(<AntiBanWarningBadge riskLevel="medium" />);

      const badge = screen.getByText("Caution").parentElement;
      expect(badge?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("high risk", () => {
    it('renders red badge with "Stop" label', () => {
      render(<AntiBanWarningBadge riskLevel="high" />);

      const badge = screen.getByText("Stop");
      expect(badge).toBeInTheDocument();
      expect(badge.closest("span")).toHaveClass("bg-red-100");
      expect(badge.closest("span")).toHaveClass("text-red-700");
    });

    it("shows alert icon for high risk", () => {
      render(<AntiBanWarningBadge riskLevel="high" />);

      const badge = screen.getByText("Stop").parentElement;
      expect(badge?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("tooltip with stats", () => {
    it("shows hourly and daily stats on hover when stats provided", () => {
      render(<AntiBanWarningBadge riskLevel="medium" stats={mockAntiBanStats} />);

      // Check for title attribute (native HTML tooltip)
      const badge = screen.getByText("Caution").closest("span");
      expect(badge).toHaveAttribute("title");
      const title = badge?.getAttribute("title");
      expect(title).toContain("Hourly: 5/50");
      expect(title).toContain("Daily: 25/300");
    });

    it("shows recommendation for high risk", () => {
      render(<AntiBanWarningBadge riskLevel="high" stats={mockAntiBanStats} />);

      const badge = screen.getByText("Stop").closest("span");
      const title = badge?.getAttribute("title");
      expect(title).toContain("Take a break recommended");
    });

    it("works without stats (no crash)", () => {
      render(<AntiBanWarningBadge riskLevel="low" />);

      const badge = screen.getByText("Safe");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper aria-label for risk level", () => {
      render(<AntiBanWarningBadge riskLevel="high" />);

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "High risk: Stop posting recommended");
    });

    it("has aria-label for medium risk", () => {
      render(<AntiBanWarningBadge riskLevel="medium" />);

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "Medium risk: Proceed with caution");
    });

    it("has aria-label for low risk", () => {
      render(<AntiBanWarningBadge riskLevel="low" />);

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "Low risk: Safe to post");
    });
  });
});
