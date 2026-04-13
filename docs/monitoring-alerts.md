# Monitoring & Alerting - Social-Pip

> Sistema completo de monitoreo y alertas para automatizaciones de redes sociales
> Última actualización: Abril 2026

---

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORING STACK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│   │  App     │───▶│  Logger  │───▶│  Store   │                │
│   │  Events  │    │  Service │    │  (DB)    │                │
│   └──────────┘    └──────────┘    └──────────┘                │
│        │                               │                        │
│        │                               ▼                        │
│        │         ┌──────────────────────────────┐              │
│        │         │      ALERT ROUTER            │              │
│        │         │  ┌────────┐  ┌───────────┐  │              │
│        └────────▶│  │ Rules  │─▶│ Channels  │  │              │
│                  │  │ Engine │  │ Dispatcher│  │              │
│                  │  └────────┘  └───────────┘  │              │
│                  └──────────────────────────────┘              │
│                           │                                     │
│           ┌───────────────┼───────────────┐                    │
│           ▼               ▼               ▼                    │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│     │  Slack   │    │  Email   │    │  In-App  │              │
│     │ Channel  │    │  Report  │    │ Dashboard│              │
│     └──────────┘    └──────────┘    └──────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Eventos a Monitorear

### Taxonomía de Eventos

| Evento | Severidad | Canal | Frecuencia | Acción |
|--------|-----------|-------|------------|--------|
| `post_published` | Info | Dashboard | Tiempo real | Actualizar stats |
| `post_failed` | Warning | Dashboard + Slack | Tiempo real | Log + retry |
| `rate_limit_approaching` | Warning | Dashboard | Check cada 1h | Reducir velocidad |
| `rate_limit_exceeded` | Warning | Slack | Tiempo real | Pausar plataforma |
| `account_blocked` | Critical | Slack + Email | Tiempo real | Detener + investigar |
| `auth_expired` | Critical | Email | Tiempo real | Re-autenticar |
| `api_error` | Warning | Dashboard | Agregado 5min | Verificar servicio |
| `scheduler_stopped` | Critical | Slack + Email | Tiempo real | Reiniciar |
| `daily_summary` | Info | Email | Diario 21:00 | Resumen del día |
| `weekly_report` | Info | Email | Lunes 9:00 | Métricas semanales |

### Definición de Severidad

- **Info**: Evento normal, solo para auditoría
- **Warning**: Situación anómala pero recuperable
- **Error**: Fallo que afecta operación parcialmente
- **Critical**: Fallo que requiere intervención inmediata

---

## Sistema de Alertas

### Canales de Notificación

#### 1. Slack (Real-time Críticos)

```yaml
# Configuración de Slack
slack:
  workspace: social-pip-workspace
  channels:
    critical: "#alerts-critical"
    warnings: "#alerts-warnings"
    info: "#activity-log"
  
  webhook_url: ${SLACK_WEBHOOK_URL}
  rate_limit: 10/hour  # Max 10 alertas por hora
```

**Formato de Mensaje:**
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 CRITICAL: Account Blocked"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Platform:*\nFacebook"},
        {"type": "mrkdwn", "text": "*Account:*\n@empresa_oficial"},
        {"type": "mrkdwn", "text": "*Time:*\n2026-04-10 12:34:56"},
        {"type": "mrkdwn", "text": "*Reason:*\nSuspicious activity detected"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "View Details"},
          "url": "https://app.social-pip.com/alerts/abc123"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Acknowledge"},
          "action_id": "acknowledge_alert"
        }
      ]
    }
  ]
}
```

#### 2. Email (Reportes Programados)

**Tipos de Email:**
1. **Alerta Inmediata**: Errores críticos (E002, E005, E007)
2. **Daily Summary**: Resumen de actividad del día
3. **Weekly Report**: Métricas y tendencias

**Template Daily Summary:**
```html
<h2>📊 Daily Summary - Social-Pip</h2>
<p><strong>Date:</strong> April 10, 2026</p>

<h3>📈 Activity</h3>
<table>
  <tr><th>Platform</th><th>Published</th><th>Failed</th><th>Success Rate</th></tr>
  <tr><td>Facebook</td><td>8</td><td>1</td><td>89%</td></tr>
  <tr><td>Instagram</td><td>4</td><td>0</td><td>100%</td></tr>
  <tr><td>Twitter</td><td>15</td><td>2</td><td>88%</td></tr>
</table>

<h3>⚠️ Issues</h3>
<ul>
  <li>10:30 - Rate limit warning on Facebook</li>
  <li>14:22 - Network timeout on Twitter (recovered)</li>
</ul>

<h3>🔮 Tomorrow's Schedule</h3>
<p>12 posts scheduled across 3 platforms</p>
```

#### 3. Dashboard In-App

**Componentes:**
- Health status por plataforma (verde/amarillo/rojo)
- Rate limit usage con progress bar
- Últimos 10 eventos en tiempo real
- Métricas de las últimas 24h

---

## Logs Estructurados

### Formato JSON

```json
{
  "timestamp": "2026-04-10T12:34:56.789Z",
  "level": "warning",
  "event_type": "rate_limit_approaching",
  "platform": "facebook",
  "account_id": "acc_abc123",
  "data": {
    "posts_remaining": 2,
    "max_posts": 10,
    "reset_at": "2026-04-10T13:00:00Z",
    "posts_today": 8,
    "last_post_at": "2026-04-10T12:30:00Z"
  },
  "correlation_id": "req_xyz789",
  "metadata": {
    "version": "1.2.0",
    "environment": "production",
    "hostname": "social-pip-prod-1"
  }
}
```

### Niveles de Log

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| `error` | Errores que afectan operación | Platform block, auth failed |
| `warn` | Situaciones anómalas recuperables | Rate limit approaching, timeout |
| `info` | Eventos informativos importantes | Post published, scheduler start |
| `debug` | Información de depuración | Request/response bodies |
| `trace` | Trazabilidad detallada | Function entry/exit |

### Implementación en Rust

```rust
use tracing::{info, warn, error, instrument};
use serde_json::json;

#[instrument(skip(state), fields(platform = %platform, account_id = %account_id))]
pub async fn publish_post(
    platform: &str,
    account_id: &str,
    content: &PostContent,
    state: &AppState,
) -> Result<PublishResult, PublishError> {
    info!(
        posts_remaining = state.rate_limiter.remaining(platform),
        "Starting publish operation"
    );
    
    match state.publisher.publish(content).await {
        Ok(result) => {
            info!(
                post_url = %result.url,
                "Post published successfully"
            );
            Ok(result)
        }
        Err(e) => {
            error!(
                error_code = e.code(),
                error_message = %e,
                "Publish operation failed"
            );
            Err(e)
        }
    }
}
```

---

## Rotación de Logs

### Política de Retención

| Tipo de Log | Retención | Storage |
|-------------|-----------|---------|
| Errores (error/warn) | 30 días | DB + File |
| Info | 7 días | DB |
| Debug/Trace | 24 horas | File only |
| Éxitos de publicación | 90 días | DB (stats) |

### Implementación

```rust
pub struct LogRotator {
    max_days: u32,
    max_size_mb: u32,
}

impl LogRotator {
    pub async fn rotate(&self) -> Result<(), Error> {
        let cutoff = Utc::now() - Duration::days(self.max_days as i64);
        
        // Eliminar logs antiguos
        sqlx::query!(
            "DELETE FROM logs WHERE level = 'debug' AND created_at < ?",
            cutoff
        )
        .execute(&self.pool)
        .await?;
        
        // Comprimir archivo si excede tamaño
        let log_file = self.log_path.metadata()?.len();
        if log_file > (self.max_size_mb * 1024 * 1024) as u64 {
            self.compress_and_archive().await?;
        }
        
        Ok(())
    }
}
```

### Cron Job

```rust
// Ejecutar rotación diaria a las 3:00 AM
let scheduler = tokio_cron_scheduler::Job::new("0 0 3 * * *", |_, _| {
    Box::pin(async {
        log_rotator.rotate().await.expect("Log rotation failed");
    })
})?;
```

---

## Métricas y Dashboards

### Métricas Clave (KPIs)

#### Por Plataforma
- Posts publicados hoy / límite diario
- Tasa de éxito (últimas 24h)
- Tiempo promedio de publicación
- Errores por tipo (última semana)

#### Por Cuenta
- Posts en cola
- Último post publicado
- Estado de autenticación
- Rate limit remaining

#### Sistema
- Scheduler status (running/stopped)
- Cola de trabajos pendientes
- Uso de memoria/CPU
- Latencia de APIs externas

### Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  SOCIAL-PIP DASHBOARD                              🟢 All OK    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PLATFORM STATUS                    TODAY'S ACTIVITY            │
│  ┌─────────────┐                    Posts Published: 27        │
│  │ Facebook 🟢 │                    Posts Failed: 3            │
│  │ Instagram 🟢│                    Success Rate: 90%          │
│  │ Twitter  🟡 │                                                │
│  │ LinkedIn 🟢 │                    QUEUE STATUS                │
│  └─────────────┘                    Pending: 8                 │
│                                      Processing: 2             │
│  RATE LIMITS                        Scheduled: 15              │
│  Facebook: ████████░░ 80%                                      │
│  Instagram: ████░░░░░░ 40%          RECENT EVENTS              │
│  Twitter: ██████████ 100% ⚠️       12:34 - ✅ FB post published │
│  LinkedIn: ██░░░░░░░░ 20%          12:30 - ⚠️ TW rate limit    │
│                                     12:25 - ❌ IG auth failed  │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alert Rules Engine

### Configuración de Reglas

```yaml
# alert-rules.yaml
rules:
  - name: rate_limit_critical
    condition: "rate_limit_remaining <= 1"
    severity: warning
    channels: [slack, dashboard]
    cooldown: 30m
    
  - name: account_blocked
    condition: "account_status == 'blocked'"
    severity: critical
    channels: [slack, email, dashboard]
    cooldown: 0  # Inmediato
    
  - name: consecutive_failures
    condition: "consecutive_failures >= 3"
    severity: warning
    channels: [slack, dashboard]
    cooldown: 1h
    
  - name: auth_expired
    condition: "days_since_auth > 55"
    severity: warning
    channels: [email]
    cooldown: 24h
    
  - name: scheduler_stopped
    condition: "scheduler_status == 'stopped' AND scheduler_expected == 'running'"
    severity: critical
    channels: [slack, email]
    cooldown: 0
```

### Implementación del Engine

```rust
pub struct AlertRule {
    pub name: String,
    pub condition: AlertCondition,
    pub severity: Severity,
    pub channels: Vec<Channel>,
    pub cooldown: Duration,
}

impl AlertEngine {
    pub async fn evaluate(&self, event: &Event) -> Result<Option<Alert>, Error> {
        for rule in &self.rules {
            if rule.matches(event) && !self.is_in_cooldown(&rule.name) {
                let alert = Alert {
                    rule: rule.name.clone(),
                    severity: rule.severity,
                    message: self.format_message(rule, event),
                    channels: rule.channels.clone(),
                };
                
                self.set_cooldown(&rule.name, rule.cooldown);
                return Ok(Some(alert));
            }
        }
        Ok(None)
    }
    
    fn is_in_cooldown(&self, rule_name: &str) -> bool {
        self.cooldowns
            .get(rule_name)
            .map(|expires| Utc::now() < *expires)
            .unwrap_or(false)
    }
}
```

---

## Integración con Herramientas Gratuitas

### Opciones Recomendadas

| Propósito | Herramienta | Plan Gratuito |
|-----------|-------------|---------------|
| Dashboards | Grafana Cloud | 3 dashboards |
| Metrics | Prometheus | Self-hosted |
| Error Tracking | Sentry | 5k events/mes |
| Uptime | UptimeRobot | 50 monitors |
| Log Management | Loki | Self-hosted |
| APM | SigNoz | Self-hosted |

### Configuración de Sentry

```rust
// Inicializar Sentry al arrancar la app
let _guard = sentry::init(sentry::ClientOptions {
    dsn: env::var("SENTRY_DSN").ok().map(|d| d.parse().unwrap()),
    release: Some(env!("CARGO_PKG_VERSION").into()),
    environment: Some(env::var("ENVIRONMENT").unwrap_or_else(|_| "development".into())),
    traces_sample_rate: 0.2, // 20% de transacciones
    ..Default::default()
});

// Capturar errores automáticamente
#[instrument(skip(state))]
pub async fn publish_with_sentry(state: &AppState, post: &Post) -> Result<(), Error> {
    let transaction = sentry::start_transaction(sentry::TransactionContext::new(
        "publish_post",
        "http.request"
    ));
    
    let result = state.publisher.publish(post).await;
    
    match &result {
        Ok(_) => transaction.set_status(sentry::protocol::SpanStatus::Ok),
        Err(e) => {
            transaction.set_status(sentry::protocol::SpanStatus::InternalError);
            sentry::capture_error(e);
        }
    }
    
    transaction.finish();
    result
}
```

---

## Webhooks de Notificación

### Endpoint para Alertas Externas

```rust
#[derive(Debug, Deserialize)]
pub struct WebhookPayload {
    pub alert_name: String,
    pub severity: String,
    pub message: String,
    pub data: serde_json::Value,
}

#[post("/webhooks/alert")]
async fn receive_alert(
    payload: Json<WebhookPayload>,
    state: Data<AppState>,
) -> Result<HttpResponse, Error> {
    // Verificar autenticación
    let auth = request.headers().get("X-Webhook-Auth")
        .ok_or(Error::Unauthorized)?;
    
    if auth != state.config.webhook_secret {
        return Err(Error::Unauthorized);
    }
    
    // Procesar alerta
    state.alert_handler.handle(payload.into_inner()).await?;
    
    Ok(HttpResponse::Ok().json(json!({"status": "received"})))
}
```

---

## Checklist de Implementación

### Backend (Rust)
- [ ] Implementar sistema de logging con `tracing`
- [ ] Crear `AlertEngine` con reglas configurables
- [ ] Integrar Sentry para error tracking
- [ ] Implementar rotación de logs
- [ ] Crear endpoints de métricas para Prometheus

### Frontend (React)
- [ ] Dashboard de estado en tiempo real
- [ ] Lista de eventos recientes
- [ ] Indicadores de rate limit por plataforma
- [ ] Panel de configuración de alertas
- [ ] Vista de logs con filtros

### Infraestructura
- [ ] Configurar Slack webhook
- [ ] Configurar SMTP para emails
- [ ] Instalar Prometheus + Grafana (o usar Grafana Cloud)
- [ ] Configurar UptimeRobot para health checks
- [ ] Crear dashboards predefinidos

---

## Referencias

- [Tracing Documentation](https://docs.rs/tracing/latest/tracing/)
- [Sentry Rust SDK](https://docs.sentry.io/platforms/rust/)
- [Grafana Cloud Free Tier](https://grafana.com/products/cloud/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

---

*Última actualización: Abril 2026*
*Fuente: NotebookLM - Architectural Guide to N8N Automation*
