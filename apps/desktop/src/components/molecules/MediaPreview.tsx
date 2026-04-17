import { usePostingStore } from "../../stores/postingStore";
import { MediaConstraintBadge } from "../atoms/MediaConstraintBadge";
import { MediaThumbnail } from "../atoms/MediaThumbnail";

export function MediaPreview(): React.ReactElement | null {
  const mediaFiles = usePostingStore((state) => state.mediaFiles);
  const mediaValidation = usePostingStore((state) => state.mediaValidation);
  const removeMediaFile = usePostingStore((state) => state.removeMediaFile);

  if (mediaFiles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {mediaFiles.map((file) => {
        const validation = mediaValidation.get(file.id);
        return (
          <div key={file.id} className="flex flex-col gap-1">
            <MediaThumbnail
              id={file.id}
              thumbnailUrl={file.thumbnailUrl ?? ""}
              fileName={file.fileName}
              onRemove={removeMediaFile}
              validationStatus={file.validationStatus}
            />
            {validation && (
              <MediaConstraintBadge
                status={validation.valid ? "valid" : "invalid"}
                errors={validation.errors}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
