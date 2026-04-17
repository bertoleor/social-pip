import { render, screen } from "@testing-library/react";
/**
 * @fileoverview NotFound page tests
 */
import { describe, expect, it } from "vitest";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
  describe("rendering", () => {
    it("renders the page container", () => {
      render(<NotFoundPage />);

      expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    });

    it("renders 404 heading", () => {
      render(<NotFoundPage />);

      expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    });

    it("renders not found message", () => {
      render(<NotFoundPage />);

      expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<NotFoundPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("404");
    });
  });
});
