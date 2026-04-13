# Workflows de Automatización

## Resumen

Este documento presenta los workflows de automatización para Social-Pip, incluyendo warmup de cuentas, posting en lote, y respuesta automática a comentarios.

---

## 1. Workflow: Account Warmup Automation

### 1.1 Descripción

Automatiza el proceso de "calentamiento" de nuevas cuentas para evitar bans.

### 1.2 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW: ACCOUNT WARMUP - SOCIAL-PIP                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │  SCHEDULE  │      │    GET     │      │   FILTER   │      │   APPLY    │
     │  TRIGGER   │─────▶│  ACCOUNTS  │─────▶│  ACTIVE    │─────▶│   WARMUP   │
     │            │      │   NEW      │      │  TODAY     │      │   RULES    │
     │ Cron:      │      │            │      │            │      │            │
     │ 0 10,14   │      │ Read from  │      │ • Week     │      │ • Week 1:  │
     │  ,18 * * * │      │   SQLite   │      │   rules    │      │   5 posts  │
     └─────────────┘      └─────────────┘      │ • 24hs    │      │ • Week 2:  │
                                              │   gap     │      │  10 posts  │
                                              └───────────┘      │ • Week 3:  │
                                                               │  15 posts  │
                                                               │ • Week 4:  │
                                                               │  20 posts  │
                                                               └───────────┘
                     │                    │                    │
                     │                    │                    │
                     ▼                    ▼                    ▼
           ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
           │   LOOP     │      │   ERROR    │      │   UPDATE   │
           │  ACCOUNTS  │      │   IF NO    │      │   ACCOUNT  │
           │            │      │  ACCOUNTS  │      │   STATUS   │
           │ For each   │      │  READY    │      │            │
           │  account   │      │            │      │            │
           └─────────────┘      └─────────────┘      └─────────────┘
                  │
                  │ FOR EACH ACCOUNT
                  ▼
     ┌─────────────────────────────┐
     │      EXECUTE WARMUP        │
     │     (Anti-Ban Engine)     │
     │                           │
     │ ┌──────────┐ ┌──────────┐ │
     │ │ ACTION  │─▶│ DELAY   │ │
     │ │ (Post/  │ │ (Random │ │
     │ │ Like/   │ │  60-240 │ │
     │ │Comment)│ │    sec  │ │
     │ └──────────┘ └──────────┘ │
     │         │                 │
     │         ▼                 │
     │ ┌──────────┐ ┌──────────┐ │
     │ │CHECK    │─▶│ NEXT    │ │
     │ │ LIMITS  │ │ ACTION  │ │
     │ └──────────┘ └──────────┘ │
     └─────────────────────────────┘
```

### 1.3 Reglas de Warmup por Semana

| Semana | Posts/Día | Likes/Día | Comments/Día | Objetivo |
|--------|-----------|-----------|---------------|----------|
| Semana 1 | 5 | 20 | 10 | Establecer patrón natural |
| Semana 2 | 10 | 40 | 20 | Aumentar actividad gradualmente |
| Semana 3 | 15 | 60 | 30 | Preparar para producción |
| Semana 4 | 20 | 80 | 40 | Lista para posting completo |

### 1.4 Estructura del Workflow

```json
{
  "name": "SP - Account Warmup",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 10,14,18 * * *" }
          ]
        }
      }
    },
    {
      "id": "get_accounts",
      "name": "Get New Accounts",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/accounts/new.json"
      }
    },
    {
      "id": "filter",
      "name": "Filter Active Today",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const accounts = $input.first().json || [];\nconst now = new Date();\nconst dayOfWeek = now.getDay();\n\n// Warmup rules by week\nconst warmupRules = {\n  1: { maxPosts: 5, maxLikes: 20, maxComments: 10 },  // Week 1\n  2: { maxPosts: 10, maxLikes: 40, maxComments: 20 }, // Week 2\n  3: { maxPosts: 15, maxLikes: 60, maxComments: 30 }, // Week 3\n  4: { maxPosts: 20, maxLikes: 80, maxComments: 40 }   // Week 4\n};\n\n// Calculate week number (simplified)\nconst startDate = new Date('2026-01-01');\nconst daysSince = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));\nconst weekNum = Math.min(4, Math.ceil(daysSince / 7));\nconst rules = warmupRules[weekNum];\n\n// Filter accounts ready for warmup\nconst ready = accounts.filter(acc => {\n  const lastActivity = new Date(acc.lastWarmup || 0);\n  const hoursSince = (now - lastActivity) / (1000 * 60 * 60);\n  return hoursSince >= 24; // At least 24 hours since last activity\n});\n\nreturn {\n  json: {\n    accounts: ready,\n    rules,\n    weekNum\n  }\n};"
      }
    },
    {
      "id": "loop",
      "name": "Loop Accounts",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [850, 300],
      "parameters": {}
    },
    {
      "id": "load_profile",
      "name": "Load Account Profile",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "parameters": {
        "method": "GET",
        "url": "={{$env.CHROME_EXT_URL + '/load-profile?accountId=' + $json.accountId}}"
      }
    },
    {
      "id": "actions",
      "name": "Execute Warmup Actions",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const account = $input.first().json;\nconst rules = $input.first().json.rules;\n\n// Generate random actions within limits\nconst actions = [];\n\n// Random browsing (2-5 minutes)\nactions.push({\n  type: 'browse',\n  duration: Math.floor(Math.random() * 180000) + 120000\n});\n\n// Random likes (within limits)\nconst numLikes = Math.floor(Math.random() * rules.maxLikes);\nfor (let i = 0; i < numLikes; i++) {\n  actions.push({\n    type: 'like',\n    delay: Math.floor(Math.random() * 30000) + 10000\n  });\n}\n\n// Random comments (within limits)\nconst numComments = Math.floor(Math.random() * rules.maxComments);\nif (numComments > 0) {\n  const comments = [\n    'Muy buena esa! 👍',\n    'Excelente información',\n    'Gracias por compartir',\n    'Muy interesante',\n    'Buen post! 🔥'\n  ];\n  for (let i = 0; i < numComments; i++) {\n    actions.push({\n      type: 'comment',\n      content: comments[Math.floor(Math.random() * comments.length)],\n      delay: Math.floor(Math.random() * 60000) + 30000\n    });\n  }\n}\n\n// Random scroll behavior\nactions.push({\n  type: 'scroll',\n  count: Math.floor(Math.random() * 10) + 5\n});\n\nreturn {\n  json: {\n    ...account,\n    warmupActions: actions,\n    rules\n  }\n};"
      }
    },
    {
      "id": "execute",
      "name": "Execute Actions via Extension",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CHROME_EXT_URL + '/execute-warmup'}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "body",
              "value": "={{$json}}"
            }
          ]
        },
        "options": { "timeout": 300000 }
      }
    },
    {
      "id": "update",
      "name": "Update Account Status",
      "type": "n8n-nodes-base.code",
      "position": [1650, 300],
      "parameters": {
        "jsCode": "const result = $input.first().json;\n\nreturn {\n  json: {\n    ...result,\n    lastWarmup: new Date().toISOString(),\n    status: 'warmed',\n    actionsCompleted: result.actions?.length || 0\n  }\n};"
      }
    },
    {
      "id": "save",
      "name": "Save Updated Account",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/accounts/{{$json.accountId}}.json",
        "output": "json"
      }
    },
    {
      "id": "notify",
      "name": "Notify Completion",
      "type": "n8n-nodes-base.telegram",
      "position": [1850, 450],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "✅ Warmup completado: {{$json.accountName}} - Semana {{$json.weekNum}}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Get New Accounts", "type": "main", "index": 0 }]]
    },
    "Get New Accounts": {
      "main": [[{ "node": "Filter Active Today", "type": "main", "index": 0 }]]
    },
    "Filter Active Today": {
      "main": [[{ "node": "Loop Accounts", "type": "main", "index": 0 }]]
    },
    "Loop Accounts": {
      "main": [[{ "node": "Load Account Profile", "type": "main", "index": 0 }]]
    },
    "Load Account Profile": {
      "main": [[{ "node": "Execute Warmup Actions", "type": "main", "index": 0 }]]
    },
    "Execute Warmup Actions": {
      "main": [[{ "node": "Execute Actions via Extension", "type": "main", "index": 0 }]]
    },
    "Execute Actions via Extension": {
      "main": [[{ "node": "Update Account Status", "type": "main", "index": 0 }]]
    },
    "Update Account Status": {
      "main": [
        [{ "node": "Save Updated Account", "type": "main", "index": 0 }],
        [{ "node": "Notify Completion", "type": "main", "index": 0 }],
        [{ "node": "Loop Accounts", "type": "main", "index": 0 }]
      ]
    },
    "Save Updated Account": {
      "main": []
    },
    "Notify Completion": {
      "main": []
    }
  },
  "tags": ["social-pip", "warmup", "automation", "anti-ban"]
}
```

---

## 2. Workflow: Batch Poster

### 2.1 Descripción

Publica contenido en lote con delays configurables entre cada post.

```json
{
  "name": "SP - Batch Poster",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "batch-post"
      }
    },
    {
      "id": "parse",
      "name": "Parse Batch Request",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const input = $input.first().json;\n\n// Parse posts array\nconst posts = input.posts || [];\nconst config = input.config || {};\n\n// Apply default config\nconst batchConfig = {\n  delayBetweenPosts: config.delayBetweenPosts || 300000, // 5 min default\n  batchSize: config.batchSize || 5,\n  batchDelay: config.batchDelay || 900000, // 15 min between batches\n  platform: config.platform || 'facebook',\n  targetGroups: config.targetGroups || []\n};\n\n// Create batch items\nconst batches = [];\nfor (let i = 0; i < posts.length; i += batchConfig.batchSize) {\n  batches.push({\n    batchId: i / batchConfig.batchSize,\n    posts: posts.slice(i, i + batchConfig.batchSize)\n  });\n}\n\nreturn {\n  json: {\n    posts: posts,\n    batches: batches,\n    config: batchConfig,\n    totalPosts: posts.length,\n    totalBatches: batches.length\n  }\n};"
      }
    },
    {
      "id": "batches_loop",
      "name": "Loop Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {
        "batchMode": "batchItem"
      }
    },
    {
      "id": "wait_batch",
      "name": "Wait Between Batches",
      "type": "n8n-nodes-base.wait",
      "position": [850, 300],
      "parameters": {
        "amount": 15,
        "unit": "minutes"
      },
      "onError": "continueErrorOutput"
    },
    {
      "id": "posts_loop",
      "name": "Loop Posts in Batch",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [1050, 300],
      "parameters": {}
    },
    {
      "id": "wait_post",
      "name": "Wait Between Posts",
      "type": "n8n-nodes-base.wait",
      "position": [1250, 300],
      "parameters": {
        "amount": 5,
        "unit": "minutes"
      }
    },
    {
      "id": "post",
      "name": "Post Content",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CHROME_EXT_URL + '/post'}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "body",
              "value": "={{$json}}"
            }
          ]
        }
      }
    },
    {
      "id": "check_result",
      "name": "Check Result",
      "type": "n8n-nodes-base.if",
      "position": [1650, 300],
      "parameters": {
        "conditions": {
          "conditions": [
            { "value1": "={{$json.success}}", "operation": "equal", "value2": "true" }
          ]
        }
      }
    },
    {
      "id": "log_success",
      "name": "Log Success",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/logs/batch_{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "log_error",
      "name": "Log Error",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 450],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/logs/errors_{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "aggregate",
      "name": "Aggregate Results",
      "type": "n8n-nodes-base.aggregate",
      "position": [2050, 300],
      "parameters": {
        "aggregate": "append"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [2250, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Parse Batch Request", "type": "main", "index": 0 }]]
    },
    "Parse Batch Request": {
      "main": [[{ "node": "Loop Batches", "type": "main", "index": 0 }]]
    },
    "Loop Batches": {
      "main": [[{ "node": "Wait Between Batches", "type": "main", "index": 0 }]]
    },
    "Wait Between Batches": {
      "main": [[{ "node": "Loop Posts in Batch", "type": "main", "index": 0 }]]
    },
    "Loop Posts in Batch": {
      "main": [[{ "node": "Wait Between Posts", "type": "main", "index": 0 }]]
    },
    "Wait Between Posts": {
      "main": [[{ "node": "Post Content", "type": "main", "index": 0 }]]
    },
    "Post Content": {
      "main": [[{ "node": "Check Result", "type": "main", "index": 0 }]]
    },
    "Check Result": {
      "main": [
        [{ "node": "Log Success", "type": "main", "index": 0 }],
        [{ "node": "Log Error", "type": "main", "index": 1 }]
      ]
    },
    "Log Success": {
      "main": [[{ "node": "Aggregate Results", "type": "main", "index": 0 }]]
    },
    "Log Error": {
      "main": [[{ "node": "Aggregate Results", "type": "main", "index": 0 }]]
    },
    "Aggregate Results": {
      "main": [
        [{ "node": "Loop Posts in Batch", "type": "main", "index": 0 }],
        [{ "node": "Loop Batches", "type": "main", "index": 0 }],
        [{ "node": "Respond", "type": "main", "index": 0 }]
      ]
    }
  },
  "tags": ["social-pip", "batch", "posting", "automation"]
}
```

---

## 3. Workflow: Auto-Responder to Comments

### 3.1 Descripción

Responde automáticamente a comentarios usando reglas del Manual de Marca.

```json
{
  "name": "SP - Comment Auto-Responder",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "new-comment"
      }
    },
    {
      "id": "parse",
      "name": "Parse Comment",
      "type": "n8n-nodes-base.code",
      "position": [450, 300],
      "parameters": {
        "jsCode": "const webhook = $input.first().json;\n\n// Extract comment data\nconst comment = {\n  id: webhook.commentId,\n  postId: webhook.postId,\n  author: webhook.author,\n  content: webhook.content,\n  platform: webhook.platform,\n  timestamp: webhook.timestamp\n};\n\n// Categorize comment\nlet category = 'general';\nconst lowerContent = comment.content.toLowerCase();\n\nif (lowerContent.includes('precio') || lowerContent.includes('cuánto') || lowerContent.includes('cuesta')) {\n  category = 'pricing';\n} else if (lowerContent.includes('dónde') || lowerContent.includes('ubicación') || lowerContent.includes('dirección')) {\n  category = 'location';\n} else if (lowerContent.includes('whatsapp') || lowerContent.includes('contacto') || lowerContent.includes('escribir')) {\n  category = 'contact';\n} else if (lowerContent.includes('gracias') || lowerContent.includes('thank')) {\n  category = 'thanks';\n}\n\nreturn {\n  json: {\n    ...comment,\n    category\n  }\n};"
      }
    },
    {
      "id": "load_responses",
      "name": "Load Response Templates",
      "type": "n8n-nodes-base.readFile",
      "position": [650, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/responses.json"
      }
    },
    {
      "id": "select_response",
      "name": "Select Response",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const comment = $input.first().json;\nconst responses = $input.first().json.responses || {};\n\nconst category = comment.category || 'general';\nconst platform = comment.platform || 'facebook';\n\n// Get responses for category and platform\nconst availableResponses = responses[category] || responses['general'] || [];\n\nif (availableResponses.length === 0) {\n  // Use default\n  return {\n    json: {\n      ...comment,\n      response: 'Gracias por tu comentario! Escribinos para más información. 📱'\n    }\n  };\n}\n\n// Select random response\nconst response = availableResponses[Math.floor(Math.random() * availableResponses.length)];\n\n// Personalize with author name\nlet responseText = response.text.replace('{author}', comment.author.split(' ')[0]);\n\nreturn {\n  json: {\n    ...comment,\n    response: responseText,\n    responseType: response.type\n  }\n};"
      }
    },
    {
      "id": "ai_enhance",
      "name": "AI Enhancement (Optional)",
      "type": "n8n-nodes-base.if",
      "position": [1050, 300],
      "parameters": {
        "conditions": {
          "conditions": [\n            { "value1": "={{$json.useAI}}", "operation": "equal", "value2": "true" }\n          ]\n        }
      }
    },
    {
      "id": "ai_generate",
      "name": "Generate with AI",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-responder/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [\n                {
                  "type": "text",
                  "content": "={{'Genera una respuesta courteous para este comentario: \"' + $json.content + '\". Autor: ' + $json.author + '. Sector: ' + $json.sector}}\n                }\n              ]\n            }\n          ]
        }
      }
    },
    {
      "id": "validate",
      "name": "Validate Response",
      "type": "n8n-nodes-base.code",
      "position": [1450, 300],
      "parameters": {
        "jsCode": "const response = $input.first().json.response || '';\n\n// Basic validation\nconst valid = response.length > 0 && response.length < 500;\n\nif (!valid) {\n  throw new Error('Response validation failed');\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    validatedResponse: response,\n    validated: true\n  }\n};"
      }
    },
    {
      "id": "send",
      "name": "Send Reply",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1650, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CHROME_EXT_URL + '/reply'}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "body",
              "value": "={{$json}}"
            }\n          ]
        }
      }
    },
    {
      "id": "log",
      "name": "Log Interaction",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/logs/comments_{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "respond",
      "name": "Respond to Webhook",
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
      "main": [[{ "node": "Parse Comment", "type": "main", "index": 0 }]]
    },
    "Parse Comment": {
      "main": [[{ "node": "Load Response Templates", "type": "main", "index": 0 }]]
    },
    "Load Response Templates": {
      "main": [[{ "node": "Select Response", "type": "main", "index": 0 }]]
    },
    "Select Response": {
      "main": [[{ "node": "AI Enhancement (Optional)", "type": "main", "index": 0 }]]
    },
    "AI Enhancement (Optional)": {
      "main": [
        [{ "node": "Generate with AI", "type": "main", "index": 0 }],
        [{ "node": "Validate Response", "type": "main", "index": 1 }]
      ]
    },
    "Generate with AI": {
      "main": [[{ "node": "Validate Response", "type": "main", "index": 0 }]]
    },
    "Validate Response": {
      "main": [[{ "node": "Send Reply", "type": "main", "index": 0 }]]
    },
    "Send Reply": {
      "main": [[{ "node": "Log Interaction", "type": "main", "index": 0 }]]
    },
    "Log Interaction": {
      "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "comments", "automation", "responder"]
}
```

---

## 4. Workflow: Engagement Automation

### 4.1 Descripción

Automatiza engagement (likes, follows, shares) de forma segura.

```json
{
  "name": "SP - Engagement Automation",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 9,12,17 * * *" }
          ]
        }
      }
    },
    {
      "id": "load_targets",
      "name": "Load Target Accounts",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/targets/engagement.json"
      }
    },
    {
      "id": "filter",
      "name": "Filter by Rules",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const targets = $input.first().json || [];\nconst now = new Date();\n\n// Filter targets ready for engagement\nconst ready = targets.filter(target => {\n  const lastEngage = new Date(target.lastEngaged || 0);\n  const hoursSince = (now - lastEngage) / (1000 * 60 * 60);\n  \n  // Don't engage same account within 48 hours\n  return hoursSince >= 48;\n});\n\n// Limit daily engagement\nconst dailyLimit = 50;\nconst selected = ready.slice(0, dailyLimit);\n\nreturn {\n  json: {\n    targets: selected,\n    count: selected.length\n  }\n};"
      }
    },
    {
      "id": "loop",
      "name": "Loop Targets",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [850, 300],
      "parameters": {}
    },
    {
      "id": "random_delay",
      "name": "Random Delay",
      "type": "n8n-nodes-base.wait",
      "position": [1050, 300],
      "parameters": {
        "amount": "={{Math.floor(Math.random() * 10) + 5}}",
        "unit": "seconds"
      }
    },
    {
      "id": "actions",
      "name": "Execute Engagement",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const target = $input.first().json;\n\n// Random engagement actions\nconst actions = [];\nconst rand = Math.random();\n\nif (rand > 0.3) {\n  actions.push({ type: 'like', targetId: target.id });\n}\n\nif (rand > 0.6) {\n  actions.push({ type: 'follow', targetId: target.id });\n}\n\nif (rand > 0.8) {\n  const comments = [\n    'Muy buen contenido! 👍',\n    'Excelente post 🔥',\n    'Gracias por compartir!',\n    'Muy interesante 📱'\n  ];\n  actions.push({\n    type: 'comment',\n    targetId: target.id,\n    text: comments[Math.floor(Math.random() * comments.length)]\n  });\n}\n\n// Add random scroll behavior\nactions.push({\n  type: 'scroll',\n  duration: Math.floor(Math.random() * 30000) + 10000\n});\n\nreturn {\n  json: {\n    ...target,\n    actions,\n    timestamp: new Date().toISOString()\n  }\n};"
      }
    },
    {
      "id": "execute",
      "name": "Execute via Extension",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CHROME_EXT_URL + '/engagement'}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "body",
              "value": "={{$json}}"
            }\n          ]
        }
      }
    },
    {
      "id": "update",
      "name": "Update Target",
      "type": "n8n-nodes-base.code",
      "position": [1650, 300],
      "parameters": {
        "jsCode": "const result = $input.first().json;\n\nreturn {\n  json: {\n    ...result,\n    lastEngaged: new Date().toISOString(),\n    engagementCount: (result.engagementCount || 0) + 1\n  }\n};"
      }
    },
    {
      "id": "save",
      "name": "Save Updated Target",
      "type": "n8n-nodes-base.writeFile",
      "position": [1850, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/targets/{{$json.id}}.json",
        "output": "json"
      }
    },
    {
      "id": "aggregate",
      "name": "Aggregate Results",
      "type": "n8n-nodes-base.aggregate",
      "position": [2050, 300],
      "parameters": {
        "aggregate": "append"
      }
    },
    {
      "id": "notify",
      "name": "Notify Summary",
      "type": "n8n-nodes-base.telegram",
      "position": [2250, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "✅ Engagement completado: {{$json.count}} cuentas"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Load Target Accounts", "type": "main", "index": 0 }]]
    },
    "Load Target Accounts": {
      "main": [[{ "node": "Filter by Rules", "type": "main", "index": 0 }]]
    },
    "Filter by Rules": {
      "main": [[{ "node": "Loop Targets", "type": "main", "index": 0 }]]
    },
    "Loop Targets": {
      "main": [[{ "node": "Random Delay", "type": "main", "index": 0 }]]
    },
    "Random Delay": {
      "main": [[{ "node": "Execute Engagement", "type": "main", "index": 0 }]]
    },
    "Execute Engagement": {
      "main": [[{ "node": "Execute via Extension", "type": "main", "index": 0 }]]
    },
    "Execute via Extension": {
      "main": [[{ "node": "Update Target", "type": "main", "index": 0 }]]
    },
    "Update Target": {
      "main": [[{ "node": "Save Updated Target", "type": "main", "index": 0 }]]
    },
    "Save Updated Target": {
      "main": [\n        [{ "node": "Aggregate Results", "type": "main", "index": 0 }],\n        [{ "node": "Loop Targets", "type": "main", "index": 0 }]\n      ]
    },
    "Aggregate Results": {
      "main": [[{ "node": "Notify Summary", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "engagement", "automation"]
}
```

---

## 5. Referencia Rápida

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| Account Warmup | Schedule 10am,2pm,6pm | Calienta cuentas nuevas |
| Batch Poster | Webhook | Posting en lote con delays |
| Comment Auto-Responder | Webhook | Responde comentarios automáticamente |
| Engagement Automation | Schedule 9am,12pm,5pm | Likes, follows, comentarios seguros |

---

*Última actualización: Abril 2026*