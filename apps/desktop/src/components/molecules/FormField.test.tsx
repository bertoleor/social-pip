import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "./FormField";

describe("FormField", () => {
	describe("rendering", () => {
		it("renders label and input together", () => {
			render(<FormField label="Email" value="" onChange={() => {}} />);

			expect(screen.getByLabelText("Email")).toBeInTheDocument();
			expect(screen.getByRole("textbox")).toBeInTheDocument();
		});

		it("renders as a form group container", () => {
			const { container } = render(
				<FormField label="Username" value="" onChange={() => {}} />,
			);

			const formGroup = container.firstChild;
			expect(formGroup).toHaveClass("flex");
			expect(formGroup).toHaveClass("flex-col");
		});
	});

	describe("label association", () => {
		it("associates label with input via htmlFor/id", () => {
			render(
				<FormField
					label="Password"
					id="password-field"
					value=""
					onChange={() => {}}
				/>,
			);

			const label = screen.getByText("Password");
			const input = screen.getByRole("textbox");

			expect(label).toHaveAttribute("for", "password-field");
			expect(input).toHaveAttribute("id", "password-field");
		});

		it("generates unique id if not provided", () => {
			render(<FormField label="Email" value="" onChange={() => {}} />);

			const label = screen.getByText("Email");
			const input = screen.getByRole("textbox");

			// Both should have matching id/htmlFor
			expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
			expect(label.getAttribute("for")).toMatch(/^form-field-/);
		});
	});

	describe("error display", () => {
		it("shows error message when error prop provided", () => {
			render(
				<FormField
					label="Email"
					value=""
					onChange={() => {}}
					error="Email is required"
				/>,
			);

			expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
		});

		it("does not show error message when error prop not provided", () => {
			render(<FormField label="Email" value="" onChange={() => {}} />);

			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});

		it("input has aria-invalid when error present", () => {
			render(
				<FormField
					label="Email"
					value=""
					onChange={() => {}}
					error="Invalid email"
				/>,
			);

			const input = screen.getByRole("textbox");
			expect(input).toHaveAttribute("aria-invalid", "true");
		});

		it("error message has aria-describedby association", () => {
			render(
				<FormField
					label="Email"
					id="email-field"
					value=""
					onChange={() => {}}
					error="Email is required"
				/>,
			);

			const input = screen.getByRole("textbox");
			const errorMessage = screen.getByRole("alert");

			expect(input).toHaveAttribute("aria-describedby");
			expect(errorMessage).toHaveAttribute("id", "email-field-error");
		});
	});

	describe("input props passthrough", () => {
		it("passes value and onChange to input", async () => {
			const handleChange = vi.fn();
			const user = userEvent.setup();

			render(<FormField label="Name" value="John" onChange={handleChange} />);

			const input = screen.getByRole("textbox");
			expect(input).toHaveValue("John");

			await user.type(input, " Doe");
			expect(handleChange).toHaveBeenCalled();
		});

		it("passes placeholder to input", () => {
			render(
				<FormField
					label="Search"
					value=""
					onChange={() => {}}
					placeholder="Enter search term"
				/>,
			);

			expect(
				screen.getByPlaceholderText("Enter search term"),
			).toBeInTheDocument();
		});

		it("passes disabled state to input", () => {
			render(<FormField label="Email" value="" onChange={() => {}} disabled />);

			expect(screen.getByRole("textbox")).toBeDisabled();
		});

		it("passes type prop to input", () => {
			render(
				<FormField
					label="Password"
					type="password"
					value=""
					onChange={() => {}}
				/>,
			);

			expect(screen.getByLabelText("Password")).toHaveAttribute(
				"type",
				"password",
			);
		});

		it("passes custom className to wrapper", () => {
			const { container } = render(
				<FormField
					label="Email"
					value=""
					onChange={() => {}}
					className="custom-wrapper"
				/>,
			);

			expect(container.firstChild).toHaveClass("custom-wrapper");
		});
	});

	describe("accessibility", () => {
		it("has proper focus management", async () => {
			const user = userEvent.setup();

			render(<FormField label="Email" value="" onChange={() => {}} />);

			const input = screen.getByRole("textbox");
			expect(input).not.toHaveFocus();

			await user.click(screen.getByLabelText("Email"));
			expect(input).toHaveFocus();
		});

		it("is keyboard navigable", async () => {
			const user = userEvent.setup();

			render(<FormField label="Email" value="" onChange={() => {}} />);

			await user.tab();
			expect(screen.getByRole("textbox")).toHaveFocus();
		});
	});

	describe("required field", () => {
		it("shows required indicator when required", () => {
			render(<FormField label="Email" value="" onChange={() => {}} required />);

			expect(screen.getByText("*")).toBeInTheDocument();
		});

		it("input has required attribute when required", () => {
			render(<FormField label="Email" value="" onChange={() => {}} required />);

			expect(screen.getByRole("textbox")).toBeRequired();
		});

		it("does not show required indicator when not required", () => {
			render(
				<FormField
					label="Email"
					value=""
					onChange={() => {}}
					required={false}
				/>,
			);

			expect(screen.queryByText("*")).not.toBeInTheDocument();
		});
	});
});
