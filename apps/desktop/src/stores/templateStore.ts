import type { Template } from "@social-pip/types";
import {
  countVariations,
  parseSpintax,
  type SpintaxValidationResult,
  validateSpintax,
} from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";
/**
 * @fileoverview Template store - Zustand state management for template CRUD with spintax support
 */
import { create } from "zustand";

// Re-export Template type
export type { Template } from "@social-pip/types";

export interface TemplateFilter {
  sector?: string;
  category?: string;
  platforms?: string[];
  search?: string;
}

export interface CreateTemplateInput {
  name: string;
  sector: string;
  platforms: string[];
  content: string;
  variants?: string[];
  imagePaths?: string[];
  includeLink?: boolean;
  linkUrl?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  sector?: string;
  platforms?: string[];
  content?: string;
  variants?: string[];
  imagePaths?: string[];
  includeLink?: boolean;
  linkUrl?: string;
  category?: string;
  tags?: string[];
}

export interface PreviewState {
  content: string | null;
  variation: number;
  seed: number;
}

// State interface
export interface TemplateState {
  templates: Template[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  filter: TemplateFilter | null;

  // Preview state
  preview: PreviewState | null;
  previewVariations: number;
  previewValidation: SpintaxValidationResult | null;

  // Actions
  fetchTemplates: (filter?: TemplateFilter) => Promise<void>;
  createTemplate: (data: CreateTemplateInput) => Promise<Template>;
  updateTemplate: (id: string, data: UpdateTemplateInput) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  selectTemplate: (id: string | null) => void;
  setFilter: (filter: TemplateFilter) => void;
  clearError: () => void;

  // Spintax actions
  generatePreview: (content: string, seed?: number) => void;
  cycleVariation: () => void;
  validateContent: (content: string) => SpintaxValidationResult;
  countContentVariations: (content: string) => number;

  // Usage tracking
  incrementUseCount: (id: string) => Promise<void>;
}

// Helper to sort templates by lastUsedAt (most recent first)
function sortTemplates(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; // Descending order
  });
}

// Store implementation
export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedId: null,
  loading: false,
  error: null,
  filter: null,

  preview: null,
  previewVariations: 0,
  previewValidation: null,

  fetchTemplates: async (filter?: TemplateFilter) => {
    const currentFilter = filter ?? get().filter ?? undefined;
    set({ loading: true, error: null });

    try {
      const params: Record<string, string | string[] | undefined> = {};
      if (currentFilter?.sector !== undefined) params["sector"] = currentFilter.sector;
      if (currentFilter?.category !== undefined) params["category"] = currentFilter.category;
      if (currentFilter?.platforms !== undefined) params["platforms"] = currentFilter.platforms;
      if (currentFilter?.search !== undefined) params["search"] = currentFilter.search;

      const templates = await invoke<Template[]>("get_templates", params);
      set({
        templates: sortTemplates(templates),
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  createTemplate: async (data: CreateTemplateInput) => {
    // Validate spintax before creating
    const validation = validateSpintax(data.content);
    if (!validation.valid) {
      throw new Error(`Invalid spintax: ${validation.error}`);
    }

    try {
      const template = await invoke<Template>("create_template", {
        data: {
          name: data.name,
          sector: data.sector,
          platforms: data.platforms,
          content: data.content,
          variants: data.variants ?? [],
          image_paths: data.imagePaths ?? [],
          include_link: data.includeLink ?? false,
          link_url: data.linkUrl,
          category: data.category,
          tags: data.tags ?? [],
        },
      });

      // Add to templates
      set((state) => ({
        templates: sortTemplates([...state.templates, template]),
        loading: false,
        error: null,
      }));

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateInput) => {
    const currentTemplates = get().templates;
    const currentTemplate = currentTemplates.find((t) => t.id === id);

    if (!currentTemplate) {
      throw new Error(`Template not found: ${id}`);
    }

    // Validate content if provided
    if (data.content !== undefined) {
      const validation = validateSpintax(data.content);
      if (!validation.valid) {
        throw new Error(`Invalid spintax: ${validation.error}`);
      }
    }

    try {
      const template = await invoke<Template>("update_template", {
        id,
        data: {
          name: data.name,
          sector: data.sector,
          platforms: data.platforms,
          content: data.content,
          variants: data.variants,
          image_paths: data.imagePaths,
          include_link: data.includeLink,
          link_url: data.linkUrl,
          category: data.category,
          tags: data.tags,
        },
      });

      set((state) => ({
        templates: sortTemplates(state.templates.map((t) => (t.id === id ? template : t))),
        error: null,
      }));

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        templates: currentTemplates,
        error: errorMessage,
      });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    const currentTemplates = get().templates;
    const currentSelectedId = get().selectedId;

    // Optimistic removal
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));

    try {
      await invoke<void>("delete_template", { id });
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      set({
        templates: currentTemplates,
        selectedId: currentSelectedId,
        error: errorMessage,
      });
      throw error;
    }
  },

  selectTemplate: (id: string | null) => {
    set({ selectedId: id });

    // Generate preview if selecting a template
    if (id) {
      const template = get().templates.find((t) => t.id === id);
      if (template) {
        get().generatePreview(template.content);
      }
    } else {
      set({ preview: null, previewVariations: 0, previewValidation: null });
    }
  },

  setFilter: (filter: TemplateFilter) => {
    const currentFilter = get().filter;
    set({ filter: currentFilter ? { ...currentFilter, ...filter } : filter });
  },

  clearError: () => {
    set({ error: null });
  },

  generatePreview: (content: string, seed?: number) => {
    const validation = validateSpintax(content);
    const variations = countVariations(content);

    if (!validation.valid) {
      set({
        preview: null,
        previewVariations: variations,
        previewValidation: validation,
      });
      return;
    }

    const useSeed = seed ?? Date.now();
    const result = parseSpintax(content, { seed: useSeed });

    set({
      preview: {
        content: result.text,
        variation: 1,
        seed: useSeed,
      },
      previewVariations: variations,
      previewValidation: { valid: true },
    });
  },

  cycleVariation: () => {
    const currentPreview = get().preview;
    if (!currentPreview) return;

    const template = get().templates.find((t) => t.id === get().selectedId);
    if (!template) return;

    // Generate new variation with different seed
    const newSeed = Date.now();
    const result = parseSpintax(template.content, { seed: newSeed });

    set({
      preview: {
        content: result.text,
        variation: currentPreview.variation + 1,
        seed: newSeed,
      },
    });
  },

  validateContent: (content: string) => {
    return validateSpintax(content);
  },

  countContentVariations: (content: string) => {
    return countVariations(content);
  },

  incrementUseCount: async (id: string) => {
    try {
      await invoke<void>("increment_template_use", { id });
    } catch (error) {
      // Silent fail for usage tracking
      console.error("Failed to increment template use count:", error);
    }
  },
}));
