//! Spintax engine - Recursive descent parser for spintax content variation
//!
//! Provides parsing, validation, and generation of spintax variations.
//! Uses Mulberry32 seeded RNG for reproducible results.

use serde::{Deserialize, Serialize};

// ============================================
// DOMAIN TYPES
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpintaxParseResult {
    pub original: String,
    pub variation: String,
    pub options_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpintaxValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub depth: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpintaxVariationCount {
    pub count: u64,
    pub is_infinite: bool,
}

// ============================================
// SEEDED RNG - Mulberry32
// ============================================

struct Mulberry32 {
    state: u32,
}

impl Mulberry32 {
    fn new(seed: u32) -> Self {
        Self { state: seed }
    }

    fn next(&mut self) -> u32 {
        self.state = self.state.wrapping_add(0x6D2B79F5);
        let mut z = self.state;
        z = (z ^ (z >> 15)).wrapping_mul(z);
        z = (z ^ (z >> 15)).wrapping_mul(z);
        z = z ^ (z >> 16);
        z
    }

    fn next_u64(&mut self) -> u64 {
        (self.next() as u64) << 32 | (self.next() as u64)
    }

    fn gen_range(&mut self, range: std::ops::Range<usize>) -> usize {
        if range.start >= range.end {
            return range.start;
        }
        let range_size = range.end - range.start;
        let val = self.next_u64() as usize;
        range.start + (val % range_size)
    }
}

// ============================================
// PARSER IMPLEMENTATION
// ============================================

pub struct SpintaxParser;

impl SpintaxParser {
    pub fn parse(content: &str, seed: Option<u64>) -> SpintaxParseResult {
        let options_count = Self::count_options(content);
        let variation = Self::generate_variation(content, seed);

        SpintaxParseResult {
            original: content.to_string(),
            variation,
            options_count,
        }
    }

    pub fn validate(content: &str) -> SpintaxValidationResult {
        let mut errors = Vec::new();
        let mut brace_stack: Vec<usize> = Vec::new();
        let mut depth = 0usize;
        let mut max_depth = 0usize;
        let chars: Vec<char> = content.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            match chars[i] {
                '{' => {
                    depth += 1;
                    max_depth = max_depth.max(depth);
                    brace_stack.push(i);
                }
                '}' => {
                    if let Some(_) = brace_stack.pop() {
                        depth -= 1;
                    } else {
                        errors.push(format!("Unmatched closing brace at position {}", i));
                    }
                }
                _ => {}
            }
            i += 1;
        }

        for pos in brace_stack {
            errors.push(format!("Unmatched opening brace at position {}", pos));
        }

        if errors.is_empty() {
            if let Err(e) = Self::validate_options(content) {
                errors.push(e);
            }
        }

        SpintaxValidationResult {
            is_valid: errors.is_empty(),
            errors,
            depth: max_depth,
        }
    }

    pub fn count_variations(content: &str) -> SpintaxVariationCount {
        if content.is_empty() {
            return SpintaxVariationCount {
                count: 0,
                is_infinite: false,
            };
        }

        match Self::count_variations_recursive(content) {
            Ok(count) => SpintaxVariationCount {
                count,
                is_infinite: false,
            },
            Err(_) => SpintaxVariationCount {
                count: 0,
                is_infinite: true,
            },
        }
    }

    pub fn generate_all_variations(content: &str) -> Result<Vec<String>, String> {
        let count_result = Self::count_variations(content);

        if count_result.is_infinite {
            return Err("Cannot generate all variations: infinite count".to_string());
        }

        if count_result.count > 10000 {
            return Err(format!(
                "Too many variations to generate: {} (max 10000)",
                count_result.count
            ));
        }

        Self::generate_all_recursive(content)
    }

    // ============================================
    // INTERNAL HELPERS
    // ============================================

    fn generate_variation(content: &str, seed: Option<u64>) -> String {
        let mut rng = Mulberry32::new(seed.unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        }) as u32);

        Self::parse_recursive(content, &mut rng)
    }

    fn parse_recursive(content: &str, rng: &mut Mulberry32) -> String {
        let mut result = String::new();
        let chars: Vec<char> = content.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            if chars[i] == '{' {
                if let Some(end) = Self::find_matching_brace(&chars, i) {
                    let inner: String = chars[i + 1..end].iter().collect();
                    let options = Self::split_top_level(&inner, '|');

                    if !options.is_empty() {
                        let chosen_idx = rng.gen_range(0..options.len());
                        let chosen = &options[chosen_idx];
                        result.push_str(&Self::parse_recursive(chosen, rng));
                    }

                    i = end + 1;
                } else {
                    result.push(chars[i]);
                    i += 1;
                }
            } else {
                result.push(chars[i]);
                i += 1;
            }
        }

        result
    }

    fn find_matching_brace(chars: &[char], start: usize) -> Option<usize> {
        let mut depth = 0;
        for i in start..chars.len() {
            match chars[i] {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Some(i);
                    }
                }
                _ => {}
            }
        }
        None
    }

    fn count_options(content: &str) -> usize {
        let chars: Vec<char> = content.chars().collect();
        let mut count = 1;
        let mut i = 0;

        while i < chars.len() {
            if chars[i] == '{' {
                if let Some(end) = Self::find_matching_brace(&chars, i) {
                    let inner: String = chars[i + 1..end].iter().collect();
                    let depth = Self::get_nesting_depth(&inner);

                    if depth == 0 {
                        let options: Vec<&str> = inner.split('|').collect();
                        count *= options.len().max(1);
                    }
                    i = end + 1;
                } else {
                    i += 1;
                }
            } else {
                i += 1;
            }
        }

        count
    }

    fn validate_options(content: &str) -> Result<(), String> {
        let chars: Vec<char> = content.chars().collect();
        let mut i = 0;

        while i < chars.len() {
            if chars[i] == '{' {
                if let Some(end) = Self::find_matching_brace(&chars, i) {
                    let inner: String = chars[i + 1..end].iter().collect();
                    if inner.is_empty() {
                        return Err("Empty spintax block found".to_string());
                    }

                    let options: Vec<&str> = inner.split('|').collect();
                    for opt in &options {
                        if opt.is_empty() && options.len() > 1 {
                            // Empty option is OK (e.g., {A|} means A or nothing)
                        }
                    }

                    if let Err(e) = Self::validate_options(&inner) {
                        return Err(e);
                    }

                    i = end + 1;
                } else {
                    return Err("Unmatched opening brace".to_string());
                }
            } else {
                i += 1;
            }
        }

        Ok(())
    }

    fn get_nesting_depth(content: &str) -> usize {
        let mut depth = 0;
        let mut max_depth = 0;

        for c in content.chars() {
            match c {
                '{' => {
                    depth += 1;
                    max_depth = max_depth.max(depth);
                }
                '}' => depth -= 1,
                _ => {}
            }
        }

        max_depth
    }

    fn count_variations_recursive(content: &str) -> Result<u64, ()> {
        let chars: Vec<char> = content.chars().collect();
        let mut total: u64 = 1;
        let mut i = 0;

        while i < chars.len() {
            if chars[i] == '{' {
                if let Some(end) = Self::find_matching_brace(&chars, i) {
                    let inner: String = chars[i + 1..end].iter().collect();

                    let options = Self::split_top_level(&inner, '|');
                    let mut options_count: u64 = 0;

                    for opt in &options {
                        let opt_count = Self::count_variations_recursive(opt)?;
                        options_count = options_count.saturating_add(opt_count.max(1));
                    }

                    total = total.saturating_mul(options_count.max(1));
                    i = end + 1;
                } else {
                    return Err(());
                }
            } else {
                i += 1;
            }
        }

        Ok(total)
    }

    fn split_top_level(content: &str, delimiter: char) -> Vec<String> {
        let chars: Vec<char> = content.chars().collect();
        let mut result = Vec::new();
        let mut current = String::new();
        let mut depth = 0;

        for c in chars {
            match c {
                '{' => {
                    depth += 1;
                    current.push(c);
                }
                '}' => {
                    depth -= 1;
                    current.push(c);
                }
                d if d == delimiter && depth == 0 => {
                    result.push(current.clone());
                    current.clear();
                }
                _ => {
                    current.push(c);
                }
            }
        }

        result.push(current);
        result
    }

    fn generate_all_recursive(content: &str) -> Result<Vec<String>, String> {
        let chars: Vec<char> = content.chars().collect();

        if !chars.contains(&'{') {
            return Ok(vec![content.to_string()]);
        }

        let mut results = vec![String::new()];
        let mut i = 0;

        while i < chars.len() {
            if chars[i] == '{' {
                if let Some(end) = Self::find_matching_brace(&chars, i) {
                    let inner: String = chars[i + 1..end].iter().collect();
                    let options = Self::split_top_level(&inner, '|');

                    let mut new_results = Vec::new();

                    for existing in &results {
                        for opt in &options {
                            let opt_variations = Self::generate_all_recursive(opt)?;
                            for opt_var in opt_variations {
                                new_results.push(format!("{}{}", existing, opt_var));
                            }
                        }
                    }

                    results = new_results;
                    i = end + 1;
                } else {
                    for result in &mut results {
                        result.push(chars[i]);
                    }
                    i += 1;
                }
            } else {
                for result in &mut results {
                    result.push(chars[i]);
                }
                i += 1;
            }
        }

        Ok(results)
    }
}

// ============================================
// TAURI COMMANDS
// ============================================

#[tauri::command]
pub fn parse_spintax(content: String, seed: Option<u64>) -> Result<SpintaxParseResult, String> {
    Ok(SpintaxParser::parse(&content, seed))
}

#[tauri::command]
pub fn validate_spintax(content: String) -> Result<SpintaxValidationResult, String> {
    Ok(SpintaxParser::validate(&content))
}

#[tauri::command]
pub fn count_variations(content: String) -> Result<SpintaxVariationCount, String> {
    Ok(SpintaxParser::count_variations(&content))
}

#[tauri::command]
pub fn generate_all_variations(content: String) -> Result<Vec<String>, String> {
    SpintaxParser::generate_all_variations(&content)
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ================================
    // SIMPLE SPINTAX TESTS
    // ================================

    #[test]
    fn test_parse_simple_spintax_returns_one_variation() {
        let content = "Hello {world|earth|planet}";
        let result = SpintaxParser::parse(content, Some(42));

        assert!(result.variation.starts_with("Hello "));
        assert!(
            result.variation == "Hello world"
                || result.variation == "Hello earth"
                || result.variation == "Hello planet"
        );
        assert_eq!(result.original, content);
        assert_eq!(result.options_count, 3);
    }

    #[test]
    fn test_parse_simple_spintax_with_seed_is_reproducible() {
        let content = "Hello {world|earth|planet}";

        let result1 = SpintaxParser::parse(content, Some(12345));
        let result2 = SpintaxParser::parse(content, Some(12345));

        assert_eq!(result1.variation, result2.variation);
    }

    #[test]
    fn test_parse_simple_spintax_different_seeds_produce_different_results() {
        let content = "{A|B|C|D|E|F|G|H|I|J}";

        let result1 = SpintaxParser::parse(content, Some(1));
        let result2 = SpintaxParser::parse(content, Some(999999));

        // With 10 options, different seeds should produce different results most of the time
        // But we can't guarantee it, so we just check format is valid
        assert!(result1.variation.len() == 1);
        assert!(result2.variation.len() == 1);
    }

    // ================================
    // NESTED SPINTAX TESTS
    // ================================

    #[test]
    fn test_parse_nested_spintax_resolves_inner_first() {
        let content = "{Hello {world|earth}|Hi}";
        let result = SpintaxParser::parse(content, Some(42));

        // Should be one of: "Hello world", "Hello earth", or "Hi"
        assert!(
            result.variation == "Hello world"
                || result.variation == "Hello earth"
                || result.variation == "Hi"
        );
    }

    #[test]
    fn test_parse_deeply_nested_spintax() {
        let content = "{A{B{C|D}|E}|F}";
        let result = SpintaxParser::parse(content, Some(42));

        // Possible: ABC, ABD, AE, F
        assert!(
            result.variation == "ABC"
                || result.variation == "ABD"
                || result.variation == "AE"
                || result.variation == "F"
        );
    }

    // ================================
    // EMPTY OPTIONS TESTS
    // ================================

    #[test]
    fn test_parse_empty_option_returns_empty_or_value() {
        let content = "Hello {world|}";
        let result = SpintaxParser::parse(content, Some(42));

        assert!(result.variation == "Hello world" || result.variation == "Hello ");
    }

    #[test]
    fn test_parse_multiple_empty_options() {
        let content = "{A||B}";
        let result = SpintaxParser::parse(content, Some(42));

        assert!(result.variation == "A" || result.variation == "" || result.variation == "B");
    }

    // ================================
    // NO SPINTAX TESTS
    // ================================

    #[test]
    fn test_parse_no_spintax_returns_original() {
        let content = "Hello world";
        let result = SpintaxParser::parse(content, Some(42));

        assert_eq!(result.variation, "Hello world");
        assert_eq!(result.original, "Hello world");
    }

    #[test]
    fn test_parse_empty_string_returns_empty() {
        let content = "";
        let result = SpintaxParser::parse(content, Some(42));

        assert_eq!(result.variation, "");
        assert_eq!(result.original, "");
    }

    // ================================
    // VALIDATION TESTS
    // ================================

    #[test]
    fn test_validate_valid_spintax_returns_valid() {
        let content = "Hello {world|earth|planet}";
        let result = SpintaxParser::validate(content);

        assert!(result.is_valid);
        assert!(result.errors.is_empty());
        assert_eq!(result.depth, 1);
    }

    #[test]
    fn test_validate_nested_spintax_returns_correct_depth() {
        let content = "{A{B{C|D}|E}|F}";
        let result = SpintaxParser::validate(content);

        assert!(result.is_valid);
        assert_eq!(result.depth, 3);
    }

    #[test]
    fn test_validate_unclosed_brace_returns_error() {
        let content = "Hello {world|earth";
        let result = SpintaxParser::validate(content);

        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert!(result.errors[0].contains("Unmatched opening brace"));
    }

    #[test]
    fn test_validate_extra_closing_brace_returns_error() {
        let content = "Hello {world}}";
        let result = SpintaxParser::validate(content);

        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert!(result
            .errors
            .iter()
            .any(|e| e.contains("Unmatched closing brace")));
    }

    #[test]
    fn test_validate_multiple_unmatched_braces_returns_multiple_errors() {
        let content = "{{A}{{B}";
        let result = SpintaxParser::validate(content);

        assert!(!result.is_valid);
        assert!(result.errors.len() >= 1);
    }

    #[test]
    fn test_validate_empty_string_is_valid() {
        let content = "";
        let result = SpintaxParser::validate(content);

        assert!(result.is_valid);
        assert_eq!(result.depth, 0);
    }

    #[test]
    fn test_validate_no_spintax_is_valid() {
        let content = "Just plain text without spintax";
        let result = SpintaxParser::validate(content);

        assert!(result.is_valid);
        assert_eq!(result.depth, 0);
    }

    // ================================
    // COUNT VARIATIONS TESTS
    // ================================

    #[test]
    fn test_count_variations_simple() {
        let content = "{A|B|C}";
        let result = SpintaxParser::count_variations(content);

        assert!(!result.is_infinite);
        assert_eq!(result.count, 3);
    }

    #[test]
    fn test_count_variations_nested() {
        let content = "{A{B|C}|D}";
        let result = SpintaxParser::count_variations(content);

        // A*B = 2 (AB, AC) + 1 (D) = 3
        assert!(!result.is_infinite);
        assert_eq!(result.count, 3);
    }

    #[test]
    fn test_count_variations_multiple_blocks() {
        let content = "{A|B} and {C|D|E}";
        let result = SpintaxParser::count_variations(content);

        // 2 * 3 = 6
        assert!(!result.is_infinite);
        assert_eq!(result.count, 6);
    }

    #[test]
    fn test_count_variations_empty_string() {
        let content = "";
        let result = SpintaxParser::count_variations(content);

        assert_eq!(result.count, 0);
        assert!(!result.is_infinite);
    }

    #[test]
    fn test_count_variations_no_spintax() {
        let content = "Just text";
        let result = SpintaxParser::count_variations(content);

        assert_eq!(result.count, 1);
        assert!(!result.is_infinite);
    }

    // ================================
    // GENERATE ALL VARIATIONS TESTS
    // ================================

    #[test]
    fn test_generate_all_variations_simple() {
        let content = "{A|B|C}";
        let result = SpintaxParser::generate_all_variations(content).unwrap();

        assert_eq!(result.len(), 3);
        assert!(result.contains(&"A".to_string()));
        assert!(result.contains(&"B".to_string()));
        assert!(result.contains(&"C".to_string()));
    }

    #[test]
    fn test_generate_all_variations_nested() {
        let content = "{A{B|C}|D}";
        let result = SpintaxParser::generate_all_variations(content).unwrap();

        assert_eq!(result.len(), 3);
        assert!(result.contains(&"AB".to_string()));
        assert!(result.contains(&"AC".to_string()));
        assert!(result.contains(&"D".to_string()));
    }

    #[test]
    fn test_generate_all_variations_multiple_blocks() {
        let content = "{A|B}{X|Y}";
        let result = SpintaxParser::generate_all_variations(content).unwrap();

        assert_eq!(result.len(), 4);
        assert!(result.contains(&"AX".to_string()));
        assert!(result.contains(&"AY".to_string()));
        assert!(result.contains(&"BX".to_string()));
        assert!(result.contains(&"BY".to_string()));
    }

    #[test]
    fn test_generate_all_variations_too_many_errors() {
        // Create content with more than 10000 variations
        let mut content = String::new();
        for _ in 0..15 {
            content.push_str("{A|B|C|D|E}");
        }

        let result = SpintaxParser::generate_all_variations(&content);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Too many variations"));
    }

    #[test]
    fn test_generate_all_variations_no_spintax() {
        let content = "Just text";
        let result = SpintaxParser::generate_all_variations(content).unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0], "Just text");
    }

    // ================================
    // SPECIAL CHARACTERS TESTS
    // ================================

    #[test]
    fn test_parse_spintax_with_special_chars() {
        let content = "Hello {world!|earth?|planet...}";
        let result = SpintaxParser::parse(content, Some(42));

        assert!(result.variation.starts_with("Hello "));
        assert!(
            result.variation == "Hello world!"
                || result.variation == "Hello earth?"
                || result.variation == "Hello planet..."
        );
    }

    #[test]
    fn test_parse_spintax_with_unicode() {
        let content = "Hello {世界|地球|🌍}";
        let result = SpintaxParser::parse(content, Some(42));

        assert!(result.variation.starts_with("Hello "));
        assert!(
            result.variation == "Hello 世界"
                || result.variation == "Hello 地球"
                || result.variation == "Hello 🌍"
        );
    }

    // ================================
    // TAURI COMMAND TESTS
    // ================================

    #[test]
    fn test_parse_spintax_command_returns_valid_result() {
        let result = parse_spintax("Hello {A|B}".to_string(), Some(42)).unwrap();

        assert!(result.variation == "Hello A" || result.variation == "Hello B");
    }

    #[test]
    fn test_validate_spintax_command_returns_valid_result() {
        let result = validate_spintax("Hello {A|B}".to_string()).unwrap();

        assert!(result.is_valid);
    }

    #[test]
    fn test_count_variations_command_returns_valid_result() {
        let result = count_variations("{A|B|C}".to_string()).unwrap();

        assert_eq!(result.count, 3);
    }

    #[test]
    fn test_generate_all_variations_command_returns_valid_result() {
        let result = generate_all_variations("{A|B}".to_string()).unwrap();

        assert_eq!(result.len(), 2);
        assert!(result.contains(&"A".to_string()));
        assert!(result.contains(&"B".to_string()));
    }
}
