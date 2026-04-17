import { render, screen } from "@testing-library/react";
import { MediaConstraintBadge } from "./MediaConstraintBadge";

describe("MediaConstraintBadge", () => {
  describe("rendering", () => {
    it("renders pending status", () => {
      render(<MediaConstraintBadge status="pending" />);

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("renders valid status", () => {
      render(<MediaConstraintBadge status="valid" />);

      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    it("renders invalid status", () => {
      render(<MediaConstraintBadge status="invalid" />);

      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });

    it("renders warning status", () => {
      render(<MediaConstraintBadge status="warning" />);

      expect(screen.getByText("Warning")).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("applies neutral variant for pending", () => {
      const { container } = render(<MediaConstraintBadge status="pending" />);

      expect(container.firstChild).toHaveClass("bg-gray-100");
    });

    it("applies success variant for valid", () => {
      const { container } = render(<MediaConstraintBadge status="valid" />);

      expect(container.firstChild).toHaveClass("bg-green-100");
    });

    it("applies error variant for invalid", () => {
      const { container } = render(<MediaConstraintBadge status="invalid" />);

      expect(container.firstChild).toHaveClass("bg-red-100");
    });

    it("applies warning variant for warning", () => {
      const { container } = render(<MediaConstraintBadge status="warning" />);

      expect(container.firstChild).toHaveClass("bg-yellow-100");
    });
  });

  describe("with errors", () => {
    it("shows errors in sr-only span", () => {
      const errors = [{ code: "SIZE_EXCEEDED" as const, message: "Image too large" }];
      const { container } = render(<MediaConstraintBadge status="invalid" errors={errors} />);

      expect(container.querySelector(".sr-only")).toHaveTextContent("Image too large");
    });

    it("shows multiple errors", () => {
      const errors = [
        { code: "SIZE_EXCEEDED" as const, message: "Image too large" },
        { code: "FORMAT_UNSUPPORTED" as const, message: "Format not supported" },
      ];
      const { container } = render(<MediaConstraintBadge status="invalid" errors={errors} />);

      expect(container.querySelector(".sr-only")).toHaveTextContent("Image too large");
      expect(container.querySelector(".sr-only")).toHaveTextContent("Format not supported");
    });
  });
});
