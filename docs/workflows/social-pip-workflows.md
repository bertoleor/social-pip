# Workflows Base de Social-Pip

## Resumen

Este documento presenta los workflows base de n8n que Social-Pip utiliza para automatización de posting. Cada workflow está diseñado para un propósito específico y puede ser gestionado completamente desde OpenCode.

---

## 1. Workflow: Posting Programado Diario

### 1.1 Descripción

Este workflow publica contenido automáticamente a una hora específica cada día.

### 1.2 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW: DAILY POSTING - SOCIAL-PIP                               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │   SCHEDULE │      │  VALIDATE   │      │   GENERATE  │      │    APPLY    │
     │   TRIGGER  │─────▶│   CONTENT   │─────▶│   (AI/Open  │─────▶│  MANUAL DE  │
     │             │      │             │      │    CODE)    │      │    MARCA    │
     │ Cron:       │      │ • Content   │      │ • Caption   │      │ • Brand     │
     │ 0 9 * * *   │      │   required  │      │   generation│      │   rules     │
     │             │      │ • Platform  │      │ • Platform  │      │ • Emoji     │
     │             │      │   limits    │      │   context   │      │   limit     │
     └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
           │                    │                    │                    │
           │                    │                    │                    │
           ▼                    ▼                    ▼                    ▼
     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │   SCHEDULE  │      │   ERROR IF  │      │   ERROR IF  │      │    STORE   │
     │    NEXT     │      │  VALIDATION│      │   AI FAIL   │      │    RESULT   │
     │  EXECUTION  │      │   FAIL      │      │             │      │             │
     └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                                    │
                                    │ IF SUCCESS
                                    ▼
                          ┌─────────────────┐
                          │    POST TO     │
                          │   PLATFORM     │
                          │   (Facebook,   │
                          │  Instagram,    │
                          │  Twitter, etc) │
                          └─────────────────┘
```

### 1.3 Detalle de Nodos

| Nodo | Función | Input | Output | Error Handling |
|------|---------|-------|--------|----------------|
| Schedule Trigger | Dispara a la hora configurada | Cron expression | Post data | N/A |
| Validate Content | Verifica contenido y límites | Post data | Validated post | Si falla → berhenti |
| Generate Content | Llama a OpenCode para caption | Prompt + context | Generated caption | Continue to error |
| Apply Manual de Marca | Aplica reglas de brand | Generated content | Brand-compliant | Continue |
| Post to Platform | Publica en la plataforma | Final content | Post result | Retry 3x |

### 1.4 Estructura del Workflow

```json
{
  "name": "SP - Daily Posting - {{$json.platform}}",
  "nodes": [
    {
      "id": "schedule",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "cronExpression": "{{$json.cronExpression || '0 9 * * *'}}"
            }
          ]
        }
      }
    },
    {
      "id": "validate",
      "name": "Validate Content",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const item = $input.first().json;\n\n// Validate required fields\nif (!item.content) {\n  throw new Error('Content is required');\n}\n\n// Check character limits based on platform\nconst limits = {\n  facebook: 63206,\n  instagram: 2200,\n  twitter: 280,\n  linkedin: 3000,\n  tiktok: 2200\n};\n\nconst platform = item.platform || 'facebook';\nconst limit = limits[platform] || 63206;\n\nif (item.content.length > limit) {\n  throw new Error(`Content exceeds ${platform} limit of ${limit} characters`);\n}\n\nreturn { json: { ...item, validated: true } };"
      }
    },
    {
      "id": "generate",
      "name": "Generate Content (OpenCode)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-posting/prompt_async",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{$json.prompt || 'Genera un caption para posting en ' + $json.platform}}"
                }
              ]
            }
          ]
        }
      },
      "onError": "continueErrorOutput"
    },
    {
      "id": "apply_manual",
      "name": "Apply Manual de Marca",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const item = $input.first().json;\n\n// Apply brand rules from Manual de Marca\nconst brandRules = {\n  tone: 'profesional pero cercano',\n  emojis: 'maximo 3 por post',\n  hashtags: 'maximo 5, relevantes',\n  cta: 'siempre incluir',\n  prohibited: ['spam', 'exceso de mayusculas']\n};\n\nlet content = item.parts?.[0]?.content || item.content || '';\n\n// Remove excess emojis\nconst emojis = content.match(/[\\u{1F600}-\\u{1F64F}]/gu) || [];\nif (emojis.length > 3) {\n  content = content.replace(/[\\u{1F600}-\\u{1F64F}]/gu, '').trim();\n  content = emojis.slice(0, 3).join(' ') + ' ' + content;\n}\n\n// Add CTA if missing\nif (!content.toLowerCase().includes('escribinos') && \n    !content.toLowerCase().includes('contactanos') &&\n    !content.toLowerCase().includes('mas info')) {\n  content += '\\n\\n📱 Escribinos para más información';\n}\n\nreturn { json: { ...item, finalContent: content, brandApplied: true } };"
      }
    },
    {
      "id": "queue",
      "name": "Queue for Posting",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH || '/data'}}/pending/{{$json.platform}}_{{$now}}.json",
        "mode": "overwrite",
        "output": "json"
      }
    },
    {
      "id": "notify_success",
      "name": "Notify Success",
      "type": "n8n-nodes-base.telegram",
      "position": [1050, 450],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "✅ Content queued for {{$json.platform}} at {{$now}}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Validate Content", "type": "main", "index": 0 }]]
    },
    "Validate Content": {
      "main": [
        [{ "node": "Generate Content (OpenCode)", "type": "main", "index": 0 }],
        [{ "node": "Notify Success", "type": "main", "index": 0 }]
      ]
    },
    "Generate Content (OpenCode)": {
      "main": [[{ "node": "Apply Manual de Marca", "type": "main", "index": 0 }]]
    },
    "Apply Manual de Marca": {
      "main": [[{ "node": "Queue for Posting", "type": "main", "index": 0 }]]
    },
    "Queue for Posting": {
      "main": [[{ "node": "Notify Success", "type": "main", "index": 0 }]]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "tags": ["social-pip", "posting", "daily", "manual-de-marca"]
}
```

### 1.3 Configuración

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `cronExpression` | Expresión cron | `0 9 * * *` (9am diario) |
| `platform` | Plataforma objetivo | facebook |
| `chatId` | Chat de Telegram para notificaciones | - |

### 1.4 Uso desde OpenCode

```
Crea un workflow de posting diario para Facebook Groups a las 9am
```

---

## 2. Workflow: Multi-Platform Posting

### 2.1 Descripción

Publica el mismo contenido en múltiples plataformas simultáneamente.

### 2.2 Estructura del Workflow

```json
{
  "name": "SP - Multi-Platform Posting",
  "nodes": [
    {
      "id": "webhook",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "social-pip-multi-post",
        "responseMode": "onFinished"
      }
    },
    {
      "id": "parse",
      "name": "Parse Input",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const input = $input.first().json;\n\n// Parse platforms from input\nconst platforms = input.platforms || ['facebook', 'instagram'];\nconst content = input.content;\nconst media = input.media || [];\n\n// Create separate items for each platform\nreturn platforms.map(platform => ({\n  json: {\n    platform,\n    content,\n    media,\n    originalInput: input\n  }\n}));"
      }
    },
    {
      "id": "loop",
      "name": "Loop Over Platforms",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {}
    },
    {
      "id": "transform",
      "name": "Transform for Platform",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const item = $input.first().json;\nconst platform = item.platform;\n\n// Platform-specific transformations\nconst transformations = {\n  facebook: {\n    maxImages: 10,\n    supportsHashtags: true,\n    supportsEmoji: true\n  },\n  instagram: {\n    maxImages: 20,\n    supportsHashtags: true,\n    supportsEmoji: true,\n    hashtagLimit: 30\n  },\n  twitter: {\n    maxImages: 4,\n    supportsHashtags: true,\n    hashtagLimit: 5\n  },\n  linkedin: {\n    maxImages: 9,\n    supportsHashtags: true,\n    hashtagLimit: 3\n  }\n};\n\nconst transform = transformations[platform] || transformations.facebook;\nlet content = item.content;\n\n// Truncate for Twitter\nif (platform === 'twitter' && content.length > 280) {\n  content = content.substring(0, 277) + '...';\n}\n\n// Add platform-specific hashtags\nif (transform.supportsHashtags && !content.includes('#')) {\n  content += '\\n\\n#socialmedia #automation';\n}\n\nreturn {\n  json: {\n    ...item,\n    transformedContent: content,\n    transformation: transform\n  }\n};"
      }
    },
    {
      "id": "queue_platform",
      "name": "Queue for {{$json.platform}}",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/pending/{{$json.platform}}_{{$now}}.json",
        "output": "json"
      }
    },
    {
      "id": "aggregate",
      "name": "Aggregate Results",
      "type": "n8n-nodes-base.aggregate",
      "position": [1250, 300],
      "parameters": {
        "aggregate": "append",
        "includeOtherFields": true
      }
    },
    {
      "id": "respond",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1450, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Parse Input", "type": "main", "index": 0 }]]
    },
    "Parse Input": {
      "main": [[{ "node": "Loop Over Platforms", "type": "main", "index": 0 }]]
    },
    "Loop Over Platforms": {
      "main": [[{ "node": "Transform for Platform", "type": "main", "index": 0 }]]
    },
    "Transform for Platform": {
      "main": [[{ "node": "Queue for {{$json.platform}}", "type": "main", "index": 0 }]]
    },
    "Queue for {{$json.platform}}": {
      "main": [[{ "node": "Aggregate Results", "type": "main", "index": 0 }]]
    },
    "Aggregate Results": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "posting", "multi-platform"]
}
```

### 2.3 Uso del Webhook

```bash
curl -X POST http://localhost:5678/webhook/social-pip-multi-post \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Nuevo producto disponible!",
    "platforms": ["facebook", "instagram", "twitter"],
    "media": ["image1.jpg", "image2.jpg"]
  }'
```

---

## 3. Workflow: Content Generation

### 3.1 Descripción

Genera contenido automáticamente usando OpenCode AI.

### 3.2 Estructura del Workflow

```json
{
  "name": "SP - Content Generation",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 8 * * *" }
          ]
        }
      }
    },
    {
      "id": "get_topics",
      "name": "Get Topics",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/topics/daily.json"
      }
    },
    {
      "id": "iterate",
      "name": "Iterate Topics",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {}
    },
    {
      "id": "generate",
      "name": "Generate Content",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [850, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-content-gen/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{'Genera un caption para redes sociales sobre: ' + $json.topic + '. Sector: ' + $json.sector + '. Aplica Manual de Marca.'}}"
                }
              ]
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      }
    },
    {
      "id": "save",
      "name": "Save Content",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/generated/{{$json.sector}}_{{$now}}.json",
        "output": "json"
      }
    },
    {
      "id": "notify",
      "name": "Notify",
      "type": "n8n-nodes-base.telegram",
      "position": [1050, 450],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "✅ Generados {{$json.totalGenerated}} contenidos para hoy"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Get Topics", "type": "main", "index": 0 }]]
    },
    "Get Topics": {
      "main": [[{ "node": "Iterate Topics", "type": "main", "index": 0 }]]
    },
    "Iterate Topics": {
      "main": [[{ "node": "Generate Content", "type": "main", "index": 0 }]]
    },
    "Generate Content": {
      "main": [[{ "node": "Save Content", "type": "main", "index": 0 }]]
    },
    "Save Content": {
      "main": [
        [{ "node": "Notify", "type": "main", "index": 0 }],
        [{ "node": "Iterate Topics", "type": "main", "index": 0 }]
      ]
    }
  },
  "tags": ["social-pip", "content", "generation"]
}
```

---

## 4. Workflow: Group Monitor

### 4.1 Descripción

Monitorea grupos de Facebook para encontrar nuevas oportunidades de contenido.

### 4.2 Estructura del Workflow

```json
{
  "name": "SP - Group Monitor",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 */2 * * *" }
          ]
        }
      }
    },
    {
      "id": "get_groups",
      "name": "Get Groups List",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/groups/active.json"
      }
    },
    {
      "id": "iterate",
      "name": "Loop Groups",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {}
    },
    {
      "id": "scrape",
      "name": "Scrape Group",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "GET",
        "url": "={{'http://localhost:5678/webhook/scrape-fb-group?groupId=' + $json.groupId}}"
      }
    },
    {
      "id": "filter",
      "name": "Filter Relevant",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const posts = $input.first().json.posts || [];\n\n// Filter by relevance keywords\nconst keywords = ['vendo', 'alquilo', 'oferta', 'promo', 'descuento'];\n\nconst relevant = posts.filter(post => {\n  const text = (post.content || '').toLowerCase();\n  return keywords.some(k => text.includes(k));\n});\n\nreturn {\n  json: {\n    groupId: $input.first().json.groupId,\n    relevantPosts: relevant,\n    count: relevant.length\n  }\n};"
      }
    },
    {
      "id": "analyze",
      "name": "Analyze with OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-analyzer/prompt_async",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{'Analiza estos posts y determina cuáles son oportunidades de negocio: ' + JSON.stringify($json.relevantPosts)}}"
                }
              ]
            }
          ]
        }
      }
    },
    {
      "id": "save_leads",
      "name": "Save Leads",
      "type": "n8n-nodes-base.writeFile",
      "position": [1450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/leads/{{$now}}.json",
        "output": "json"
      }
    },
    {
      "id": "notify",
      "name": "Notify if Leads",
      "type": "n8n-nodes-base.if",
      "position": [1650, 300],
      "parameters": {
        "conditions": {
          "conditions": [
            { "value1": "={{$json.relevantPosts.length}}", "operation": "greater", "value2": "0" }
          ]
        }
      }
    },
    {
      "id": "telegram",
      "name": "Send Telegram",
      "type": "n8n-nodes-base.telegram",
      "position": [1850, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "={{'🎯 ' + $json.relevantPosts.length + ' oportunidades encontradas en grupos' }}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Get Groups List", "type": "main", "index": 0 }]]
    },
    "Get Groups List": {
      "main": [[{ "node": "Loop Groups", "type": "main", "index": 0 }]]
    },
    "Loop Groups": {
      "main": [[{ "node": "Scrape Group", "type": "main", "index": 0 }]]
    },
    "Scrape Group": {
      "main": [[{ "node": "Filter Relevant", "type": "main", "index": 0 }]]
    },
    "Filter Relevant": {
      "main": [[{ "node": "Analyze with OpenCode", "type": "main", "index": 0 }]]
    },
    "Analyze with OpenCode": {
      "main": [[{ "node": "Save Leads", "type": "main", "index": 0 }]]
    },
    "Save Leads": {
      "main": [[{ "node": "Notify if Leads", "type": "main", "index": 0 }]]
    },
    "Notify if Leads": {
      "main": [
        [{ "node": "Send Telegram", "type": "main", "index": 0 }],
        [{ "node": "Loop Groups", "type": "main", "index": 0 }]
      ]
    }
  },
  "tags": ["social-pip", "monitor", "leads"]
}
```

---

## 5. Workflow: Manual de Marca Processor

### 5.1 Descripción

Procesa contenido aplicando reglas del Manual de Marca.

### 5.2 Estructura del Workflow

```json
{
  "name": "SP - Manual de Marca Processor",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "apply-manual-de-marca"
      }
    },
    {
      "id": "load_brand",
      "name": "Load Brand Manual",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/active.json"
      }
    },
    {
      "id": "apply_tone",
      "name": "Apply Tone Rules",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.content || '';\nconst brand = $input.first().json.brand || {};\n\n// Get tone rules\nconst tone = brand.tone || {};\nlet result = content;\n\n// Apply capitalization rules\nif (tone.capitalization === 'sentence') {\n  result = result.toLowerCase().replace(/(?:^|\\.\\s+)([a-z])/g, (m, p) => m.toUpperCase());\n}\n\n// Apply formal/informal rules\nif (tone.formality === 'formal') {\n  result = result.replace(/\\bt\\b/g, 'usted');\n  result = result.replace(/\\bte\\b/g, 'le');\n} else if (tone.formality === 'informal') {\n  result = result.replace(/\\busted\\b/g, 'vos');\n  result = result.replace(/\\ble\\b/g, 'te');\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    contentAfterTone: result\n  }\n};"
      }
    },
    {
      "id": "apply_emoji",
      "name": "Apply Emoji Rules",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.contentAfterTone;\nconst brand = $input.first().json.brand || {};\n\nconst emojiRules = brand.emoji || { max: 3 };\nlet emojis = content.match(/[\\u{1F600}-\\u{1F64F}]/gu) || [];\n\nif (emojis.length > emojiRules.max) {\n  emojis = emojis.slice(0, emojiRules.max);\n  // Remove all emojis and add back only the allowed ones\n  content = content.replace(/[\\u{1F600}-\\u{1F64F}]/gu, '').trim();\n  content = emojis.join(' ') + '\\n\\n' + content;\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    contentAfterEmoji: content\n  }\n};"
      }
    },
    {
      "id": "apply_hashtags",
      "name": "Apply Hashtag Rules",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.contentAfterEmoji;\nconst brand = $input.first().json.brand || {};\n\nconst hashtagRules = brand.hashtags || { max: 5, allowed: [] };\nconst hashtags = content.match(/#\\w+/g) || [];\n\nif (hashtags.length > hashtagRules.max) {\n  // Keep only the first N hashtags\n  const cleaned = content.replace(/#\\w+/g, '').trim();\n  const allowed = hashtags.slice(0, hashtagRules.max).join(' ');\n  content = cleaned + '\\n\\n' + allowed;\n}\n\n// Add required brand hashtags\nif (hashtagRules.required && hashtagRules.required.length > 0) {\n  const existing = hashtags.map(h => h.toLowerCase());\n  const newHashtags = hashtagRules.required.filter(h => !existing.includes(h.toLowerCase()));\n  content += '\\n' + newHashtags.join(' ');\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    finalContent: content\n  }\n};"
      }
    },
    {
      "id": "apply_cta",
      "name": "Apply CTA Rules",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.finalContent;\nconst brand = $input.first().json.brand || {};\n\nconst ctaRules = brand.cta || { required: true, templates: [] };\n\nif (ctaRules.required && ctaRules.templates) {\n  // Check if already has CTA\n  const hasCTA = /escribinos|contactanos|mas info|click aqui|visitanos/i.test(content);\n  \n  if (!hasCTA && ctaRules.templates.length > 0) {\n    const randomCTA = ctaRules.templates[Math.floor(Math.random() * ctaRules.templates.length)];\n    content += '\\n\\n' + randomCTA;\n  }\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    contentWithCTA: content\n  }\n};"
      }
    },
    {
      "id": "validate",
      "name": "Validate Output",
      "type": "n8n-nodes-base.code",
      "position": [1450, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.contentWithCTA;\nconst brand = $input.first().json.brand || {};\n\nconst errors = [];\n\n// Check character limits\nif (content.length > (brand.maxChars || 5000)) {\n  errors.push('Content exceeds character limit');\n}\n\n// Check for prohibited words\nconst prohibited = brand.prohibited || [];\nfor (const word of prohibited) {\n  if (content.toLowerCase().includes(word.toLowerCase())) {\n    errors.push('Content contains prohibited word: ' + word);\n  }\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    validated: errors.length === 0,\n    validationErrors: errors,\n    finalContent: errors.length === 0 ? content : null\n  }\n};"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1650, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Load Brand Manual", "type": "main", "index": 0 }]]
    },
    "Load Brand Manual": {
      "main": [[{ "node": "Apply Tone Rules", "type": "main", "index": 0 }]]
    },
    "Apply Tone Rules": {
      "main": [[{ "node": "Apply Emoji Rules", "type": "main", "index": 0 }]]
    },
    "Apply Emoji Rules": {
      "main": [[{ "node": "Apply Hashtag Rules", "type": "main", "index": 0 }]]
    },
    "Apply Hashtag Rules": {
      "main": [[{ "node": "Apply CTA Rules", "type": "main", "index": 0 }]]
    },
    "Apply CTA Rules": {
      "main": [[{ "node": "Validate Output", "type": "main", "index": 0 }]]
    },
    "Validate Output": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "manual-de-marca", "processor"]
}
```

---

## 6. Workflow: Backup y Export

### 6.1 Descripción

Realiza backup de la base de datos y exports.

```json
{
  "name": "SP - Backup & Export",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 2 * * 0" }
          ]
        }
      }
    },
    {
      "id": "backup_db",
      "name": "Backup Database",
      "type": "n8n-nodes-base.executeCommand",
      "position": [450, 300],
      "parameters": {
        "command": "={{'cp ' + $env.DB_PATH + ' ' + $env.BACKUP_PATH + '/db_' + $now + '.sqlite'}}"
      }
    },
    {
      "id": "export_posts",
      "name": "Export Posts",
      "type": "n8n-nodes-base.readFile",
      "position": [650, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/posts/all.json"
      }
    },
    {
      "id": "compress",
      "name": "Compress Export",
      "type": "n8n-nodes-base.compression",
      "position": [850, 300],
      "parameters": {
        "operation": "compress",
        "format": "zip"
      }
    },
    {
      "id": "upload",
      "name": "Upload to Cloud",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CLOUD_UPLOAD_URL}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "file",
              "value": "={{$binary.data}}"
            }
          ]
        }
      }
    },
    {
      "id": "notify",
      "name": "Notify",
      "type": "n8n-nodes-base.telegram",
      "position": [1250, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "✅ Backup completado: {{$now}}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Backup Database", "type": "main", "index": 0 }]]
    },
    "Backup Database": {
      "main": [[{ "node": "Export Posts", "type": "main", "index": 0 }]]
    },
    "Export Posts": {
      "main": [[{ "node": "Compress Export", "type": "main", "index": 0 }]]
    },
    "Compress Export": {
      "main": [[{ "node": "Upload to Cloud", "type": "main", "index": 0 }]]
    },
    "Upload to Cloud": {
      "main": [[{ "node": "Notify", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "backup", "maintenance"]
}
```

---

## 7. Referencia Rápida de Workflows

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| Daily Posting | Schedule 9am | Posting programado diario |
| Multi-Platform | Webhook | Cross-posting multiple |
| Content Generation | Schedule 8am | Generar contenido con AI |
| Group Monitor | Schedule cada 2h | Monitorear grupos por leads |
| Manual de Marca | Webhook | Aplicar reglas de marca |
| Backup | Schedule dom 2am | Backup semanal |

---

*Última actualización: Abril 2026*