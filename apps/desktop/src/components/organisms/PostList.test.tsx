import type { Post } from "@social-pip/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostList } from "./PostList";

const mockPosts: Post[] = [
  {
    id: "post_1",
    content: "First post",
    mediaUrls: [],
    platform: "facebook",
    status: "draft",
    altCaptions: [],
    hashtags: ["test"],
    variance: 15,
    accountId: "account_1",
    createdAt: new Date("2026-04-10T10:00:00Z"),
    updatedAt: new Date("2026-04-10T10:00:00Z"),
  },
  {
    id: "post_2",
    content: "Second post",
    mediaUrls: [],
    platform: "instagram",
    status: "scheduled",
    altCaptions: [],
    hashtags: ["photo"],
    variance: 15,
    accountId: "account_1",
    createdAt: new Date("2026-04-10T11:00:00Z"),
    updatedAt: new Date("2026-04-10T11:00:00Z"),
  },
];

describe("PostList", () => {
  it("renders all posts", () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.getByText("Second post")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<PostList posts={[]} loading={true} />);
    const skeletonElements = document.querySelectorAll(".animate-pulse");
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it("renders empty state with add button", () => {
    const onAdd = vi.fn();
    render(<PostList posts={[]} onAdd={onAdd} />);
    expect(screen.getByText("No posts yet")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Create Post"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("filters by platform", () => {
    render(<PostList posts={mockPosts} />);

    const platformSelect = screen.getByLabelText("Filter by platform");
    fireEvent.change(platformSelect, { target: { value: "instagram" } });

    expect(screen.getByText("Second post")).toBeInTheDocument();
    expect(screen.queryByText("First post")).not.toBeInTheDocument();
  });

  it("filters by status", () => {
    render(<PostList posts={mockPosts} />);

    const statusSelect = screen.getByLabelText("Filter by status");
    fireEvent.change(statusSelect, { target: { value: "draft" } });

    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.queryByText("Second post")).not.toBeInTheDocument();
  });

  it("searches by content", () => {
    render(<PostList posts={mockPosts} />);

    const searchInput = screen.getByLabelText("Search posts");
    fireEvent.change(searchInput, { target: { value: "First" } });

    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.queryByText("Second post")).not.toBeInTheDocument();
  });

  it("shows no results message when filtered", () => {
    render(<PostList posts={mockPosts} />);

    const searchInput = screen.getByLabelText("Search posts");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No posts match your filters")).toBeInTheDocument();
  });

  it("calls onAdd when new post button clicked", () => {
    const onAdd = vi.fn();
    render(<PostList posts={mockPosts} onAdd={onAdd} />);

    fireEvent.click(screen.getByText("New Post"));
    expect(onAdd).toHaveBeenCalled();
  });
});
