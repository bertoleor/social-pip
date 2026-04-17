/**
 * @fileoverview Tests for templateStore
 */

// removed unused import
import { useTemplateStore } from "./templateStore";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe("templateStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useTemplateStore.setState({
      templates: [],
      selectedId: null,
      loading: false,
      error: null,
      filter: null,
      preview: null,
      previewVariations: 0,
      previewValidation: null,
    });
  });

  describe("fetchTemplates", () => {
    it("fetches templates successfully", async () => {
      const mockTemplates = [
        {
          id: "1",
          name: "Template 1",
          sector: "marketing",
          platforms: "facebook",
          content: "Hello {World|Universe}",
          variants: "[]",
          imagePaths: "[]",
          includeLink: false,
          aiEnhanced: false,
          variationsCount: 2,
          tags: "[]",
          useCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockTemplates);

      const { fetchTemplates } = useTemplateStore.getState();
      await fetchTemplates();

      const state = useTemplateStore.getState();
      expect(state.templates).toHaveLength(1);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("handles fetch error", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"));

      const { fetchTemplates } = useTemplateStore.getState();
      await fetchTemplates();

      const state = useTemplateStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.loading).toBe(false);
    });
  });

  describe("createTemplate", () => {
    it("creates template with valid spintax", async () => {
      const newTemplate = {
        id: "real-id",
        name: "New Template",
        sector: "sales",
        platforms: "facebook",
        content: "Hello {A|B}",
        variants: "[]",
        imagePaths: "[]",
        includeLink: false,
        aiEnhanced: false,
        variationsCount: 2,
        tags: "[]",
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(newTemplate);

      const { createTemplate } = useTemplateStore.getState();
      const result = await createTemplate({
        name: "New Template",
        sector: "sales",
        platforms: "facebook",
        content: "Hello {A|B}",
      });

      expect(result.name).toBe("New Template");
      const state = useTemplateStore.getState();
      expect(state.templates).toHaveLength(1);
    });

    it("rejects template with invalid spintax", async () => {
      const { createTemplate } = useTemplateStore.getState();

      await expect(
        createTemplate({
          name: "Bad Template",
          sector: "sales",
          platforms: "facebook",
          content: "Hello {|}", // Empty option
        }),
      ).rejects.toThrow("Invalid spintax");
    });
  });

  describe("generatePreview", () => {
    it("generates preview for valid spintax", () => {
      const { generatePreview } = useTemplateStore.getState();
      generatePreview("Hello {World|Universe}");

      const state = useTemplateStore.getState();
      expect(state.preview).not.toBeNull();
      expect(state.previewVariations).toBe(2);
      expect(state.previewValidation?.valid).toBe(true);
    });

    it("handles invalid spintax in preview", () => {
      const { generatePreview } = useTemplateStore.getState();
      generatePreview("Hello {|}"); // Empty option

      const state = useTemplateStore.getState();
      expect(state.preview).toBeNull();
      expect(state.previewValidation?.valid).toBe(false);
    });
  });

  describe("cycleVariation", () => {
    it("cycles to new variation", () => {
      // Set up initial state with a template
      useTemplateStore.setState({
        templates: [
          {
            id: "test-id",
            name: "Test",
            sector: "test",
            platforms: "facebook",
            content: "Hello {A|B|C}",
            variants: "[]",
            imagePaths: "[]",
            includeLink: false,
            aiEnhanced: false,
            tags: "[]",
            useCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        selectedId: "test-id",
        preview: {
          content: "Hello A",
          variation: 1,
          seed: 123,
        },
      });

      const { cycleVariation } = useTemplateStore.getState();
      cycleVariation();

      const state = useTemplateStore.getState();
      expect(state.preview?.variation).toBe(2);
    });
  });

  describe("validateContent", () => {
    it("returns validation result", () => {
      const { validateContent } = useTemplateStore.getState();
      const result = validateContent("{A|B}");

      expect(result.valid).toBe(true);
    });

    it("detects invalid spintax", () => {
      const { validateContent } = useTemplateStore.getState();
      const result = validateContent("{A|");

      expect(result.valid).toBe(false);
    });
  });

  describe("countContentVariations", () => {
    it("counts variations correctly", () => {
      const { countContentVariations } = useTemplateStore.getState();
      const count = countContentVariations("{A|B} {1|2|3}");

      expect(count).toBe(6); // 2 * 3
    });
  });
});
