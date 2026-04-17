import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  describe("rendering", () => {
    it("renders LOW level with text", () => {
      render(<RiskBadge level="LOW" />);
      expect(screen.getByText("LOW")).toBeInTheDocument();
    });

    it("renders MEDIUM level with text", () => {
      render(<RiskBadge level="MEDIUM" />);
      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    });

    it("renders HIGH level with text", () => {
      render(<RiskBadge level="HIGH" />);
      expect(screen.getByText("HIGH")).toBeInTheDocument();
    });

    it("renders CRITICAL level with text", () => {
      render(<RiskBadge level="CRITICAL" />);
      expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    });
  });

  describe("color mapping", () => {
    it("applies green/success color for LOW level", () => {
      render(<RiskBadge level="LOW" />);
      const badge = screen.getByText("LOW");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-700");
    });

    it("applies yellow/warning color for MEDIUM level", () => {
      render(<RiskBadge level="MEDIUM" />);
      const badge = screen.getByText("MEDIUM");
      expect(badge).toHaveClass("bg-yellow-100");
      expect(badge).toHaveClass("text-yellow-700");
    });

    it("applies orange color for HIGH level", () => {
      render(<RiskBadge level="HIGH" />);
      const badge = screen.getByText("HIGH");
      expect(badge).toHaveClass("bg-orange-100");
      expect(badge).toHaveClass("text-orange-700");
    });

    it("applies red/error color for CRITICAL level", () => {
      render(<RiskBadge level="CRITICAL" />);
      const badge = screen.getByText("CRITICAL");
      expect(badge).toHaveClass("bg-red-100");
      expect(badge).toHaveClass("text-red-700");
    });
  });

  describe("sizes", () => {
    it("renders small size", () => {
      render(<RiskBadge level="LOW" size="sm" />);
      const badge = screen.getByText("LOW");
      expect(badge).toHaveClass("px-2");
      expect(badge).toHaveClass("py-0.5");
      expect(badge).toHaveClass("text-xs");
    });

    it("renders medium size by default", () => {
      render(<RiskBadge level="LOW" />);
      const badge = screen.getByText("LOW");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-1");
      expect(badge).toHaveClass("text-sm");
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<RiskBadge level="LOW" className="custom-risk-badge" />);
      const badge = screen.getByText("LOW");
      expect(badge).toHaveClass("custom-risk-badge");
      expect(badge).toHaveClass("bg-green-100");
    });
  });

  describe("accessibility", () => {
    it("has proper role attributes", () => {
      render(<RiskBadge level="HIGH" />);
      const badge = screen.getByText("HIGH");
      expect(badge.tagName).toBe("SPAN");
    });
  });
});
