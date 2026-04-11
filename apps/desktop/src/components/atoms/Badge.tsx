import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: "success" | "warning" | "error" | "info" | "neutral";
	size?: "sm" | "md";
	children: ReactNode;
	className?: string;
}

const variantStyles = {
	success: "bg-green-100 text-green-700",
	warning: "bg-yellow-100 text-yellow-700",
	error: "bg-red-100 text-red-700",
	info: "bg-blue-100 text-blue-700",
	neutral: "bg-gray-100 text-gray-700",
};

const sizeStyles = {
	sm: "px-2 py-0.5 text-xs",
	md: "px-2.5 py-1 text-sm",
};

export function Badge({
	variant = "neutral",
	size = "md",
	children,
	className,
	...props
}: BadgeProps): React.ReactElement {
	return (
		<span
			className={cn(
				"inline-flex items-center font-medium rounded-full",
				variantStyles[variant],
				sizeStyles[size],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
