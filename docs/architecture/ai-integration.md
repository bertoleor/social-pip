# Integración de IA para Social-Pip

## Resumen

Social-Pip soporta dos proveedores de IA para caption generation:
1. **NVIDIA NIM** - API gratuita con +100 modelos
2. **Ollama** - Modelos locales 100% privados

---

## Proveedores de IA

### 1. NVIDIA NIM API (Gratis)

**Qué es:** API gratuita de NVIDIA con acceso a +100 modelos de lenguaje.

**Modelos recomendados para captions:**
| Modelo | Tamaño | Velocidad | Calidad |
|--------|--------|-----------|---------|
| `meta/llama-3.1-70b-instruct` |Grande |Media |Excelente |
| `mistralai/mixtral-8x7b-instruct-v0.1` |Medio |Rápida |Muy buena |
| `nvidia/nemotron-mini-4b-instruct` |Pequeño |Muy rápida |Buena |

**Cómo obtener API key:**
1. Ir a https://build.nvidia.com/
2. Click "Get API Key" (gratis, requiere cuenta NVIDIA)
3. Guardar la key en configuración

**Endpoint:**
```
https://integrate.api.nvidia.com/v1/chat/completions
```

**Precio:** $0 (gratis hasta ciertos límites)

**Docs:** https://docs.nvidia.com/nim/large-language-models/latest/

---

### 2. Ollama (Local, 100% Gratis)

**Qué es:** Ejecutar LLMs localmente en tu PC.

**Instalación:**
```powershell
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

**Modelos recomendados para captions:**
```bash
# Modelos ligeros (recomendados para captions)
ollama pull llama3.2           # 3GB - rápido, bueno
ollama pull qwen2.5:14b        # 10GB - excelente en español
ollama pull mistral            # 4GB - buena opción

# Modelos grandes (requiere GPU dedicada)
ollama pull llama3.1:70b       # 40GB - máxima calidad
```

**URL por defecto:** `http://localhost:11434`

**Precio:** $0 (usa tus recursos locales)

**Docs:** https://github.com/ollama/ollama

---

## Comparación

| Aspecto | NVIDIA NIM | Ollama (Local) |
|---------|-----------|----------------|
| **Costo** | $0 (API key gratis) | $0 (recursos locales) |
| **Internet** | Requiere | No requiere |
| **Velocidad** | Depende de conexión | Depende de CPU/GPU |
| **Privacidad** | Datos van a NVIDIA | Todo local |
| **GPU** | NVIDIA GPU cloud | Tu GPU local |
| **Setup** | API key → listo | Instalar + descargar modelo |

---

## Configuración

### Habilitar NVIDIA NIM

1. Obtener API key de https://build.nvidia.com/
2. En la app, ir a Settings → AI Configuration
3. Seleccionar "NVIDIA NIM"
4. Ingresar API key
5. Seleccionar modelo
6. Habilitar "Enable"

### Habilitar Ollama

1. Instalar Ollama
2. Descargar modelo: `ollama pull llama3.2`
3. En la app, ir a Settings → AI Configuration
4. Seleccionar "Ollama"
5. Verificar URL (por defecto: http://localhost:11434)
6. Seleccionar modelo descargado
7. Habilitar "Enable"

---

## Prompt para Captions

**System prompt por defecto:**
```
Eres un copywriter argentino profesional. Escribís captions cortos, persuasivos y naturales para redes sociales. 

Reglas:
- Usás emojis pero no abusás (1-3 por caption)
- El tono es cercano pero profesional
- Usás hashtags solo si es relevante (máx 5)
- Incluís call-to-action al final
- Para inmobiliarios: destacás precio, ubicación, características
- Para servicios: destacás beneficio, disponibilidad, contacto
- Para productos: destacás calidad, precio, diferencia
```

**Ejemplo de uso:**
```
Input: "Departamento 2 ambientes Palermo, $150.000 USD, 45m2"

Output generado:
✨ OPORTUNIDAD EN PALERMO ✨

2 ambientes • 45m² • $150.000

La ubicación que buscás, al precio que necesitás.

📍 Palermo, Buenos Aires
💰 $150.000 (USD)
📐 45 metros cuadrados

¡Planificá tu futuro hoy!

📱 Escribinos para visitarlo

#inmobiliario #palermo #departamento #inversion
```

---

## API de Uso

### Desde Rust (Anti-Ban Engine)

```rust
// Obtener caption generado
let caption = ai_service::generate_caption(
    "Departamento 2 ambientes Palermo $150.000",
    "instagram"
).await;
```

### Desde TypeScript (Frontend)

```typescript
// Generar caption
const caption = await invoke<string>('generate_caption', {
    content: "Departamento en Palermo",
    platform: "instagram",
    style: "professional" // professional, casual, emoji
});
```

---

## Configuración en Base de Datos

```prisma
model AIConfig {
  provider        AIProvider  // NVIDIA_NIM o OLLAMA
  modelName       String      // modelo a usar
  apiKey          String?     // solo para NVIDIA
  endpoint        String?     // custom endpoint
  ollamaUrl       String      // URL de Ollama
  isEnabled       Boolean
  isDefault       Boolean
  temperature     Float       // Creativity (0.1-1.0)
  maxTokens       Int         // Longitud máx
  systemPrompt    String      // Prompt base
}
```

---

## Rate Limits y Best Practices

### NVIDIA NIM
- **Límite:** ~500K invocaciones/mes (gratis)
- **Recomendación:** Cache captions similares
- **Fallback:** Si falla, usar templates locales

### Ollama
- **Sin límite** (usa tus recursos)
- **Recomendación:** GPU dedicada recomendada para 70B
- **Fallback:** Modelos pequeños (3B-7B) funcionan en CPU

---

## Troubleshooting

### "Connection refused" (Ollama)
```bash
# Verificar que Ollama está corriendo
ollama list

# Si no está, iniciarlo
ollama serve
```

### "Invalid API Key" (NVIDIA NIM)
- Verificar que la key no expiró
- Ir a https://build.nvidia.com/ para regenerar

### "Model not found" (Ollama)
```bash
# Descargar el modelo
ollama pull llama3.2
```

---

## Próximos Pasos

1. ✅ Configurar schema de DB con AI models
2. ✅ AI service en Rust (ai_service.rs implementado)
3. ✅ UI para configurar AI (en frontend)
4. ✅ Integrar con caption generation (vía OpenCode + n8n)

---

## Integración con OpenCode para Caption Generation

### Flujo de Generación de Caption

```
OpenCode → n8n Workflow → AI Service (NVIDIA NIM/Ollama) → Caption Output
```

### Configuración en n8n Workflow

```json
{
  "name": "SP - AI Caption Generator",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "generate-caption"
      }
    },
    {
      "id": "opencode",
      "name": "OpenCode AI",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-caption/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{'Genera caption para: ' + $json.producto + '. Sector: ' + $json.sector + '. Aplica Manual de Marca.'}}"
                }
              ]
            }
          ]
        }
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json.parts[0].content}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "OpenCode AI", "type": "main", "index": 0 }]] },
    "OpenCode AI": { "main": [[{ "node": "Respond", "type": "main", "index": 0 }]] }
  }
}
```

### Uso desde OpenCode

```typescript
// Custom tool para generar caption
export const generate_caption = tool({
  description: "Genera caption usando AI via n8n",
  args: {
    producto: tool.schema.string(),
    sector: tool.schema.string(),
    plataforma: tool.schema.string()
  },
  async execute({ producto, sector, plataforma }) {
    const response = await fetch('http://localhost:5678/webhook/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto, sector, plataforma })
    });
    return response.json();
  }
});
```

### Ejemplo de Prompt para OpenCode

```
Eres un copywriter argentino profesional. Genera un caption corto y persuasivo para redes sociales.

Datos del producto:
- Producto: {producto}
- Sector: {sector}
- Plataforma: {plataforma}

Requisitos:
- Usa emojis pero máximo 3
- Incluye call-to-action
- Hashtags relevantes (máx 5)
- Aplica tono profesional pero cercano
- Para inmobiliario: destaca precio, ubicación, características
```

---

## AI Agents por Plataforma

### Concepto

En lugar de un solo prompt genérico,我们可以 crear **agentes especializados** para cada plataforma social. Cada agente tiene su propio system prompt con reglas específicas de formato, tono y límites.

### Agentes por Plataforma

#### 1. LinkedIn Agent

```typescript
const linkedinAgent = {
  name: "LinkedIn Professional",
  systemPrompt: `
Eres un copywriter profesional para LinkedIn Argentina/LATAM.

Reglas:
- Formato: Primero hook (línea que-stop), luego desarrollo, después call-to-action
- Largo: 1500-3000 caracteres
- Usar emojis sparingly (1-2) - profesional pero no aburrido
- Hashtags: 3-5 relevantes (ej: #negocios, #inmobiliario, #servicios)
- Nunca usar mayúsculas excesivas
- Evitar lenguaje demasiado informal
- Incluir espacios entre párrafos
- Fin con pregunta o invitación a comentar
`.trim()
};
```

**Ejemplo de output:**
```
¿Sabías que el 80% de los departamentos en Palermo se rentan amueblados?

Hace 3 años armé un negocio con $5000 de inversión.
Hoy manejo +20 propiedades y facturo $15.000/mes.

El secreto no fue el capital.
Fue entender qué necesitaban los propietarios.

➤ ¿Te cuento cómo lo hice?
➤ Dejá tu comentarios y te paso el método sin costo.

PD: Si manejás propiedades en CABA, tengo una oportunidad para vos.
```

---

#### 2. Twitter/X Agent

```typescript
const twitterAgent = {
  name: "Twitter Thread Creator",
  systemPrompt: `
Eres un especialista en Twitter/X threads Argentina/LATAM.

Reglas:
- Formato: Thread de 5-15 tweets
- Primer tweet: Hook fuerte con números o pregunta controversial
- Cada tweet: 200-280 caracteres (contar espacios)
- Usar emojis relevantes (1-2 por tweet)
- Incluir "🧵" en primer tweet
- Llamadas: "1/" "2/" "3/" al inicio
- CTAs: "Seguí para más" "Rt si te sirve"
- Evitar links en primeros tweets
- Hashtags: 1-2 máximo por tweet
`.trim()
};
```

**Estructura de thread:**
```
🧵 Cómo duplicé mis clientes en 30 días (sin publicidad)

1/ El error que comete el 90% de los profesionales:
tratar de vender a todos en vez de especializarse.

2/ Mi cliente ideal no era "todo el mundo".
Era el dueño de negocio que:
• Ya había intentado de todo
• Tiene presupuesto
• Está cansado de resultados mediocres

3/ El cambio más importante:
de "qué vendo" a "a quién resuelvo un problema"

[...continúa...]
```

---

#### 3. Instagram Agent

```typescript
const instagramAgent = {
  name: "Instagram Caption Expert",
  systemPrompt: `
Eres un copywriter para Instagram Argentina/LATAM.

Reglas:
- Primera línea: Emoji + texto que-stop (máx 125 caracteres)
- Cuerpo: 2-4 oraciones cortas, separadas por líneas en blanco
- Emoji: 3-5 emojis que representen el contenido
- Llamado: "📝" o "💬" antes del CTA
- CTA: Pregunta que genere comentarios
- Hashtags: 5-10 (mezclar populares con nicho)
- Alternar entre mayúsculas para énfasis (sparse)
- Incluir ubicación cuando sea relevante
`.trim()
};
```

**Ejemplo:**
```
✨ No compres ese departamento hasta leer esto

En Palermo hay 3 zonas donde el precio cayó 15%
y los alquileres siguen iguales.

Te paso cuáles son y por qué es la oportunidad
del año para inversores.

📝 ¿Querés la guía completa de zonas?
```

---

#### 4. Facebook Agent

```typescript
const facebookAgent = {
  name: "Facebook Engagement",
  systemPrompt: `
Eres un copywriter para Facebook Argentina/LATAM.

Reglas:
- Largo: 500-2000 caracteres (Facebook penaliza muy largos)
- Tono: Conversacional, como si hablaras con un amigo
- Emojis: 2-4, muy relevantes al contenido
- Primera línea: Importante (Facebook muestra solo las primeras líneas)
- Preguntas: Sí, generan más engagement
- Hashtags: 3-5, menos es más en FB
- Incluir experiencia personal/historia
- Evitar CTAs agresivos
- Fin con pregunta abierta
`.trim()
};
```

---

#### 5. WhatsApp Business Agent

```typescript
const whatsappAgent = {
  name: "WhatsApp Business Messages",
  systemPrompt: `
Eres un asistente para WhatsApp Business Argentina/LATAM.

Reglas:
- Largo máximo: 1 mensaje de texto (evitar mensajes largos)
- Tono: Muy cercano, como un amigo que ajuda
- Usar saltos de línea para legibilidad
- Incluir emoji al inicio del mensaje
- Siempre terminar con pregunta o opción
- Para catálogos: descripción breve + imagen
- Para seguimientos: recordatorio no invasivo
- No usar mayúsculas (parece gritar)
- Incluir horario de respuesta
`.trim()
};
```

**Ejemplo de mensaje inicial:**
```
✨ Hola! Soy de [Nombre de tu negocio]

Te escribo porque vi que estabas buscando
departamentos en Palermo.

Tengo exactamente lo que necesitás:
📍 3 ambientes, Villa Crespo
💰 $180.000 (negoociable)
📐 65m² con balcón

Te paso fotos? 👇
```

---

### Tabla Comparativa de Plataformas

| Plataforma | Largo | Emojis | Hashtags | CTA |
|------------|-------|--------|----------|-----|
| LinkedIn | 1500-3000 | 1-2 | 3-5 | Pregunta |
| Twitter/X | 200-280/tweet | 1-2 | 1-2 | "Seguí" |
| Instagram | 125 hook + cuerpo | 3-5 | 5-10 | Pregunta |
| Facebook | 500-2000 | 2-4 | 3-5 | Pregunta |
| WhatsApp | 1 mensaje | 1-2 | N/A | Opción |

---

### Configuración en la App

```typescript
// Tipos de agente disponibles
type PlatformAgent = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'whatsapp';

// Sistema de selección automática
const getAgentForPlatform = (platform: string): PlatformAgent => {
  const agents: Record<string, PlatformAgent> = {
    linkedin: 'linkedin',
    'twitter-x': 'twitter',
    'twitter': 'twitter',
    instagram: 'instagram',
    facebook: 'facebook',
    'whatsapp-business': 'whatsapp'
  };
  return agents[platform] || 'instagram';
};
```

---

### Warmup de Agentes

Los agentes mejoran con uso. Métricas a trackear:

- **Engagement rate** por agente
- ** CTR** de links
- **Comentarios** generados
- **Shares**

Ajustar prompts según resultados.

---

## Referencias

- NVIDIA NIM: https://docs.nvidia.com/nim/large-language-models/latest/
- Ollama: https://github.com/ollama/ollama
- Modelos disponibles: https://build.nvidia.com/explore/discover
- OpenCode Server: http://localhost:4096/docs

---

*Última actualización: Abril 2026*