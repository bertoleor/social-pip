import type { Platform } from "@social-pip/types"
import { usePostingStore } from "../../stores/postingStore"
import { useMediaUpload } from "../../hooks/useMediaUpload"
import { MediaUploadButton } from "../atoms/MediaUploadButton"
import { MediaPreview } from "./MediaPreview"

export interface MediaUploaderProps {
	platform: Platform
	maxFiles?: number
}

export function MediaUploader({ platform, maxFiles }: MediaUploaderProps): React.ReactElement {
	const mediaFiles = usePostingStore((state) => state.mediaFiles)
	const clearMedia = usePostingStore((state) => state.clearMedia)
	const { constraints } = useMediaUpload({ platform, maxFiles })

	const hasFiles = mediaFiles.length > 0

	return (
		<div className="flex flex-col gap-4">
			{constraints && (
				<div className="text-xs text-gray-500">
					Max {constraints.maxImages} images, {Math.round(constraints.maxSizeBytes / (1024 * 1024))}MB each. Formats:{" "}
					{constraints.allowedFormats.join(", ").toUpperCase()}
				</div>
			)}

			{hasFiles ? (
				<div className="flex flex-col gap-4">
					<MediaPreview />
					<div className="flex gap-2">
						<MediaUploadButton platform={platform} maxFiles={maxFiles} className="border border-gray-300 px-3 py-1.5 text-sm" />
						<button
							type="button"
							onClick={clearMedia}
							className="text-sm text-gray-500 hover:text-gray-700"
						>
							Clear all
						</button>
					</div>
				</div>
			) : (
				<MediaUploadButton platform={platform} maxFiles={maxFiles} />
			)}
		</div>
	)
}
