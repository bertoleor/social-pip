import type { Platform, Post, PostStatus } from "@social-pip/types";

interface CreatePostFixtureOptions {
  id?: string;
  content?: string;
  platform?: Platform;
  status?: PostStatus;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: Date;
  accountId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createPostFixture(options: CreatePostFixtureOptions = {}): Post {
  return {
    id: options.id ?? "post_test001",
    content: options.content ?? "Test post content",
    platform: options.platform ?? "facebook",
    status: options.status ?? "draft",
    mediaUrls: options.mediaUrls ?? [],
    altCaptions: [],
    hashtags: options.hashtags ?? [],
    scheduledAt: options.scheduledAt,
    variance: 15,
    accountId: options.accountId ?? "acc_test001",
    createdAt: options.createdAt ?? new Date("2026-04-01T00:00:00Z"),
    updatedAt: options.updatedAt ?? new Date("2026-04-01T00:00:00Z"),
  };
}

export function createPostFixtures(count: number, options: CreatePostFixtureOptions = {}): Post[] {
  return Array.from({ length: count }, (_, index) => {
    const platformIndex = index % 4;
    const platforms: Platform[] = ["facebook", "instagram", "twitter", "linkedin"];
    const statuses: PostStatus[] = ["draft", "scheduled", "published", "failed"];
    return createPostFixture({
      ...options,
      id: options.id ? `${options.id}_${index}` : `post_test${String(index + 1).padStart(3, "0")}`,
      platform: options.platform ?? platforms[platformIndex],
      status: options.status ?? statuses[index % 4],
      content: options.content ?? `Test post ${index + 1} content`,
    });
  });
}

export const mockDraftPost = createPostFixture({
  id: "post_draft",
  status: "draft",
  content: "This is a draft post",
});

export const mockScheduledPost = createPostFixture({
  id: "post_scheduled",
  status: "scheduled",
  content: "This is a scheduled post",
  scheduledAt: new Date("2026-04-15T10:00:00Z"),
});

export const mockPublishedPost = createPostFixture({
  id: "post_published",
  status: "published",
  content: "This post was published",
});

export const mockFailedPost = createPostFixture({
  id: "post_failed",
  status: "failed",
  content: "This post failed to publish",
});

export const mockPostWithMedia = createPostFixture({
  id: "post_media",
  content: "Post with media",
  mediaUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
});

export const mockPostWithHashtags = createPostFixture({
  id: "post_hashtags",
  content: "Post with hashtags #trending",
  hashtags: ["trending", "social", "marketing"],
});
