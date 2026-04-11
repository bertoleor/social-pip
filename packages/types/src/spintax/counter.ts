/**
 * Spintax Variation Counter
 * 
 * Counts total possible variations without generating them.
 * Algorithm: Multiplication of choice block sizes
 */

/**
 * Counts total variations for spintax input
 * 
 * @param input - Text with spintax syntax
 * @returns Number of unique variations possible
 * 
 * @example
 * ```ts
 * countVariations('{A|B|C}') // 3
 * countVariations('{A|B} {1|2}') // 4 (2 * 2)
 * countVariations('{{A|B}|{C|D}}') // 4 (2 + 2, but as options = 2 inner blocks, 2 choices each)
 * ```
 */
export function countVariations(input: string): number {
  // Base case: no spintax
  if (!input.includes('{')) {
    return 1
  }

  // Find all top-level choice blocks and count
  const blocks = findTopLevelBlocks(input)

  if (blocks.length === 0) {
    return 1
  }

  // Total variations = product of all block variations
  let total = 1

  for (const block of blocks) {
    const blockVariations = countBlockVariations(block)
    total *= blockVariations
  }

  return total
}

/**
 * Find all top-level spintax blocks (not nested within each other)
 */
function findTopLevelBlocks(input: string): string[] {
  const blocks: string[] = []
  let depth = 0
  let blockStart = -1

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (char === '\\' && i + 1 < input.length) {
      i++ // Skip escaped character
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        blockStart = i
      }
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && blockStart !== -1) {
        blocks.push(input.slice(blockStart, i + 1))
        blockStart = -1
      }
    }
  }

  return blocks
}

/**
 * Count variations for a single spintax block
 */
function countBlockVariations(block: string): number {
  // Remove outer braces
  const content = block.slice(1, -1)

  // Split by | at current nesting level
  const options = splitOptions(content)

  // Count variations: sum of each option's variations
  // If an option contains nested spintax, recursively count those
  let count = 0

  for (const option of options) {
    if (option.includes('{')) {
      // Nested spintax - count variations within
      count += countVariations(option)
    } else {
      // Simple option - counts as 1
      count += 1
    }
  }

  return count
}

/**
 * Split options by | at current nesting level
 */
function splitOptions(content: string): string[] {
  const options: string[] = []
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
      options.push(current)
      current = ''
    } else {
      current += char
    }
  }

  options.push(current)
  return options
}
