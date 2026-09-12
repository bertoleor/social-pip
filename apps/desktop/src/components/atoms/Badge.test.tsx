import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  describe("rendering", () => {
    it("renders children correctly", () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders as a span element", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge.tagName).toBe("SPAN");
    });
  });

  describe("status variants", () => {
    it("renders success variant with success colors", () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText("Success");
      expect(badge).toHaveClass("bg-success/10");
      expect(badge).toHaveClass("text-success");
    });

    it("renders warning variant with warning colors", () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText("Warning");
      expect(badge).toHaveClass("bg-warning/10");
      expect(badge).toHaveClass("text-warning");
    });

    it("renders error variant with error colors", () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText("Error");
      expect(badge).toHaveClass("bg-error/10");
      expect(badge).toHaveClass("text-error");
    });

    it("renders info variant with info colors", () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText("Info");
      expect(badge).toHaveClass("bg-info/10");
      expect(badge).toHaveClass("text-info");
    });

    it("renders default variant", () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-muted/20");
    });

    it("defaults to default variant", () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-muted/20");
    });
  });

  describe("sizes", () => {
    it("renders small size", () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText("Small");
      expect(badge).toHaveClass("px-2");
      expect(badge).toHaveClass("py-0.5");
      expect(badge).toHaveClass("text-xs");
    });

    it("renders medium size", () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText("Medium");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-1");
      expect(badge).toHaveClass("text-sm");
    });

    it("defaults to medium size", () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("px-2.5");
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText("Custom");
      expect(badge).toHaveClass("custom-badge");
      expect(badge).toHaveClass("bg-muted/20");
    });
  });
});
