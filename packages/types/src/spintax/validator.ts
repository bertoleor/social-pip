/**
 * Spintax Validator
 * 
 * Validates spintax syntax without parsing.
 * Uses stack-based algorithm for brace matching.
 */

import type { SpintaxValidationResult, SpintaxConfig } from './types'

/**
 * Validates spintax syntax
 * 
 * @param input - Text to validate
 * @param config - Optional configuration (maxDepth)
 * @returns Validation result with error details if invalid
 * 
 * @example
 * ```ts
 * validateSpintax('{A|B}') // { valid: true }
 * validateSpintax('{A|')   // { valid: false, error: 'Unbalanced opening brace', position: 0 }
 * ```
 */
export function validateSpintax(
  input: string,
  config?: SpintaxConfig
): SpintaxValidationResult {
  const maxDepth = config?.maxDepth ?? 10
  const braceStack: number[] = [] // Stack of opening brace positions
  let currentDepth = 0
  let i = 0

  while (i < input.length) {
    const char = input[i]

    // Handle escaped characters (including escaped backslash)
    if (char === '\\' && i + 1 < input.length) {
      // Check if the next character is also a backslash (escaped backslash)
      // If so, we need to check if there's a third backslash (odd number of backslashes = escaped)
      // Simple approach: if current char is backslash, skip the next character entirely
      i += 2
      continue
    }

    if (char === '{') {
      currentDepth++
      braceStack.push(i)

      if (currentDepth > maxDepth) {
        return {
          valid: false,
          error: `Max nesting depth exceeded (${maxDepth})`,
          position: i,
        }
      }
    } else if (char === '}') {
      if (braceStack.length === 0) {
        return {
          valid: false,
          error: 'Unbalanced closing brace',
          position: i,
        }
      }

      const openPos = braceStack.pop()!
      currentDepth--

      // Check for empty options
      const content = input.slice(openPos + 1, i)
      const hasEmptyOption = checkEmptyOptions(content)
      if (hasEmptyOption) {
        return {
          valid: false,
          error: 'empty option detected',
          position: openPos,
        }
      }
    }

    i++
  }

  // Check for unbalanced opening braces
  if (braceStack.length > 0) {
    const firstUnbalanced = braceStack[0]!
    return {
      valid: false,
      error: 'Unbalanced opening brace',
      position: firstUnbalanced,
    }
  }

  return { valid: true }
}

/**
 * Check if content between braces has empty options
 */
function checkEmptyOptions(content: string): boolean {
  // Handle nested braces by finding innermost first
  // For now, simple check: split by | and check for empty strings

  // If there are nested braces, we need to handle them
  if (content.includes('{') || content.includes('}')) {
    // Complex case with nesting - check recursively
    // Split by | but only at the current level
    const parts = splitAtCurrentLevel(content)
    return parts.some(part => part === '' || (part.includes('{') && checkEmptyOptionsRecursive(part)))
  }

  // Simple case: no nesting
  const parts = content.split('|')
  return parts.some(part => part === '')
}

/**
 * Split content by | at the current nesting level
 */
function splitAtCurrentLevel(content: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

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
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }

  parts.push(current)
  return parts
}

/**
 * Recursively check for empty options in nested content
 */
function checkEmptyOptionsRecursive(content: string): boolean {
  // This is called for nested braces content
  // We need to check if any inner block has empty options
  const validation = validateSpintax(content)
  return !validation.valid && (validation.error?.includes('Empty') ?? false)
}
