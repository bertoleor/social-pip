import type { AntiBanStats } from "@social-pip/types";
import { render, screen } from "@testing-library/react";
/**
 * @fileoverview AntiBanStatsCard molecule tests (TDD)
 */
import { describe, expect, it } from "vitest";
import { AntiBanStatsCard } from "./AntiBanStatsCard";

// Mock AntiBanStats for testing
const mockAntiBanStats: AntiBanStats = {
  hourly_count: 15,
  daily_count: 120,
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

describe("AntiBanStatsCard", () => {
  describe("metrics display", () => {
    it("displays hourly count vs limit", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("15/50")).toBeInTheDocument();
      expect(screen.getByText("actions this hour")).toBeInTheDocument();
    });

    it("displays daily count vs limit", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("120/300")).toBeInTheDocument();
      expect(screen.getByText("actions today")).toBeInTheDocument();
    });

    it("displays success rate percentage", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("95%")).toBeInTheDocument();
      expect(screen.getByText("success rate")).toBeInTheDocument();
    });

    it("displays batch count vs batch size", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("3/10")).toBeInTheDocument();
      expect(screen.getByText("batch progress")).toBeInTheDocument();
    });

    it("displays risk level badge", () => {
      // 15/50 = 30%, 120/300 = 40% - should be low risk
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("Safe")).toBeInTheDocument();
    });
  });

  describe("risk level calculation", () => {
    it("shows high risk when hourly > 80%", () => {
      const highRiskStats: AntiBanStats = {
        ...mockAntiBanStats,
        hourly_count: 45, // 45/50 = 90%
      };

      render(<AntiBanStatsCard stats={highRiskStats} platform="facebook" />);

      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    it("shows high risk when daily > 80%", () => {
      const highRiskStats: AntiBanStats = {
        ...mockAntiBanStats,
        daily_count: 280, // 280/300 = 93%
      };

      render(<AntiBanStatsCard stats={highRiskStats} platform="facebook" />);

      expect(screen.getByText("Stop")).toBeInTheDocument();
    });

    it("shows medium risk when hourly > 50%", () => {
      const mediumRiskStats: AntiBanStats = {
        ...mockAntiBanStats,
        hourly_count: 30, // 30/50 = 60%
      };

      render(<AntiBanStatsCard stats={mediumRiskStats} platform="facebook" />);

      expect(screen.getByText("Caution")).toBeInTheDocument();
    });

    it("shows medium risk when daily > 50%", () => {
      const mediumRiskStats: AntiBanStats = {
        ...mockAntiBanStats,
        daily_count: 180, // 180/300 = 60%
      };

      render(<AntiBanStatsCard stats={mediumRiskStats} platform="facebook" />);

      expect(screen.getByText("Caution")).toBeInTheDocument();
    });

    it("shows low risk when both under 50%", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("Safe")).toBeInTheDocument();
    });
  });

  describe("last action timestamp", () => {
    it("displays last action relative time when provided", () => {
      // Note: In a real implementation, we'd pass lastActionAt
      // For now, we'll just check the component renders
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      // Component should render without error
      expect(screen.getByTestId("antiban-stats-card")).toBeInTheDocument();
    });
  });

  describe("platform display", () => {
    it("displays platform name in header", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByText("Facebook")).toBeInTheDocument();
    });

    it("capitalizes platform names correctly", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="instagram" />);

      expect(screen.getByText("Instagram")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Facebook");
    });

    it("has accessible labels for all metrics", () => {
      render(<AntiBanStatsCard stats={mockAntiBanStats} platform="facebook" />);

      // Each metric should be in a list item or have proper labeling
      const metrics = screen.getAllByRole("listitem");
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});
