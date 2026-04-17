import type { Platform, PlatformMediaConstraints } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

export interface UseMediaValidationReturn {
  getConstraints: () => Promise<PlatformMediaConstraints>;
  isFormatAllowed: (format: string) => boolean;
  isSizeWithinLimit: (sizeBytes: number) => boolean;
  areDimensionsValid: (width: number, height: number) => boolean;
  constraints: PlatformMediaConstraints | null;
  loading: boolean;
  error: string | null;
}

export function useMediaValidation(platform: Platform): UseMediaValidationReturn {
  const [constraints, setConstraints] = useState<PlatformMediaConstraints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConstraints() {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<PlatformMediaConstraints>("get_platform_media_constraints", {
          platform,
        });
        setConstraints(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadConstraints();
  }, [platform]);

  const getConstraints = useCallback(async (): Promise<PlatformMediaConstraints> => {
    if (constraints) {
      return constraints;
    }
    const result = await invoke<PlatformMediaConstraints>("get_platform_media_constraints", {
      platform,
    });
    setConstraints(result);
    return result;
  }, [platform, constraints]);

  const isFormatAllowed = useCallback(
    (format: string): boolean => {
      if (!constraints) return false;
      return constraints.allowedFormats.includes(format as never);
    },
    [constraints],
  );

  const isSizeWithinLimit = useCallback(
    (sizeBytes: number): boolean => {
      if (!constraints) return false;
      return sizeBytes <= constraints.maxSizeBytes;
    },
    [constraints],
  );

  const areDimensionsValid = useCallback(
    (width: number, height: number): boolean => {
      if (!constraints) return false;
      return (
        width >= constraints.minDimensions.width &&
        height >= constraints.minDimensions.height &&
        width <= constraints.maxDimensions.width &&
        height <= constraints.maxDimensions.height
      );
    },
    [constraints],
  );

  return {
    getConstraints,
    isFormatAllowed,
    isSizeWithinLimit,
    areDimensionsValid,
    constraints,
    loading,
    error,
  };
}
