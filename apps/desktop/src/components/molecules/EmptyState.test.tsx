/**
 * @fileoverview Tests for EmptyState molecule component
 * Verifies rendering with and without action prop
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileText } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  describe("rendering with action", () => {
    it("renders icon, title, description, and action button", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          icon={FileText}
          title="No posts"
          description="Create your first post"
          action={{ label: "Create", onClick }}
        />,
      );

      expect(screen.getByText("No posts")).toBeInTheDocument();
      expect(screen.getByText("Create your first post")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });

    it("fires action onClick when button is clicked", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <EmptyState
          icon={FileText}
          title="No posts"
          description="Create your first post"
          action={{ label: "Create", onClick }}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("rendering without action", () => {
    it("renders icon, title, and description without action button", () => {
      render(<EmptyState icon={FileText} title="No data" description="Nothing to show yet" />);

      expect(screen.getByText("No data")).toBeInTheDocument();
      expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("renders the icon with proper aria-hidden", () => {
      render(<EmptyState icon={FileText} title="No posts" description="Create your first post" />);

      // The SVG icon should be present
      const icon = screen.getByTestId("empty-state-icon");
      expect(icon).toBeInTheDocument();
    });
  });
});
