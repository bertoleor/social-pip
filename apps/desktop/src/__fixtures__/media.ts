import type { MediaFile, MediaValidationResult, Platform } from "@social-pip/types";

export const VALID_JPG_FIXTURE: MediaFile = {
  id: "test-jpg-1",
  path: "/test/fixtures/test-1mb.jpg",
  fileName: "test-1mb.jpg",
  fileSize: 1024 * 1024,
  format: "jpg",
  dimensions: { width: 1920, height: 1080 },
  thumbnailUrl:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
  validationStatus: "valid",
};

export const VALID_PNG_FIXTURE: MediaFile = {
  id: "test-png-1",
  path: "/test/fixtures/test-5mb.png",
  fileName: "test-5mb.png",
  fileSize: 5 * 1024 * 1024,
  format: "png",
  dimensions: { width: 2048, height: 2048 },
  thumbnailUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  validationStatus: "valid",
};

export const VALID_GIF_FIXTURE: MediaFile = {
  id: "test-gif-1",
  path: "/test/fixtures/test-small.gif",
  fileName: "test-small.gif",
  fileSize: 512 * 1024,
  format: "gif",
  dimensions: { width: 800, height: 600 },
  thumbnailUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  validationStatus: "valid",
};

export const VALID_WEBP_FIXTURE: MediaFile = {
  id: "test-webp-1",
  path: "/test/fixtures/test-small.webp",
  fileName: "test-small.webp",
  fileSize: 256 * 1024,
  format: "webp",
  dimensions: { width: 640, height: 480 },
  thumbnailUrl:
    "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoKAAoAAUAmJYgCdAEO5YIqAMCD3AAD8P8A/gAAAAAAAAAAAAAAAAAAAAAAAAAA",
  validationStatus: "valid",
};

export const INVALID_SIZE_FIXTURE: MediaFile = {
  id: "test-large-1",
  path: "/test/fixtures/test-10mb.jpg",
  fileName: "test-10mb.jpg",
  fileSize: 10 * 1024 * 1024,
  format: "jpg",
  dimensions: { width: 4000, height: 3000 },
  validationStatus: "invalid",
  platformViolations: [
    {
      platform: "facebook",
      errors: [
        {
          code: "SIZE_EXCEEDED",
          message: "File size exceeds platform limit",
          actual: 10 * 1024 * 1024,
          limit: 4 * 1024 * 1024,
        },
      ],
      warnings: [],
    },
  ],
};

export const INVALID_FORMAT_FIXTURE: MediaFile = {
  id: "test-unsupported-1",
  path: "/test/fixtures/test-document.pdf",
  fileName: "test-document.pdf",
  fileSize: 100 * 1024,
  format: "jpg",
  dimensions: { width: 100, height: 100 },
  validationStatus: "invalid",
  platformViolations: [
    {
      platform: "facebook",
      errors: [{ code: "FORMAT_UNSUPPORTED", message: "PDF format not supported", actual: "pdf" }],
      warnings: [],
    },
  ],
};

export const WARNING_SIZE_FIXTURE: MediaFile = {
  id: "test-warning-1",
  path: "/test/fixtures/test-3.5mb.jpg",
  fileName: "test-3.5mb.jpg",
  fileSize: 3.5 * 1024 * 1024,
  format: "jpg",
  dimensions: { width: 1800, height: 1200 },
  validationStatus: "warning",
};

export const createMockMediaFile = (overrides: Partial<MediaFile> = {}): MediaFile => ({
  ...VALID_JPG_FIXTURE,
  ...overrides,
});

export const createMockValidationResult = (
  fileId: string,
  platform: Platform,
  valid: boolean,
  errors: MediaValidationResult["errors"] = [],
  warnings: MediaValidationResult["warnings"] = [],
): MediaValidationResult => ({
  fileId,
  platform,
  valid,
  errors,
  warnings,
});

export const MULTIPLE_FILES_FIXTURE: MediaFile[] = [
  VALID_JPG_FIXTURE,
  VALID_PNG_FIXTURE,
  VALID_GIF_FIXTURE,
];

export const MIXED_VALIDITY_FIXTURE: MediaFile[] = [
  VALID_JPG_FIXTURE,
  INVALID_SIZE_FIXTURE,
  VALID_GIF_FIXTURE,
];
