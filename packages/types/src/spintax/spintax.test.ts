/**
 * Spintax Engine Tests - TDD RED Phase
 * 
 * Tests for spintax parsing, validation, counting, and generation.
 * Spintax format: {option1|option2|option3}
 * Nested: {{inner1|inner2}|outer1|outer2}
 */

import { describe, it, expect } from 'vitest'
import {
  parseSpintax,
  validateSpintax,
  countVariations,
  createSeededRng,
  type SpintaxConfig,
  type SpintaxParseResult,
  type SpintaxValidationResult,
  SpintaxError,
} from './index'

// ============================================
// TASK 1.1: Type Definition Tests
// ============================================

describe('Spintax Types', () => {
  describe('SpintaxConfig', () => {
    it('accepts optional seed for reproducibility', () => {
      const config: SpintaxConfig = { seed: 12345 }
      expect(config.seed).toBe(12345)
    })

    it('accepts optional maxDepth limit', () => {
      const config: SpintaxConfig = { maxDepth: 5 }
      expect(config.maxDepth).toBe(5)
    })

    it('allows empty config for random generation', () => {
      const config: SpintaxConfig = {}
      expect(config.seed).toBeUndefined()
      expect(config.maxDepth).toBeUndefined()
    })
  })

  describe('SpintaxParseResult', () => {
    it('contains generated text', () => {
      const result: SpintaxParseResult = {
        text: 'Hello World',
        variations: 1,
        selectedOptions: [],
      }
      expect(result.text).toBe('Hello World')
    })

    it('tracks variation count', () => {
      const result: SpintaxParseResult = {
        text: 'Hello',
        variations: 2500,
        selectedOptions: ['Hello'],
      }
      expect(result.variations).toBe(2500)
    })

    it('tracks selected options for debugging', () => {
      const result: SpintaxParseResult = {
        text: 'A 1',
        variations: 6,
        selectedOptions: ['A', '1'],
      }
      expect(result.selectedOptions).toEqual(['A', '1'])
    })
  })

  describe('SpintaxValidationResult', () => {
    it('returns valid for correct syntax', () => {
      const result: SpintaxValidationResult = { valid: true }
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('returns error details for invalid syntax', () => {
      const result: SpintaxValidationResult = {
        valid: false,
        error: 'Unbalanced opening brace',
        position: 5,
      }
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Unbalanced opening brace')
      expect(result.position).toBe(5)
    })
  })

  describe('SpintaxError', () => {
    it('extends Error with position', () => {
      const error = new SpintaxError('Test error', 10)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.position).toBe(10)
    })

    it('has correct name', () => {
      const error = new SpintaxError('Test', 0)
      expect(error.name).toBe('SpintaxError')
    })
  })
})

// ============================================
// TASK 1.2: Seeded RNG Tests
// ============================================

describe('createSeededRng', () => {
  it('returns a function', () => {
    const rng = createSeededRng(12345)
    expect(typeof rng).toBe('function')
  })

  it('produces values in [0, 1) range', () => {
    const rng = createSeededRng(12345)
    for (let i = 0; i < 100; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(42)
    const rng2 = createSeededRng(42)

    const values1 = [rng1(), rng1(), rng1(), rng1(), rng1()]
    const values2 = [rng2(), rng2(), rng2(), rng2(), rng2()]

    expect(values1).toEqual(values2)
  })

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRng(42)
    const rng2 = createSeededRng(99)

    const values1 = [rng1(), rng1(), rng1()]
    const values2 = [rng2(), rng2(), rng2()]

    expect(values1).not.toEqual(values2)
  })

  it('distribution is roughly uniform', () => {
    const rng = createSeededRng(12345)
    const buckets = [0, 0, 0, 0, 0] // 5 buckets: [0-0.2, 0.2-0.4, ...]

    for (let i = 0; i < 1000; i++) {
      const value = rng()
      const bucket = Math.floor(value * 5)
      buckets[bucket] = (buckets[bucket] ?? 0) + 1
    }

    // Each bucket should have roughly 200 values (±50)
    for (const count of buckets) {
      expect(count).toBeGreaterThan(150)
      expect(count).toBeLessThan(250)
    }
  })

  it('performance: 10,000 calls under 1ms', () => {
    const rng = createSeededRng(1)
    const start = performance.now()

    for (let i = 0; i < 10000; i++) {
      rng()
    }

    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(1)
  })
})

// ============================================
// TASK 1.3: Validator Tests
// ============================================

describe('validateSpintax', () => {
  describe('balanced braces', () => {
    it('passes for simple spintax', () => {
      const result = validateSpintax('{A|B|C}')
      expect(result.valid).toBe(true)
    })

    it('passes for multiple blocks', () => {
      const result = validateSpintax('{A|B} and {1|2}')
      expect(result.valid).toBe(true)
    })

    it('passes for nested spintax', () => {
      const result = validateSpintax('{{A|B}|C}')
      expect(result.valid).toBe(true)
    })

    it('passes for text without spintax', () => {
      const result = validateSpintax('Hello World')
      expect(result.valid).toBe(true)
    })

    it('passes for empty string', () => {
      const result = validateSpintax('')
      expect(result.valid).toBe(true)
    })
  })

  describe('unbalanced braces', () => {
    it('detects unbalanced opening brace', () => {
      const result = validateSpintax('{A|B')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unbalanced')
      expect(result.position).toBe(0)
    })

    it('detects unbalanced closing brace', () => {
      const result = validateSpintax('A|B}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unbalanced')
      expect(result.position).toBeDefined()
    })

    it('detects multiple unbalanced braces', () => {
      const result = validateSpintax('{{A|B}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unbalanced')
    })
  })

  describe('empty options', () => {
    it('rejects empty options {||}', () => {
      const result = validateSpintax('{||}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('rejects options with empty variant {|A}', () => {
      const result = validateSpintax('{|A}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('rejects options with empty variant {A|}', () => {
      const result = validateSpintax('{A|}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })

    it('rejects nested empty options', () => {
      const result = validateSpintax('{A|{|}B}')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })
  })

  describe('edge cases', () => {
    it('handles escaped opening brace \\{ with escaped closing brace \\}', () => {
      const result = validateSpintax('\\{not spintax\\}')
      expect(result.valid).toBe(true)
    })

    it('handles escaped pipe inside spintax', () => {
      const result = validateSpintax('{A\\|B}') // Escaped pipe inside
      expect(result.valid).toBe(true)
    })

    it('handles text with only closing brace', () => {
      const result = validateSpintax('text}')
      expect(result.valid).toBe(false)
    })

    it('handles deeply nested spintax', () => {
      const result = validateSpintax('{{{{A|B}|C}|D}|E}')
      expect(result.valid).toBe(true)
    })
  })

  describe('max depth', () => {
    it('reports depth error when exceeded', () => {
      const result = validateSpintax('{{{{{{{{{{A}}}}}}}}}}', { maxDepth: 5 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('depth')
    })
  })

  describe('performance', () => {
    it('validates 1000 char input under 1ms', () => {
      const input = '{A|B|C}'.repeat(143) // ~1000 chars
      const start = performance.now()
      validateSpintax(input)
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(1)
    })
  })
})

// ============================================
// TASK 1.4: Counter Tests
// ============================================

describe('countVariations', () => {
  describe('basic counting', () => {
    it('counts simple spintax {A|B|C} = 3', () => {
      expect(countVariations('{A|B|C}')).toBe(3)
    })

    it('counts two options {A|B} = 2', () => {
      expect(countVariations('{A|B}')).toBe(2)
    })

    it('counts single option {only} = 1', () => {
      expect(countVariations('{only}')).toBe(1)
    })
  })

  describe('multiple blocks', () => {
    it('counts multiple blocks {A|B} {1|2} = 4', () => {
      expect(countVariations('{A|B} {1|2}')).toBe(4)
    })

    it('counts three blocks {A|B} {1|2} {X|Y|Z} = 12', () => {
      expect(countVariations('{A|B} {1|2} {X|Y|Z}')).toBe(12)
    })

    it('counts with surrounding text', () => {
      expect(countVariations('Hello {A|B} World')).toBe(2)
    })
  })

  describe('nested spintax', () => {
    it('counts nested {{A|B}|{C|D}} = 4', () => {
      expect(countVariations('{{A|B}|{C|D}}')).toBe(4)
    })

    it('counts deeply nested multiplication', () => {
      // {{A|B} {1|2}|C} = (2*2) + 1 = 5
      expect(countVariations('{{A|B} {1|2}|C}')).toBe(5)
    })

    it('counts nested with different depths', () => {
      // {A|{B|C}|{D|E|F}} = 1 + 2 + 3 = 6
      expect(countVariations('{A|{B|C}|{D|E|F}}')).toBe(6)
    })
  })

  describe('edge cases', () => {
    it('returns 1 for no spintax', () => {
      expect(countVariations('Hello World')).toBe(1)
    })

    it('returns 1 for empty string', () => {
      expect(countVariations('')).toBe(1)
    })

    it('handles large variation counts', () => {
      // {A|B|C|D|E} {A|B|C|D|E} {A|B|C|D|E} = 125
      expect(countVariations('{A|B|C|D|E} {A|B|C|D|E} {A|B|C|D|E}')).toBe(125)
    })
  })

  describe('performance', () => {
    it('counts 10,000 variations under 5ms', () => {
      // Generate template with many variations
      const input = '{1|2|3|4|5|6|7|8|9|10} {A|B|C|D|E} {X|Y|Z}'
      const start = performance.now()
      countVariations(input)
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(5)
    })
  })
})

// ============================================
// TASK 1.5: Parser Tests
// ============================================

describe('parseSpintax', () => {
  describe('simple spintax', () => {
    it('parses {Hello|Hi} World', () => {
      const result = parseSpintax('{Hello|Hi} World')
      expect(['Hello World', 'Hi World']).toContain(result.text)
    })

    it('returns one of the valid options', () => {
      const result = parseSpintax('{A|B|C}')
      expect(['A', 'B', 'C']).toContain(result.text)
    })
  })

  describe('multiple blocks', () => {
    it('parses {A|B} {1|2}', () => {
      const result = parseSpintax('{A|B} {1|2}')
      const validOptions = ['A 1', 'A 2', 'B 1', 'B 2']
      expect(validOptions).toContain(result.text)
      expect(result.variations).toBe(4)
    })

    it('tracks all selected options', () => {
      const result = parseSpintax('{A|B} {X|Y|Z}')
      expect(result.selectedOptions).toHaveLength(2)
    })
  })

  describe('nested spintax', () => {
    it('parses {{A|B}|C}', () => {
      const result = parseSpintax('{{A|B}|C}')
      expect(['A', 'B', 'C']).toContain(result.text)
    })

    it('parses deeply nested', () => {
      const result = parseSpintax('{{{A|B}|C}|D}')
      expect(['A', 'B', 'C', 'D']).toContain(result.text)
    })

    it('resolves innermost first', () => {
      // With seed, we can verify order
      const result = parseSpintax('{A|{1|2}}', { seed: 42 })
      expect(typeof result.text).toBe('string')
    })
  })

  describe('single option', () => {
    it('unwraps single option {only}', () => {
      const result = parseSpintax('{only}')
      expect(result.text).toBe('only')
      expect(result.variations).toBe(1)
    })
  })

  describe('text without spintax', () => {
    it('returns unchanged text', () => {
      const result = parseSpintax('Hello World')
      expect(result.text).toBe('Hello World')
      expect(result.variations).toBe(1)
      expect(result.selectedOptions).toEqual([])
    })

    it('handles empty string', () => {
      const result = parseSpintax('')
      expect(result.text).toBe('')
      expect(result.variations).toBe(1)
    })
  })

  describe('seeded reproducibility', () => {
    it('same seed produces same result', () => {
      const result1 = parseSpintax('{A|B|C|D|E}', { seed: 123 })
      const result2 = parseSpintax('{A|B|C|D|E}', { seed: 123 })
      expect(result1.text).toBe(result2.text)
      expect(result1.selectedOptions).toEqual(result2.selectedOptions)
    })

    it('different seeds produce different results (probabilistic)', () => {
      // Run multiple times with different seeds
      const results = new Set<string>()
      for (let seed = 0; seed < 10; seed++) {
        results.add(parseSpintax('{A|B|C|D|E}', { seed }).text)
      }
      // With 5 options and 10 different seeds, we should see at least 3 different results
      expect(results.size).toBeGreaterThan(2)
    })

    it('seed affects nested spintax deterministically', () => {
      const result1 = parseSpintax('{{A|B}|{C|D}}', { seed: 42 })
      const result2 = parseSpintax('{{A|B}|{C|D}}', { seed: 42 })
      expect(result1.text).toBe(result2.text)
    })
  })

  describe('escaped characters', () => {
    it('preserves escaped braces as literal text', () => {
      const result = parseSpintax('\\{not spintax\\}')
      expect(result.text).toBe('\\{not spintax\\}')
    })

    it('preserves escaped pipes', () => {
      const result = parseSpintax('{A\\|B|C}')
      expect(['A\\|B', 'C']).toContain(result.text)
    })
  })

  describe('whitespace handling', () => {
    it('preserves whitespace in options', () => {
      const result = parseSpintax('{Hello World|Hi}')
      expect(['Hello World', 'Hi']).toContain(result.text)
    })

    it('handles options with leading/trailing spaces', () => {
      const result = parseSpintax('{ A | B }')
      expect([' A ', ' B ']).toContain(result.text)
    })
  })

  describe('max depth limit', () => {
    it('throws on max depth exceeded', () => {
      const deeplyNested = '{{{{{A}}}}}'
      expect(() => parseSpintax(deeplyNested, { maxDepth: 2 })).toThrow(SpintaxError)
    })

    it('includes position in error', () => {
      const deeplyNested = '{{{{{A}}}}}'
      try {
        parseSpintax(deeplyNested, { maxDepth: 2 })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SpintaxError)
        expect((error as SpintaxError).position).toBeDefined()
      }
    })
  })

  describe('invalid input', () => {
    it('throws SpintaxError for unbalanced braces', () => {
      expect(() => parseSpintax('{A|B')).toThrow(SpintaxError)
    })

    it('throws SpintaxError for empty options', () => {
      expect(() => parseSpintax('{||}')).toThrow(SpintaxError)
    })

    it('error includes position', () => {
      try {
        parseSpintax('text {|A}')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SpintaxError)
        expect((error as SpintaxError).position).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('performance', () => {
    it('parses typical content (1000 chars) under 10ms', () => {
      const input = '{Hello|Hi|Hey} {World|Universe|Earth}! '.repeat(50)
      const start = performance.now()
      parseSpintax(input)
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(10)
    })

    it('tracks selected options for debugging', () => {
      const result = parseSpintax('{A|B} {1|2} {X|Y|Z}')
      expect(result.selectedOptions).toHaveLength(3)
      // Each selected option should be a valid choice from its block
      expect(['A', 'B']).toContain(result.selectedOptions[0])
      expect(['1', '2']).toContain(result.selectedOptions[1])
      expect(['X', 'Y', 'Z']).toContain(result.selectedOptions[2])
    })
  })
})

// ============================================
// TASK 1.6: Barrel Export Tests
// ============================================

describe('Spintax Barrel Export', () => {
  it('exports parseSpintax', () => {
    expect(typeof parseSpintax).toBe('function')
  })

  it('exports validateSpintax', () => {
    expect(typeof validateSpintax).toBe('function')
  })

  it('exports countVariations', () => {
    expect(typeof countVariations).toBe('function')
  })

  it('exports createSeededRng', () => {
    expect(typeof createSeededRng).toBe('function')
  })

  it('exports SpintaxError', () => {
    expect(SpintaxError).toBeDefined()
    expect(new SpintaxError('test', 0)).toBeInstanceOf(Error)
  })

  it('exports SpintaxConfig type', () => {
    const config: SpintaxConfig = { seed: 1 }
    expect(config).toBeDefined()
  })

  it('exports SpintaxParseResult type', () => {
    const result: SpintaxParseResult = { text: 'test', variations: 1, selectedOptions: [] }
    expect(result).toBeDefined()
  })

  it('exports SpintaxValidationResult type', () => {
    const result: SpintaxValidationResult = { valid: true }
    expect(result).toBeDefined()
  })
})
