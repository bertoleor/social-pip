/**
 * Spintax Engine - Public API
 * 
 * Spintax is a text format for generating variations:
 * {option1|option2|option3} randomly selects one option
 * 
 * @example
 * ```ts
 * import { parseSpintax, countVariations } from '@social-pip/types/spintax'
 * 
 * // Generate a variation
 * const result = parseSpintax('{Hello|Hi} {World|Universe}')
 * console.log(result.text) // "Hello World" or "Hi Universe" etc.
 * 
 * // Count total variations
 * console.log(countVariations('{A|B|C}')) // 3
 * console.log(countVariations('{A|B} {1|2}')) // 4
 * ```
 */

// Types
export type {
  SpintaxConfig,
  SpintaxParseResult,
  SpintaxValidationResult,
} from './types'
export { SpintaxError } from './types'

// Functions
export { parseSpintax } from './parser'
export { validateSpintax } from './validator'
export { countVariations } from './counter'
export { createSeededRng } from './rng'
