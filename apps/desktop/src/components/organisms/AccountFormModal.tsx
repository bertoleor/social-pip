import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import {
	ACCOUNT_STATUSES,
	type AccountFormData,
	AccountFormSchema,
	PLATFORMS,
} from "@/lib/schemas/account";
import { cn } from "@/lib/utils";
import type { Account } from "@social-pip/types";
import { X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export interface AccountFormModalProps {
	isOpen: boolean;
	mode: "create" | "edit";
	account?: Account | null;
	onSubmit: (data: AccountFormData) => Promise<void>;
	onCancel: () => void;
	className?: string;
}

const DEFAULT_VALUES: AccountFormData = {
	platform: "facebook",
	name: "",
	username: "",
	displayName: "",
	status: "active",
	notes: "",
};

export function AccountFormModal({
	isOpen,
	mode,
	account,
	onSubmit,
	onCancel,
	className,
}: AccountFormModalProps): React.ReactElement | null {
	const [formData, setFormData] = useState<AccountFormData>(DEFAULT_VALUES);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (mode === "edit" && account) {
			setFormData({
				platform: account.platform,
				name: account.name,
				username: account.username ?? "",
				displayName: account.displayName ?? "",
				status: account.status,
				notes: "",
			});
		} else if (mode === "create") {
			setFormData(DEFAULT_VALUES);
		}
		setErrors({});
	}, [mode, account, isOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onCancel();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onCancel]);

	if (!isOpen) return null;

	const handleChange = (field: keyof AccountFormData) => (value: string) => {
		setFormData((prev: AccountFormData) => ({ ...prev, [field]: value }));

		const fieldKey = field as string;
		if (errors[fieldKey]) {
			setErrors((prev: Record<string, string>) => {
				const next = { ...prev };
				delete next[fieldKey];
				return next;
			});
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		const result = AccountFormSchema.safeParse(formData);

		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			for (const err of result.error.errors) {
				const field = err.path[0] as string;
				if (!fieldErrors[field]) {
					fieldErrors[field] = err.message;
				}
			}
			setErrors(fieldErrors);
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(result.data);
		} catch (error) {
			console.error("Form submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid =
		Object.keys(errors).length === 0 && formData.name.trim() !== "";

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onCancel}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div
				className={cn(
					"bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6",
					className,
				)}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-6">
					<h2 id="modal-title" className="text-xl font-semibold text-gray-900">
						{mode === "create" ? "Add Account" : "Edit Account"}
					</h2>
					<button
						onClick={onCancel}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="platform"
							className="text-sm font-medium text-gray-700"
						>
							Platform <span className="text-red-500">*</span>
						</label>
						<select
							id="platform"
							value={formData.platform}
							onChange={(e) => handleChange("platform")(e.target.value)}
							disabled={mode === "edit"}
							className={cn(
								"w-full px-3 py-2 border rounded-lg text-sm transition-colors",
								"focus:outline-none focus:ring-2 focus:ring-primary/50",
								"bg-white",
								errors["platform"] ? "border-red-500" : "border-gray-300",
								mode === "edit" && "opacity-50 cursor-not-allowed bg-gray-50",
							)}
							aria-invalid={!!errors["platform"]}
						>
							{PLATFORMS.map((p) => (
								<option key={p} value={p}>
									{p.charAt(0).toUpperCase() + p.slice(1)}
								</option>
							))}
						</select>
						{errors["platform"] && (
							<p role="alert" className="text-sm text-red-500">
								{errors["platform"]}
							</p>
						)}
					</div>

					<FormField
						label="Name"
						value={formData.name}
						onChange={handleChange("name")}
						placeholder="Account name"
						required
						error={errors["name"]}
					/>

					<FormField
						label="Username"
						value={formData.username ?? ""}
						onChange={handleChange("username")}
						placeholder="username"
						error={errors["username"]}
					/>

					<FormField
						label="Display Name"
						value={formData.displayName ?? ""}
						onChange={handleChange("displayName")}
						placeholder="Display name (optional)"
						error={errors["displayName"]}
					/>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="status"
							className="text-sm font-medium text-gray-700"
						>
							Status
						</label>
						<select
							id="status"
							value={formData.status}
							onChange={(e) =>
								handleChange("status")(e.target.value as AccountFormData["status"])
							}
							className={cn(
								"w-full px-3 py-2 border rounded-lg text-sm transition-colors",
								"focus:outline-none focus:ring-2 focus:ring-primary/50",
								"bg-white",
								errors["status"] ? "border-red-500" : "border-gray-300",
							)}
							aria-invalid={!!errors["status"]}
						>
							{ACCOUNT_STATUSES.map((s) => (
								<option key={s} value={s}>
									{s
										.split("_")
										.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
										.join(" ")}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="notes"
							className="text-sm font-medium text-gray-700"
						>
							Notes
						</label>
						<textarea
							id="notes"
							value={formData.notes ?? ""}
							onChange={(e) => handleChange("notes")(e.target.value)}
							placeholder="Optional notes..."
							rows={3}
							className={cn(
								"w-full px-3 py-2 border rounded-lg text-sm transition-colors resize-none",
								"focus:outline-none focus:ring-2 focus:ring-primary/50",
								"bg-white",
								errors["notes"] ? "border-red-500" : "border-gray-300",
							)}
							aria-invalid={!!errors["notes"]}
						/>
						{errors["notes"] && (
							<p role="alert" className="text-sm text-red-500">
								{errors["notes"]}
							</p>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-4">
						<Button
							type="button"
							variant="secondary"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={!isFormValid || isSubmitting}
						>
							{isSubmitting
								? "Saving..."
								: mode === "create"
									? "Create"
									: "Save"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
