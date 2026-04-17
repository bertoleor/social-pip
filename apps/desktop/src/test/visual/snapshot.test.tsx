import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { PostStatusBadge } from "@/components/atoms/PostStatusBadge";
import { AntiBanStatsCard } from "@/components/molecules/AntiBanStatsCard";
import { Card } from "@/components/molecules/Card";
import { PostCard } from "@/components/molecules/PostCard";
import { createPostFixture } from "@/test/fixtures/posts";
import type { AntiBanStats } from "@social-pip/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Visual Regression", () => {
  describe("Button snapshots", () => {
    it("renders primary button", () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-white hover:bg-primary/90 px-4 py-2 text-sm"
          type="button"
        >
          Primary
        </button>
      `);
    });

    it("renders secondary button", () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 text-sm"
          type="button"
        >
          Secondary
        </button>
      `);
    });

    it("renders outline button", () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm"
          type="button"
        >
          Outline
        </button>
      `);
    });

    it("renders ghost button", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent text-gray-700 hover:bg-gray-100 px-4 py-2 text-sm"
          type="button"
        >
          Ghost
        </button>
      `);
    });

    it("renders small size button", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-white hover:bg-primary/90 px-3 py-1.5 text-sm"
          type="button"
        >
          Small
        </button>
      `);
    });

    it("renders large size button", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-white hover:bg-primary/90 px-6 py-3 text-base"
          type="button"
        >
          Large
        </button>
      `);
    });

    it("renders disabled button", () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <button
          class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-white hover:bg-primary/90 px-4 py-2 text-sm opacity-50 cursor-not-allowed"
          disabled=""
          type="button"
        >
          Disabled
        </button>
      `);
    });
  });

  describe("Badge snapshots", () => {
    it("renders success badge", () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-sm"
        >
          Success
        </span>
      `);
    });

    it("renders warning badge", () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-sm"
        >
          Warning
        </span>
      `);
    });

    it("renders error badge", () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-sm"
        >
          Error
        </span>
      `);
    });

    it("renders info badge", () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 text-sm"
        >
          Info
        </span>
      `);
    });

    it("renders neutral badge", () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-sm"
        >
          Neutral
        </span>
      `);
    });

    it("renders small badge", () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs"
        >
          Small
        </span>
      `);
    });
  });

  describe("Card snapshots", () => {
    it("renders card with default padding and shadow", () => {
      const { container } = render(<Card>Card content</Card>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
        >
          Card content
        </div>
      `);
    });

    it("renders card with no padding", () => {
      const { container } = render(<Card padding="none">No padding</Card>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          No padding
        </div>
      `);
    });

    it("renders card with large padding", () => {
      const { container } = render(<Card padding="lg">Large padding</Card>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
        >
          Large padding
        </div>
      `);
    });

    it("renders card with large shadow", () => {
      const { container } = render(<Card shadow="lg">Large shadow</Card>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-lg"
        >
          Large shadow
        </div>
      `);
    });

    it("renders card with no shadow", () => {
      const { container } = render(<Card shadow="none">No shadow</Card>);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4"
        >
          No shadow
        </div>
      `);
    });
  });

  describe("PostStatusBadge snapshots", () => {
    it("renders draft status", () => {
      const { container } = render(<PostStatusBadge status="draft" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs"
        >
          Draft
        </span>
      `);
    });

    it("renders scheduled status", () => {
      const { container } = render(<PostStatusBadge status="scheduled" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-xs"
        >
          Scheduled
        </span>
      `);
    });

    it("renders published status", () => {
      const { container } = render(<PostStatusBadge status="published" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs"
        >
          Published
        </span>
      `);
    });

    it("renders failed status", () => {
      const { container } = render(<PostStatusBadge status="failed" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs"
        >
          Failed
        </span>
      `);
    });
  });

  describe("AntiBanStatsCard snapshot", () => {
    const mockStats: AntiBanStats = {
      hourly_count: 5,
      daily_count: 25,
      success_rate: 0.95,
      batch_count: 3,
      config: {
        platform: "facebook",
        hourly_action_limit: 10,
        daily_action_limit: 50,
        min_action_delay_ms: 60000,
        max_action_delay_ms: 300000,
        batch_size: 5,
        batch_break_minutes: 20,
      },
    };

    it("renders anti-ban stats card", () => {
      const { container } = render(<AntiBanStatsCard stats={mockStats} platform="facebook" />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          data-testid="antiban-stats-card"
        >
          <div
            class="space-y-4"
          >
            <div
              class="flex items-center justify-between"
            >
              <h3
                class="text-lg font-semibold text-gray-900"
              >
                Facebook
              </h3>
              <span
                aria-label="Low risk: Safe to post"
                class="font-medium rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-sm inline-flex items-center gap-1.5"
                role="status"
                title="Hourly: 5/10 (50%)
        Daily: 25/50 (50%)"
              >
                <svg
                  aria-hidden="true"
                  class="lucide lucide-check h-3.5 w-3.5"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6 9 17l-5-5"
                  />
                </svg>
                Safe
              </span>
            </div>
            <ul
              class="grid grid-cols-2 gap-4"
            >
              <li
                class="flex flex-col"
              >
                <span
                  class="text-2xl font-bold text-gray-900"
                >
                  5/10
                </span>
                <span
                  class="text-sm text-gray-500"
                >
                  actions this hour
                </span>
              </li>
              <li
                class="flex flex-col"
              >
                <span
                  class="text-2xl font-bold text-gray-900"
                >
                  25/50
                </span>
                <span
                  class="text-sm text-gray-500"
                >
                  actions today
                </span>
              </li>
              <li
                class="flex flex-col"
              >
                <span
                  class="text-2xl font-bold text-gray-900"
                >
                  95%
                </span>
                <span
                  class="text-sm text-gray-500"
                >
                  success rate
                </span>
              </li>
              <li
                class="flex flex-col"
              >
                <span
                  class="text-2xl font-bold text-gray-900"
                >
                  3/5
                </span>
                <span
                  class="text-sm text-gray-500"
                >
                  batch progress
                </span>
              </li>
            </ul>
          </div>
        </div>
      `);
    });
  });

  describe("PostCard snapshot", () => {
    it("renders draft post card", () => {
      const post = createPostFixture({
        id: "post_snapshot_1",
        status: "draft",
        content: "This is a test post for visual regression testing",
      });
      const { container } = render(<PostCard post={post} />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
          <div
            class="space-y-3"
          >
            <div
              class="flex items-start justify-between gap-2"
            >
              <div
                class="flex items-center gap-2"
              >
                <svg
                  aria-label="facebook icon"
                  class="lucide lucide-facebook inline-block"
                  fill="none"
                  height="16"
                  stroke="#1877F2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  />
                </svg>
                <span
                  class="inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs"
                >
                  Draft
                </span>
              </div>
              <div
                class="flex gap-1"
              />
            </div>
            <p
              class="text-sm text-gray-700 line-clamp-2"
            >
              This is a test post for visual regression testing
            </p>
          </div>
        </div>
      `);
    });

    it("renders scheduled post card with hashtags", () => {
      const post = createPostFixture({
        id: "post_snapshot_2",
        status: "scheduled",
        content: "Scheduled post with hashtags",
        hashtags: ["trending", "social", "marketing"],
        scheduledAt: new Date("2026-04-15T10:00:00Z"),
      });
      const { container } = render(<PostCard post={post} />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
          <div
            class="space-y-3"
          >
            <div
              class="flex items-start justify-between gap-2"
            >
              <div
                class="flex items-center gap-2"
              >
                <svg
                  aria-label="facebook icon"
                  class="lucide lucide-facebook inline-block"
                  fill="none"
                  height="16"
                  stroke="#1877F2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  />
                </svg>
                <span
                  class="inline-flex items-center font-medium rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-xs"
                >
                  Scheduled
                </span>
              </div>
              <div
                class="flex gap-1"
              />
            </div>
            <p
              class="text-sm text-gray-700 line-clamp-2"
            >
              Scheduled post with hashtags
            </p>
            <div
              class="flex flex-wrap gap-1"
            >
              <span
                class="text-xs text-blue-600"
              >
                #
                trending
              </span>
              <span
                class="text-xs text-blue-600"
              >
                #
                social
              </span>
              <span
                class="text-xs text-blue-600"
              >
                #
                marketing
              </span>
            </div>
            <div
              class="flex items-center gap-1 text-xs text-gray-500"
            >
              <svg
                class="lucide lucide-clock h-3 w-3"
                fill="none"
                height="24"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />
                <polyline
                  points="12 6 12 12 16 14"
                />
              </svg>
              <span>
                Apr 15, 07:00 AM
              </span>
            </div>
          </div>
        </div>
      `);
    });

    it("renders failed post card with error", () => {
      const post = createPostFixture({
        id: "post_snapshot_3",
        status: "failed",
        content: "Failed post",
      });
      post.errorMessage = "Rate limit exceeded";
      const { container } = render(<PostCard post={post} />);
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
          <div
            class="space-y-3"
          >
            <div
              class="flex items-start justify-between gap-2"
            >
              <div
                class="flex items-center gap-2"
              >
                <svg
                  aria-label="facebook icon"
                  class="lucide lucide-facebook inline-block"
                  fill="none"
                  height="16"
                  stroke="#1877F2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  />
                </svg>
                <span
                  class="inline-flex items-center font-medium rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs"
                >
                  Failed
                </span>
              </div>
              <div
                class="flex gap-1"
              />
            </div>
            <p
              class="text-sm text-gray-700 line-clamp-2"
            >
              Failed post
            </p>
            <p
              class="text-xs text-red-500 truncate"
            >
              Rate limit exceeded
            </p>
          </div>
        </div>
      `);
    });
  });
});
