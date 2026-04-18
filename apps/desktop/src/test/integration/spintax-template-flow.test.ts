import { useTemplateStore } from "@/stores/templateStore";
import { countVariations, parseSpintax, validateSpintax } from "@social-pip/types";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("Spintax to Template Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("creates template with valid spintax", () => {
    it("validates simple spintax before template creation", () => {
      const content = "{Hello|Hi} {World|Universe}";
      const result = validateSpintax(content);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("validates nested spintax before template creation", () => {
      const content = "{{A|B}|{C|D}} test";
      const result = validateSpintax(content);

      expect(result.valid).toBe(true);
    });

    it("creates template via store with valid spintax", async () => {
      const mockTemplate = {
        id: "tpl_001",
        name: "Test Template",
        sector: "marketing",
        platforms: ["facebook"],
        content: "{Hello|Hi} World",
        variants: [],
        imagePaths: [],
        includeLink: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(mockTemplate);

      const { createTemplate } = useTemplateStore.getState();
      const result = await createTemplate({
        name: "Test Template",
        sector: "marketing",
        platforms: ["facebook"],
        content: "{Hello|Hi} World",
      });

      expect(result.id).toBe("tpl_001");
      expect(mockInvoke).toHaveBeenCalledWith("create_template", expect.any(Object));
    });

    it("rejects template with invalid spintax", async () => {
      const { createTemplate } = useTemplateStore.getState();

      await expect(
        createTemplate({
          name: "Bad Template",
          sector: "marketing",
          platforms: ["facebook"],
          content: "{Hello|}",
        }),
      ).rejects.toThrow("Invalid spintax");

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe("generates reproducible preview with seed", () => {
    it("generates same output for same seed", () => {
      const content = "{A|B|C} {1|2|3}";

      const result1 = parseSpintax(content, { seed: 42 });
      const result2 = parseSpintax(content, { seed: 42 });

      expect(result1.text).toBe(result2.text);
      expect(result1.variations).toBe(9);
    });

    it("generates different output for different seeds", () => {
      const content = "{A|B|C|D|E}";

      const results: string[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const result = parseSpintax(content, { seed });
        results.push(result.text);
      }

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it("store generatePreview creates deterministic output", () => {
      const { generatePreview } = useTemplateStore.getState();

      generatePreview("{A|B|C}", 12345);

      const state1 = useTemplateStore.getState();
      const preview1 = state1.preview?.content;

      generatePreview("{A|B|C}", 12345);

      const state2 = useTemplateStore.getState();
      const preview2 = state2.preview?.content;

      expect(preview1).toBe(preview2);
    });

    it("cycleVariation produces different results", () => {
      useTemplateStore.setState({
        templates: [
          {
            id: "test-id",
            name: "Test",
            sector: "test",
            platforms: ["facebook"],
            content: "{A|B|C|D|E}",
            variants: [],
            imagePaths: [],
            includeLink: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        selectedId: "test-id",
        preview: {
          content: "A",
          variation: 1,
          seed: 1000,
        },
      });

      const { cycleVariation } = useTemplateStore.getState();
      const initialContent = useTemplateStore.getState().preview?.content;

      cycleVariation();

      const newContent = useTemplateStore.getState().preview?.content;
      expect(useTemplateStore.getState().preview?.variation).toBe(2);
    });
  });

  describe("counts variations correctly", () => {
    it("counts single block variations", () => {
      expect(countVariations("{A|B|C}")).toBe(3);
    });

    it("counts multiple block variations (multiplication)", () => {
      expect(countVariations("{A|B} {1|2|3}")).toBe(6);
    });

    it("counts nested variations", () => {
      expect(countVariations("{{A|B}|{C|D}}")).toBe(4);
    });

    it("counts deeply nested variations", () => {
      expect(countVariations("{{{A|B}|{C|D}}|{E|F}}")).toBe(6);
    });

    it("returns 1 for no spintax", () => {
      expect(countVariations("Hello World")).toBe(1);
    });

    it("returns 1 for empty string", () => {
      expect(countVariations("")).toBe(1);
    });

    it("store countContentVariations integrates correctly", () => {
      const { countContentVariations } = useTemplateStore.getState();

      const count = countContentVariations("{A|B} {X|Y|Z}");

      expect(count).toBe(6);
    });
  });

  describe("validates invalid spintax", () => {
    it("detects unbalanced opening brace", () => {
      const result = validateSpintax("{A|B");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unbalanced");
      expect(result.position).toBeDefined();
    });

    it("detects unbalanced closing brace", () => {
      const result = validateSpintax("A|B}");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unbalanced");
    });

    it("detects empty options", () => {
      const result = validateSpintax("{A||B}");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty option");
    });

    it("detects empty options with leading pipe", () => {
      const result = validateSpintax("{|A|B}");

      expect(result.valid).toBe(false);
    });

    it("detects empty options with trailing pipe", () => {
      const result = validateSpintax("{A|B|}");

      expect(result.valid).toBe(false);
    });

    it("detects max depth exceeded", () => {
      const deepNesting = `${"{".repeat(15)}A${"}".repeat(15)}`;
      const result = validateSpintax(deepNesting);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("depth");
    });

    it("handles escaped braces correctly", () => {
      const result = validateSpintax("\\{not spintax\\}");

      expect(result.valid).toBe(true);
    });

    it("handles mixed escaped and real braces", () => {
      const result = validateSpintax("Text \\{escaped\\} and {real|options}");

      expect(result.valid).toBe(true);
    });

    it("store validateContent returns proper validation result", () => {
      const { validateContent } = useTemplateStore.getState();

      const validResult = validateContent("{A|B}");
      expect(validResult.valid).toBe(true);

      const invalidResult = validateContent("{A|");
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });

    it("generatePreview handles invalid spintax gracefully", () => {
      const { generatePreview } = useTemplateStore.getState();

      generatePreview("{invalid|}");

      const state = useTemplateStore.getState();
      expect(state.preview).toBeNull();
      expect(state.previewValidation?.valid).toBe(false);
    });
  });
});
