import type { GenerateCaptionOutput, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act, renderHook, waitFor } from "@testing-library/react";
// removed unused import
import { useAIStore } from "../stores/aiStore";
import { useAI } from "./useAI";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockCaptionOutput: GenerateCaptionOutput & { log_id: string } = {
  caption: "Generated caption",
  hashtags: ["#ai", "#generated"],
  alternatives: ["Alt 1"],
  log_id: "log_123",
};

describe("useAI", () => {
  beforeEach(() => {
    useAIStore.setState({
      generationHistory: [],
      loading: false,
      error: null,
      selectedProvider: "nim",
    });
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("returns store state", () => {
      const { result } = renderHook(() => useAI());

      expect(result.current.generationHistory).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.selectedProvider).toBe("nim");
    });
  });

  describe("generateCaption", () => {
    it("calls store generateCaption with input", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const { result } = renderHook(() => useAI());

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      let output: GenerateCaptionOutput | undefined;
      await act(async () => {
        output = await result.current.generateCaption(input);
      });

      expect(output).toEqual({
        caption: "Generated caption",
        hashtags: ["#ai", "#generated"],
        alternatives: ["Alt 1"],
      });
      expect(mockInvoke).toHaveBeenCalledWith("generate_caption", expect.any(Object));
    });

    it("updates loading state during generation", async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCaptionOutput), 100)),
      );

      const { result } = renderHook(() => useAI());

      const input = {
        content: "Test content",
        platform: "instagram" as Platform,
      };

      act(() => {
        result.current.generateCaption(input);
      });

      expect(result.current.loading).toBe(true);
    });

    it("returns error state on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Generation failed"));

      const { result } = renderHook(() => useAI());

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      await act(async () => {
        try {
          await result.current.generateCaption(input);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe("Generation failed");
    });

    it("passes all optional params correctly", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const { result } = renderHook(() => useAI());

      const input = {
        content: "Test content",
        platform: "twitter" as Platform,
        tone: "humorous" as const,
        maxLength: 280,
        includeHashtags: false,
      };

      await act(async () => {
        await result.current.generateCaption(input);
      });

      expect(mockInvoke).toHaveBeenCalledWith("generate_caption", {
        content: "Test content",
        platform: "twitter",
        tone: "humorous",
        max_length: 280,
        include_hashtags: false,
      });
    });
  });

  describe("rateGeneration", () => {
    it("calls store rateGeneration", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAI());

      useAIStore.setState({
        generationHistory: [
          {
            id: "gen_001",
            provider: "nim",
            promptType: "caption",
            inputPrompt: "Test",
            generatedText: "Result",
            createdAt: new Date(),
          },
        ],
      });

      await act(async () => {
        await result.current.rateGeneration("gen_001", 5);
      });

      expect(mockInvoke).toHaveBeenCalledWith("rate_ai_generation", {
        id: "gen_001",
        rating: 5,
      });
    });

    it("updates rating in history", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAI());

      useAIStore.setState({
        generationHistory: [
          {
            id: "gen_001",
            provider: "nim",
            promptType: "caption",
            inputPrompt: "Test",
            generatedText: "Result",
            createdAt: new Date(),
          },
        ],
      });

      await act(async () => {
        await result.current.rateGeneration("gen_001", 4);
      });

      const state = useAIStore.getState();
      expect(state.generationHistory[0]?.rating).toBe(4);
    });
  });

  describe("fetchHistory", () => {
    it("calls store fetchHistory with limit", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.fetchHistory(25);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_ai_generation_history", {
        limit: 25,
      });
    });

    it("uses default limit when not provided", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.fetchHistory();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_ai_generation_history", {
        limit: 50,
      });
    });

    it("updates generationHistory", async () => {
      mockInvoke.mockResolvedValueOnce([
        {
          id: "gen_001",
          provider: "nim",
          prompt_type: "caption",
          input_prompt: "Test",
          generated_text: "Result",
          platform: "facebook",
          created_at: "2026-04-11T10:00:00Z",
        },
      ]);

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.fetchHistory();
      });

      await waitFor(() => {
        expect(result.current.generationHistory).toHaveLength(1);
      });
    });
  });

  describe("setProvider", () => {
    it("updates selectedProvider", () => {
      const { result } = renderHook(() => useAI());

      act(() => {
        result.current.setProvider("openai");
      });

      expect(result.current.selectedProvider).toBe("openai");
    });

    it("accepts all provider values", () => {
      const { result } = renderHook(() => useAI());

      const providers: Array<"nim" | "openai" | "anthropic"> = ["nim", "openai", "anthropic"];

      for (const provider of providers) {
        act(() => {
          result.current.setProvider(provider);
        });
        expect(result.current.selectedProvider).toBe(provider);
      }
    });
  });

  describe("clearHistory", () => {
    it("clears generationHistory", () => {
      const { result } = renderHook(() => useAI());

      useAIStore.setState({
        generationHistory: [
          {
            id: "gen_001",
            provider: "nim",
            promptType: "caption",
            inputPrompt: "Test",
            generatedText: "Result",
            createdAt: new Date(),
          },
        ],
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.generationHistory).toEqual([]);
    });
  });

  describe("type safety", () => {
    it("returns all required methods", () => {
      const { result } = renderHook(() => useAI());

      expect(typeof result.current.generateCaption).toBe("function");
      expect(typeof result.current.rateGeneration).toBe("function");
      expect(typeof result.current.fetchHistory).toBe("function");
      expect(typeof result.current.setProvider).toBe("function");
      expect(typeof result.current.clearHistory).toBe("function");
    });
  });
});
