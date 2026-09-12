import type { AIProvider, GenerateCaptionOutput, Platform } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { act } from "@testing-library/react";
// removed unused import
import { useAIStore } from "./aiStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const mockCaptionOutput: GenerateCaptionOutput & { log_id: string } = {
  caption: "Test caption",
  hashtags: ["#test", "#example"],
  alternatives: ["Alt caption 1", "Alt caption 2"],
  log_id: "log_123",
};

const mockAIGenerationLog: Record<string, unknown> = {
  id: "gen_001",
  provider: "nim",
  prompt_type: "caption",
  input_prompt: "Test content",
  generated_text: "Generated caption",
  platform: "facebook",
  post_id: null,
  account_id: null,
  tokens_used: 100,
  latency_ms: 500,
  rating: null,
  created_at: "2026-04-11T10:00:00Z",
};

describe("useAIStore", () => {
  beforeEach(() => {
    useAIStore.setState({
      generationHistory: [],
      loading: false,
      error: null,
      selectedProvider: "nim",
    });
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("has empty generationHistory by default", () => {
      const state = useAIStore.getState();
      expect(state.generationHistory).toEqual([]);
    });

    it("has loading set to false by default", () => {
      const state = useAIStore.getState();
      expect(state.loading).toBe(false);
    });

    it("has error set to null by default", () => {
      const state = useAIStore.getState();
      expect(state.error).toBeNull();
    });

    it("has selectedProvider set to nim by default", () => {
      const state = useAIStore.getState();
      expect(state.selectedProvider).toBe("nim");
    });
  });

  describe("generateCaption", () => {
    it("sets loading to true during generation", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      act(() => {
        useAIStore.getState().generateCaption(input);
      });

      expect(useAIStore.getState().loading).toBe(true);
    });

    it("calls invoke with correct params", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const input = {
        content: "Test content",
        platform: "instagram" as Platform,
        tone: "professional" as const,
        maxLength: 500,
        includeHashtags: true,
      };

      await act(async () => {
        await useAIStore.getState().generateCaption(input);
      });

      expect(mockInvoke).toHaveBeenCalledWith("generate_caption", {
        content: "Test content",
        platform: "instagram",
        tone: "professional",
        max_length: 500,
        include_hashtags: true,
      });
    });

    it("adds log entry to history on success", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      await act(async () => {
        await useAIStore.getState().generateCaption(input);
      });

      const state = useAIStore.getState();
      expect(state.generationHistory).toHaveLength(1);
      expect(state.generationHistory[0]?.inputPrompt).toBe("Test content");
      expect(state.generationHistory[0]?.generatedText).toBe("Test caption");
      expect(state.generationHistory[0]?.platform).toBe("facebook");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("returns caption output on success", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      let result: GenerateCaptionOutput | undefined;
      await act(async () => {
        result = await useAIStore.getState().generateCaption(input);
      });

      expect(result).toEqual({
        caption: "Test caption",
        hashtags: ["#test", "#example"],
        alternatives: ["Alt caption 1", "Alt caption 2"],
      });
    });

    it("sets error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Generation failed"));

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      await act(async () => {
        try {
          await useAIStore.getState().generateCaption(input);
        } catch {
          // Expected
        }
      });

      const state = useAIStore.getState();
      expect(state.error).toBe("Generation failed");
      expect(state.loading).toBe(false);
    });

    it("handles unknown errors gracefully", async () => {
      mockInvoke.mockRejectedValueOnce("Unknown error string");

      const input = {
        content: "Test content",
        platform: "facebook" as Platform,
      };

      await act(async () => {
        try {
          await useAIStore.getState().generateCaption(input);
        } catch {
          // Expected
        }
      });

      const state = useAIStore.getState();
      expect(state.error).toBe("Unknown error string");
    });

    it("uses default values for optional params", async () => {
      mockInvoke.mockResolvedValueOnce(mockCaptionOutput);

      const input = {
        content: "Test",
        platform: "tiktok" as Platform,
      };

      await act(async () => {
        await useAIStore.getState().generateCaption(input);
      });

      expect(mockInvoke).toHaveBeenCalledWith("generate_caption", {
        content: "Test",
        platform: "tiktok",
        tone: "engaging",
        max_length: 280,
        include_hashtags: true,
      });
    });
  });

  describe("rateGeneration", () => {
    it("calls invoke with correct params", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAIStore.getState().rateGeneration("gen_001", 5);
      });

      expect(mockInvoke).toHaveBeenCalledWith("rate_ai_generation", {
        id: "gen_001",
        rating: 5,
      });
    });

    it("updates rating in history", async () => {
      useAIStore.setState({
        generationHistory: [
          {
            id: "gen_001",
            provider: "nim" as AIProvider,
            promptType: "caption",
            inputPrompt: "Test",
            generatedText: "Result",
            createdAt: new Date(),
          },
        ],
      });

      mockInvoke.mockResolvedValueOnce(undefined);

      await act(async () => {
        await useAIStore.getState().rateGeneration("gen_001", 4);
      });

      const state = useAIStore.getState();
      expect(state.generationHistory[0]?.rating).toBe(4);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Rating failed"));

      await act(async () => {
        await useAIStore.getState().rateGeneration("gen_001", 5);
      });

      const state = useAIStore.getState();
      expect(state.error).toBe("Rating failed");
    });
  });

  describe("fetchHistory", () => {
    it("sets loading to true during fetch", async () => {
      mockInvoke.mockResolvedValueOnce([mockAIGenerationLog]);

      act(() => {
        useAIStore.getState().fetchHistory(10);
      });

      expect(useAIStore.getState().loading).toBe(true);
    });

    it("calls invoke with correct limit", async () => {
      mockInvoke.mockResolvedValueOnce([mockAIGenerationLog]);

      await act(async () => {
        await useAIStore.getState().fetchHistory(25);
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_ai_generation_history", {
        limit: 25,
      });
    });

    it("uses default limit of 50", async () => {
      mockInvoke.mockResolvedValueOnce([]);

      await act(async () => {
        await useAIStore.getState().fetchHistory();
      });

      expect(mockInvoke).toHaveBeenCalledWith("get_ai_generation_history", {
        limit: 50,
      });
    });

    it("maps API response to AIGenerationLog", async () => {
      mockInvoke.mockResolvedValueOnce([mockAIGenerationLog]);

      await act(async () => {
        await useAIStore.getState().fetchHistory();
      });

      const state = useAIStore.getState();
      expect(state.generationHistory).toHaveLength(1);
      expect(state.generationHistory[0]?.id).toBe("gen_001");
      expect(state.generationHistory[0]?.provider).toBe("nim");
      expect(state.generationHistory[0]?.promptType).toBe("caption");
      expect(state.generationHistory[0]?.tokensUsed).toBe(100);
      expect(state.loading).toBe(false);
    });

    it("sets error on fetch failure", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Fetch failed"));

      await act(async () => {
        await useAIStore.getState().fetchHistory();
      });

      const state = useAIStore.getState();
      expect(state.error).toBe("Fetch failed");
      expect(state.loading).toBe(false);
    });
  });

  describe("setProvider", () => {
    it("updates selectedProvider", () => {
      act(() => {
        useAIStore.getState().setProvider("openai");
      });

      expect(useAIStore.getState().selectedProvider).toBe("openai");
    });

    it("accepts all provider types", () => {
      const providers: AIProvider[] = ["nim", "openai", "anthropic"];

      for (const provider of providers) {
        act(() => {
          useAIStore.getState().setProvider(provider);
        });
        expect(useAIStore.getState().selectedProvider).toBe(provider);
      }
    });
  });

  describe("clearHistory", () => {
    it("clears generationHistory", () => {
      useAIStore.setState({
        generationHistory: [
          {
            id: "gen_001",
            provider: "nim" as AIProvider,
            promptType: "caption",
            inputPrompt: "Test",
            generatedText: "Result",
            createdAt: new Date(),
          },
        ],
      });

      act(() => {
        useAIStore.getState().clearHistory();
      });

      expect(useAIStore.getState().generationHistory).toEqual([]);
    });
  });

  describe("type safety", () => {
    it("store has all required actions", () => {
      const state = useAIStore.getState();
      expect(typeof state.generateCaption).toBe("function");
      expect(typeof state.rateGeneration).toBe("function");
      expect(typeof state.fetchHistory).toBe("function");
      expect(typeof state.setProvider).toBe("function");
      expect(typeof state.clearHistory).toBe("function");
    });
  });
});
