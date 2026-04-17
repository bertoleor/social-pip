import { cn } from "@/lib/utils";
import type { Platform } from "@social-pip/types";
import {
  Facebook,
  Film,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
} from "lucide-react";
import type { FC } from "react";

export type PlatformIconSize = "sm" | "md" | "lg";

export interface PlatformIconProps {
  platform: Platform | string;
  size?: PlatformIconSize;
  className?: string;
}

/**
 * Platform to Lucide icon mapping
 */
const PLATFORM_ICONS: Record<string, FC<{ className?: string; color?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Film,
  twitter: Twitter,
  linkedin: Linkedin,
  threads: MessageCircle,
  telegram: Send,
  whatsapp: MessageCircle,
};

/**
 * Platform brand colors
 */
const PLATFORM_COLORS: Record<string, string> = {
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
 * Size variants in pixels
 */
const SIZE_MAP: Record<PlatformIconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * PlatformIcon component
 *
 * Renders platform-specific icons with brand colors.
 * Falls back to Globe icon for unknown platforms.
 *
 * @example
 * ```tsx
 * <PlatformIcon platform="facebook" size="md" />
 * <PlatformIcon platform="instagram" size="lg" className="opacity-75" />
 * ```
 */
export function PlatformIcon({
  platform,
  size = "md",
  className,
}: PlatformIconProps): React.ReactElement {
  const Icon = PLATFORM_ICONS[platform] ?? Globe;
  const color = PLATFORM_COLORS[platform] ?? "#9CA3AF"; // gray-400 fallback
  const dimension = SIZE_MAP[size];

  return (
    <Icon
      className={cn("inline-block", className)}
      color={color}
      size={dimension}
      aria-label={`${platform} icon`}
    />
  );
}

/**
 * Get platform color for custom styling
 */
export function getPlatformColor(platform: Platform | string): string {
  return PLATFORM_COLORS[platform] ?? "#9CA3AF";
}

/**
 * Get platform icon size in pixels
 */
export function getPlatformIconSize(size: PlatformIconSize): number {
  return SIZE_MAP[size];
}
