use serde::{Deserialize, Serialize};
use std::time::Duration;
use url::Url;

/// Base URLs de proveedor permitidos (hallazgo RS-03).
/// NVIDIA se limita a hosts oficiales `api.nvidia.com`; Ollama solo a localhost.
fn is_allowed_provider_base_url(provider: &AIProvider, base_url: &str) -> bool {
    let Ok(parsed) = Url::parse(base_url) else {
        return false;
    };
    let Some(host) = parsed.host_str() else {
        return false;
    };
    let scheme = parsed.scheme();
    match provider {
        AIProvider::NvidiaNim => {
            scheme == "https"
                && (host == "api.nvidia.com" || host.ends_with(".api.nvidia.com"))
        }
        AIProvider::Ollama => {
            (scheme == "http" || scheme == "https")
                && matches!(host, "localhost" | "127.0.0.1" | "::1")
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AIProvider {
    #[serde(rename = "NVIDIA_NIM")]
    NvidiaNim,
    #[serde(rename = "OLLAMA")]
    Ollama,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub enum AICapability {
    CaptionGeneration,
    ImagePrompt,
    HashtagSuggestion,
    ResponseSuggestion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub provider: AIProvider,
    pub model_name: String,
    pub api_key: Option<String>,
    pub endpoint: Option<String>,
    pub ollama_url: Option<String>,
    pub is_enabled: bool,
    pub is_default: bool,
    pub temperature: f32,
    pub max_tokens: u32,
    pub system_prompt: String,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            provider: AIProvider::Ollama,
            model_name: "llama3.2".to_string(),
            api_key: None,
            endpoint: None,
            ollama_url: Some("http://localhost:11434".to_string()),
            is_enabled: false,
            is_default: false,
            temperature: 0.7,
            max_tokens: 500,
            system_prompt: "Eres un copywriter argentino profesional. Escribís captions cortos, persuasivos y naturales para redes sociales. Usás emojis适量. El tono es cercano pero profesional.".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionRequest {
    pub content: String,
    pub platform: String,
    pub style: Option<String>,
    pub sector: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionResponse {
    pub caption: String,
    pub provider: AIProvider,
    pub model: String,
    pub tokens_used: Option<u32>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaOptions {
    temperature: f32,
    num_predict: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NvidiaRequest {
    model: String,
    messages: Vec<NvidiaMessage>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NvidiaMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NvidiaResponse {
    choices: Vec<NvidiaChoice>,
    usage: Option<NvidiaUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NvidiaChoice {
    message: NvidiaMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NvidiaUsage {
    prompt_tokens: Option<u32>,
    completion_tokens: Option<u32>,
    total_tokens: Option<u32>,
}

pub struct AIService {
    config: AIConfig,
    client: reqwest::Client,
}

impl AIService {
    pub fn new(config: AIConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .unwrap_or_default();

        Self { config, client }
    }

    pub fn from_default() -> Self {
        Self::new(AIConfig::default())
    }

    pub async fn generate_caption(&self, request: CaptionRequest) -> Result<CaptionResponse, String> {
        if !self.config.is_enabled {
            return Err("AI no está habilitado".to_string());
        }

        let start = std::time::Instant::now();

        let prompt = self.build_caption_prompt(&request);

let (caption, tokens) = match self.config.provider {
        AIProvider::NvidiaNim => {
            self.call_nvidia(&prompt).await?
        }
        AIProvider::Ollama => {
            self.call_ollama(&prompt).await?
        }
    };

        let duration = start.elapsed().as_millis() as u64;

        Ok(CaptionResponse {
            caption,
            provider: self.config.provider.clone(),
            model: self.config.model_name.clone(),
            tokens_used: tokens,
            duration_ms: duration,
        })
    }

    fn build_caption_prompt(&self, request: &CaptionRequest) -> String {
        let style = request.style.as_deref().unwrap_or("professional");
        
        let platform_guide = match request.platform.as_str() {
            "instagram" => "Para Instagram: caption corto (máx 2200 chars), usa emojis, incluye hashtags al final.",
            "facebook" => "Para Facebook: caption más largo permitido, más detallado, hashtags opcionales.",
            "twitter" => "Para Twitter/X: muy corto (máx 280 chars), directo, hashtags limitados.",
            "linkedin" => "Para LinkedIn: tono profesional, más extenso permitido, sin emojis excesivos.",
            "tiktok" => "Para TikTok: caption corto con trending sounds, emojis, call-to-action.",
            _ => "Caption genérico para redes sociales.",
        };

        let sector_context = request.sector.as_deref()
            .map(|s| format!("Sector: {}. ", s))
            .unwrap_or_default();

        format!(
            "{}\n\n{}Write a {} caption for this content:\n\n{}\n\n{}",
            self.config.system_prompt,
            sector_context,
            style,
            request.content,
            platform_guide
        )
    }

    async fn call_ollama(&self, prompt: &str) -> Result<(String, Option<u32>), String> {
        let raw_url = self.config.ollama_url
            .as_ref()
            .ok_or("Ollama URL no configurada")?
            .clone();

        if !is_allowed_provider_base_url(&AIProvider::Ollama, &raw_url) {
            return Err("URL de Ollama no permitida (solo localhost)".to_string());
        }

        let url = format!("{}/api/generate", raw_url);

        let request = OllamaRequest {
            model: self.config.model_name.clone(),
            prompt: prompt.to_string(),
            stream: false,
            options: OllamaOptions {
                temperature: self.config.temperature,
                num_predict: self.config.max_tokens,
            },
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|_| "Error conectando a Ollama".to_string())?;

        if !response.status().is_success() {
            return Err("Error de Ollama".to_string());
        }

        let ollama_response: OllamaResponse = response
            .json()
            .await
            .map_err(|_| "Error parseando respuesta de Ollama".to_string())?;

        // Ollama no devuelve token count, devolvemos None
        Ok((ollama_response.response.trim().to_string(), None))
    }

    async fn call_nvidia(&self, prompt: &str) -> Result<(String, Option<u32>), String> {
        let api_key = self.config.api_key
            .as_ref()
            .ok_or("API key de NVIDIA no configurada")?
            .clone();

        let endpoint = self.config.endpoint
            .clone()
            .unwrap_or_else(|| "https://integrate.api.nvidia.com/v1/chat/completions".to_string());

        if !is_allowed_provider_base_url(&AIProvider::NvidiaNim, &endpoint) {
            return Err("Endpoint de NVIDIA no permitido".to_string());
        }

        let model = format!("meta/{}", self.config.model_name);

        let request = NvidiaRequest {
            model,
            messages: vec![
                NvidiaMessage {
                    role: "system".to_string(),
                    content: self.config.system_prompt.clone(),
                },
                NvidiaMessage {
                    role: "user".to_string(),
                    content: prompt.to_string(),
                },
            ],
            temperature: self.config.temperature,
            max_tokens: self.config.max_tokens,
            stream: false,
        };

        let response = self.client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|_| "Error conectando a NVIDIA".to_string())?;

        if !response.status().is_success() {
            return Err("Error de NVIDIA".to_string());
        }

        let nvidia_response: NvidiaResponse = response
            .json()
            .await
            .map_err(|_| "Error parseando respuesta de NVIDIA".to_string())?;

        let caption = nvidia_response.choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or("No hay respuesta del modelo")?;

        let tokens = nvidia_response.usage
            .map(|u| u.total_tokens.unwrap_or(0));

        Ok((caption.trim().to_string(), tokens))
    }

    pub fn set_config(&mut self, config: AIConfig) {
        self.config = config;
    }

    pub fn is_enabled(&self) -> bool {
        self.config.is_enabled
    }

    pub fn get_provider(&self) -> &AIProvider {
        &self.config.provider
    }

    pub fn get_config(&self) -> &AIConfig {
        &self.config
    }
}

// Prompt templates por sector para captions
pub fn get_sector_prompt(sector: &str) -> &'static str {
    match sector.to_lowercase().as_str() {
        "inmobiliario" => {
            "Para inmobiliarios: destacá precio (en USD o pesos), ubicación (barrio/zona), metros cuadrados, cantidad de ambientes, amenities, fecha de disponibilidad, forma de contacto."
        }
        "esoterismo" => {
            "Para esoterismo: tono místico pero profesional, mencioná servicios disponibles, horarios de atención, forma de contacto (WhatsApp preferido), ubicación."
        }
        "digital" => {
            "Para productos digitales: destacá features, precio, link de compra, beneficios únicos, urgencia/limited oferta."
        }
        "comida" => {
            "Para comida: mencioná plato especial, precio, zona de delivery, horarios, método de pedido (WhatsApp, app), promociones."
        }
        "estetica" => {
            "Para estética: destacá servicio, precio, duración del turno, zona, disponibilidad, método de reserva."
        }
        "articulos" => {
            "Para artículos: estado del producto, precio, ubicación, forma de entrega, método de contacto."
        }
        _ => {
            "Para cualquier producto/servicio: caption claro, precio visible, contacto fácil, call-to-action claro."
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

#[test]
fn test_default_config() {
    let config = AIConfig::default();
    assert_eq!(config.provider, AIProvider::Ollama);
        assert_eq!(config.model_name, "llama3.2");
        assert!(!config.is_enabled);
    }

    #[test]
    fn test_sector_prompts() {
        assert!(get_sector_prompt("inmobiliario").contains("precio"));
        assert!(get_sector_prompt("digital").contains("features"));
    }

    #[test]
    fn test_allowlist_nvidia() {
        use AIProvider::*;
        assert!(is_allowed_provider_base_url(&NvidiaNim, "https://integrate.api.nvidia.com/v1/chat/completions"));
        assert!(is_allowed_provider_base_url(&NvidiaNim, "https://api.nvidia.com/v1"));
        assert!(!is_allowed_provider_base_url(&NvidiaNim, "http://api.nvidia.com/v1")); // no https
        assert!(!is_allowed_provider_base_url(&NvidiaNim, "https://evil.com"));
        assert!(!is_allowed_provider_base_url(&NvidiaNim, "https://apitest.nvidia.com.evil.com"));
        assert!(!is_allowed_provider_base_url(&NvidiaNim, "https://nvidia.com"));
        assert!(!is_allowed_provider_base_url(&NvidiaNim, "not a url"));
    }

    #[test]
    fn test_allowlist_ollama() {
        use AIProvider::*;
        assert!(is_allowed_provider_base_url(&Ollama, "http://localhost:11434"));
        assert!(is_allowed_provider_base_url(&Ollama, "http://127.0.0.1:11434"));
        assert!(is_allowed_provider_base_url(&Ollama, "https://localhost:11434"));
        assert!(!is_allowed_provider_base_url(&Ollama, "http://evil.localhost:11434"));
        assert!(!is_allowed_provider_base_url(&Ollama, "http://192.168.1.10:11434"));
        assert!(!is_allowed_provider_base_url(&Ollama, "http://api.ollama.com"));
        assert!(!is_allowed_provider_base_url(&Ollama, "not a url"));
    }
}