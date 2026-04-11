import type {
	AIProvider,
	GenerateCaptionInput,
	GenerateCaptionOutput,
} from "@social-pip/types";
import { type AIState, useAIStore } from "../stores/aiStore";

export interface UseAIReturn {
	generationHistory: AIState["generationHistory"];
	loading: boolean;
	error: string | null;
	selectedProvider: AIProvider;
	generateCaption: (
		input: GenerateCaptionInput,
	) => Promise<GenerateCaptionOutput>;
	rateGeneration: (id: string, rating: number) => Promise<void>;
	fetchHistory: (limit?: number) => Promise<void>;
	setProvider: (provider: AIProvider) => void;
	clearHistory: () => void;
}

export function useAI(): UseAIReturn {
	const {
		generationHistory,
		loading,
		error,
		selectedProvider,
		generateCaption,
		rateGeneration,
		fetchHistory,
		setProvider,
		clearHistory,
	} = useAIStore();

	return {
		generationHistory,
		loading,
		error,
		selectedProvider,
		generateCaption,
		rateGeneration,
		fetchHistory,
		setProvider,
		clearHistory,
	};
}
