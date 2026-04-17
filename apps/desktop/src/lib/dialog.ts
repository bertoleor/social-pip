/**
 * @fileoverview Dialog confirmation utilities
 * Simple dialog abstraction for confirmations
 */

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Shows a confirmation dialog
 * @param title - Dialog title
 * @param message - Dialog message
 * @param _options - Additional options (unused in console version)
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export async function confirm(
  title: string,
  message: string,
  _options?: Partial<ConfirmOptions>,
): Promise<boolean> {
  // Console-based confirmation for now (can be replaced with Tauri dialog)
  console.log(`[CONFIRM] ${title}: ${message}`);
  // Default to true for testing, in production this would show a real dialog
  return true;
}
