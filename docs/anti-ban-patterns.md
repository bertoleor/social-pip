# Anti-Ban Patterns - Social-Pip

> Patrones probados para automatización de redes sociales sin ser bloqueado
> Basado en: NotebookLM - Architectural Guide to N8N Automation

---

## Principios Fundamentales

### 1. Batch Limiting Estricto

**Regla de Oro**: Procesar UN item por ejecución.

```
❌ MAL: Publicar 10 posts seguidos
✅ BIEN: 1 post por ejecución, con pausa entre ejecuciones
```

**Implementación en n8n:**
```
Nodo: Limit
Configuración: Max Items = 1
Resultado: Solo pasa el primer item, ignora el resto
```

**Implementación en Rust:**
```rust
pub struct BatchConfig {
    pub max_items_per_run: u32,  // SIEMPRE 1
    pub pause_between_runs_ms: u64,
}
```

### 2. Frecuencias Espaciadas por Plataforma

Cada red social tiene límites diferentes. Respetarlos es CRÍTICO.

| Plataforma | Min Delay | Max Posts/Día | Ventana Horaria | Recomendación |
|------------|-----------|---------------|-----------------|---------------|
| **Facebook** | 30 min | 10 | 9:00 - 21:00 | 3 posts/día máximo |
| **Instagram** | 45 min | 5 | 10:00 - 20:00 | 2 posts/día máximo |
| **Twitter/X** | 15 min | 20 | 8:00 - 22:00 | 5 posts/día máximo |
| **LinkedIn** | 60 min | 3 | 9:00 - 18:00 | 1 post/día (días laborales) |
| **TikTok** | 30 min | 5 | 12:00 - 22:00 | 2 posts/día máximo |
| **Telegram** | 5 min | 50 | 24/7 | 10 mensajes/día máximo |
| **WhatsApp** | 10 min | 20 | 24/7 | 5 mensajes/día máximo |

### 3. Control de Estado para Evitar Duplicados

**Patrón**: Base de datos como fuente de verdad.

```
Estados del Post:
├── pending → listo para procesar
├── processing → en ejecución (lock)
├── published → completado exitosamente
├── failed → error (retry manual)
└── cancelled → cancelado por usuario
```

**Implementación:**
```
1. Schedule Trigger ejecuta cada X minutos
2. Query: SELECT * FROM posts WHERE status = 'pending' LIMIT 1
3. Update status = 'processing'
4. Ejecutar publicación
5. Update status = 'published' o 'failed'
```

### 4. Revisión Humana (Draft Mode)

Para cuentas críticas, agregar checkpoint humano.

```
Flujo con Draft:
├── Generar contenido
├── Guardar como draft
├── Notificar humano (Slack/Email)
├── Esperar aprobación
└── Publicar si approved
```

### 5. Evitar Comportamiento Robótico

**Señales de alerta para las plataformas:**
- ❌ Publicar exactamente a la misma hora todos los días
- ❌ Usar el mismo texto en múltiples posts
- ❌ Publicar sin imágenes regularmente
- ❌ No interactuar con otros usuarios

**Buenas prácticas:**
- ✅ Variar horarios con `variance` (±15 min)
- ✅ Rotar templates de contenido
- ✅ Incluir multimedia siempre
- ✅ Responder comentarios manualmente

---

## Rate Limits por API

### Facebook Graph API
```
Limit: 200 calls/hour per app
Per User: Variable (depende de score)
Penalty: 24-72 horas de bloqueo
```

### Instagram Graph API
```
Limit: 200 calls/hour per app
Per User: 25 posts/day máximo recomendado
Penalty: Shadowban (posts no aparecen)
```

### Twitter/X API v2
```
Free Tier: 450 requests/15min (user auth)
Posts: 50 tweets/day (recomendado < 20)
Penalty: Cuenta suspendida temporalmente
```

### LinkedIn API
```
Limit: 100,000 requests/day
Posts: 10 posts/day máximo recomendado
Penalty: Restricción de API
```

### TikTok API
```
Limit: Variable por cuenta
Posts: 5 videos/day máximo
Penalty: Shadowban o cuenta suspendida
```

---

## Patrones de Error Handling

### Rate Limit Detectado

```
1. Recibir HTTP 429 (Too Many Requests)
2. Leer header Retry-After
3. Actualizar PlatformConfig.rateLimitedUntil
4. Pausar scheduler hasta esa fecha
5. Alertar via Slack/Telegram
```

### Cuenta Bloqueada

```
1. Detectar HTTP 403 o error específico
2. Actualizar Account.status = 'BANNED'
3. Detener todos los posts pendientes
4. Alertar URGENTE al usuario
5. Documentar causa probable
```

### Shadowban Detectado

```
1. Monitorear engagement (likes/views)
2. Si cae >80% por 3 días consecutivos
3. Marcar cuenta como 'RESTRICTED'
4. Reducir frecuencia a 1 post/día
5. Esperar 7 días antes de intensificar
```

---

## Arquitectura Anti-Ban en Social-Pip

### Nivel 1: Scheduler (Rust)

```rust
pub struct AntiBanScheduler {
    platform: Platform,
    min_delay_ms: u64,
    max_delay_ms: u64,
    hourly_limit: u32,
    daily_limit: u32,
    current_hourly_count: u32,
    current_daily_count: u32,
}

impl AntiBanScheduler {
    pub fn can_execute(&self) -> Result<Duration, AntiBanError> {
        if self.current_hourly_count >= self.hourly_limit {
            return Err(AntiBanError::HourlyLimitExceeded);
        }
        if self.current_daily_count >= self.daily_limit {
            return Err(AntiBanError::DailyLimitExceeded);
        }
        let delay = self.random_delay();
        Ok(delay)
    }
}
```

### Nivel 2: DB State Management

```prisma
model PlatformConfig {
  platform Platform @unique
  
  maxPostsPerDay Int @default(20)
  minDelaySeconds Int @default(60)
  maxDelaySeconds Int @default(240)
  
  batchSize Int @default(5)
  batchBreakMinutes Int @default(20)
}

model AntiBanEvent {
  id String @id @default(cuid())
  eventType String  // 'rate_limit', 'block', 'shadowban', 'warning'
  details String?
  accountId String
  timestamp DateTime @default(now())
}
```

### Nivel 3: n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "mode": "every",
        "hour": 9,
        "minute": 0
      }
    },
    {
      "name": "Get Pending Posts",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.SOCIAL_PIP_API}}/posts/pending",
        "queryParameters": {
          "limit": 1
        }
      }
    },
    {
      "name": "Limit to 1",
      "type": "n8n-nodes-base.limit",
      "parameters": {
        "maxItems": 1
      }
    },
    {
      "name": "Check Anti-Ban",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.SOCIAL_PIP_API}}/anti-ban/check",
        "queryParameters": {
          "account_id": "{{$json.accountId}}",
          "platform": "{{$json.platform}}"
        }
      }
    },
    {
      "name": "Publish Post",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "rules": [
          {"value": "facebook", "output": 0},
          {"value": "instagram", "output": 1},
          {"value": "twitter", "output": 2}
        ]
      }
    }
  ]
}
```

---

## Monitoreo Anti-Ban

### Métricas a Trackear

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Posts/hora | >80% del límite | Warning |
| Engagement drop | >50% en 24h | Alert |
| API errors | >3 en 1 hora | Critical |
| Account age | <30 días | Warm-up mode |

### Dashboard de Estado

```
┌─────────────────────────────────────────────────────────────────┐
│  ANTI-BAN DASHBOARD                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Platform: Facebook                                             │
│  Account: MiNegocioBA                                          │
│                                                                 │
│  ┌──────────────┬──────────────┬──────────────┐               │
│  │ Posts Hoy    │ Límite Hora  │ Próximo Post │               │
│  │ 3/10         │ 60% usado    │ 14:32 ±15min │               │
│  └──────────────┴──────────────┴──────────────┘               │
│                                                                 │
│  ⚠️ Warning: Engagement bajo en últimos 3 posts                │
│                                                                 │
│  Status: ✅ Healthy                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Warm-Up de Cuentas Nuevas

### Proceso de Warm-Up (30 días)

```
Semana 1:
├── 1 post cada 3 días
├── Horarios: 10:00, 14:00, 18:00 (rotar)
└── Solo contenido original

Semana 2:
├── 1 post cada 2 días
├── Responder 5 comentarios manualmente
└── Interactuar con 3 cuentas similares

Semana 3:
├── 1 post por día
├── 2 stories por día
└── Responder todos los comentarios

Semana 4:
├── 2 posts por día
├── Incrementar interacción
└── Automatización gradual

Día 30+: Normalizar a configuración estándar
```

---

## Checklist Pre-Publicación

Antes de cada post automatizado, verificar:

- [ ] Cuenta no está en warm-up (o está en fase correcta)
- [ ] No se alcanzó límite diario
- [ ] No se alcanzó límite horario
- [ ] Delay desde último post cumple mínimo
- [ ] No hay alertas activas para la cuenta
- [ ] Contenido es único (no duplicado)
- [ ] Horario está dentro de ventana recomendada
- [ ] No hay rate limit activo

---

## Referencias

- NotebookLM: Architectural Guide to N8N Automation
- Facebook Graph API Documentation
- Instagram Platform Guidelines
- Twitter API Rate Limits
- LinkedIn API Best Practices

---

*Última actualización: Abril 2026*
