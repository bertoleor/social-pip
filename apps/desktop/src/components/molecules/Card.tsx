import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	padding?: "none" | "sm" | "md" | "lg";
	shadow?: "none" | "sm" | "md" | "lg";
	children: ReactNode;
	className?: string;
}

const paddingStyles = {
	none: "",
	sm: "p-3",
	md: "p-4",
	lg: "p-6",
};

const shadowStyles = {
	none: "",
	sm: "shadow-sm",
	md: "shadow-md",
	lg: "shadow-lg",
};

export function Card({
	padding = "md",
	shadow = "sm",
	children,
	className,
	...props
}: CardProps): React.ReactElement {
	return (
		<div
			className={cn(
				"bg-white rounded-lg border border-gray-200",
				paddingStyles[padding],
				shadowStyles[shadow],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
