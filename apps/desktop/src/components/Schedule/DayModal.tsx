import type { Schedule } from "@social-pip/types";
/**
 * @fileoverview DayModal component - Modal showing schedules for a specific day
 */
import { useCallback } from "react";

interface DayModalProps {
	isOpen: boolean;
	date: Date;
	schedules: Schedule[];
	onCancel: (scheduleId: string) => void;
	onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	running: "Running",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-blue-100 text-blue-800",
	running: "bg-yellow-100 text-yellow-800",
	completed: "bg-green-100 text-green-800",
	failed: "bg-red-100 text-red-800",
	cancelled: "bg-gray-100 text-gray-800",
};

/**
 * Modal displaying schedules for a clicked day
 */
export function DayModal({
	isOpen,
	date,
	schedules,
	onCancel,
	onClose,
}: DayModalProps): React.ReactElement | null {
	const handleBackdropClick = useCallback(
		(event: React.MouseEvent): void => {
			if (event.target === event.currentTarget) {
				onClose();
			}
		},
		[onClose],
	);

	const handleCancelClick = useCallback(
		(scheduleId: string): void => {
			onCancel(scheduleId);
		},
		[onCancel],
	);

	if (!isOpen) return null;

	const formattedDate = date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			onClick={handleBackdropClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b">
					<h2 id="modal-title" className="text-lg font-semibold">
						{formattedDate}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded"
						aria-label="Close modal"
					>
						×
					</button>
				</div>

				{/* Content */}
				<div className="p-4 overflow-y-auto max-h-[60vh]">
					{schedules.length === 0 ? (
						<p className="text-gray-500 text-center py-4">
							No schedules for this day
						</p>
					) : (
						<ul className="space-y-3">
							{schedules.map((schedule) => (
								<li
									key={schedule.id}
									className="border rounded-lg p-3 hover:bg-gray-50"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											{/* Time */}
											<p className="font-medium">
												{new Date(schedule.scheduledAt).toLocaleTimeString(
													"en-US",
													{
														hour: "2-digit",
														minute: "2-digit",
													},
												)}
											</p>

											{/* Status badge */}
											<span
												className={`inline-block px-2 py-1 text-xs rounded ${STATUS_COLORS[schedule.status] ?? "bg-gray-100 text-gray-800"}`}
											>
												{STATUS_LABELS[schedule.status] ?? schedule.status}
											</span>

											{/* Post preview */}
											<p className="text-sm text-gray-600 mt-1">
												Post ID: {schedule.postId.substring(0, 8)}...
											</p>

											{/* Result (if completed/failed) */}
											{schedule.result && (
												<p className="text-sm text-gray-500 mt-1">
													{schedule.result}
												</p>
											)}

											{/* Attempts */}
											{schedule.attempts > 0 && (
												<p className="text-xs text-gray-400 mt-1">
													Attempts: {schedule.attempts}/{schedule.maxAttempts}
												</p>
											)}
										</div>

										{/* Cancel button (only for pending) */}
										{schedule.status === "pending" && (
											<button
												type="button"
												onClick={() => handleCancelClick(schedule.id)}
												className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
												aria-label={`Cancel schedule ${schedule.id}`}
											>
												Cancel
											</button>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
