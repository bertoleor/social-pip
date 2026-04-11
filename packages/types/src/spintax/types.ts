/**
 * Spintax Types - Type definitions for spintax engine
 * 
 * Spintax format: {option1|option2|option3}
 * Example: "{Hello|Hi} World" → "Hello World" or "Hi World"
 */

/**
 * Configuration for spintax parsing
 */
export interface SpintaxConfig {
  /** Seed for deterministic generation (optional) */
  seed?: number
  /** Maximum nesting depth allowed (default: 10) */
  maxDepth?: number
}

/**
 * Result of parsing spintax
 */
export interface SpintaxParseResult {
  /** Generated text after spintax resolution */
  text: string
  /** Total number of possible variations */
  variations: number
  /** Selected options for each choice block (for debugging) */
  selectedOptions: string[]
}

/**
 * Result of validating spintax syntax
 */
export interface SpintaxValidationResult {
  /** Whether the syntax is valid */
  valid: boolean
  /** Error message if invalid */
  error?: string
  /** Position of error in input string */
  position?: number
}

/**
 * Custom error class for spintax errors
 */
export class SpintaxError extends Error {
  /** Position in the input where the error occurred */
  public readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.name = 'SpintaxError'
    this.position = position
  }
}
