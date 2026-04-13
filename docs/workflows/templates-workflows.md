# Workflows de Templates y Manual de Marca

## Resumen

Este documento presenta los workflows dedicados a la gestión de templates y la aplicación del Manual de Marca. Es la documentación más completa ya que cubre todo lo relacionado con la identidad de marca, generación de contenido automatizado y cumplimiento de reglas de marca.

---

## 1. Workflow: Gestión de Templates con Manual de Marca

### 1.1 Descripción

Este workflow aplica templates de contenido mientras asegura el cumplimiento del Manual de Marca (brand rules, emoji limits, hashtags, CTA, prohibited words).

### 1.2 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                  WORKFLOW: TEMPLATE + MANUAL DE MARCA - SOCIAL-PIP                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │    LOAD    │      │   SELECT   │      │    FILL    │      │   APPLY    │
     │   BRAND    │─────▶│  TEMPLATE  │─────▶│  TEMPLATE  │─────▶│  BRAND     │
     │   RULES    │      │             │      │  WITH DATA │      │   RULES    │
     │            │      │ • Sector   │      │            │      │            │
     │ • Tone     │      │ • Type      │      │ {variable} │      │ • Emoji    │
     │ • Emoji    │      │ • Template │      │   replace  │      │   limit    │
     │ • Hashtags │      │   selection │      │            │      │ • Hashtag   │
     │ • CTA      │      │             │      │            │      │   limit    │
     └─────────────┘      └─────────────┘      └─────────────┘      │ • CTA      │
                                                                       │ • Prohibit │
                                                                       └─────────────┘
             │                    │                    │                    │
             │                    │                    │                    │
             ▼                    ▼                    ▼                    ▼
       ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
       │   BRAND    │      │   ERROR IF │      │   ERROR IF │      │   OUTPUT   │
       │   RULES   │      │   TEMPLATE  │      │   DATA     │      │   WITH     │
       │   READ    │      │   NOT      │      │   MISSING  │      │   BRAND    │
       │           │      │   FOUND    │      │            │      │   READY    │
       └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                                          │                    │
                                          │ IF USE_AI=TRUE     │ IF VALID
                                          ▼                    ▼
                               ┌─────────────────┐      ┌─────────────────┐
                               │   CONDITIONAL   │      │   VALIDATE &    │
                               │   BRANCH        │      │   STORE         │
                               │                 │      │                 │
                               │  YES ───────┐   │      │                 │
                               │             │   │      │                 │
                               │  NO ───────┘   │      │                 │
                               └─────────────────┘      └─────────────────┘
                                      │
                                      │ IF YES (useAI = true)
                                      ▼
                          ┌─────────────────┐      ┌─────────────────┐
                          │   GENERATE     │      │   GENERATE     │
                          │   WITH AI     │      │   WITH TEMPLATE │
                          │  (OpenCode/   │      │   (No AI)       │
                          │   NVIDIA)     │      │                 │
                          └─────────────────┘      └─────────────────┘
```

### 1.3 Detalle de Nodos

| Nodo | Función | Input | Output | Notas |
|------|---------|-------|--------|-------|
| Load Brand Rules | Carga config del Manual de Marca | Brand config JSON | Rules object | Lee desde SQLite |
| Select Template | Selecciona template por sector | Sector + type | Template string | Busca en DB |
| Fill Template | Reemplaza {variables} con datos | Template + data | Content con datos | Limpia placeholders vacíos |
| Apply Brand Rules | Aplica límites de marca | Content + rules | Brand-compliant | Valida emoji, hashtags, CTA, prohibited |
| Conditional Branch | ¿Usar AI? | useAI flag | Bifurcación | Si/no según flag |
| Generate with AI | Genera caption con AI | Prompt | AI content | Llama a OpenCode/NVIDIA |

### 1.4 Reglas del Manual de Marca

**Estructura del Manual de Marca:**

```json
{
  "version": "1.0",
  "brandName": "Mi Marca",
  "sectors": ["inmobiliario", "esoterismo", "digital", "comida", "estetica", "articulos"],
  "rules": {
    "tone": {
      "formal": "Profesional, directo, orientado a resultados",
      "informal": "Cercano, amigable, conversacional",
      "default": "profesional"
    },
    "emoji": {
      "maxPerPost": 3,
      "allowed": ["✨", "🔥", "💰", "📱", "📍", "⏰", "✅", "🎯"],
      "forbidden": ["💩", "🤮", "👎"]
    },
    "hashtags": {
      "maxPerPost": 5,
      "requiredBySector": {
        "inmobiliario": ["#inmobiliario", "#propiedad", "#inversion"],
        "esoterismo": ["#esoterismo", "#spiritualidad", "#rituales"],
        "digital": ["#digital", "#tech", "#innovacion"]
      }
    },
    "cta": {
      "required": true,
      "templates": [
        "📱 Escribinos para más información",
        "💬 Escribinos y te contamos más",
        "📞 Llamanos al XXX-XXXX-XXXX",
        "🔗 Link en bio para más detalles"
      ]
    },
    "prohibited": [
      "spam", "scam", "estafa", "fraude", "urgente", "última oportunidad",
      "no te quedes sin", "solo hoy", "descuento increíble"
    ],
    "capitalization": "sentence",
    "maxChars": {
      "facebook": 63206,
      "instagram": 2200,
      "twitter": 280,
      "linkedin": 3000,
      "tiktok": 2200
    }
  },
  "templates": {
    "inmobiliario": {
      "structure": [
        "{emoji} {titulo}",
        "{descripcion}",
        "{detalles}",
        "{ubicacion}",
        "{precio}",
        "{cta}",
        "{hashtags}"
      ],
      "sample": "✨ OPORTUNIDAD EN PALERMO\n\nHermoso departamento de 2 ambientes.\n\n📐 45m² • 2 habitaciones • 1 baño\n📍 Palermo, Buenos Aires\n💰 USD 150.000\n\n📱 Escribinos para visitarlo\n\n#inmobiliario #palermo #departamento"
    }
  }
}
```

---

## 2. Workflow: Template Processor

### 2.1 Descripción

Procesa templates y genera contenido basado en el sector y tipo de publicación.

### 2.2 Estructura del Workflow

```json
{
  "name": "SP - Template Processor",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "process-template"
      }
    },
    {
      "id": "parse",
      "name": "Parse Request",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const input = $input.first().json;\n\n// Extract parameters\nconst sector = input.sector || 'general';\nconst templateType = input.templateType || 'post';\nconst data = input.data || {};\nconst platform = input.platform || 'facebook';\n\nreturn {\n  json: {\n    sector,\n    templateType,\n    data,\n    platform,\n    originalInput: input\n  }\n};"
      }
    },
    {
      "id": "load_sector",
      "name": "Load Sector Templates",
      "type": "n8n-nodes-base.readFile",
      "position": [650, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/sectors/{{$json.sector}}.json"
      }
    },
    {
      "id": "load_brand",
      "name": "Load Brand Rules",
      "type": "n8n-nodes-base.readFile",
      "position": [650, 450],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/rules.json"
      }
    },
    {
      "id": "select_template",
      "name": "Select Template",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const sector = $input.first().json;\nconst templateType = $input.first().json.templateType;\n\nconst templates = sector.templates || {};\nconst template = templates[templateType] || templates.default || '';\n\nreturn {\n  json: {\n    ...$input.first().json,\n    template\n  }\n};"
      }
    },
    {
      "id": "fill_template",
      "name": "Fill Template",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const template = $input.first().json.template || '';\nconst data = $input.first().json.data || {};\n\n// Replace placeholders with data\nlet content = template;\n\nObject.keys(data).forEach(key => {\n  const placeholder = '{' + key + '}';\n  content = content.split(placeholder).join(data[key] || '');\n});\n\n// Clean up unfilled placeholders\ncontent = content.replace(/\\{[a-z_]+\\}/gi, '');\n\nreturn {\n  json: {\n    ...$input.first().json,\n    filledContent: content.trim()\n  }\n};"
      }
    },
    {
      "id": "apply_brand",
      "name": "Apply Brand Rules",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.filledContent;\nconst brand = $input.first().json.rules || {};\nlet result = content;\n\n// Apply emoji limits\nif (brand.emoji && brand.emoji.maxPerPost) {\n  const emojis = result.match(/[\\u{1F600}-\\u{1F64F}]/gu) || [];\n  if (emojis.length > brand.emoji.maxPerPost) {\n    const allowed = emojis.slice(0, brand.emoji.maxPerPost);\n    result = result.replace(/[\\u{1F600}-\\u{1F64F}]/gu, '').trim();\n    result = allowed.join(' ') + '\\n\\n' + result;\n  }\n}\n\n// Apply hashtag limits\nif (brand.hashtags && brand.hashtags.maxPerPost) {\n  const hashtags = result.match(/#\\w+/g) || [];\n  if (hashtags.length > brand.hashtags.maxPerPost) {\n    const firstN = hashtags.slice(0, brand.hashtags.maxPerPost).join(' ');\n    result = result.replace(/#\\w+/g, '').trim();\n    result = result + '\\n\\n' + firstN;\n  }\n}\n\n// Apply CTA if missing\nif (brand.cta && brand.cta.required) {\n  const hasCTA = /escribinos|contactanos|mas info|click aqui/i.test(result);\n  if (!hasCTA && brand.cta.templates && brand.cta.templates.length > 0) {\n    const cta = brand.cta.templates[0];\n    result = result + '\\n\\n' + cta;\n  }\n}\n\n// Check prohibited words\nif (brand.prohibited && brand.prohibited.length > 0) {\n  const found = brand.prohibited.filter(word => \n    result.toLowerCase().includes(word.toLowerCase())\n  );\n  if (found.length > 0) {\n    throw new Error('Prohibited words found: ' + found.join(', '));\n  }\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    contentWithBrand: result\n  }\n};"
      }
    },
    {
      "id": "generate_ai",
      "name": "Generate with AI (Optional)",
      "type": "n8n-nodes-base.if",
      "position": [1450, 300],
      "parameters": {
        "conditions": {
          "conditions": [\n            { "value1": "={{$json.useAI}}", "operation": "equal", "value2": "true" }\n          ]\n        }
      }
    },
    {
      "id": "ai_request",
      "name": "OpenCode AI",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1650, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-template/message",
        "bodyParameters": {
          "parameters": [\n            {\n              "name": "parts",\n              "value": [\n                {\n                  "type": "text",\n                  "content": "={{'Genera un caption basado en estos datos: ' + JSON.stringify($json.data) + '. Sector: ' + $json.sector + '. Aplica Manual de Marca.'}}\n                }\n              ]\n            }\n          ]\n        }\n      }
    },
    {
      "id": "validate",
      "name": "Validate Output",
      "type": "n8n-nodes-base.code",
      "position": [1850, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.contentWithBrand || $input.first().json.aiContent || '';\nconst platform = $input.first().json.platform || 'facebook';\n\nconst limits = {\n  facebook: 63206,\n  instagram: 2200,\n  twitter: 280,\n  linkedin: 3000,\n  tiktok: 2200\n};\n\nconst limit = limits[platform] || 63206;\nconst valid = content.length <= limit;\n\nreturn {\n  json: {\n    ...$input.first().json,\n    finalContent: content,\n    validated: valid,\n    characterCount: content.length,\n    platform,\n    limit\n  }\n};"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [2050, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Parse Request", "type": "main", "index": 0 }]]
    },
    "Parse Request": {
      "main": [\n        [{ "node": "Load Sector Templates", "type": "main", "index": 0 }],\n        [{ "node": "Load Brand Rules", "type": "main", "index": 0 }]\n      ]
    },
    "Load Sector Templates": {
      "main": [[{ "node": "Select Template", "type": "main", "index": 0 }]]
    },
    "Load Brand Rules": {
      "main": [[{ "node": "Select Template", "type": "main", "index": 0 }]]
    },
    "Select Template": {
      "main": [[{ "node": "Fill Template", "type": "main", "index": 0 }]]
    },
    "Fill Template": {
      "main": [[{ "node": "Apply Brand Rules", "type": "main", "index": 0 }]]
    },
    "Apply Brand Rules": {
      "main": [[{ "node": "Generate with AI (Optional)", "type": "main", "index": 0 }]]
    },
    "Generate with AI (Optional)": {
      "main": [\n        [{ "node": "OpenCode AI", "type": "main", "index": 0 }],\n        [{ "node": "Validate Output", "type": "main", "index": 1 }]
      ]
    },
    "OpenCode AI": {
      "main": [[{ "node": "Validate Output", "type": "main", "index": 0 }]]
    },
    "Validate Output": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "templates", "manual-de-marca"]
}
```

### 2.3 Uso del Webhook

```bash
# Ejemplo: Generar posting inmobiliario
curl -X POST http://localhost:5678/webhook/process-template \
  -H "Content-Type: application/json" \
  -d '{
    "sector": "inmobiliario",
    "templateType": "opportunity",
    "data": {
      "title": "OPORTUNIDAD EN PALERMO",
      "description": "Hermoso departamento de 2 ambientes",
      "price": "USD 150.000",
      "location": "Palermo, Buenos Aires",
      "size": "45m2"
    },
    "platform": "facebook"
  }'
```

---

## 3. Workflow: Caption Generator (AI)

### 3.1 Descripción

Genera captions usando OpenCode AI aplicando reglas del Manual de Marca.

### 3.2 Estructura del Workflow

```json
{
  "name": "SP - AI Caption Generator",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "generate-caption"
      }
    },
    {
      "id": "load_md",
      "name": "Load Manual de Marca",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/complete.json"
      }
    },
    {
      "id": "build_prompt",
      "name": "Build AI Prompt",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const input = $input.first().json;\nconst md = $input.first().json.manual || {};\n\nconst sector = input.sector || md.defaultSector || 'general';\nconst sectorRules = md.sectors?.[sector] || {};\n\n// Build comprehensive prompt\nconst prompt = `Eres un copywriter profesional especializado en ${sector}.\n\nREGLAS DE MARCA:\n- Tono: ${md.rules?.tone?.default || 'profesional'}\n- Emojis: máximo ${md.rules?.emoji?.maxPerPost || 3} por post\n- Hashtags: máximo ${md.rules?.hashtags?.maxPerPost || 5}\n- CTA: siempre incluir\n- Prohibido: ${md.rules?.prohibited?.join(', ') || 'ninguno'}\n\nSECTOR ${sector.toUpperCase()}:\n- Estructura: ${sectorRules.structure || 'genérica'}\n- Ejemplo: ${sectorRules.sample || 'no disponible'}\n\nDATOS DEL CONTENIDO:\n${JSON.stringify(input.data || {})}\n\nPLATAFORMA: ${input.platform || 'facebook'}\n\nGENERA un caption que cumpla todas las reglas de marca.`;\n\nreturn {\n  json: {\n    ...input,\n    prompt,\n    sector,\n    sectorRules\n  }\n};"
      }
    },
    {
      "id": "generate",
      "name": "Generate with OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-caption/message",
        "bodyParameters": {
          "parameters": [\n            {\n              "name": "parts",\n              "value": [{ "type": "text", "content": "={{$json.prompt}}" }]\n            }\n          ]\n        },
        "options": { "timeout": 60000 }
      }
    },
    {
      "id": "extract",
      "name": "Extract Caption",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const response = $input.first().json;\nconst content = response.parts?.[0]?.content || '';\n\nreturn {\n  json: {\n    ...$input.first().json,\n    rawResponse: content\n  }\n};"
      }
    },
    {
      "id": "validate_md",
      "name": "Validate against MD",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.rawResponse;\nconst md = $input.first().json.manual || {};\nconst rules = md.rules || {};\n\nconst errors = [];\nconst warnings = [];\n\n// Validate emojis\nif (rules.emoji && rules.emoji.maxPerPost) {\n  const emojis = content.match(/[\\u{1F600}-\\u{1F64F}]/gu) || [];\n  if (emojis.length > rules.emoji.maxPerPost) {\n    errors.push(`Demasiados emojis: ${emojis.length}/${rules.emoji.maxPerPost}`);\n  }\n}\n\n// Validate hashtags\nif (rules.hashtags && rules.hashtags.maxPerPost) {\n  const hashtags = content.match(/#\\w+/g) || [];\n  if (hashtags.length > rules.hashtags.maxPerPost) {\n    warnings.push(`Hashtags excesivos: ${hashtags.length}/${rules.hashtags.maxPerPost}`);\n  }\n}\n\n// Validate CTA\nif (rules.cta && rules.cta.required) {\n  const hasCTA = /escribinos|contactanos|mas info|click aqui|visitanos/i.test(content);\n  if (!hasCTA) {\n    errors.push('Falta CTA (Call to Action)');\n  }\n}\n\n// Validate prohibited\nif (rules.prohibited && rules.prohibited.length > 0) {\n  const found = rules.prohibited.filter(word => \n    content.toLowerCase().includes(word.toLowerCase())\n  );\n  if (found.length > 0) {\n    errors.push('Palabras prohibidas: ' + found.join(', '));\n  }\n}\n\n// Validate length\nconst platform = $input.first().json.platform || 'facebook';\nconst limits = { facebook: 63206, instagram: 2200, twitter: 280, linkedin: 3000 };\nif (content.length > (limits[platform] || 63206)) {\n  errors.push('Excede límite de caracteres');\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    caption: errors.length === 0 ? content : null,\n    validationErrors: errors,\n    validationWarnings: warnings,\n    validated: errors.length === 0\n  }\n};"
      }
    },
    {
      "id": "fix",
      "name": "Fix if Invalid",
      "type": "n8n-nodes-base.if",
      "position": [1450, 300],
      "parameters": {
        "conditions": {\n          "conditions": [\n            { "value1": "={{$json.validated}}", "operation": "equal", "value2": "false" }\n          ]\n        }
      }
    },
    {
      "id": "fix_request",
      "name": "Fix with OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1650, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-caption-fix/message",
        "bodyParameters": {\n          "parameters": [\n            {\n              "name": "parts",\n              "value": [\n                {\n                  "type": "text",\n                  "content": "={{'Corrige este caption según las reglas de marca. Errores: ' + $json.validationErrors.join(', ') + '. Caption: ' + $json.rawResponse}}\n                }\n              ]\n            }\n          ]\n        }
      }
    },
    {
      "id": "save",
      "name": "Save to Database",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/generated/caption_{{$now}}.json",
        "output": "json"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [2050, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {\n      "main": [[{ "node": "Load Manual de Marca", "type": "main", "index": 0 }]]
    },
    "Load Manual de Marca": {\n      "main": [[{ "node": "Build AI Prompt", "type": "main", "index": 0 }]]
    },
    "Build AI Prompt": {\n      "main": [[{ "node": "Generate with OpenCode", "type": "main", "index": 0 }]]
    },
    "Generate with OpenCode": {\n      "main": [[{ "node": "Extract Caption", "type": "main", "index": 0 }]]
    },
    "Extract Caption": {\n      "main": [[{ "node": "Validate against MD", "type": "main", "index": 0 }]]
    },
    "Validate against MD": {
      "main": [\n        [{ "node": "Fix if Invalid", "type": "main", "index": 0 }],\n        [{ "node": "Save to Database", "type": "main", "index": 1 }]
      ]
    },
    "Fix if Invalid": {
      "main": [\n        [{ "node": "Fix with OpenCode", "type": "main", "index": 0 }],\n        [{ "node": "Save to Database", "type": "main", "index": 1 }]
      ]
    },
    "Fix with OpenCode": {
      "main": [[{ "node": "Save to Database", "type": "main", "index": 0 }]]
    },
    "Save to Database": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "ai", "caption", "manual-de-marca"]
}
```

---

## 4. Workflow: Content Rotation

### 4.1 Descripción

Rota entre diferentes variantes de contenido para evitar contenido repetitivo.

```json
{
  "name": "SP - Content Rotation",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "cronExpression": "0 9 * * *" }]
        }
      }
    },
    {
      "id": "load_content",
      "name": "Load Content Pool",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/content-pool/{{$json.sector || 'general'}}.json"
      }
    },
    {
      "id": "load_stats",
      "name": "Load Previous Usage",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 450],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/content-usage.json"
      }
    },
    {
      "id": "select",
      "name": "Select Content",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const contentPool = $input.first().json;\nconst usage = $input.first().json.usage || {};\n\n// Score each piece of content\nconst scored = contentPool.map(item => {\n  const usedCount = usage[item.id] || 0;\n  const lastUsed = usage[item.id + '_last'] || 0;\n  const daysSinceLast = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);\n  \n  // Lower score = better candidate (less used, longer ago)\n  let score = usedCount * 10 + daysSinceLast;\n  \n  // Boost items that have never been used\n  if (usedCount === 0) score = -100;\n  \n  return { ...item, score };\n});\n\n// Sort by score (lowest first = best)\nscored.sort((a, b) => a.score - b.score);\n\nconst selected = scored[0];\n\n// Update usage\nusage[selected.id] = (usage[selected.id] || 0) + 1;\nusage[selected.id + '_last'] = Date.now();\n\nreturn {\n  json: {\n    ...$input.first().json,\n    selectedContent: selected,\n    updatedUsage: usage\n  }\n};"
      }
    },
    {
      "id": "transform",
      "name": "Transform for Platform",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.selectedContent;\nconst platform = $input.first().json.platform || 'facebook';\n\n// Platform-specific transformations\nlet result = content.content;\n\nif (platform === 'twitter') {\n  // Truncate for Twitter\n  if (result.length > 277) {\n    result = result.substring(0, 274) + '...';\n  }\n} else if (platform === 'instagram') {\n  // Add line breaks for readability\n  result = result.replace(/\\n/g, '\\n\\n');\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    finalContent: result,\n    platform\n  }\n};"
      }
    },
    {
      "id": "save",
      "name": "Save Usage",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/content-usage.json",
        "mode": "overwrite",
        "output": "json"
      }
    },
    {
      "id": "queue",
      "name": "Queue for Posting",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 450],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/pending/rotation_{{$now}}.json",
        "output": "json"
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
        "text": "✅ Content rotado: {{$json.selectedContent.title}}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {\n      "main": [\n        [{ "node": "Load Content Pool", "type": "main", "index": 0 }],\n        [{ "node": "Load Previous Usage", "type": "main", "index": 0 }]\n      ]
    },
    "Load Content Pool": {\n      "main": [[{ "node": "Select Content", "type": "main", "index": 0 }]]
    },
    "Load Previous Usage": {\n      "main": [[{ "node": "Select Content", "type": "main", "index": 0 }]]
    },
    "Select Content": {
      "main": [[{ "node": "Transform for Platform", "type": "main", "index": 0 }]]
    },
    "Transform for Platform": {\n      "main": [\n        [{ "node": "Save Usage", "type": "main", "index": 0 }],\n        [{ "node": "Queue for Posting", "type": "main", "index": 0 }]\n      ]
    },
    "Save Usage": {\n      "main": [[{ "node": "Notify", "type": "main", "index": 0 }]]
    },
    "Queue for Posting": {
      "main": [[{ "node": "Notify", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "rotation", "content"]
}
```

---

## 5. Templates por Sector

### 5.1 Sector: Inmobiliario

```json
{
  "sector": "inmobiliario",
  "templates": {
    "opportunity": {
      "name": "Oportunidad",
      "structure": [
        "{emoji} {titulo}",
        "",
        "{descripcion}",
        "",
        "📐 {superficie} • {habitaciones} ambientes • {banos} baño",
        "📍 {ubicacion}",
        "💰 {precio}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ],
      "sample": "✨ OPORTUNIDAD EN PALERMO\n\nHermoso departamento de 2 ambientes con excelente distribución.\n\n📐 45m² • 2 ambientes • 1 baño\n📍 Palermo, Buenos Aires\n💰 USD 150.000\n\n📱 Escribinos para visitarla\n\n#inmobiliario #palermo #departamento #inversion"
    },
    "new_listing": {
      "name": "Nuevo Listing",
      "structure": [
        "🏠 NUEVO EN EL MERCADO",
        "",
        "{titulo}",
        "",
        "{descripcion}",
        "",
        "📍 {ubicacion}",
        "💰 {precio}",
        "📐 {superficie}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ]
    },
    "open_house": {
      "name": "Open House",
      "structure": [
        "🏠 OPEN HOUSE",
        "",
        "{titulo}",
        "",
        "📅 {fecha}",
        "⏰ {hora}",
        "📍 {ubicacion}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ]
    }
  }
}
```

### 5.2 Sector: Esoterismo

```json
{
  "sector": "esoterismo",
  "templates": {
    "service": {
      "name": "Servicio",
      "structure": [
        "🔮 {servicio}",
        "",
        "{descripcion}",
        "",
        "✨ Beneficios: {beneficios}",
        "",
        "📅 Disponibilidad: {disponibilidad}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ],
      "sample": "🔮 LECTURA DE TAROT\n\nDescubre qué te depara el futuro a través de las cartas.\n\n✨ Claridad • Guía • Orientación\n\n📅 Lunes a Sábado • Turnos disponibles\n\n💬 Escribinos para reservar tu turno\n\n#esoterismo #tarot #spiritualidad #lectura"
    },
    "ritual": {
      "name": "Ritual",
      "structure": [
        "🌙 RITUAL DE {titulo}",
        "",
        "{descripcion}",
        "",
        "✨ Incluye: {incluye}",
        "",
        "📅 Fecha: {fecha}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ]
    }
  }
}
```

### 5.3 Sector: Digital/Productos

```json
{
  "sector": "digital",
  "templates": {
    "product": {
      "name": "Producto",
      "structure": [
        "🚀 {producto}",
        "",
        "{descripcion}",
        "",
        "✨ Características:",
        "{features}",
        "",
        "💰 {precio}",
        "",
        "🔗 {link}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ],
      "sample": "🚀 NUEVO PRODUCTO\n\nSoftware de gestión para inmobiliarias.\n\n✨ Características:\n• Control de propiedades\n• Seguimiento de clientes\n• Reportes automáticos\n\n💰 $99/mes\n\n🔗 Link en bio\n\n📱 Escribinos para demo gratuita\n\n#digital #software #inmobiliario #tech"
    },
    "promo": {
      "name": "Promoción",
      "structure": [
        "🔥 {titulo_promo}",
        "",
        "{descripcion}",
        "",
        "💰 Precio especial: {precio_promo}",
        "⏰ Válido hasta: {fecha_limite}",
        "",
        "{cta}",
        "",
        "{hashtags}"
      ]
    }
  }
}
```

---

## 6. Referencia de Variables de Template

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{titulo}` | Título del post | "OPORTUNIDAD EN PALERMO" |
| `{descripcion}` | Descripción detallada | "Hermoso departamento de 2 ambientes" |
| `{precio}` | Precio | "USD 150.000" |
| `{ubicacion}` | Ubicación | "Palermo, Buenos Aires" |
| `{superficie}` | Tamaño en m² | "45m²" |
| `{habitaciones}` | Cantidad de ambientes | "2 ambientes" |
| `{banos}` | Cantidad de baños | "1 baño" |
| `{cta}` | Call to action | "Escribinos para más información" |
| `{hashtags}` | Hashtags | "#inmobiliario #palermo" |
| `{fecha}` | Fecha del evento | "Sábado 15 de Abril" |
| `{hora}` | Hora del evento | "10:00 a 14:00" |
| `{link}` | Link externo | "https://ejemplo.com" |
| `{features}` | Lista de características | "• Feature 1\n• Feature 2" |

---

## 7. Workflow: Brand Rules Validator

### 7.1 Descripción

Valida cualquier contenido contra las reglas del Manual de Marca.

```json
{
  "name": "SP - Brand Rules Validator",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "validate-brand"
      }
    },
    {
      "id": "load_brand",
      "name": "Load Brand Rules",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/rules.json"
      }
    },
    {
      "id": "validate",
      "name": "Validate Content",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.content || '';\nconst brand = $input.first().json.rules || {};\n\nconst results = {\n  valid: true,\n  errors: [],\n  warnings: [],\n  stats: {\n    chars: content.length,\n    words: content.split(/\\s+/).length,\n    emojis: (content.match(/[\\u{1F600}-\\u{1F64F}]/gu) || []).length,\n    hashtags: (content.match(/#\\w+/g) || []).length,\n    mentions: (content.match(/@\\w+/g) || []).length,\n    links: (content.match(/https?:\\/\\/\\S+/g) || []).length\n  }\n};\n\n// Check character limit\nconst platform = $input.first().json.platform || 'facebook';\nconst limits = { facebook: 63206, instagram: 2200, twitter: 280, linkedin: 3000, tiktok: 2200 };\nconst limit = limits[platform] || 63206;\n\nif (results.stats.chars > limit) {\n  results.errors.push(`Excede límite (${limit}): ${results.stats.chars} caracteres`);\n  results.valid = false;\n}\n\n// Check emojis\nif (brand.emoji && brand.emoji.maxPerPost) {\n  if (results.stats.emojis > brand.emoji.maxPerPost) {\n    results.errors.push(`Demasiados emojis: ${results.stats.emojis}/${brand.emoji.maxPerPost}`);\n    results.valid = false;\n  }\n  if (brand.emoji.forbidden) {\n    const found = brand.emoji.forbidden.filter(e => content.includes(e));\n    if (found.length) {\n      results.errors.push('Emojis prohibidos: ' + found.join(' '));\n      results.valid = false;\n    }\n  }\n}\n\n// Check hashtags\nif (brand.hashtags && brand.hashtags.maxPerPost) {\n  if (results.stats.hashtags > brand.hashtags.maxPerPost) {\n    results.warnings.push(`Hashtags excesivos: ${results.stats.hashtags}/${brand.hashtags.maxPerPost}`);\n  }\n  if (brand.hashtags.requiredByPlatform && brand.hashtags.requiredByPlatform[platform]) {\n    const required = brand.hashtags.requiredByPlatform[platform];\n    const present = required.filter(h => content.toLowerCase().includes(h.toLowerCase()));\n    if (present.length < required.length) {\n      results.warnings.push('Faltan hashtags requeridos: ' + required.join(', '));\n    }\n  }\n}\n\n// Check CTA\nif (brand.cta && brand.cta.required) {\n  const hasCTA = /escribinos|contactanos|mas info|click aqui|visitanos|llamanos|escribime/i.test(content);\n  if (!hasCTA) {\n    results.errors.push('Falta Call to Action');\n    results.valid = false;\n  }\n}\n\n// Check prohibited\nif (brand.prohibited && brand.prohibited.length) {\n  const found = brand.prohibited.filter(word => \n    content.toLowerCase().includes(word.toLowerCase())\n  );\n  if (found.length) {\n    results.errors.push('Palabras prohibidas: ' + found.join(', '));\n    results.valid = false;\n  }\n}\n\n// Check capitalization\nif (brand.capitalization === 'sentence') {\n  const allCaps = content.match(/[A-Z]{4,}/g) || [];\n  if (allCaps.length > 2) {\n    results.warnings.push('Exceso de mayúsculas');\n  }\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    ...results\n  }\n};"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {\n      "main": [[{ "node": "Load Brand Rules", "type": "main", "index": 0 }]]
    },
    "Load Brand Rules": {\n      "main": [[{ "node": "Validate Content", "type": "main", "index": 0 }]]
    },
    "Validate Content": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "validator", "manual-de-marca"]
}
```

---

## 8. Referencia Rápida

| Workflow | Webhook | Descripción |
|----------|---------|-------------|
| Template Processor | `/process-template` | Procesa templates con datos |
| AI Caption Generator | `/generate-caption` | Genera captions con AI |
| Content Rotation | Schedule 9am | Rota contenido disponible |
| Brand Rules Validator | `/validate-brand` | Valida contra reglas de marca |

---

*Última actualización: Abril 2026*