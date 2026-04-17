import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { useAI } from "@/hooks/useAI";
import { cn } from "@/lib/utils";
import type { AIGenerationLog } from "@social-pip/types";
import { ChevronDown, ChevronUp, Filter, History, Star, Trash2 } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

export interface GenerationHistoryProps {
  limit?: number;
  onSelect?: (item: AIGenerationLog) => void;
  className?: string;
}

const PLATFORM_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Platforms" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
];

const PROVIDER_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Providers" },
  { value: "nim", label: "NVIDIA NIM" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const GenerationHistory: FC<GenerationHistoryProps> = ({
  limit = 20,
  onSelect,
  className,
}) => {
  const { generationHistory, loading, fetchHistory, rateGeneration, clearHistory } = useAI();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  useEffect(() => {
    fetchHistory(limit);
  }, [limit, fetchHistory]);

  const handleExpand = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const handleRate = useCallback(
    async (id: string, rating: number) => {
      await rateGeneration(id, rating);
    },
    [rateGeneration],
  );

  const handleClear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleSelect = useCallback(
    (item: AIGenerationLog) => {
      onSelect?.(item);
    },
    [onSelect],
  );

  const filteredHistory = generationHistory.filter((item: AIGenerationLog) => {
    if (platformFilter !== "all" && item.platform !== platformFilter) {
      return false;
    }
    if (providerFilter !== "all" && item.provider !== providerFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className={cn("space-y-4", className)} data-testid="generation-history">
        <div className="flex justify-center py-8">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            role="status"
          />
        </div>
      </div>
    );
  }

  if (generationHistory.length === 0) {
    return (
      <div className={cn("space-y-4", className)} data-testid="generation-history">
        <h2 className="text-lg font-semibold text-gray-900">Generation History</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No generations yet</p>
          <p className="text-sm text-gray-400 mt-1">Generated captions will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} data-testid="generation-history">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Generation History</h2>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            aria-label="Filter by platform"
          >
            {PLATFORM_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="h-8 px-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            aria-label="Filter by provider"
          >
            {PROVIDER_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:text-red-700"
            aria-label="Clear history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="space-y-3" aria-label="Generation history">
        {filteredHistory.map((item: AIGenerationLog) => (
          <li
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
          >
            <div className="p-4 cursor-pointer" onClick={() => handleSelect(item)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.platform && (
                      <Badge variant="info" className="text-xs">
                        {item.platform}
                      </Badge>
                    )}
                    <Badge variant="neutral" className="text-xs">
                      {item.provider}
                    </Badge>
                    {item.rating !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-900 truncate">{item.generatedText}</p>

                  <p className="text-xs text-gray-500 mt-1">{formatDate(item.createdAt)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpand(item.id);
                  }}
                  aria-label={expandedId === item.id ? "Collapse" : "Expand"}
                >
                  {expandedId === item.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedId === item.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Input Prompt
                      </label>
                      <p className="text-sm text-gray-700 mt-1">{item.inputPrompt}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                      <p className="text-sm text-gray-700 mt-1 capitalize">{item.promptType}</p>
                    </div>

                    {item.tokensUsed !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Tokens Used
                        </label>
                        <p className="text-sm text-gray-700 mt-1">{item.tokensUsed} tokens</p>
                      </div>
                    )}

                    {item.latencyMs !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Latency
                        </label>
                        <p className="text-sm text-gray-700 mt-1">{item.latencyMs}ms</p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Rate this generation
                      </label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRate(item.id, rating);
                            }}
                            className={cn(
                              "p-1",
                              item.rating !== undefined && item.rating >= rating
                                ? "text-yellow-500"
                                : "text-gray-300",
                            )}
                            aria-label={`Rate ${rating}`}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                item.rating !== undefined &&
                                  item.rating >= rating &&
                                  "fill-current",
                              )}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filteredHistory.length === 0 && generationHistory.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-gray-500">No items match your filters</p>
        </div>
      )}
    </div>
  );
};
