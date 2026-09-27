# Security Guidelines - Social-Pip
> Parte de: [[README]] · Relacionados: [[security-system]]

> Protocolos de seguridad para automatización de redes sociales
> Última actualización: Abril 2026

---

## Principios de Seguridad

### 1. Defense in Depth
Múltiples capas de protección:
- Autenticación en cada punto
- Encriptación en tránsito y reposo
- Validación de entrada
- Rate limiting
- Logs de auditoría

### 2. Least Privilege
Cada componente tiene solo los permisos necesarios:
- Cuentas de API con scopes mínimos
- Tokens con expiración corta
- Acceso a datos por necesidad

### 3. Zero Trust
Nunca confiar implícitamente:
- Verificar cada request
- Validar cada webhook
- Autenticar cada operación

---

## Autenticación

### Webhooks

#### NUNCA dejar webhooks abiertos

```rust
// ❌ INCORRECTO - Webhook sin autenticación
#[post("/webhook/facebook")]
async fn facebook_webhook(body: Json<WebhookBody>) -> HttpResponse {
    // Procesar sin verificar...
}

// ✅ CORRECTO - Webhook con autenticación
#[post("/webhook/facebook")]
async fn facebook_webhook(
    body: Json<WebhookBody>,
    headers: HeaderMap,
    state: Data<AppState>,
) -> Result<HttpResponse, WebhookError> {
    // 1. Verificar firma de Facebook
    let signature = headers
        .get("X-Hub-Signature-256")
        .ok_or(WebhookError::MissingSignature)?;
    
    let expected = format!("sha256={}", 
        hmac_sha256(&state.config.facebook_secret, &body.to_string())
    );
    
    if signature != expected {
        return Err(WebhookError::InvalidSignature);
    }
    
    // 2. Verificar IP whitelist (opcional)
    let ip = get_client_ip(&headers);
    if !state.config.allowed_ips.contains(&ip) {
        return Err(WebhookError::UnauthorizedIp(ip));
    }
    
    // 3. Rate limit por IP
    if state.rate_limiter.is_limited(&ip) {
        return Err(WebhookError::RateLimited);
    }
    
    // Procesar webhook...
    Ok(HttpResponse::Ok().finish())
}
```

#### Métodos de Autenticación para Webhooks

| Método | Uso | Seguridad |
|--------|-----|-----------|
| **HMAC Signature** | Facebook, Stripe | Alta - Firma criptográfica |
| **Bearer Token** | APIs propias | Media - Token en header |
| **Basic Auth** | Simple integrations | Media - User/Pass |
| **IP Whitelist** | Complementario | Alta - Restricción de origen |
| **Timestamp + Nonce** | Prevención replay | Alta - Anti-replay |

### Credenciales de Plataformas

#### Almacenamiento Seguro

```rust
// ❌ INCORRECTO - Credenciales en código o config
const FACEBOOK_TOKEN: &str = "EAAabc123..."; // NUNCA

// ✅ CORRECTO - Variables de entorno + encriptación
pub struct SecureCredentials {
    vault: Arc<dyn CredentialVault>,
}

impl SecureCredentials {
    pub async fn get_token(&self, account_id: &str) -> Result<String, SecurityError> {
        // 1. Obtener de vault encriptado
        let encrypted = self.vault.get(&format!("tokens/{}", account_id)).await?;
        
        // 2. Desencriptar con key de entorno
        let key = env::var("ENCRYPTION_KEY")
            .map_err(|_| SecurityError::MissingEncryptionKey)?;
        
        let token = decrypt_aes256(&encrypted, &key)?;
        
        Ok(token)
    }
    
    pub async fn store_token(&self, account_id: &str, token: &str) -> Result<(), SecurityError> {
        let key = env::var("ENCRYPTION_KEY")?;
        let encrypted = encrypt_aes256(token, &key)?;
        
        self.vault.store(&format!("tokens/{}", account_id), &encrypted).await?;
        
        Ok(())
    }
}
```

#### Traspaso de Credenciales

**NUNCA compartir por:**
- ❌ WhatsApp
- ❌ Email sin encriptar
- ❌ Telegram
- ❌ SMS
- ❌ Chat corporativo

**USAR servicios dedicados:**
- ✅ **Onetime Secret** - Links auto-destructivos
- ✅ **1Password Psst** - Compartir sin revelar
- ✅ **Bitwarden Send** - Encriptación E2E

```yaml
# Procedimiento de traspaso seguro
procedimiento:
  1. Generar token/credencial
  2. Crear link en Onetime Secret:
     - Expiración: 1 hora
     - Lecturas máximas: 1
     - Destruir al leer: true
  3. Enviar link por canal secundario (email)
  4. Confirmar recepción
  5. Verificar destrucción del link
```

---

## Rate Limiting

### APIs de IA

```rust
pub struct AiRateLimiter {
    requests_per_minute: u32,
    tokens_per_day: u32,
    current_requests: AtomicU32,
    current_tokens: AtomicU32,
    last_reset: Mutex<Instant>,
}

impl AiRateLimiter {
    pub async fn check_limit(&self, tokens_needed: u32) -> Result<(), RateLimitError> {
        // Reset diario
        let mut last_reset = self.last_reset.lock().await;
        if last_reset.elapsed() > Duration::from_secs(86400) {
            self.current_tokens.store(0, Ordering::SeqCst);
            *last_reset = Instant::now();
        }
        
        // Verificar límite de tokens diario
        let current_tokens = self.current_tokens.load(Ordering::SeqCst);
        if current_tokens + tokens_needed > self.tokens_per_day {
            return Err(RateLimitError::DailyLimitExceeded {
                used: current_tokens,
                limit: self.tokens_per_day,
            });
        }
        
        // Verificar requests por minuto
        let current_requests = self.current_requests.load(Ordering::SeqCst);
        if current_requests >= self.requests_per_minute {
            return Err(RateLimitError::MinuteLimitExceeded);
        }
        
        // Incrementar contadores
        self.current_requests.fetch_add(1, Ordering::SeqCst);
        self.current_tokens.fetch_add(tokens_needed, Ordering::SeqCst);
        
        Ok(())
    }
}
```

### Límites por Plataforma

| Plataforma | Límite | Ventana | Consecuencia |
|------------|--------|---------|--------------|
| OpenAI | 500 RPM | 1 minuto | 429 error |
| Anthropic | 1000 RPM | 1 minuto | 429 error |
| Facebook Graph API | 200 calls | 1 hora | App blocked |
| Instagram Graph API | 200 calls | 1 hora | App blocked |
| Twitter API v2 | 450 requests | 15 min | 429 error |
| LinkedIn API | 100K requests | 1 día | 429 error |

### Backoff Exponencial

```rust
pub async fn with_backoff<F, T, E>(mut operation: F) -> Result<T, E>
where
    F: FnMut() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
    E: std::fmt::Debug,
{
    let mut delay = Duration::from_millis(100);
    let max_delay = Duration::from_secs(60);
    let max_retries = 5;
    
    for attempt in 1..=max_retries {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if attempt < max_retries => {
                log::warn!("Operation failed (attempt {}/{}): {:?}", attempt, max_retries, e);
                tokio::time::sleep(delay).await;
                delay = std::cmp::min(delay * 2, max_delay);
            }
            Err(e) => return Err(e),
        }
    }
    
    unreachable!()
}
```

---

## Encriptación

### SSL/TLS

```
REQUISITOS OBLIGATORIOS:

1. HTTPS en TODOS los endpoints
2. TLS 1.2 mínimo, preferir TLS 1.3
3. Certificados válidos (no self-signed en producción)
4. HSTS header habilitado
5. No HTTP redirects, solo HTTPS
```

```rust
// Configuración de servidor seguro
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let cert_path = env::var("SSL_CERT_PATH").expect("SSL_CERT_PATH required");
    let key_path = env::var("SSL_KEY_PATH").expect("SSL_KEY_PATH required");
    
    HttpServer::new(|| {
        App::new()
            .wrap(middleware::DefaultHeaders::new()
                .header("Strict-Transport-Security", "max-age=31536000; includeSubDomains"))
            .wrap(middleware::Logger::default())
            // ... routes
    })
    .bind_rustls("0.0.0.0:443", &mut config)?
    .run()
    .await
}
```

### Encriptación de Datos

```rust
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::{Aead, NewAead}};

pub struct DataEncryption {
    key: [u8; 32],
}

impl DataEncryption {
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        let key = Key::<Aes256Gcm>::from_slice(&self.key);
        let cipher = Aes256Gcm::new(key);
        
        // Nonce único para cada encriptación
        let nonce_bytes = generate_secure_random_bytes(12);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = cipher.encrypt(nonce, plaintext)
            .map_err(|_| EncryptionError::EncryptionFailed)?;
        
        // Prepend nonce para desencriptación
        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        
        Ok(result)
    }
    
    pub fn decrypt(&self, data: &[u8]) -> Result<Vec<u8>, EncryptionError> {
        if data.len() < 12 {
            return Err(EncryptionError::InvalidData);
        }
        
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        let key = Key::<Aes256Gcm>::from_slice(&self.key);
        let cipher = Aes256Gcm::new(key);
        
        cipher.decrypt(nonce, ciphertext)
            .map_err(|_| EncryptionError::DecryptionFailed)
    }
}
```

---

## Logs y Privacidad

### Qué NO Loguear

```
❌ NUNCA LOGUEAR:
- Tokens de autenticación
- API keys
- Contraseñas
- Credenciales de usuarios
- Contenido de posts privados
- Datos personales (email, teléfono)
- Información de tarjetas
- Session IDs
- Refresh tokens
```

### Sanitización de Logs

```rust
pub struct SanitizedLogger;

impl SanitizedLogger {
    pub fn sanitize_for_log(value: &str) -> String {
        // Patrones a ocultar
        let patterns = [
            (r"EAA[a-zA-Z0-9]+", "EAA***REDACTED***"),           // Facebook token
            (r"sk-[a-zA-Z0-9]+", "sk-***REDACTED***"),           // OpenAI key
            (r"[a-f0-9]{32}", "***REDACTED_HASH***"),            // Hashes
            (r"\b[\w\.-]+@[\w\.-]+\.\w+\b", "***@***.***"),      // Email
            (r"\+?[0-9]{10,15}", "***PHONE***"),                 // Teléfono
        ];
        
        let mut result = value.to_string();
        for (pattern, replacement) in patterns {
            let re = regex::Regex::new(pattern).unwrap();
            result = re.replace_all(&result, replacement).to_string();
        }
        result
    }
}

// Uso
log::info!("Processing request for account: {}", 
    SanitizedLogger::sanitize_for_log(&account_id)
);
```

### Política de Retención

| Tipo de Log | Retención | Almacenamiento | Acceso |
|-------------|-----------|----------------|--------|
| Errores críticos | 90 días | Encriptado DB | Admins |
| Errores normales | 30 días | Encriptado DB | Admins |
| Info de operación | 7 días | DB | Team |
| Debug/Trace | 24 horas | File only | Devs |
| Métricas | 1 año | Agregado | Dashboard |

### Rotación Automática

```rust
pub async fn rotate_logs(db: &Database) -> Result<(), Error> {
    let cutoff = Utc::now() - chrono::Duration::days(30);
    
    // Archivar logs antiguos
    let archived = sqlx::query_as::<_, LogEntry>(
        "SELECT * FROM logs WHERE created_at < ? AND level IN ('info', 'debug')",
    )
    .bind(cutoff)
    .fetch_all(&db.pool)
    .await?;
    
    // Guardar en archivo encriptado
    let archive_path = format!("logs/archive_{}.enc", cutoff.format("%Y%m%d"));
    save_encrypted_archive(&archived, &archive_path)?;
    
    // Eliminar de DB
    sqlx::query!("DELETE FROM logs WHERE created_at < ?", cutoff)
        .execute(&db.pool)
        .await?;
    
    log::info!("Rotated {} log entries", archived.len());
    
    Ok(())
}
```

---

## Validación de Entrada

### Schema Validation

```rust
use serde::Deserialize;
use validator::{Validate, ValidationError};

#[derive(Debug, Deserialize, Validate)]
pub struct PostInput {
    #[validate(length(min = 1, max = 2200, message = "Content must be 1-2200 characters"))]
    pub content: String,
    
    #[validate(url(message = "Image must be a valid URL"))]
    pub image_url: Option<String>,
    
    #[validate(range(min = 0, max = 30, message = "Maximum 30 hashtags"))]
    pub hashtags: Vec<String>,
    
    #[validate(custom(function = "validate_platform"))]
    pub platform: String,
}

fn validate_platform(platform: &str) -> Result<(), ValidationError> {
    let valid = ["facebook", "instagram", "twitter", "linkedin", "tiktok"];
    if !valid.contains(&platform) {
        return Err(ValidationError::new("invalid_platform"));
    }
    Ok(())
}

// Uso en handler
#[post("/posts")]
async fn create_post(
    body: Json<PostInput>,
) -> Result<HttpResponse, ApiError> {
    body.validate()?; // Retorna error si validation falla
    
    // Procesar post...
}
```

### SQL Injection Prevention

```rust
// ❌ INCORRECTO - Vulnerable a SQL injection
let query = format!("SELECT * FROM posts WHERE platform = '{}'", platform);

// ✅ CORRECTO - Parameterized query
let posts = sqlx::query_as::<_, Post>(
    "SELECT * FROM posts WHERE platform = ?"
)
.bind(&platform)
.fetch_all(&pool)
.await?;
```

### XSS Prevention (Frontend)

```typescript
// Sanitizar contenido antes de mostrar
import DOMPurify from 'dompurify';

function PostPreview({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

---

## Protocolo de Emergencia

### Escenarios Críticos

#### 1. Cuenta Bloqueada

```
ACTIVAR PROTOCOLO DE CUENTA BLOQUEADA:

1. INMEDIATO (0-5 min):
   □ Detener scheduler para la cuenta
   □ Marcar cuenta como BLOCKED en DB
   □ Notificar a usuario via email
   
2. INVESTIGACIÓN (5-30 min):
   □ Revisar últimos posts publicados
   □ Verificar logs de errores previos
   □ Identificar patrón sospechoso
   
3. RESOLUCIÓN:
   □ Contactar soporte de plataforma
   □ Ajustar configuración anti-ban
   □ Documentar incidente
   
4. REACTIVACIÓN:
   □ Verificar cuenta desbloqueada
   □ Reducir frecuencia temporalmente
   □ Monitorear 24-48h
```

#### 2. API Comprometida

```
ACTIVAR PROTOCOLO DE API COMPROMETIDA:

1. INMEDIATO (0-5 min):
   □ Revocar todas las sesiones activas
   □ Invalidar todos los tokens de API
   □ Cambiar API keys
   
2. CONTENCIÓN (5-30 min):
   □ Analizar logs de acceso
   □ Identificar vector de ataque
   □ Cerrar vulnerabilidad
   
3. COMUNICACIÓN:
   □ Notificar a usuarios afectados
   □ Publicar advisory si es público
   □ Contactar autoridades si aplica
   
4. RECUPERACIÓN:
   □ Regenerar credenciales
   □ Restaurar desde backup limpio
   □ Implementar mitigación
```

#### 3. Data Breach

```
ACTIVAR PROTOCOLO DE DATA BREACH:

1. INMEDIATO (0-1 hora):
   □ Aislar sistema afectado
   □ Preservar evidencia forense
   □ Notificar a stakeholders
   
2. EVALUACIÓN (1-4 horas):
   □ Determinar alcance del breach
   □ Identificar datos expuestos
   □ Clasificar severidad
   
3. COMUNICACIÓN (4-24 horas):
   □ Preparar comunicado
   □ Notificar usuarios afectados
   □ Contactar reguladores si aplica
   
4. REMEDIACIÓN:
   □ Aplicar patches de seguridad
   □ Implementar monitoreo adicional
   □ Auditoría de seguridad completa
```

### Contactos de Emergencia

| Rol | Contacto | Disponibilidad | Incidentes |
|-----|----------|----------------|------------|
| Tech Lead | +54 XXX XXX XXXX | 24/7 | Críticos |
| DevOps | +54 XXX XXX XXXX | 9-21h | Infraestructura |
| Security | security@social-pip.com | 24/7 | Breaches |
| Legal | legal@social-pip.com | 9-18h | Compliance |

---

## Checklist de Implementación

### Backend (Rust)
- [ ] Implementar HMAC verification para webhooks
- [ ] Sistema de encriptación AES-256-GCM
- [ ] Rate limiting por IP y usuario
- [ ] Sanitización de logs
- [ ] Validación de entrada con validator crate
- [ ] Prepared statements en todas las queries

### Frontend (React)
- [ ] Sanitización de contenido con DOMPurify
- [ ] CSP headers configurados
- [ ] HttpOnly cookies para sesiones
- [ ] CSRF tokens en forms
- [ ] Rate limiting en UI

### Infraestructura
- [ ] Certificados SSL válidos
- [ ] Firewall con IP whitelist
- [ ] WAF (Web Application Firewall)
- [ ] Backup encriptado offsite
- [ ] Monitoreo de seguridad

---

## Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [Facebook Security Best Practices](https://developers.facebook.com/docs/security/)
- [Rustls Documentation](https://docs.rs/rustls/)
- [Argon2 Password Hashing](https://docs.rs/argon2/)

---

*Última actualización: Abril 2026*
*Fuente: NotebookLM - Architectural Guide to N8N Automation*
