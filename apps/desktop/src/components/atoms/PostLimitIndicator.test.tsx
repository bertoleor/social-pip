import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostLimitIndicator } from "./PostLimitIndicator";

describe("PostLimitIndicator", () => {
  describe("rendering", () => {
    it("renders current and limit counts", () => {
      render(<PostLimitIndicator current={5} limit={10} type="daily" />);
      expect(screen.getByText("5/10")).toBeInTheDocument();
      expect(screen.getByText("posts today")).toBeInTheDocument();
    });

    it("renders hourly type correctly", () => {
      render(<PostLimitIndicator current={2} limit={5} type="hourly" />);
      expect(screen.getByText("2/5")).toBeInTheDocument();
      expect(screen.getByText("posts this hour")).toBeInTheDocument();
    });

    it("shows percentage text", () => {
      render(<PostLimitIndicator current={5} limit={10} type="daily" />);
      expect(screen.getByText("(50%)")).toBeInTheDocument();
    });
  });

  describe("color coding", () => {
    it("shows green for 0-80% usage", () => {
      render(<PostLimitIndicator current={5} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      const fill = progressBar?.querySelector("div");
      expect(fill).toHaveClass("bg-green-500");
    });

    it("shows yellow for 80-95% usage", () => {
      render(<PostLimitIndicator current={9} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      const fill = progressBar?.querySelector("div");
      expect(fill).toHaveClass("bg-yellow-500");
    });

    it("shows red for 95-100% usage", () => {
      render(<PostLimitIndicator current={10} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      const fill = progressBar?.querySelector("div");
      expect(fill).toHaveClass("bg-red-500");
    });

    it("shows red for over limit", () => {
      render(<PostLimitIndicator current={11} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      const fill = progressBar?.querySelector("div");
      expect(fill).toHaveClass("bg-red-500");
    });
  });

  describe("progress bar", () => {
    it("renders progress bar with correct width", () => {
      render(<PostLimitIndicator current={5} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("caps progress at 100%", () => {
      render(<PostLimitIndicator current={15} limit={10} type="daily" />);
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    });
  });

  describe("custom className", () => {
    it("merges custom className", () => {
      render(<PostLimitIndicator current={5} limit={10} type="daily" className="custom-class" />);
      const container = screen.getByText("5/10").closest("div")?.parentElement;
      expect(container).toHaveClass("custom-class");
    });
  });
});
