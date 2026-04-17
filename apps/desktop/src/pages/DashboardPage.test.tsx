import { render, screen } from "@testing-library/react";
/**
 * @fileoverview Dashboard page tests
 */
import { describe, expect, it } from "vitest";
import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<DashboardPage />);

      expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
    });

    it("renders the page title", () => {
      render(<DashboardPage />);

      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });

    it("renders welcome message", () => {
      render(<DashboardPage />);

      expect(screen.getByText(/overview of your social media activity/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<DashboardPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Dashboard");
    });
  });
});
