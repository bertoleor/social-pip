/**
 * U3.2: Input with focus ring and dark mode support
 */

import type { ChangeEvent, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
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
        "bg-surface text-foreground placeholder:text-muted",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        error
          ? "border-error focus-visible:ring-error/50"
          : "border-border focus-visible:ring-primary-500",
        disabled && "opacity-50 cursor-not-allowed bg-muted/20",
        className,
      )}
      {...props}
    />
  );
}
