import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline" | "ghost";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	loading?: boolean;
	children: ReactNode;
	className?: string;
}

const variantStyles = {
	primary: "bg-primary text-white hover:bg-primary/90",
	secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
	outline:
		"border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
	ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
};

const sizeStyles = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-sm",
	lg: "px-6 py-3 text-base",
};

export function Button({
	variant = "primary",
	size = "md",
	disabled = false,
	loading = false,
	children,
	className,
	onClick,
	...props
}: ButtonProps): React.ReactElement {
	const isDisabled = disabled || loading;

	return (
		<button
			type="button"
			disabled={isDisabled}
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
				"focus:outline-none focus:ring-2 focus:ring-primary/50",
				variantStyles[variant],
				sizeStyles[size],
				isDisabled && "opacity-50 cursor-not-allowed",
				className,
			)}
			onClick={isDisabled ? undefined : onClick}
			{...props}
		>
			{loading && (
				<Loader2
					className="w-4 h-4 animate-spin"
					data-testid="button-spinner"
				/>
			)}
			{children}
		</button>
	);
}
