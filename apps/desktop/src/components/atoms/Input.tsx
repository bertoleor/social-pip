import { cn } from "@/lib/utils";
import type { ChangeEvent, InputHTMLAttributes } from "react";

export interface InputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	type?: "text" | "password" | "email" | "number";
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	error?: boolean;
	className?: string;
}

export function Input({
	type = "text",
	placeholder,
	value,
	onChange,
	disabled = false,
	error = false,
	className,
	...props
}: InputProps): React.ReactElement {
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<input
			type={type}
			placeholder={placeholder}
			value={value}
			onChange={handleChange}
			disabled={disabled}
			aria-invalid={error}
			className={cn(
				"w-full px-3 py-2 border rounded-lg text-sm transition-colors",
				"focus:outline-none focus:ring-2 focus:ring-primary/50",
				"bg-white",
				error ? "border-red-500 focus:ring-red-500/50" : "border-gray-300",
				disabled && "opacity-50 cursor-not-allowed bg-gray-50",
				className,
			)}
			{...props}
		/>
	);
}
