# Estrategia Anti-Ban para Facebook — 2026

## Cómo Detecta Facebook la Automatización

Facebook NO usa límites fijos publicados. Usa **detección de patrones de comportamiento**:

### Los 5 Triggers Principales

1. **Speed Bursts** (Trigger #1)
   - Publicar demasiado rápido en ventana corta
   - Posts consecutivos sin pausa natural

2. **Contenido Duplicado**
   - Mismo texto + mismo link + misma imagen en múltiples grupos
   - Patrón repetitivo que grita "bot"

3. **Comportamiento Link-Heavy**
   - Solo posts con links externos
   - Dominios que Facebook no confía
   - Previews rotos o que cargan lento

4. **Señales de Cuenta de Baja Confianza**
   - Cuentas nuevas con alta actividad
   - Cambios recientes de IP/dispositivo
   - Eventos de seguridad recientes

5. **Feedback Negativo**
   - Posts reportados como spam
   - Posts ocultados por usuarios
   - Pocas interacciones positivas

---

## Límites Seguros por Cuenta (2026)

### Grupos
- **Máximo diario**: 15-20 posts
- **Delay entre posts**: 60-240 segundos (RANGO aleatorio)
- **Batch break**: Cada 5-10 posts, pausa de 15-30 minutos
- **Pausa entre campañas**: 2-4 horas mínimo

### Marketplace
- **Máximo diario**: 5-10 listings
- **Delay entre listings**: 30-60 segundos (RANGO aleatorio)
- **Pausa entre sesiones**: 2-4 horas mínimo

### Cuentas Nuevas
- **Período de warm-up**: 2-4 semanas antes de automatizar
- **Primera semana**: 5 grupos/día máximo
- **Segunda semana**: 10 grupos/día
- **Tercera semana**: 15 grupos/día
- **Cuarta semana**: Escalar gradualmente a 20

---

## Protecciones a Implementar (100% Gratuitas)

### 1. Delay Ranges (NO delays fijos)
```python
# MAL: siempre 30 segundos
time.sleep(30)

# BIEN: rango aleatorio
import random
time.sleep(random.uniform(60, 240))  # 1-4 minutos
```

### 2. Caption Rotation (3-5 variantes mínimo + spintax)
Cada post debe tener variaciones:
- Diferente línea de apertura
- Diferente orden de puntos
- Ligeramente diferente CTA
- Variaciones opcionales de emojis (no abusar)
- Spintax para variaciones dentro de cada variante

### 3. Batch Breaks
```
Posts 1-5: delay 60-120s
→ Pausa larga: 15-20 min
Posts 6-10: delay 90-180s
→ Pausa larga: 20-30 min
Posts 11-15: delay 120-240s
→ FIN de campaña
```

### 4. Value/Link Mix
- 60% posts de valor (tips, guías, imágenes sin link)
- 40% posts con link
- NUNCA todos los posts con link

### 5. Detección de Rate Limits
- Detectar mensaje: "We limit how often you can post..."
- Acción: PAUSAR inmediatamente
- Esperar: 24-72 horas
- Reanudar: más lento, con más variación

### 6. Perfiles de Navegador Separados
- Cada cuenta = perfil de navegador independiente
- NUNCA loguear múltiples cuentas en el mismo perfil
- Usar persistent context de Playwright

### 7. Fingerprint por Cuenta (Gratis)
- User agent diferente por cuenta
- Viewport diferente por cuenta
- Timezone/locale consistente con la ubicación
- Geolocation realista (ciudad argentina)

### 8. Comportamiento Humano Simulado
- Scroll aleatorio antes de publicar
- Pausas aleatorias entre acciones
- Movimiento de mouse natural (no teleport al elemento)

---

## Qué NO Hacer (High-Risk)

❌ Publicar mismo texto en muchos grupos seguidos
❌ Usar delays muy cortos o sin delays
❌ Compartir links que Facebook no puede previsualizar
❌ Publicar desde cuenta nueva a alto volumen
❌ Ignorar warnings de Facebook
❌ Hacer push después de recibir limitación
❌ Usar mismo fingerprint de browser para todas las cuentas
❌ Usar VPS cloud sin proxy residencial
❌ Usar servicios de pago para "anti-ban"

---

## Qué SÍ Hacer (Safer)

✅ Usar delay ranges, no delays fijos
✅ Agregar pausas más largas después de algunos grupos
✅ Rotar 3-5 variantes de caption + spintax
✅ Mezclar posts de valor con posts con link
✅ Empezar pequeño: test con 5-10 grupos antes de escalar
✅ Tomar breaks entre campañas grandes
✅ Verificar links manualmente antes de campaña grande
✅ Parar inmediatamente si Facebook muestra warnings
✅ Usar cuentas secundarias, no la principal
✅ Ejecutar localmente (IP residencial + fingerprint genuino)
✅ Fallback visual gratuito (OpenCV + Tesseract) ante fallos de selectores

---

## Checklist de Seguridad Pre-Campaña

- [ ] Solo posting en grupos relevantes
- [ ] Delay es un RANGO, no fijo
- [ ] Al menos 3 variantes de caption + spintax
- [ ] Link preview testeado manualmente una vez
- [ ] Primera ejecución pequeña (warm-up) antes de escalar
- [ ] Parar inmediatamente si Facebook muestra rate-limit warnings
- [ ] Cuenta tiene antigüedad suficiente (2-4 semanas mínimo)
- [ ] Perfil de navegador separado para esta cuenta
- [ ] Fingerprint único por cuenta (user agent, viewport, timezone)
- [ ] Templates de botones capturados para fallback visual

---

## Duración de Restricciones

Facebook no publica duraciones fijas. Reportes de la comunidad:
- **Primera vez**: Horas a 1-3 días
- **Reincidencia**: Días a semanas
- **Persistir después del warning**: Semanas a meses (posible ban permanente)

**Regla de oro**: Si ves el warning, PARÁ. No sigas. Es cómo una restricción temporal se convierte en permanente.

---

## Integración con Rust Anti-Ban Engine

Social-Pip implementa toda esta estrategia en el motor anti-ban de Rust (`src-tauri/src/anti_ban/`).

### Configuración por Plataforma

```rust
// src-tauri/src/anti_ban/config.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformConfig {
    pub platform: String,
    pub max_posts_per_day: u32,
    pub min_delay_ms: u64,
    pub max_delay_ms: u64,
    pub batch_size: u32,
    pub batch_break_minutes: u32,
    pub warmup_weeks: u32,
}

pub fn facebook_config() -> PlatformConfig {
    PlatformConfig {
        platform: "facebook".to_string(),
        max_posts_per_day: 15,        // 15-20 posts/día
        min_delay_ms: 60_000,          // 60 segundos mínimo
        max_delay_ms: 240_000,        // 240 segundos máximo
        batch_size: 5,                 // 5 posts por batch
        batch_break_minutes: 15,       // 15-30 min break
        warmup_weeks: 2,               // 2-4 semanas warm-up
    }
}
```

### Delay con Jitter

```rust
// src-tauri/src/anti_ban/delays.rs
use rand::Rng;

pub fn calculate_post_delay(config: &PlatformConfig) -> u64 {
    let mut rng = rand::thread_rng();
    
    // Delay base aleatorio entre min y max
    let base_delay = rng.gen_range(config.min_delay_ms..config.max_delay_ms);
    
    // Agregar jitter del 10-20%
    let jitter_percentage = rng.gen_range(10..20) as f64 / 100.0;
    let jitter = (base_delay as f64 * jitter_percentage) as u64;
    
    // Jitter puede ser positivo o negativo
    let jitter_direction: i64 = if rng.gen_bool(0.5) { 1 } else { -1 };
    let jitter = jitter as i64 * jitter_direction;
    
    let final_delay = base_delay as i64 + jitter;
    
    // Asegurar que no sea menor al mínimo
    final_delay.max(config.min_delay_ms as i64) as u64
}
```

### Batch Breaks

```rust
// src-tauri/src/anti_ban/batch_manager.rs
pub struct BatchManager {
    posts_in_current_batch: u32,
    last_batch_time: Option<DateTime<Utc>>,
    config: PlatformConfig,
}

impl BatchManager {
    pub fn should_take_break(&self) -> bool {
        let batch_limit = self.config.batch_size;
        
        if self.posts_in_current_batch >= batch_limit {
            // Verificar si pasaron los minutos de break
            if let Some(last_break) = self.last_batch_time {
                let break_duration = last_break.signed_duration_since(Utc::now());
                let min_break = Duration::minutes(self.config.batch_break_minutes as i64);
                
                return break_duration >= min_break;
            }
            return true;
        }
        
        false
    }
    
    pub fn calculate_batch_delay(&self) -> u64 {
        // Delay más largo entre batches
        let mut rng = rand::thread_rng();
        let min = self.config.batch_break_minutes * 60 * 1000; // a ms
        let max = (self.config.batch_break_minutes + 15) * 60 * 1000;
        rng.gen_range(min..max)
    }
}
```

### Detección de Rate Limit Warning

```rust
// src-tauri/src/anti_ban/detector.rs
pub fn detect_rate_limit_warning(page_text: &str) -> Option<RateLimitWarning> {
    let warning_patterns = [
        "We limit how often you can post",
        "You've reached a limit",
        "暂时无法发布",
        "You can't post right now",
    ];
    
    for pattern in warning_patterns {
        if page_text.contains(pattern) {
            return Some(RateLimitWarning {
                detected_at: Utc::now(),
                message: pattern.to_string(),
            });
        }
    }
    
    None
}

#[derive(Debug, Clone)]
pub struct RateLimitWarning {
    pub detected_at: DateTime<Utc>,
    pub message: String,
}
```

### Uso desde Tauri Commands

```rust
// src-tauri/src/commands/posts.rs
#[tauri::command]
pub async fn execute_post(
    state: State<'_, AppState>,
    account_id: String,
    platform: String,
    content: String,
    target: String,
) -> Result<PostResult, String> {
    // 1. Verificar rate limits
    let limiter = state.anti_ban.get_rate_limiter(&platform);
    limiter.check(&account_id).await
        .map_err(|e| format!("Rate limit: {}", e))?;
    
    // 2. Verificar batch break
    let batch_manager = state.anti_ban.get_batch_manager(&account_id);
    if batch_manager.should_take_break() {
        let delay = batch_manager.calculate_batch_delay();
        tokio::time::sleep(Duration::from_millis(delay)).await;
    }
    
    // 3. Calcular delay con jitter
    let config = state.anti_ban.get_config(&platform);
    let delay = calculate_post_delay(&config);
    tokio::time::sleep(Duration::from_millis(delay)).await;
    
    // 4. Enviar a la extensión para ejecutar
    let result = state.extension_executor.execute(content, target).await?;
    
    // 5. Registrar acción
    state.anti_ban.record_action(&account_id, &platform);
    
    Ok(result)
}
```

### Warmup de Cuentas Nuevas

```rust
// src-tauri/src/anti_ban/warmup.rs
pub struct WarmupTracker {
    account_id: String,
    start_date: DateTime<Utc>,
    current_week: u32,
    posts_this_week: u32,
}

impl WarmupTracker {
    pub fn get_max_posts_today(&self) -> u32 {
        match self.current_week {
            1 => 5,   // Semana 1: 5 posts/día
            2 => 10,  // Semana 2: 10 posts/día
            3 => 15,  // Semana 3: 15 posts/día
            _ => 20,  // Semana 4+: 20 posts/día
        }
    }
    
    pub fn can_post(&self) -> bool {
        self.posts_this_week < self.get_max_posts_today()
    }
}
```

---

## Referencias

- Anti-Ban Engine: `apps/desktop/src-tauri/src/anti_ban/`
- Content Scripts: `apps/extension/src/content/facebook/`
- Config docs: `docs/architecture/main-architecture.md`
