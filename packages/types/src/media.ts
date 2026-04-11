import type { Platform } from './index'

export type ImageFormat = 'jpg' | 'png' | 'gif' | 'webp'

export interface ImageDimensions {
  width: number
  height: number
}

export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning'

export interface MediaFile {
  id: string
  path: string
  fileName: string
  fileSize: number
  format: ImageFormat
  dimensions: ImageDimensions
  thumbnailUrl?: string
  validationStatus: ValidationStatus
  platformViolations?: PlatformViolation[]
}

export interface PlatformViolation {
  platform: Platform
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: MediaErrorCode
  message: string
  actual?: number | string
  limit?: number | string
}

export interface ValidationWarning {
  code: MediaWarningCode
  message: string
  actual: number
  limit: number
}

export type MediaErrorCode =
  | 'FORMAT_UNSUPPORTED'
  | 'SIZE_EXCEEDED'
  | 'DIMENSIONS_TOO_SMALL'
  | 'DIMENSIONS_TOO_LARGE'
  | 'COUNT_EXCEEDED'
  | 'FILE_READ_ERROR'

export type MediaWarningCode =
  | 'SIZE_NEAR_LIMIT'
  | 'DIMENSIONS_UNUSUAL'

export interface MediaValidationResult {
  fileId: string
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  platform: Platform
}

export interface PlatformMediaConstraints {
  platform: Platform
  maxImages: number
  maxSizeBytes: number
  allowedFormats: ImageFormat[]
  minDimensions: ImageDimensions
  maxDimensions: ImageDimensions
}

export const PLATFORM_MEDIA_CONSTRAINTS: Record<Platform, PlatformMediaConstraints> = {
  facebook: {
    platform: 'facebook',
    maxImages: 10,
    maxSizeBytes: 4 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'gif', 'webp'],
    minDimensions: { width: 200, height: 200 },
    maxDimensions: { width: 2048, height: 2048 },
  },
  instagram: {
    platform: 'instagram',
    maxImages: 10,
    maxSizeBytes: 30 * 1024 * 1024,
    allowedFormats: ['jpg', 'png'],
    minDimensions: { width: 320, height: 320 },
    maxDimensions: { width: 1080, height: 1080 },
  },
  twitter: {
    platform: 'twitter',
    maxImages: 4,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'gif', 'webp'],
    minDimensions: { width: 120, height: 120 },
    maxDimensions: { width: 4096, height: 4096 },
  },
  tiktok: {
    platform: 'tiktok',
    maxImages: 35,
    maxSizeBytes: 20 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'webp'],
    minDimensions: { width: 360, height: 360 },
    maxDimensions: { width: 1080, height: 1080 },
  },
  linkedin: {
    platform: 'linkedin',
    maxImages: 9,
    maxSizeBytes: 8 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'gif'],
    minDimensions: { width: 400, height: 400 },
    maxDimensions: { width: 7680, height: 4320 },
  },
  threads: {
    platform: 'threads',
    maxImages: 20,
    maxSizeBytes: 8 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'gif'],
    minDimensions: { width: 320, height: 320 },
    maxDimensions: { width: 1440, height: 1920 },
  },
  telegram: {
    platform: 'telegram',
    maxImages: 10,
    maxSizeBytes: 2 * 1024 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'webp', 'gif'],
    minDimensions: { width: 1, height: 1 },
    maxDimensions: { width: 10000, height: 10000 },
  },
  whatsapp: {
    platform: 'whatsapp',
    maxImages: 30,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'webp'],
    minDimensions: { width: 1, height: 1 },
    maxDimensions: { width: 1080, height: 1920 },
  },
}

export function getPlatformMediaConstraints(platform: Platform): PlatformMediaConstraints {
  return PLATFORM_MEDIA_CONSTRAINTS[platform]
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function imageFormatFromExtension(fileName: string): ImageFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpg'
    case 'png':
      return 'png'
    case 'gif':
      return 'gif'
    case 'webp':
      return 'webp'
    default:
      return null
  }
}

export function imageFormatFromMimeType(mimeType: string): ImageFormat | null {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    default:
      return null
  }
}
