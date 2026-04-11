/**
 * Seeded Random Number Generator
 * 
 * Uses Mulberry32 algorithm for fast, good distribution.
 * Same implementation should be used in TypeScript and Rust for cross-platform consistency.
 */

/**
 * Creates a seeded pseudo-random number generator
 * 
 * @param seed - Initial seed value
 * @returns Function returning random values in [0, 1)
 * 
 * @example
 * ```ts
 * const rng = createSeededRng(42)
 * const value = rng() // Always same value for seed 42
 * ```
 */
export function createSeededRng(seed: number): () => number {
  // Mulberry32 algorithm
  // Fast, good distribution, 32-bit state
  let state = seed >>> 0 // Ensure unsigned 32-bit

  return function rng(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t ^ (t >>> 14))
    return ((t >>> 0) % 4294967296) / 4294967296
  }
}
