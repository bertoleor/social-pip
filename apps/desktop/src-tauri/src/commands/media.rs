use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub file_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationWarning {
    pub code: String,
    pub message: String,
    pub actual: u64,
    pub limit: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformConstraints {
    pub platform: String,
    pub max_images: u32,
    pub max_size_bytes: u64,
    pub allowed_formats: Vec<String>,
    pub min_width: u32,
    pub min_height: u32,
    pub max_width: u32,
    pub max_height: u32,
}

fn get_platform_constraints(platform: &str) -> Result<PlatformConstraints, String> {
    match platform.to_lowercase().as_str() {
        "facebook" => Ok(PlatformConstraints {
            platform: "facebook".to_string(),
            max_images: 10,
            max_size_bytes: 4 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "gif".to_string(), "webp".to_string()],
            min_width: 200,
            min_height: 200,
            max_width: 2048,
            max_height: 2048,
        }),
        "instagram" => Ok(PlatformConstraints {
            platform: "instagram".to_string(),
            max_images: 10,
            max_size_bytes: 30 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string()],
            min_width: 320,
            min_height: 320,
            max_width: 1080,
            max_height: 1080,
        }),
        "twitter" => Ok(PlatformConstraints {
            platform: "twitter".to_string(),
            max_images: 4,
            max_size_bytes: 5 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "gif".to_string(), "webp".to_string()],
            min_width: 120,
            min_height: 120,
            max_width: 4096,
            max_height: 4096,
        }),
        "tiktok" => Ok(PlatformConstraints {
            platform: "tiktok".to_string(),
            max_images: 35,
            max_size_bytes: 20 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "webp".to_string()],
            min_width: 360,
            min_height: 360,
            max_width: 1080,
            max_height: 1080,
        }),
        "linkedin" => Ok(PlatformConstraints {
            platform: "linkedin".to_string(),
            max_images: 9,
            max_size_bytes: 8 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "gif".to_string()],
            min_width: 400,
            min_height: 400,
            max_width: 7680,
            max_height: 4320,
        }),
        "threads" => Ok(PlatformConstraints {
            platform: "threads".to_string(),
            max_images: 20,
            max_size_bytes: 8 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "gif".to_string()],
            min_width: 320,
            min_height: 320,
            max_width: 1440,
            max_height: 1920,
        }),
        "telegram" => Ok(PlatformConstraints {
            platform: "telegram".to_string(),
            max_images: 10,
            max_size_bytes: 2 * 1024 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "webp".to_string(), "gif".to_string()],
            min_width: 1,
            min_height: 1,
            max_width: 10000,
            max_height: 10000,
        }),
        "whatsapp" => Ok(PlatformConstraints {
            platform: "whatsapp".to_string(),
            max_images: 30,
            max_size_bytes: 5 * 1024 * 1024,
            allowed_formats: vec!["jpg".to_string(), "png".to_string(), "webp".to_string()],
            min_width: 1,
            min_height: 1,
            max_width: 1080,
            max_height: 1920,
        }),
        _ => Err(format!("Unknown platform: {}", platform)),
    }
}

#[tauri::command]
pub async fn get_image_metadata(path: String) -> Result<ImageMetadata, String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let file_size = fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?
        .len();

    let img = image::open(&path)
        .map_err(|e| format!("Failed to open image: {}", e))?;

    let (width, height) = img.dimensions();

    let format = match image::ImageFormat::from_path(&path) {
        Ok(fmt) => match fmt {
            image::ImageFormat::Jpeg => "jpg",
            image::ImageFormat::Png => "png",
            image::ImageFormat::Gif => "gif",
            image::ImageFormat::WebP => "webp",
            _ => "unknown",
        },
        Err(_) => "unknown",
    };

    Ok(ImageMetadata {
        width,
        height,
        format: format.to_string(),
        file_size,
    })
}

#[tauri::command]
pub async fn validate_image(
    path: String,
    platform: String,
) -> Result<ValidationResult, String> {
    let constraints = get_platform_constraints(&platform)?;

    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Ok(ValidationResult {
            valid: false,
            errors: vec![ValidationError {
                code: "FILE_READ_ERROR".to_string(),
                message: format!("File not found: {}", path),
                actual: None,
                limit: None,
            }],
            warnings: vec![],
        });
    }

    let mut errors: Vec<ValidationError> = Vec::new();
    let mut warnings: Vec<ValidationWarning> = Vec::new();

    let file_size = fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?
        .len();

    if file_size > constraints.max_size_bytes {
        errors.push(ValidationError {
            code: "SIZE_EXCEEDED".to_string(),
            message: format!(
                "Image exceeds {}MB limit for {}",
                constraints.max_size_bytes / (1024 * 1024),
                platform
            ),
            actual: Some(format!("{}MB", file_size / (1024 * 1024))),
            limit: Some(format!("{}MB", constraints.max_size_bytes / (1024 * 1024))),
        });
    } else if file_size > constraints.max_size_bytes * 90 / 100 {
        warnings.push(ValidationWarning {
            code: "SIZE_NEAR_LIMIT".to_string(),
            message: format!(
                "Image near size limit ({:.1}/{:.0}MB)",
                file_size as f64 / (1024.0 * 1024.0),
                constraints.max_size_bytes as f64 / (1024.0 * 1024.0)
            ),
            actual: file_size,
            limit: constraints.max_size_bytes,
        });
    }

    let detected_format = match image::ImageFormat::from_path(&path) {
        Ok(fmt) => match fmt {
            image::ImageFormat::Jpeg => Some("jpg"),
            image::ImageFormat::Png => Some("png"),
            image::ImageFormat::Gif => Some("gif"),
            image::ImageFormat::WebP => Some("webp"),
            _ => None,
        },
        Err(_) => None,
    };

    match detected_format {
        Some(fmt) => {
            if !constraints.allowed_formats.contains(&fmt.to_string()) {
                errors.push(ValidationError {
                    code: "FORMAT_UNSUPPORTED".to_string(),
                    message: format!(
                        "Format '{}' not supported. Allowed: {}",
                        fmt,
                        constraints.allowed_formats.join(", ")
                    ),
                    actual: Some(fmt.to_string()),
                    limit: Some(constraints.allowed_formats.join(", ")),
                });
            }
        }
        None => {
            errors.push(ValidationError {
                code: "FORMAT_UNSUPPORTED".to_string(),
                message: "Could not determine image format".to_string(),
                actual: None,
                limit: Some(constraints.allowed_formats.join(", ")),
            });
        }
    }

    let img = match image::open(&path) {
        Ok(img) => img,
        Err(e) => {
            return Ok(ValidationResult {
                valid: false,
                errors: vec![ValidationError {
                    code: "FILE_READ_ERROR".to_string(),
                    message: format!("Failed to open image: {}", e),
                    actual: None,
                    limit: None,
                }],
                warnings: vec![],
            });
        }
    };

    let (width, height) = img.dimensions();

    if width < constraints.min_width || height < constraints.min_height {
        errors.push(ValidationError {
            code: "DIMENSIONS_TOO_SMALL".to_string(),
            message: format!(
                "Image too small. Minimum {}x{} for {}",
                constraints.min_width, constraints.min_height, platform
            ),
            actual: Some(format!("{}x{}", width, height)),
            limit: Some(format!("{}x{}", constraints.min_width, constraints.min_height)),
        });
    }

    if width > constraints.max_width || height > constraints.max_height {
        errors.push(ValidationError {
            code: "DIMENSIONS_TOO_LARGE".to_string(),
            message: format!(
                "Image too large. Maximum {}x{} for {}",
                constraints.max_width, constraints.max_height, platform
            ),
            actual: Some(format!("{}x{}", width, height)),
            limit: Some(format!("{}x{}", constraints.max_width, constraints.max_height)),
        });
    }

    Ok(ValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    })
}

#[tauri::command]
pub fn get_platform_media_constraints(platform: String) -> Result<PlatformConstraints, String> {
    get_platform_constraints(&platform)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn create_test_jpeg() -> NamedTempFile {
        let mut file = NamedTempFile::with_suffix(".jpg").unwrap();
        let jpeg_header: [u8; 2] = [0xFF, 0xD8];
        file.write_all(&jpeg_header).unwrap();
        file.flush().unwrap();
        file
    }

    #[test]
    fn test_get_platform_constraints_facebook() {
        let constraints = get_platform_constraints("facebook").unwrap();
        assert_eq!(constraints.platform, "facebook");
        assert_eq!(constraints.max_images, 10);
        assert_eq!(constraints.max_size_bytes, 4 * 1024 * 1024);
        assert!(constraints.allowed_formats.contains(&"jpg".to_string()));
        assert!(constraints.allowed_formats.contains(&"png".to_string()));
    }

    #[test]
    fn test_get_platform_constraints_case_insensitive() {
        let constraints = get_platform_constraints("FACEBOOK").unwrap();
        assert_eq!(constraints.platform, "facebook");
    }

    #[test]
    fn test_get_platform_constraints_unknown_platform() {
        let result = get_platform_constraints("unknown_platform");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown platform"));
    }

    #[test]
    fn test_platform_constraints_all_platforms() {
        let platforms = vec![
            "facebook", "instagram", "twitter", "tiktok",
            "linkedin", "threads", "telegram", "whatsapp",
        ];
        
        for platform in platforms {
            let constraints = get_platform_constraints(platform).unwrap();
            assert_eq!(constraints.platform, platform);
            assert!(constraints.max_images > 0);
            assert!(constraints.max_size_bytes > 0);
            assert!(!constraints.allowed_formats.is_empty());
        }
    }

    #[test]
    fn test_validation_result_valid_when_no_errors() {
        let result = ValidationResult {
            valid: true,
            errors: vec![],
            warnings: vec![],
        };
        assert!(result.valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_validation_result_invalid_with_errors() {
        let result = ValidationResult {
            valid: false,
            errors: vec![ValidationError {
                code: "SIZE_EXCEEDED".to_string(),
                message: "Image exceeds limit".to_string(),
                actual: Some("8MB".to_string()),
                limit: Some("4MB".to_string()),
            }],
            warnings: vec![],
        };
        assert!(!result.valid);
        assert_eq!(result.errors.len(), 1);
        assert_eq!(result.errors[0].code, "SIZE_EXCEEDED");
    }

    #[test]
    fn test_image_metadata_structure() {
        let metadata = ImageMetadata {
            width: 1080,
            height: 1080,
            format: "jpg".to_string(),
            file_size: 1024 * 1024,
        };
        assert_eq!(metadata.width, 1080);
        assert_eq!(metadata.height, 1080);
        assert_eq!(metadata.format, "jpg");
        assert_eq!(metadata.file_size, 1024 * 1024);
    }

    #[test]
    fn test_platform_constraints_min_dimensions() {
        let constraints = get_platform_constraints("instagram").unwrap();
        assert_eq!(constraints.min_width, 320);
        assert_eq!(constraints.min_height, 320);
    }

    #[test]
    fn test_platform_constraints_max_dimensions() {
        let constraints = get_platform_constraints("instagram").unwrap();
        assert_eq!(constraints.max_width, 1080);
        assert_eq!(constraints.max_height, 1080);
    }

    #[test]
    fn test_platform_constraints_allowed_formats() {
        let instagram = get_platform_constraints("instagram").unwrap();
        assert!(instagram.allowed_formats.contains(&"jpg".to_string()));
        assert!(instagram.allowed_formats.contains(&"png".to_string()));
        assert!(!instagram.allowed_formats.contains(&"gif".to_string()));

        let facebook = get_platform_constraints("facebook").unwrap();
        assert!(facebook.allowed_formats.contains(&"gif".to_string()));
    }

    #[test]
    fn test_validation_error_codes() {
        let error = ValidationError {
            code: "FORMAT_UNSUPPORTED".to_string(),
            message: "Format not supported".to_string(),
            actual: Some("bmp".to_string()),
            limit: Some("jpg, png".to_string()),
        };
        assert_eq!(error.code, "FORMAT_UNSUPPORTED");
        assert!(error.actual.is_some());
        assert!(error.limit.is_some());
    }

    #[test]
    fn test_validation_warning_structure() {
        let warning = ValidationWarning {
            code: "SIZE_NEAR_LIMIT".to_string(),
            message: "Near size limit".to_string(),
            actual: 3800000,
            limit: 4000000,
        };
        assert_eq!(warning.code, "SIZE_NEAR_LIMIT");
        assert_eq!(warning.actual, 3800000);
        assert_eq!(warning.limit, 4000000);
    }
}
