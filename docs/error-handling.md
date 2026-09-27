# Error Handling Patterns - Social-Pip
> Parte de: [[README]] · Relacionados: [[monitoring-alerts]]

> Sistema robusto de manejo de errores para automatizaciones de redes sociales
> Última actualización: Abril 2026

---

## Principios Fundamentales

### 1. Fail Gracefully
Los errores NO deben detener todo el sistema. Cada falla debe:
- Ser capturada y clasificada
- Loguearse con contexto completo
- Notificarse al canal apropiado
- Permitir recuperación automática cuando sea posible

### 2. Idempotency
Las operaciones deben ser re-ejecutables sin duplicar efectos:
```rust
pub async fn publish_post(&self, post_id: &str) -> Result<PublishResult, PublishError> {
    // Verificar estado actual
    let post = self.db.get_post(post_id).await?;
    match post.status {
        PostStatus::Published => return Ok(PublishResult::AlreadyPublished),
        PostStatus::Processing => return Err(PublishError::AlreadyProcessing),
        _ => {} // Continuar solo si está en draft o failed
    }
    // ...
}
```

### 3. Circuit Breaker
Detener operaciones cuando un servicio está fallando consistentemente:
- 3 fallos consecutivos → Abrir circuito
- Esperar 60 segundos antes de reintentar
- 1 éxito → Cerrar circuito

---

## Patrones de Error por Tipo

### Continue On Fail

Para operaciones que pueden fallar sin detener el flujo principal:

```rust
// Operaciones que pueden fallar silenciosamente
let result = match fetch_user_avatar(&account).await {
    Ok(avatar) => Some(avatar),
    Err(_) => None, // No detener, continuar sin avatar
};

// En n8n: Activar "Continue On Fail" en el nodo
```

**Aplicar cuando:**
- Fetch de datos opcionales (avatars, previews)
- Notificaciones no críticas
- Operaciones de cleanup

### Error Branching

Enrutar errores a handlers específicos:

```
┌─────────────┐
│ HTTP Request│
└──────┬──────┘
       │
       ▼
┌──────────────┐    Success    ┌─────────────┐
│   Response   │──────────────▶│  Continue   │
└──────┬───────┘               └─────────────┘
       │
       │ Error
       ▼
┌──────────────┐
│ Error Router │
└──────┬───────┘
       │
       ├──▶ Rate Limit ──▶ Wait & Retry
       ├──▶ Auth Failed ──▶ Alert & Stop
       ├──▶ Network ──────▶ Backoff Retry
       └──▶ Validation ───▶ Log & Skip
```

### Bucles de Reintento (Retry Loops)

Para procesos asíncronos o inestables:

```rust
pub async fn wait_for_completion(
    &self,
    job_id: &str,
    max_attempts: u32,
) -> Result<JobResult, AsyncError> {
    let mut attempts = 0;
    let base_delay = Duration::from_secs(10);

    loop {
        attempts += 1;
        
        match self.check_job_status(job_id).await? {
            JobStatus::Completed(result) => return Ok(result),
            JobStatus::Failed(e) => return Err(AsyncError::JobFailed(e)),
            JobStatus::Processing => {
                if attempts >= max_attempts {
                    return Err(AsyncError::Timeout {
                        job_id: job_id.to_string(),
                        attempts,
                    });
                }
                
                // Backoff exponencial: 10s, 20s, 40s, 80s...
                let delay = base_delay * 2u32.pow(attempts - 1);
                tokio::time::sleep(delay).await;
            }
        }
    }
}
```

---

## Códigos de Error

### Taxonomía de Errores

| Código | Tipo | Severidad | Acción Automática | Escalación |
|--------|------|-----------|-------------------|------------|
| E001 | Rate Limit | Warning | Esperar + Retry | Log |
| E002 | Auth Failed | Critical | Detener + Alertar | Slack + Email |
| E003 | Network | Warning | Backoff Retry (3x) | Log |
| E004 | Validation | Info | Log + Skip | Ninguna |
| E005 | Platform Block | Critical | Cooldown + Alertar | Slack + Email |
| E006 | Timeout | Warning | Retry (2x) | Log |
| E007 | Quota Exceeded | Critical | Esperar reset | Email |
| E008 | Content Rejected | Info | Log + Marcar | Dashboard |

### Detalle por Código

#### E001 - Rate Limit
```json
{
  "code": "E001",
  "type": "rate_limit",
  "message": "Rate limit exceeded for platform",
  "platform": "facebook",
  "reset_at": "2026-04-10T13:00:00Z",
  "retry_after_ms": 1800000,
  "context": {
    "posts_today": 8,
    "max_posts": 10,
    "last_post_at": "2026-04-10T12:30:00Z"
  }
}
```

**Acción:**
1. Pausar scheduler para la plataforma
2. Esperar hasta `reset_at`
3. Reanudar automáticamente

#### E002 - Auth Failed
```json
{
  "code": "E002",
  "type": "auth_failed",
  "message": "Authentication failed for account",
  "account_id": "acc_abc123",
  "platform": "instagram",
  "context": {
    "error_type": "token_expired",
    "last_successful_auth": "2026-03-15T10:00:00Z"
  }
}
```

**Acción:**
1. Marcar cuenta como `NEEDS_REAUTH`
2. Enviar alerta inmediata a Slack
3. NO reintentar automáticamente
4. Requerir intervención humana

#### E005 - Platform Block
```json
{
  "code": "E005",
  "type": "platform_block",
  "message": "Account temporarily blocked by platform",
  "account_id": "acc_xyz789",
  "platform": "twitter",
  "context": {
    "block_type": "temporary",
    "reason": "suspicious_activity",
    "estimated_duration_hours": 24
  }
}
```

**Acción:**
1. Marcar cuenta como `BLOCKED`
2. Activar cooldown de 24-72h
3. Alertar a usuario via Email
4. NO intentar publicar hasta resolver

---

## Implementación en Rust

### Error Types con thiserror

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PublishError {
    #[error("Rate limit exceeded for {platform}")]
    RateLimit {
        platform: String,
        reset_at: DateTime<Utc>,
    },
    
    #[error("Authentication failed for account {account_id}")]
    AuthFailed {
        account_id: String,
        reason: String,
    },
    
    #[error("Platform blocked account {account_id}")]
    PlatformBlock {
        account_id: String,
        platform: String,
        duration: Duration,
    },
    
    #[error("Network error: {message}")]
    Network { message: String },
    
    #[error("Validation error: {field} - {reason}")]
    Validation { field: String, reason: String },
    
    #[error("Timeout after {attempts} attempts")]
    Timeout { attempts: u32 },
    
    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl PublishError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::RateLimit { .. } => "E001",
            Self::AuthFailed { .. } => "E002",
            Self::Network { .. } => "E003",
            Self::Validation { .. } => "E004",
            Self::PlatformBlock { .. } => "E005",
            Self::Timeout { .. } => "E006",
            Self::Internal(_) => "E999",
        }
    }
    
    pub fn severity(&self) -> Severity {
        match self {
            Self::RateLimit | Self::Network | Self::Timeout => Severity::Warning,
            Self::Validation => Severity::Info,
            Self::AuthFailed | Self::PlatformBlock => Severity::Critical,
            Self::Internal(_) => Severity::Error,
        }
    }
    
    pub fn should_retry(&self) -> bool {
        matches!(
            self,
            Self::RateLimit { .. } | Self::Network { .. } | Self::Timeout { .. }
        )
    }
}
```

### Result Pattern para Tauri Commands

```rust
#[derive(Serialize)]
pub struct OperationResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<ErrorInfo>,
}

#[derive(Serialize)]
pub struct ErrorInfo {
    pub code: String,
    pub message: String,
    pub recoverable: bool,
    pub retry_after_ms: Option<u64>,
}

#[tauri::command]
pub async fn publish_scheduled_post(
    post_id: String,
    state: State<'_, AppState>,
) -> Result<OperationResult<PublishResult>, String> {
    match state.publisher.publish(&post_id).await {
        Ok(result) => Ok(OperationResult {
            success: true,
            data: Some(result),
            error: None,
        }),
        Err(e) => {
            log_error(&e);
            Ok(OperationResult {
                success: false,
                data: None,
                error: Some(ErrorInfo {
                    code: e.code().to_string(),
                    message: e.to_string(),
                    recoverable: e.should_retry(),
                    retry_after_ms: e.retry_after_ms(),
                }),
            })
        }
    }
}
```

---

## Flujo de Error Completo

### Diagrama de Estados

```
┌─────────┐
│ pending │
└────┬────┘
     │ start
     ▼
┌───────────┐
│ processing│
└─────┬─────┘
      │
      ├─── Success ──────────────▶ ┌───────────┐
      │                            │ published │
      │                            └───────────┘
      │
      ├─── Retryable Error ────▶ ┌──────────┐
      │     (E001, E003, E006)  │ retrying │
      │                         └────┬─────┘
      │                              │
      │                              ├─── Max retries ──▶ ┌────────┐
      │                              │                    │ failed │
      │                              │                    └────────┘
      │                              │
      │                              └─── Success ──────────────▶ published
      │
      └─── Critical Error ──────────▶ ┌────────┐
            (E002, E005, E007)        │ failed │
                                      └────────┘
```

### Implementación del Flujo

```rust
pub async fn execute_with_retry<F, T, E>(
    &self,
    operation: F,
    max_retries: u32,
) -> Result<T, E>
where
    F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, E>> + Send>>,
    E: std::fmt::Debug + ShouldRetry,
{
    let mut attempts = 0;
    
    loop {
        attempts += 1;
        
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) if e.should_retry() && attempts <= max_retries => {
                let delay = self.calculate_backoff(attempts);
                log::warn!(
                    "Operation failed (attempt {}/{}), retrying in {:?}",
                    attempts, max_retries, delay
                );
                tokio::time::sleep(delay).await;
            }
            Err(e) => return Err(e),
        }
    }
}

impl ShouldRetry for PublishError {
    fn should_retry(&self) -> bool {
        matches!(
            self,
            Self::RateLimit { .. } | Self::Network { .. } | Self::Timeout { .. }
        )
    }
}
```

---

## Logging Estructurado

### Formato de Logs

```rust
use serde_json::json;

pub fn log_error(error: &PublishError) {
    let log_entry = json!({
        "timestamp": Utc::now().to_rfc3339(),
        "level": error.severity().to_string(),
        "code": error.code(),
        "message": error.to_string(),
        "recoverable": error.should_retry(),
        "context": error.context(),
    });
    
    match error.severity() {
        Severity::Critical => log::error!("{}", log_entry),
        Severity::Error => log::error!("{}", log_entry),
        Severity::Warning => log::warn!("{}", log_entry),
        Severity::Info => log::info!("{}", log_entry),
    }
}
```

### Ejemplos de Output

```json
{
  "timestamp": "2026-04-10T12:34:56.789Z",
  "level": "warning",
  "code": "E001",
  "message": "Rate limit exceeded for facebook",
  "recoverable": true,
  "context": {
    "platform": "facebook",
    "posts_today": 10,
    "max_posts": 10,
    "reset_at": "2026-04-10T13:00:00Z"
  }
}
```

---

## Integración con n8n

### Configuración de Nodos

#### HTTP Request Node
```json
{
  "node": "HTTP Request",
  "settings": {
    "continueOnFail": true,
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxRetries": 3,
        "retryInterval": 5000
      }
    }
  }
}
```

#### Error Trigger Node
```json
{
  "node": "Error Trigger",
  "type": "n8n-nodes-base.errorTrigger",
  "parameters": {}
}
```

#### Switch Node para Error Routing
```json
{
  "node": "Switch",
  "parameters": {
    "rules": [
      {
        "output": 0,
        "conditions": {
          "conditions": [
            {
              "value1": "={{ $json.error.code }}",
              "operation": "equals",
              "value2": "E001"
            }
          ]
        }
      },
      {
        "output": 1,
        "conditions": {
          "conditions": [
            {
              "value1": "={{ $json.error.code }}",
              "operation": "equals",
              "value2": "E002"
            }
          ]
        }
      }
    ]
  }
}
```

---

## Checklist de Implementación

### Frontend (React)
- [ ] Mostrar errores con código y mensaje claro
- [ ] Indicar si el error es recuperable
- [ ] Ofrecer acción de retry manual para errores recuperables
- [ ] Badge de severidad (Info/Warning/Critical)

### Backend (Rust)
- [x] Implementar enum `PublishError` con thiserror
- [x] Implementar `ShouldRetry` trait
- [ ] Implementar Circuit Breaker pattern
- [ ] Agregar métricas de errores por tipo
- [ ] Implementar rotación de logs

### n8n
- [ ] Configurar Error Trigger en workflows críticos
- [ ] Implementar branching por código de error
- [ ] Configurar retry con backoff en nodos HTTP
- [ ] Agregar notificaciones por Slack/Email

---

## Referencias

- [n8n Error Handling Documentation](https://docs.n8n.io/flow-logic/error-handling/)
- [Rust thiserror crate](https://docs.rs/thiserror/latest/thiserror/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

*Última actualización: Abril 2026*
*Fuente: NotebookLM - Architectural Guide to N8N Automation*
