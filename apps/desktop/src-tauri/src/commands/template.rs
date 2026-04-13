//! Template commands module - Spintax preview, validation, and CRUD operations
//!
//! Provides Tauri commands for template operations with spintax support.

use chrono::Utc;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

use crate::spintax::{SpintaxParser, SpintaxValidationResult};

// ============================================
// DOMAIN TYPES
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpintaxPreview {
    pub original: String,
    pub variation: String,
    pub options_count: usize,
    pub is_valid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateValidationResult {
    pub is_valid: bool,
    pub spintax_validation: SpintaxValidationResult,
    pub content_length: usize,
    pub has_content: bool,
    pub preview_variations: Vec<String>,
}

/// Template entity matching Prisma schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub sector: String,
    pub platforms: String,
    pub content: String,
    pub variants: String,
    pub image_paths: String,
    pub include_link: bool,
    pub link_url: Option<String>,
    pub ai_enhanced: bool,
    pub prompt_template: Option<String>,
    pub variations_count: Option<i32>,
    pub category: Option<String>,
    pub tags: String,
    pub last_used_at: Option<String>,
    pub use_count: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// Input for creating a new template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTemplateInput {
    pub name: String,
    pub content: String,
    pub platform: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sector: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// Input for updating an existing template
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdateTemplateInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

/// Filter for listing templates
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TemplateFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
}

// ============================================
// IN-MEMORY STORAGE
// ============================================

static TEMPLATES: Lazy<Mutex<HashMap<String, Template>>> = Lazy::new(|| Mutex::new(HashMap::new()));

// ============================================
// HELPER FUNCTIONS
// ============================================

fn generate_template_id() -> String {
    format!("tmpl_{}", Uuid::new_v4())
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

// ============================================
// TAURI COMMANDS
// ============================================

#[tauri::command]
pub fn generate_spintax_preview(
    content: String,
    seed: Option<u64>,
) -> Result<SpintaxPreview, String> {
    let validation = SpintaxParser::validate(&content);
    let parse_result = SpintaxParser::parse(&content, seed);

    Ok(SpintaxPreview {
        original: parse_result.original,
        variation: parse_result.variation,
        options_count: parse_result.options_count,
        is_valid: validation.is_valid,
    })
}

#[tauri::command]
pub fn validate_template_content(content: String) -> Result<TemplateValidationResult, String> {
    let spintax_validation = SpintaxParser::validate(&content);
    let content_length = content.len();
    let has_content = !content.trim().is_empty();

    let preview_variations: Vec<String> = if spintax_validation.is_valid && content_length < 1000 {
        match SpintaxParser::generate_all_variations(&content) {
            Ok(vars) if vars.len() <= 5 => vars,
            Ok(vars) => vars.into_iter().take(5).collect(),
            Err(_) => vec![content.clone()],
        }
    } else {
        vec![]
    };

    Ok(TemplateValidationResult {
        is_valid: spintax_validation.is_valid && has_content,
        spintax_validation,
        content_length,
        has_content,
        preview_variations,
    })
}

// ============================================
// TEMPLATE CRUD COMMANDS
// ============================================

#[tauri::command]
pub async fn create_template(input: CreateTemplateInput) -> Result<Template, String> {
    if input.name.trim().is_empty() {
        return Err("Template name is required".to_string());
    }

    if input.content.trim().is_empty() {
        return Err("Template content is required".to_string());
    }

    if input.platform.trim().is_empty() {
        return Err("Platform is required".to_string());
    }

    let now = now_iso();
    let id = generate_template_id();

    let variations_count = SpintaxParser::count_variations(&input.content)
        .count
        .try_into()
        .ok();

    let tags = input.tags
        .map(|t| serde_json::to_string(&t).unwrap_or_else(|_| "[]".to_string()))
        .unwrap_or_else(|| "[]".to_string());

    let template = Template {
        id: id.clone(),
        name: input.name.trim().to_string(),
        sector: input.sector.unwrap_or_else(|| "general".to_string()),
        platforms: input.platform.clone(),
        content: input.content.trim().to_string(),
        variants: "[]".to_string(),
        image_paths: "[]".to_string(),
        include_link: false,
        link_url: None,
        ai_enhanced: false,
        prompt_template: None,
        variations_count,
        category: input.category,
        tags,
        last_used_at: None,
        use_count: 0,
        created_at: now.clone(),
        updated_at: now,
    };

    let mut templates = TEMPLATES.lock().map_err(|e| e.to_string())?;
    templates.insert(id, template.clone());

    Ok(template)
}

#[tauri::command]
pub async fn get_template(id: String) -> Result<Option<Template>, String> {
    let templates = TEMPLATES.lock().map_err(|e| e.to_string())?;
    Ok(templates.get(&id).cloned())
}

#[tauri::command]
pub async fn update_template(id: String, name: String, content: String) -> Result<Template, String> {
    let mut templates = TEMPLATES.lock().map_err(|e| e.to_string())?;

    let template = templates.get_mut(&id)
        .ok_or_else(|| format!("Template not found: {}", id))?;

    if !name.trim().is_empty() {
        template.name = name.trim().to_string();
    }

    if !content.trim().is_empty() {
        template.content = content.trim().to_string();
        template.variations_count = SpintaxParser::count_variations(&template.content)
            .count
            .try_into()
            .ok();
    }

    template.updated_at = now_iso();

    Ok(template.clone())
}

#[tauri::command]
pub async fn delete_template(id: String) -> Result<(), String> {
    let mut templates = TEMPLATES.lock().map_err(|e| e.to_string())?;
    templates.remove(&id);
    Ok(())
}

#[tauri::command]
pub async fn list_templates(platform: Option<String>) -> Result<Vec<Template>, String> {
    let templates = TEMPLATES.lock().map_err(|e| e.to_string())?;

    let mut result: Vec<Template> = templates
        .values()
        .filter(|t| {
            if let Some(ref p) = platform {
                t.platforms.to_lowercase().contains(&p.to_lowercase())
            } else {
                true
            }
        })
        .cloned()
        .collect();

    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(result)
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    // ================================
    // GENERATE SPINTAX PREVIEW TESTS
    // ================================

    #[test]
    fn test_generate_spintax_preview_returns_valid_result() {
        let content = "Hello {world|earth|planet}";
        let result = generate_spintax_preview(content.to_string(), Some(42)).unwrap();

        assert_eq!(result.original, content);
        assert!(result.variation.starts_with("Hello "));
        assert_eq!(result.options_count, 3);
        assert!(result.is_valid);
    }

    #[test]
    fn test_generate_spintax_preview_invalid_content() {
        let content = "Hello {world|earth";
        let result = generate_spintax_preview(content.to_string(), Some(42)).unwrap();

        assert_eq!(result.original, content);
        assert!(!result.is_valid);
    }

    #[test]
    fn test_generate_spintax_preview_no_spintax() {
        let content = "Hello world";
        let result = generate_spintax_preview(content.to_string(), Some(42)).unwrap();

        assert_eq!(result.variation, "Hello world");
        assert_eq!(result.options_count, 1);
        assert!(result.is_valid);
    }

    #[test]
    fn test_generate_spintax_preview_empty_content() {
        let content = "";
        let result = generate_spintax_preview(content.to_string(), Some(42)).unwrap();

        assert_eq!(result.variation, "");
        assert!(result.is_valid);
    }

    #[test]
    fn test_generate_spintax_preview_nested() {
        let content = "{Hello {world|earth}|Hi}";
        let result = generate_spintax_preview(content.to_string(), Some(42)).unwrap();

        assert!(result.is_valid);
        assert!(
            result.variation == "Hello world"
                || result.variation == "Hello earth"
                || result.variation == "Hi"
        );
    }

    #[test]
    fn test_generate_spintax_preview_reproducible_with_seed() {
        let content = "{A|B|C|D|E}";

        let result1 = generate_spintax_preview(content.to_string(), Some(12345)).unwrap();
        let result2 = generate_spintax_preview(content.to_string(), Some(12345)).unwrap();

        assert_eq!(result1.variation, result2.variation);
    }

    // ================================
    // VALIDATE TEMPLATE CONTENT TESTS
    // ================================

    #[test]
    fn test_validate_template_content_valid_spintax() {
        let content = "Hello {world|earth|planet}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert!(result.has_content);
        assert!(result.spintax_validation.is_valid);
    }

    #[test]
    fn test_validate_template_content_invalid_spintax() {
        let content = "Hello {world|earth";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(!result.is_valid);
        assert!(result.has_content);
        assert!(!result.spintax_validation.is_valid);
    }

    #[test]
    fn test_validate_template_content_empty() {
        let content = "";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(!result.is_valid);
        assert!(!result.has_content);
        assert_eq!(result.content_length, 0);
    }

    #[test]
    fn test_validate_template_content_whitespace_only() {
        let content = "   ";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(!result.is_valid);
        assert!(!result.has_content);
    }

    #[test]
    fn test_validate_template_content_plain_text() {
        let content = "Just plain text without spintax";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert!(result.has_content);
        assert!(result.spintax_validation.is_valid);
    }

    #[test]
    fn test_validate_template_content_includes_preview_variations() {
        let content = "{A|B|C}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert_eq!(result.preview_variations.len(), 3);
        assert!(result.preview_variations.contains(&"A".to_string()));
        assert!(result.preview_variations.contains(&"B".to_string()));
        assert!(result.preview_variations.contains(&"C".to_string()));
    }

    #[test]
    fn test_validate_template_content_limits_preview_variations() {
        // Content with more than 5 variations
        let content = "{A|B|C|D|E|F|G|H}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert_eq!(result.preview_variations.len(), 5);
    }

    #[test]
    fn test_validate_template_content_reports_content_length() {
        let content = "Hello {A|B}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert_eq!(result.content_length, content.len());
    }

    #[test]
    fn test_validate_template_content_nested_spintax() {
        let content = "{A{B|C}|D}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert_eq!(result.spintax_validation.depth, 2);
    }

    #[test]
    fn test_validate_template_content_complex_nested() {
        let content = "Greeting: {Hello {world|earth}|Hi}! How are you?";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert!(result.spintax_validation.is_valid);
    }

    #[test]
    fn test_validate_template_content_special_chars() {
        let content = "Hello {world!|earth?|planet...}";
        let result = validate_template_content(content.to_string()).unwrap();

        assert!(result.is_valid);
        assert_eq!(result.preview_variations.len(), 3);
    }

    // ================================
    // CREATE TEMPLATE TESTS
    // ================================

    fn reset_templates() {
        let mut templates = TEMPLATES.lock().unwrap();
        templates.clear();
    }

    #[test]
    fn test_create_template_persists_and_returns_with_generated_id() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_template(CreateTemplateInput {
            name: "Test Template".to_string(),
            content: "Hello {world|earth}".to_string(),
            platform: "facebook".to_string(),
            sector: Some("marketing".to_string()),
            category: None,
            tags: Some(vec!["promo".to_string()]),
        }));

        assert!(result.is_ok());
        let template = result.unwrap();

        assert!(template.id.starts_with("tmpl_"));
        assert_eq!(template.name, "Test Template");
        assert_eq!(template.content, "Hello {world|earth}");
        assert_eq!(template.platforms, "facebook");
        assert_eq!(template.sector, "marketing");
        assert!(template.variations_count.is_some());
        assert_eq!(template.variations_count.unwrap(), 2);
        
        let _ = rt.block_on(delete_template(template.id));
    }

    #[test]
    fn test_create_template_validates_name_required() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_template(CreateTemplateInput {
            name: "".to_string(),
            content: "Some content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("name is required"));
    }

    #[test]
    fn test_create_template_validates_content_required() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_template(CreateTemplateInput {
            name: "Test".to_string(),
            content: "".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("content is required"));
    }

    #[test]
    fn test_create_template_validates_platform_required() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(create_template(CreateTemplateInput {
            name: "Test".to_string(),
            content: "Some content".to_string(),
            platform: "".to_string(),
            ..Default::default()
        }));

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("Platform is required"));
    }

    #[test]
    fn test_create_template_defaults_sector_to_general() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let template = rt.block_on(create_template(CreateTemplateInput {
            name: "Test".to_string(),
            content: "Content".to_string(),
            platform: "instagram".to_string(),
            ..Default::default()
        })).unwrap();

        assert_eq!(template.sector, "general");
        let _ = rt.block_on(delete_template(template.id));
    }

    // ================================
    // GET TEMPLATE TESTS
    // ================================

    #[test]
    fn test_get_template_returns_existing_template() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let created = rt.block_on(create_template(CreateTemplateInput {
            name: "Find Me".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(get_template(created.id.clone()));
        assert!(result.is_ok());

        let found = result.unwrap();
        assert!(found.is_some());
        assert_eq!(found.unwrap().id, created.id);
        
        let _ = rt.block_on(delete_template(created.id));
    }

    #[test]
    fn test_get_template_returns_none_for_nonexistent() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(get_template("nonexistent_id".to_string()));

        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    // ================================
    // UPDATE TEMPLATE TESTS
    // ================================

    #[test]
    fn test_update_template_modifies_name_and_content() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let created = rt.block_on(create_template(CreateTemplateInput {
            name: "Original".to_string(),
            content: "Original content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let updated = rt.block_on(update_template(
            created.id.clone(),
            "Updated Name".to_string(),
            "Updated {A|B} content".to_string(),
        )).unwrap();

        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.content, "Updated {A|B} content");
        assert_eq!(updated.variations_count.unwrap(), 2);
        
        let _ = rt.block_on(delete_template(created.id));
    }

    #[test]
    fn test_update_template_returns_error_for_nonexistent() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(update_template(
            "nonexistent".to_string(),
            "Name".to_string(),
            "Content".to_string(),
        ));

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("not found"));
    }

    #[test]
    fn test_update_template_keeps_original_if_name_empty() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let created = rt.block_on(create_template(CreateTemplateInput {
            name: "Keep This".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let updated = rt.block_on(update_template(
            created.id.clone(),
            "".to_string(),
            "New content".to_string(),
        )).unwrap();

        assert_eq!(updated.name, "Keep This");
        assert_eq!(updated.content, "New content");
        
        let _ = rt.block_on(delete_template(created.id));
    }

    // ================================
    // DELETE TEMPLATE TESTS
    // ================================

    #[test]
    fn test_delete_template_removes_from_storage() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let created = rt.block_on(create_template(CreateTemplateInput {
            name: "To Delete".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(delete_template(created.id.clone()));
        assert!(result.is_ok());

        let found = rt.block_on(get_template(created.id)).unwrap();
        assert!(found.is_none());
    }

    #[test]
    fn test_delete_template_is_idempotent() {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let result1 = rt.block_on(delete_template("nonexistent".to_string()));
        assert!(result1.is_ok());

        let result2 = rt.block_on(delete_template("nonexistent".to_string()));
        assert!(result2.is_ok());
    }

    // ================================
    // LIST TEMPLATES TESTS
    // ================================

    #[test]
    fn test_list_templates_returns_all_when_no_filter() {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let t1 = rt.block_on(create_template(CreateTemplateInput {
            name: "Template 1".to_string(),
            content: "Content 1".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let t2 = rt.block_on(create_template(CreateTemplateInput {
            name: "Template 2".to_string(),
            content: "Content 2".to_string(),
            platform: "instagram".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(list_templates(None));
        assert!(result.is_ok());
        let templates = result.unwrap();
        assert!(templates.iter().any(|t| t.id == t1.id));
        assert!(templates.iter().any(|t| t.id == t2.id));
        
        let _ = rt.block_on(delete_template(t1.id));
        let _ = rt.block_on(delete_template(t2.id));
    }

    #[test]
    fn test_list_templates_filters_by_platform() {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let fb = rt.block_on(create_template(CreateTemplateInput {
            name: "FB Template".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let ig = rt.block_on(create_template(CreateTemplateInput {
            name: "IG Template".to_string(),
            content: "Content".to_string(),
            platform: "instagram".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(list_templates(Some("facebook".to_string())));
        assert!(result.is_ok());
        let templates = result.unwrap();
        assert!(templates.iter().all(|t| t.platforms.to_lowercase().contains("facebook")));
        
        let _ = rt.block_on(delete_template(fb.id));
        let _ = rt.block_on(delete_template(ig.id));
    }

    #[test]
    fn test_list_templates_returns_empty_when_none_match() {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let fb = rt.block_on(create_template(CreateTemplateInput {
            name: "FB Template".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(list_templates(Some("tiktok".to_string())));
        assert!(result.is_ok());
        let templates = result.unwrap();
        assert!(templates.iter().all(|t| !t.platforms.to_lowercase().contains("tiktok")));
        
        let _ = rt.block_on(delete_template(fb.id));
    }

    #[test]
    fn test_list_templates_sorted_by_created_at_desc() {
        let rt = tokio::runtime::Runtime::new().unwrap();

        let first = rt.block_on(create_template(CreateTemplateInput {
            name: "First".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        std::thread::sleep(std::time::Duration::from_millis(100));

        let second = rt.block_on(create_template(CreateTemplateInput {
            name: "Second".to_string(),
            content: "Content".to_string(),
            platform: "facebook".to_string(),
            ..Default::default()
        })).unwrap();

        let result = rt.block_on(list_templates(None)).unwrap();
        let second_idx = result.iter().position(|t| t.id == second.id);
        let first_idx = result.iter().position(|t| t.id == first.id);
        
        assert!(second_idx.is_some(), "Second template should exist");
        assert!(first_idx.is_some(), "First template should exist");
        assert!(second_idx.unwrap() < first_idx.unwrap(), "Second should come before first (desc order)");
        
        let _ = rt.block_on(delete_template(first.id));
        let _ = rt.block_on(delete_template(second.id));
    }
}

impl Default for CreateTemplateInput {
    fn default() -> Self {
        Self {
            name: String::new(),
            content: String::new(),
            platform: String::new(),
            sector: None,
            category: None,
            tags: None,
        }
    }
}
