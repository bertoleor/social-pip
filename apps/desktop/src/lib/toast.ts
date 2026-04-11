/**
 * @fileoverview Toast notification utilities
 * Simple toast abstraction for consistent notifications
 */

interface ToastOptions {
	title?: string;
	description?: string;
}

interface ToastApi {
	success: (message: string, options?: ToastOptions) => void;
	error: (message: string, options?: ToastOptions) => void;
	info: (message: string, options?: ToastOptions) => void;
	warning: (message: string, options?: ToastOptions) => void;
}

// Console-based toast for now (can be replaced with sonner or similar)
export const toast: ToastApi = {
	success: (message: string, _options?: ToastOptions) => {
		console.log(`[SUCCESS] ${message}`);
	},
	error: (message: string, _options?: ToastOptions) => {
		console.error(`[ERROR] ${message}`);
	},
	info: (message: string, _options?: ToastOptions) => {
		console.info(`[INFO] ${message}`);
	},
	warning: (message: string, _options?: ToastOptions) => {
		console.warn(`[WARNING] ${message}`);
	},
};
