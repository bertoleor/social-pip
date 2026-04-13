import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
	describe("rendering", () => {
		it("renders input element", () => {
			render(<Input value="" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toBeInTheDocument();
		});

		it("displays the value prop", () => {
			render(<Input value="test value" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toHaveValue("test value");
		});
	});

	describe("types", () => {
		it("renders text type by default", () => {
			render(<Input value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveAttribute("type", "text");
		});

		it("renders password type", () => {
			render(
				<Input
					type="password"
					placeholder="password"
					value=""
					onChange={() => {}}
				/>,
			);
			const input = screen.getByPlaceholderText("password");
			expect(input).toHaveAttribute("type", "password");
		});

		it("renders email type", () => {
			render(<Input type="email" value="" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
		});

		it("renders number type", () => {
			render(<Input type="number" value="" onChange={() => {}} />);
			expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
		});
	});

	describe("placeholder", () => {
		it("renders placeholder text", () => {
			render(
				<Input placeholder="Enter text..." value="" onChange={() => {}} />,
			);
			expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
		});

		it("works without placeholder", () => {
			render(<Input value="" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toBeInTheDocument();
		});
	});

	describe("onChange handler", () => {
		it("calls onChange when user types", async () => {
			const handleChange = vi.fn();
			const user = userEvent.setup();
			render(<Input value="" onChange={handleChange} />);

			await user.type(screen.getByRole("textbox"), "hi");
			// onChange is called for each character typed
			expect(handleChange).toHaveBeenCalledTimes(2);
		});

		it("onChange receives current input value", async () => {
			function ControlledInput() {
				const [value, setValue] = useState("");
				return <Input value={value} onChange={setValue} />;
			}
			const user = userEvent.setup();
			render(<ControlledInput />);

			await user.type(screen.getByRole("textbox"), "test");
			expect(screen.getByRole("textbox")).toHaveValue("test");
		});
	});

	describe("error state", () => {
		it("has aria-invalid when error is true", () => {
			render(<Input error value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveAttribute("aria-invalid", "true");
		});

		it("has red border class when error", () => {
			render(<Input error value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveClass("border-red-500");
		});

		it("has normal border when no error", () => {
			render(<Input value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).not.toHaveClass("border-red-500");
		});
	});

	describe("disabled state", () => {
		it("has disabled attribute when disabled", () => {
			render(<Input disabled value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toBeDisabled();
		});

		it("has reduced opacity when disabled", () => {
			render(<Input disabled value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveClass("opacity-50");
		});

		it("does not fire onChange when disabled", async () => {
			const handleChange = vi.fn();
			const user = userEvent.setup();
			render(<Input disabled value="" onChange={handleChange} />);

			await user.type(screen.getByRole("textbox"), "test");
			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe("custom className", () => {
		it("merges custom className with default classes", () => {
			render(<Input className="custom-class" value="" onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveClass("custom-class");
			expect(input).toHaveClass("border"); // still has default
		});
	});
});
