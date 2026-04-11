/**
 * Spintax Parser
 * 
 * Core recursive descent parser for spintax syntax.
 * Algorithm: Innermost-first resolution
 */

import type { SpintaxConfig, SpintaxParseResult } from './types'
import { SpintaxError } from './types'
import { validateSpintax } from './validator'
import { countVariations } from './counter'
import { createSeededRng } from './rng'

/**
* Parses spintax and generates a single variation
*
* ALGORITHM: Recursive descent with innermost-first resolution
* 1. Validate syntax
* 2. Initialize RNG (seeded if config.seed provided)
* 3. Find innermost braces (deepest nesting)
* 4. Extract options, select one with RNG
* 5. Replace braces with selected option
* 6. Repeat until no braces remain
*
* @param input - Text with spintax syntax
* @param config - Optional configuration (seed, maxDepth)
* @returns Parse result with generated text and metadata
* @throws SpintaxError if syntax is invalid
*
* @example
* ```ts
* parseSpintax('{Hello|Hi} World')
* // { text: 'Hello World' | 'Hi World', variations: 2, selectedOptions: ['Hello'|'Hi'] }
*
* parseSpintax('{A|B|C}', { seed: 42 })
* // Always same result for seed 42
* ```
*/
export function parseSpintax(
  input: string,
  config?: SpintaxConfig
): SpintaxParseResult {
  // Step 1: Validate syntax
  const validation = validateSpintax(input, config)
  if (!validation.valid) {
    throw new SpintaxError(
      validation.error ?? 'Invalid spintax syntax',
      validation.position ?? 0
    )
  }

  // Step 2: Initialize RNG
  const rng = config?.seed !== undefined
  ? createSeededRng(config.seed)
  : Math.random

  const maxDepth = config?.maxDepth ?? 10
  const selectedOptions: string[] = []
  const totalVariations = countVariations(input)

  // Step 3: Process input iteratively
  let workingInput = input

  while (hasUnescapedBrace(workingInput)) {
    // Find innermost braces (deepest first)
    const { start, end, depth } = findInnermostBraces(workingInput)

    // Check if we found valid braces
    if (start === -1 || end === -1) {
      break
    }

    // Check depth limit
    if (depth > maxDepth) {
      throw new SpintaxError(
        `Max nesting depth exceeded (${maxDepth})`,
        start
      )
    }

    // Step 4: Extract and process
    const content = workingInput.slice(start + 1, end)
    const options = splitOptionsAtCurrentLevel(content)

    // Select random option
    const selectedIndex = Math.floor(rng() * options.length)
    const selectedOption = options[selectedIndex]!
    selectedOptions.push(selectedOption)

    // Step 5: Replace in working input
    workingInput =
      workingInput.slice(0, start) +
      selectedOption +
      workingInput.slice(end + 1)
  }

  // Step 6: Return result
  return {
    text: workingInput,
    variations: totalVariations,
    selectedOptions,
  }
}

/**
* Check if string has an unescaped brace
*/
function hasUnescapedBrace(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '\\' && i + 1 < input.length) {
      i++ // Skip escaped character
      continue
    }
    if (input[i] === '{') {
      return true
    }
  }
  return false
}

/**
* Find innermost braces (deepest nesting level)
* Skips escaped braces
*/
function findInnermostBraces(
  input: string
): { start: number; end: number; depth: number } {
  let maxDepth = 0
  let deepestStart = -1
  let deepestEnd = -1
  let currentDepth = 0

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    // Skip escaped characters (including escaped backslash)
    if (char === '\\' && i + 1 < input.length) {
      i++
      continue
    }

    if (char === '{') {
      currentDepth++
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth
        deepestStart = i
        deepestEnd = -1 // Reset end, need to find it
      }
    } else if (char === '}') {
      if (currentDepth === maxDepth && deepestEnd === -1) {
        deepestEnd = i
      }
      currentDepth--
    }
  }

  // This should not happen if validation passed
  if (deepestStart === -1 || deepestEnd === -1) {
    return { start: -1, end: -1, depth: 0 }
  }

  return { start: deepestStart, end: deepestEnd, depth: maxDepth }
}

/**
 * Split content by | at current nesting level
 */
function splitOptionsAtCurrentLevel(content: string): string[] {
  const options: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    // Handle escaped characters
    if (char === '\\' && i + 1 < content.length) {
      current += char + content[i + 1]
      i++
      continue
    }

    if (char === '{') {
      depth++
      current += char
    } else if (char === '}') {
      depth--
      current += char
    } else if (char === '|' && depth === 0) {
      options.push(current)
      current = ''
    } else {
      current += char
    }
  }

  options.push(current)
  return options
}
