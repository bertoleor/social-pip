import { useId } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  id?: string;
  type?: "text" | "password" | "email" | "number";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  className,
}: FormFieldProps): React.ReactElement {
  const generatedId = useId();
  const fieldId = id ?? `form-field-${generatedId}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={fieldId}
        className={cn("text-sm font-medium text-gray-700", required && "flex items-center gap-0.5")}
      >
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "bg-white",
          error ? "border-red-500 focus:ring-red-500/50" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50",
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
