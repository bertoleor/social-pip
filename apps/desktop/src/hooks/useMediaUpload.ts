import type {
  MediaFile,
  MediaValidationResult,
  Platform,
  PlatformMediaConstraints,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import { randomUUID } from "../lib/crypto";
import { usePostingStore } from "../stores/postingStore";

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  file_size: number;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string; actual: number; limit: number }>;
}

export interface UseMediaUploadProps {
  platform: Platform;
  maxFiles?: number;
}

export interface UseMediaUploadReturn {
  openFilePicker: () => Promise<void>;
  isUploading: boolean;
  error: string | null;
  constraints: PlatformMediaConstraints | null;
}

export function useMediaUpload({ platform, maxFiles }: UseMediaUploadProps): UseMediaUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<PlatformMediaConstraints | null>(null);
  const addMediaFiles = usePostingStore((state) => state.addMediaFiles);
  const setMediaValidation = usePostingStore((state) => state.setMediaValidation);
  const mediaFiles = usePostingStore((state) => state.mediaFiles);

  useEffect(() => {
    async function loadConstraints() {
      try {
        const result = await invoke<PlatformMediaConstraints>("get_platform_media_constraints", {
          platform,
        });
        setConstraints(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    loadConstraints();
  }, [platform]);

  const openFilePicker = useCallback(async () => {
    setIsUploading(true);
    setError(null);

    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "gif", "webp"],
          },
        ],
      });

      if (!selected) {
        setIsUploading(false);
        return;
      }

      const paths = Array.isArray(selected) ? selected : [selected];
      const effectiveMaxFiles = maxFiles ?? constraints?.maxImages ?? 10;
      const availableSlots = effectiveMaxFiles - mediaFiles.length;
      const pathsToProcess = paths.slice(0, availableSlots);

      const newMediaFiles: MediaFile[] = [];

      for (const path of pathsToProcess) {
        const validation = await invoke<ValidationResult>("validate_image", {
          path,
          platform,
        });

        const metadata = await invoke<ImageMetadata>("get_image_metadata", { path });

        const fileName = path.split(/[/\\]/).pop() ?? "unknown";
        const fileData = await readFile(path);
        const blob = new Blob([fileData]);
        const thumbnailUrl = URL.createObjectURL(blob);

        const mediaFile: MediaFile = {
          id: randomUUID(),
          path,
          fileName,
          fileSize: metadata.file_size,
          format: metadata.format as MediaFile["format"],
          dimensions: {
            width: metadata.width,
            height: metadata.height,
          },
          thumbnailUrl,
          validationStatus: validation.valid ? "valid" : "invalid",
          platformViolations: [],
        };

        newMediaFiles.push(mediaFile);

        setMediaValidation(mediaFile.id, {
          fileId: mediaFile.id,
          valid: validation.valid,
          errors: validation.errors.map((e: { code: string; message: string }) => ({
            code: e.code as never,
            message: e.message,
            platform,
          })),
          warnings: validation.warnings.map(
            (w: { code: string; message: string; actual: number; limit: number }) => ({
              code: w.code as never,
              message: w.message,
              actual: w.actual,
              limit: w.limit,
              platform,
            }),
          ),
          platform,
        } as MediaValidationResult);
      }

      addMediaFiles(newMediaFiles);
      setIsUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsUploading(false);
    }
  }, [platform, maxFiles, constraints, mediaFiles.length, addMediaFiles, setMediaValidation]);

  return {
    openFilePicker,
    isUploading,
    error,
    constraints,
  };
}
