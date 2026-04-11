/**
 * @fileoverview Zod validation schemas for Account forms
 */
import { z } from "zod";

/**
 * Platform enum values matching @social-pip/types
 */
export const PLATFORMS = [
	"facebook",
	"instagram",
	"tiktok",
	"twitter",
	"linkedin",
	"threads",
	"telegram",
	"whatsapp",
] as const;

/**
 * AccountStatus enum values matching @social-pip/types
 */
export const ACCOUNT_STATUSES = [
	"active",
	"inactive",
	"warming_up",
	"restricted",
	"banned",
] as const;

/**
 * Platform color mapping for UI
 */
export const PLATFORM_COLORS: Record<string, string> = {
	facebook: "#1877F2",
	instagram: "#E4405F",
	tiktok: "#000000",
	twitter: "#1DA1F2",
	linkedin: "#0A66C2",
	threads: "#000000",
	telegram: "#0088CC",
	whatsapp: "#25D366",
};

/**
 * Status badge variant mapping
 */
export const STATUS_VARIANTS: Record<
	string,
	"success" | "neutral" | "info" | "warning" | "error"
> = {
	active: "success",
	inactive: "neutral",
	warming_up: "info",
	restricted: "warning",
	banned: "error",
};

/**
 * Zod schema for Account form validation
 */
export const AccountFormSchema = z.object({
	platform: z.enum(PLATFORMS, {
		required_error: "Platform is required",
		invalid_type_error: "Invalid platform",
	}),
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less"),
	username: z
		.string()
		.max(50, "Username must be 50 characters or less")
		.regex(/^[a-zA-Z0-9_]*$/, "Only letters, numbers, and underscores")
		.optional()
		.or(z.literal("")),
	displayName: z
		.string()
		.max(100, "Display name must be 100 characters or less")
		.optional()
		.or(z.literal("")),
	status: z
		.enum(ACCOUNT_STATUSES, {
			invalid_type_error: "Invalid status",
		})
		.default("active"),
	notes: z
		.string()
		.max(500, "Notes must be 500 characters or less")
		.optional()
		.or(z.literal("")),
});

/**
 * Zod schema for creating a new account
 */
export const CreateAccountSchema = AccountFormSchema;

/**
 * Zod schema for updating an existing account
 */
export const UpdateAccountSchema = AccountFormSchema.partial().extend({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less")
		.optional(),
});

/**
 * Type exports
 */
export type AccountFormData = z.infer<typeof AccountFormSchema>;
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;

/**
 * Platform type for type-safe usage
 */
export type Platform = (typeof PLATFORMS)[number];

/**
 * AccountStatus type for type-safe usage
 */
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
