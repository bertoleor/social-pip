import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Account } from "@social-pip/types";
import { AccountFormModal } from "./AccountFormModal";

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

describe("AccountFormModal", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode", () => {
    it("renders form with 6 fields in create mode", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText(/Platform/)).toBeDefined();
      const nameInputs = screen.getAllByRole("textbox", { name: /Name/ });
      expect(nameInputs.length).toBeGreaterThan(0);
      expect(screen.getByRole("textbox", { name: /^Username$/i })).toBeDefined();
      expect(screen.getByLabelText(/Display Name/)).toBeDefined();
      expect(screen.getByLabelText(/Status/)).toBeDefined();
      expect(screen.getByLabelText(/Notes/)).toBeDefined();
    });

    it("shows Add Account title in create mode", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText("Add Account")).toBeDefined();
    });
  });

  describe("edit mode", () => {
    it("pre-populates fields in edit mode", () => {
      render(
        <AccountFormModal
          isOpen
          mode="edit"
          account={mockAccount}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInputs = screen.getAllByRole("textbox", { name: /Name/ });
      expect(nameInputs[0]).toHaveValue("Test Account");

      const usernameInput = screen.getByRole("textbox", { name: /^Username$/i });
      expect(usernameInput).toHaveValue("testuser");

      expect(screen.getByText("Edit Account")).toBeDefined();
    });

    it("disables platform select in edit mode", () => {
      render(
        <AccountFormModal
          isOpen
          mode="edit"
          account={mockAccount}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const platformSelect = screen.getByLabelText(/Platform/);
      expect(platformSelect).toBeDisabled();
    });
  });

  describe("validation", () => {
    it("disables submit when name is empty", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const submitButton = screen.getByText("Create");
      expect(submitButton).toBeDisabled();
    });

    it("submit disabled when form invalid", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const submitButton = screen.getByText("Create");
      expect(submitButton).toBeDisabled();
    });

    it("validates username format", async () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInputs = screen.getAllByRole("textbox", { name: /Name/ });
      fireEvent.change(nameInputs[0], { target: { value: "Test" } });

      const usernameInput = screen.getByRole("textbox", { name: /^Username$/i });
      fireEvent.change(usernameInput, { target: { value: "invalid-user!" } });

      const submitButton = screen.getByText("Create");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Only letters, numbers, and underscores/),
        ).toBeDefined();
      });
    });

    it("clears field error when modified", async () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInputs = screen.getAllByRole("textbox", { name: /Name/ });
      fireEvent.change(nameInputs[0], { target: { value: "Test" } });

      const usernameInput = screen.getByRole("textbox", { name: /^Username$/i });
      fireEvent.change(usernameInput, { target: { value: "invalid-user!" } });

      const submitButton = screen.getByText("Create");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Only letters, numbers, and underscores/),
        ).toBeDefined();
      });

      fireEvent.change(usernameInput, { target: { value: "validuser" } });

      await waitFor(() => {
        expect(
          screen.queryByText(/Only letters, numbers, and underscores/),
        ).toBeNull();
      });
    });
  });

  describe("submission", () => {
    it("calls onSubmit with valid data", async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const platformSelect = screen.getByLabelText(/Platform/);
      fireEvent.change(platformSelect, { target: { value: "instagram" } });

      const nameInputs = screen.getAllByRole("textbox", { name: /Name/ });
      fireEvent.change(nameInputs[0], { target: { value: "Test Account" } });

      const usernameInput = screen.getByRole("textbox", { name: /^Username$/i });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });

      const submitButton = screen.getByText("Create");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          platform: "instagram",
          name: "Test Account",
          username: "testuser",
          displayName: "",
          status: "active",
          notes: "",
        });
      });
    });
  });

  describe("cancel actions", () => {
    it("closes modal when Cancel button is clicked", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("closes modal when X button is clicked", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("closes modal when Escape is pressed", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("does not close on Escape when not open", () => {
      render(
        <AccountFormModal
          isOpen={false}
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.keyDown(window, { key: "Escape" });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(screen.queryByText("Add Account")).toBeNull();
    });
  });

  describe("accessibility", () => {
    it("has correct ARIA attributes", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.getAttribute("aria-modal")).toBe("true");
      expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");
    });

    it("marks required fields with asterisk", () => {
      render(
        <AccountFormModal
          isOpen
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const platformLabel = screen.getByLabelText(/Platform/);
      expect(platformLabel).toBeDefined();
    });
  });
});
