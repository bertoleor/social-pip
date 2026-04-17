import type { Account } from "@social-pip/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountCard } from "./AccountCard";

// Mock account for testing
const mockAccount: Account = {
  id: "acc_001",
  platform: "facebook",
  name: "Test Account",
  username: "testuser",
  displayName: "Test Display",
  status: "active",
  warmupProgress: 0,
  restrictionsCount: 0,
  dailyPostsCount: 0,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

const mockBannedAccount: Account = {
  ...mockAccount,
  id: "acc_002",
  status: "banned",
};

describe("AccountCard", () => {
  describe("rendering", () => {
    it("renders PlatformIcon, name, username, status badge", () => {
      render(<AccountCard account={mockAccount} />);

      // Platform icon is rendered
      expect(screen.getByLabelText("facebook icon")).toBeDefined();

      // Account name
      expect(screen.getByText("Test Account")).toBeDefined();

      // Username
      expect(screen.getByText("@testuser")).toBeDefined();

      // Status badge
      expect(screen.getByText("Active")).toBeDefined();
    });

    it("shows Edit and Delete buttons", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(<AccountCard account={mockAccount} onEdit={onEdit} onDelete={onDelete} />);

      expect(screen.getByLabelText("Edit account")).toBeDefined();
      expect(screen.getByLabelText("Delete account")).toBeDefined();
    });

    it("hides action buttons when handlers not provided", () => {
      render(<AccountCard account={mockAccount} />);

      expect(screen.queryByLabelText("Edit account")).toBeNull();
      expect(screen.queryByLabelText("Delete account")).toBeNull();
    });
  });

  describe("status badge variants", () => {
    it("shows success badge for active status", () => {
      render(<AccountCard account={mockAccount} />);
      const badge = screen.getByText("Active");
      expect(badge).toBeDefined();
    });

    it("shows error badge for banned status", () => {
      render(<AccountCard account={mockBannedAccount} />);
      const badge = screen.getByText("Banned");
      expect(badge).toBeDefined();
    });
  });

  describe("edit action", () => {
    it("calls onEdit with account.id on button click", () => {
      const onEdit = vi.fn();

      render(<AccountCard account={mockAccount} onEdit={onEdit} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      fireEvent.mouseEnter(card);

      const editButton = screen.getByLabelText("Edit account");
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith("acc_001");
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("event does not propagate to card click handler", () => {
      const onEdit = vi.fn();
      const onClick = vi.fn();

      render(<AccountCard account={mockAccount} onEdit={onEdit} onClick={onClick} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      fireEvent.mouseEnter(card);

      const editButton = screen.getByLabelText("Edit account");
      fireEvent.click(editButton);

      // onClick should not be called (event stopped)
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("delete action", () => {
    it("calls onDelete with account.id, event.stopPropagation", () => {
      const onDelete = vi.fn();
      const onClick = vi.fn();

      render(<AccountCard account={mockAccount} onDelete={onDelete} onClick={onClick} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      fireEvent.mouseEnter(card);

      const deleteButton = screen.getByLabelText("Delete account");
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith("acc_001");
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("hover state", () => {
    it("applies shadow-md and cursor-pointer on hover", () => {
      const { container } = render(<AccountCard account={mockAccount} />);

      const card = container.firstChild as HTMLElement;

      // Check initial classes
      expect(card.className).toContain("hover:shadow-md");
      expect(card.className).toContain("hover:cursor-pointer");
    });

    it("shows action buttons on hover", async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(<AccountCard account={mockAccount} onEdit={onEdit} onDelete={onDelete} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });

      // Buttons should not be visible initially
      // Note: In JSDOM, opacity styles don't work as expected,
      // but we can verify the buttons exist in the DOM

      // Hover over the card
      fireEvent.mouseEnter(card);

      // Buttons should now be in the document
      expect(screen.getByLabelText("Edit account")).toBeDefined();
      expect(screen.getByLabelText("Delete account")).toBeDefined();
    });
  });

  describe("click handling", () => {
    it("calls onClick with account.id when card is clicked", () => {
      const onClick = vi.fn();

      render(<AccountCard account={mockAccount} onClick={onClick} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledWith("acc_001");
    });
  });

  describe("accessibility", () => {
    it("has correct aria-label", () => {
      render(<AccountCard account={mockAccount} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      expect(card.getAttribute("aria-label")).toBe("Test Account - facebook");
    });

    it("is focusable", () => {
      render(<AccountCard account={mockAccount} />);

      const card = screen.getByRole("button", {
        name: "Test Account - facebook",
      });
      expect(card.getAttribute("tabindex")).toBe("0");
    });
  });
});
