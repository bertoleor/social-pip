import type {
  AIGenerationLog,
  AIProvider,
  GenerateCaptionInput,
  GenerateCaptionOutput,
  Platform,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export interface AIState {
  generationHistory: AIGenerationLog[];
  loading: boolean;
  error: string | null;
  selectedProvider: AIProvider;
  generateCaption: (input: GenerateCaptionInput) => Promise<GenerateCaptionOutput>;
  rateGeneration: (id: string, rating: number) => Promise<void>;
  fetchHistory: (limit?: number) => Promise<void>;
  setProvider: (provider: AIProvider) => void;
  clearHistory: () => void;
}

function apiLogToLog(apiLog: Record<string, unknown>): AIGenerationLog {
  return {
    id: apiLog["id"] as string,
    provider: apiLog["provider"] as AIProvider,
    promptType: apiLog["prompt_type"] as AIGenerationLog["promptType"],
    inputPrompt: apiLog["input_prompt"] as string,
    generatedText: apiLog["generated_text"] as string,
    platform: apiLog["platform"] as Platform | undefined,
    postId: apiLog["post_id"] as string | undefined,
    accountId: apiLog["account_id"] as string | undefined,
    tokensUsed: apiLog["tokens_used"] as number | undefined,
    latencyMs: apiLog["latency_ms"] as number | undefined,
    rating: apiLog["rating"] as number | undefined,
    createdAt: new Date(apiLog["created_at"] as string),
  };
}

export const useAIStore = create<AIState>((set, get) => ({
  generationHistory: [],
  loading: false,
  error: null,
  selectedProvider: "nim",

  generateCaption: async (input: GenerateCaptionInput) => {
    set({ loading: true, error: null });

    const params: Record<string, string | number | boolean | undefined> = {
      content: input.content,
      platform: input.platform,
      tone: input.tone ?? "engaging",
      max_length: input.maxLength ?? 280,
      include_hashtags: input.includeHashtags ?? true,
    };

    try {
      const result = await invoke<GenerateCaptionOutput & { log_id: string }>(
        "generate_caption",
        params,
      );

      const logEntry: AIGenerationLog = {
        id: result.log_id,
        provider: get().selectedProvider,
        promptType: "caption",
        inputPrompt: input.content,
        generatedText: result.caption,
        platform: input.platform,
        createdAt: new Date(),
      };

      set((state) => ({
        generationHistory: [logEntry, ...state.generationHistory],
        loading: false,
        error: null,
      }));

      return {
        caption: result.caption,
        hashtags: result.hashtags,
        alternatives: result.alternatives,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  rateGeneration: async (id: string, rating: number) => {
    try {
      await invoke<void>("rate_ai_generation", { id, rating });

      set((state) => ({
        generationHistory: state.generationHistory.map((log) =>
          log.id === id ? { ...log, rating } : log,
        ),
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage });
    }
  },

  fetchHistory: async (limit = 50) => {
    set({ loading: true, error: null });

    try {
      const apiLogs = await invoke<Record<string, unknown>[]>("get_ai_generation_history", {
        limit,
      });
      const logs = apiLogs.map(apiLogToLog);
      set({ generationHistory: logs, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({ error: errorMessage, loading: false });
    }
  },

  setProvider: (provider: AIProvider) => {
    set({ selectedProvider: provider });
  },

  clearHistory: () => {
    set({ generationHistory: [] });
  },
}));
