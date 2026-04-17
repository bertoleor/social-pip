import type { AIGenerationLog, AIProvider, Platform } from "@social-pip/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { GenerationHistory } from "./GenerationHistory";

const mockFetchHistory = vi.fn();
const mockRateGeneration = vi.fn();
const mockClearHistory = vi.fn();

let mockGenerationHistory: AIGenerationLog[] = [];
let mockLoading = false;

vi.mock("../../hooks/useAI", () => ({
  useAI: () => ({
    generationHistory: mockGenerationHistory,
    loading: mockLoading,
    error: null,
    fetchHistory: mockFetchHistory,
    rateGeneration: mockRateGeneration,
    clearHistory: mockClearHistory,
  }),
}));

const mockHistoryItems: AIGenerationLog[] = [
  {
    id: "gen_001",
    provider: "nim" as AIProvider,
    promptType: "caption",
    inputPrompt: "Test content 1",
    generatedText: "Generated caption 1",
    platform: "facebook" as Platform,
    createdAt: new Date("2026-04-11T10:00:00Z"),
    rating: 4,
  },
  {
    id: "gen_002",
    provider: "openai" as AIProvider,
    promptType: "caption",
    inputPrompt: "Test content 2",
    generatedText: "Generated caption 2",
    platform: "instagram" as Platform,
    createdAt: new Date("2026-04-11T11:00:00Z"),
    rating: undefined,
  },
  {
    id: "gen_003",
    provider: "anthropic" as AIProvider,
    promptType: "hashtag",
    inputPrompt: "Test content 3",
    generatedText: "#test #example",
    platform: "twitter" as Platform,
    createdAt: new Date("2026-04-11T12:00:00Z"),
    tokensUsed: 150,
    latencyMs: 500,
  },
];

describe("GenerationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerationHistory = [];
    mockLoading = false;
  });

  describe("rendering", () => {
    it("renders history list title", () => {
      render(<GenerationHistory />);

      expect(screen.getByText(/generation history/i)).toBeInTheDocument();
    });

    it("renders empty state when no history", () => {
      mockGenerationHistory = [];
      mockLoading = false;

      render(<GenerationHistory />);

      expect(screen.getByText(/no generations yet/i)).toBeInTheDocument();
    });

    it("renders history items when available", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      expect(screen.getByText("Generated caption 1")).toBeInTheDocument();
      expect(screen.getByText("Generated caption 2")).toBeInTheDocument();
    });

    it("renders platform badges for each item", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      expect(screen.getByText("facebook")).toBeInTheDocument();
      expect(screen.getByText("instagram")).toBeInTheDocument();
    });

    it("renders provider badges for each item", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      expect(screen.getByText("nim")).toBeInTheDocument();
      expect(screen.getByText("openai")).toBeInTheDocument();
    });

    it("renders timestamps for each item", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const timestamps = screen.getAllByText(/apr 11, 2026/i);
      expect(timestamps.length).toBe(3);
    });

    it("renders loading state", () => {
      mockGenerationHistory = [];
      mockLoading = true;

      render(<GenerationHistory />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls fetchHistory on mount", () => {
      render(<GenerationHistory />);

      expect(mockFetchHistory).toHaveBeenCalledWith(20);
    });

    it("calls fetchHistory with custom limit", () => {
      render(<GenerationHistory limit={50} />);

      expect(mockFetchHistory).toHaveBeenCalledWith(50);
    });

    it("expands item to show full details", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      await user.click(expandButton);

      expect(screen.getByText("Test content 1")).toBeInTheDocument();
    });

    it("calls rateGeneration when rating is clicked", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
      await user.click(expandButton);

      const starButton = screen.getAllByRole("button", { name: /rate/i })[0];
      await user.click(starButton);

      expect(mockRateGeneration).toHaveBeenCalledWith("gen_001", expect.any(Number));
    });

    it("displays existing rating", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("calls clearHistory when clear button is clicked", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const clearButton = screen.getByRole("button", { name: /clear history/i });
      await user.click(clearButton);

      expect(mockClearHistory).toHaveBeenCalled();
    });

    it("shows tokens used when available", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = [mockHistoryItems[2]];

      render(<GenerationHistory />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      await user.click(expandButton);

      expect(screen.getByText(/150 tokens/i)).toBeInTheDocument();
    });

    it("shows latency when available", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = [mockHistoryItems[2]];

      render(<GenerationHistory />);

      const expandButton = screen.getByRole("button", { name: /expand/i });
      await user.click(expandButton);

      expect(screen.getByText(/500ms/i)).toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    it("filters by platform", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const platformFilter = screen.getByLabelText(/filter by platform/i);
      await user.selectOptions(platformFilter, "instagram");

      expect(screen.getByText("Generated caption 2")).toBeInTheDocument();
      expect(screen.queryByText("Generated caption 1")).not.toBeInTheDocument();
    });

    it("filters by provider", async () => {
      const user = userEvent.setup();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const providerFilter = screen.getByLabelText(/filter by provider/i);
      await user.selectOptions(providerFilter, "nim");

      expect(screen.getByText("Generated caption 1")).toBeInTheDocument();
      expect(screen.queryByText("Generated caption 2")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      expect(screen.getByRole("list", { name: /generation history/i })).toBeInTheDocument();
    });

    it("has keyboard navigation", () => {
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory />);

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("props", () => {
    it("accepts limit prop", () => {
      render(<GenerationHistory limit={10} />);

      expect(mockFetchHistory).toHaveBeenCalledWith(10);
    });

    it("accepts className prop", () => {
      render(<GenerationHistory className="custom-class" />);

      const container = screen.getByTestId("generation-history");
      expect(container).toHaveClass("custom-class");
    });

    it("accepts onSelect callback", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      mockGenerationHistory = mockHistoryItems;

      render(<GenerationHistory onSelect={onSelect} />);

      const item = screen.getByText("Generated caption 1");
      await user.click(item);

      expect(onSelect).toHaveBeenCalledWith(mockHistoryItems[0]);
    });
  });
});
