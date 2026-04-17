declare module "jest-axe" {
  import type { Result } from "axe-core";

  interface AxeResults {
    violations: Result[];
    incomplete: Result[];
    inapplicable: Result[];
    passes: Result[];
    timestamp: string;
    url: string;
  }

  interface ToHaveNoViolationsResult {
    pass: boolean;
    message: () => string;
  }

  function toHaveNoViolations(results: AxeResults): ToHaveNoViolationsResult;

  export function axe(
    element: Element | DocumentFragment | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;
  export { toHaveNoViolations };
}
