/**
 * @fileoverview Tests for Skeleton component
 * Verifies rendering of all skeleton variants (line, circle, card)
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  describe("line variant (default)", () => {
    it("renders a skeleton element", () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toBeInTheDocument();
    });

    it("renders with pulse animation", () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("renders line variant by default", () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-full");
    });

    it("renders explicit line variant", () => {
      render(<Skeleton variant="line" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-4");
    });
  });

  describe("circle variant", () => {
    it("renders circle variant with rounded-full", () => {
      render(<Skeleton variant="circle" size={40} />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("renders circle with specified size", () => {
      render(<Skeleton variant="circle" size={48} />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("w-12");
      expect(skeleton).toHaveClass("h-12");
    });
  });

  describe("card variant", () => {
    it("renders card variant with aspect ratio", () => {
      render(<Skeleton variant="card" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("aspect-video");
    });

    it("card variant has rounded corners", () => {
      render(<Skeleton variant="card" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("rounded-lg");
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<Skeleton className="my-custom" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("my-custom");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });
});
