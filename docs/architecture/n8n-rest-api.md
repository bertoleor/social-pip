# n8n REST API - Referencia Completa

## Resumen

Este documento presenta la referencia completa de la API REST de n8n para la integración con Social-Pip. La API permite crear, modificar, eliminar, activar y ejecutar workflows programáticamente desde OpenCode.

---

## 1. Autenticación

### 1.1 API Key

n8n permite autenticación via API key. La key se configura en n8n y se pasa en los headers:

```bash
curl -H "X-N8N-API-KEY: tu_api_key" \
     http://localhost:5678/rest/workflows
```

### 1.2 Generar API Key

1. Abrir n8n en http://localhost:5678
2. Ir a Settings → API
3. Click "Generate API Key"
4. Copiar y guardar la key (solo se muestra una vez)

### 1.3 Autenticación Básica

También puedes usar Basic Auth:

```bash
curl -u "n8n_user:tu_password" \
     http://localhost:5678/rest/workflows
```

---

## 2. Workflows API

### 2.1 Listar Todos los Workflows

```http
GET /rest/workflows
X-N8N-API-KEY: tu_api_key
```

**Response:**
```json
{
  "data": [
    {
      "id": "abc123",
      "name": "Facebook Posting",
      "active": true,
      "nodes": [...],
      "connections": {...},
      "settings": {
        "executionOrder": "v1"
      },
      "tags": ["posting", "facebook"],
      "createdAt": "2026-04-08T12:00:00Z",
      "updatedAt": "2026-04-08T12:00:00Z"
    }
  ],
  "count": 1
}
```

### 2.2 Crear Nuevo Workflow

```http
POST /rest/workflows
Content-Type: application/json
X-N8N-API-KEY: tu_api_key

{
  "name": "Nombre del Workflow",
  "nodes": [
    {
      "id": "node_1",
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "position": [250, 300]
    },
    {
      "id": "node_2", 
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/my-session/message",
        "body": {
          "parts": [
            {
              "type": "text",
              "content": "Genera caption para posting"
            }
          ]
        }
      }
    }
  ],
  "connections": {
    "Start": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "tags": ["social-pip", "posting"]
}
```

**Response (201 Created):**
```json
{
  "id": "xyz789",
  "name": "Nombre del Workflow",
  "active": false,
  "nodes": [...],
  "connections": {...},
  "createdAt": "2026-04-08T12:00:00Z",
  "updatedAt": "2026-04-08T12:00:00Z"
}
```

### 2.3 Obtener Workflow Específico

```http
GET /rest/workflows/:id
X-N8N-API-KEY: tu_api_key
```

**Response:**
```json
{
  "id": "xyz789",
  "name": "Facebook Posting",
  "active": true,
  "nodes": [
    {
      "id": "schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 9
            }
          ]
        }
      }
    }
  ],
  "connections": {...},
  "settings": {...},
  "tags": ["posting"]
}
```

### 2.4 Actualizar Workflow

```http
PATCH /rest/workflows/:id
Content-Type: application/json
X-N8N-API-KEY: tu_api_key

{
  "name": "Nuevo Nombre",
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/Argentina/Buenos_Aires"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "xyz789",
  "name": "Nuevo Nombre",
  "active": true,
  "updatedAt": "2026-04-08T14:00:00Z"
}
```

### 2.5 Eliminar Workflow

```http
DELETE /rest/workflows/:id
X-N8N-API-KEY: tu_api_key
```

**Response:** `204 No Content`

---

## 3. Activación y Desactivación

### 3.1 Activar Workflow

```http
POST /workflows/:id/activate
X-N8N-API-KEY: tu_api_key
```

**Response (200 OK):**
```json
{
  "active": true
}
```

### 3.2 Desactivar Workflow

```http
POST /workflows/:id/deactivate
X-N8N-API-KEY: tu_api_key
```

**Response (200 OK):**
```json
{
  "active": false
}
```

---

## 4. Ejecución de Workflows

### 4.1 Via Webhook (Más Común)

Los webhooks permiten ejecutar un workflow específico:

```http
POST /webhook/:webhookPath
Content-Type: application/json

{
  "data": "tu payload",
  "moreData": "valor"
}
```

**Obtener Webhook URL:**
1. Editar workflow en n8n
2. Agregar nodo "Webhook"
3. La URL aparece en el nodo:
   - Test: `http://localhost:5678/webhook-test/:id`
   - Production: `http://localhost:5678/webhook/:id`

### 4.2 Via Webhook con Respuesta

Para obtener respuesta del workflow:

```http
POST /webhook/:webhookPath
Content-Type: application/json

{
  "prompt": "Genera caption para departamento Palermo"
}
```

El workflow debe tener un nodo "Respond to Webhook" al final:

```json
{
  "node": "Respond to Webhook",
  "parameters": {
    "respondWith": "json",
    "responseBody": "{{$json.result}}"
  }
}
```

---

## 5. Ejecuciones API

### 5.1 Listar Ejecuciones

```http
GET /executions
X-N8N-API-KEY: tu_api_key
```

**Response:**
```json
{
  "data": [
    {
      "id": "exec_123",
      "workflowId": "xyz789",
      "workflowName": "Facebook Posting",
      "status": "success",
      "mode": "manual",
      "startedAt": "2026-04-08T09:00:00Z",
      "finishedAt": "2026-04-08T09:00:05Z",
      "data": {...}
    }
  ],
  "count": 1
}
```

### 5.2 Filtrar Ejecuciones

```http
GET /executions?workflowId=xyz789&status=success&limit=10
```

### 5.3 Obtener Ejecución Específica

```http
GET /executions/:id
```

---

## 6. Webhooks API

### 6.1 Listar Webhooks

```http
GET /rest/webhooks
X-N8N-API-KEY: tu_api_key
```

### 6.2 Crear Webhook (para workflow)

```http
POST /rest/webhooks
Content-Type: application/json
X-N8N-API-KEY: tu_api_key

{
  "workflowId": "xyz789",
  "path": "my-custom-webhook",
  "method": "POST",
  "active": true
}
```

---

## 7. Nodos Comunes para Social-Pip

### 7.1 Schedule Trigger

```json
{
  "node": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "cronExpression": "0 9 * * *"  // Diario a las 9am
        }
      ]
    }
  }
}
```

**Expresiones Cron Útiles:**

| Expresión | Significado |
|-----------|-------------|
| `0 9 * * *` | Diario a las 9:00 |
| `0 9 * * 1-5` | Lunes a viernes 9am |
| `0 */2 * * *` | Cada 2 horas |
| `0 0 * * 0` | Domingos medianoche |
| `0 8,12,18 * * *` | 8am, 12pm, 6pm |

### 7.2 HTTP Request

```json
{
  "node": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4,
  "parameters": {
    "method": "POST",
    "url": "http://localhost:4096/session/{{$json.sessionId}}/message",
    "bodyParameters": {
      "parameters": [
        {
          "name": "parts",
          "value": [
            {
              "type": "text",
              "content": "{{$json.prompt}}"
            }
          ]
        }
      ]
    },
    "contentType": "json",
    "options": {
      "timeout": 30000
    }
  }
}
```

### 7.3 Webhook (Trigger)

```json
{
  "node": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "social-pip-trigger",
    "responseMode": "lastNode",
    "options": {}
  }
}
```

### 7.4 Respond to Webhook

```json
{
  "node": "Respond to Webhook",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{$json}}"
  }
}
```

### 7.5 IF (Condicional)

```json
{
  "node": "IF",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [
        {
          "value1": "={{$json.status}}",
          "operation": "equal",
          "value2": "success"
        }
      ]
    }
  }
}
```

### 7.6 Set (Manipular Datos)

```json
{
  "node": "Set",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "caption",
          "value": "={{$json.caption}}"
        },
        {
          "name": "platform",
          "value": "facebook"
        }
      ]
    },
    "options": {}
  }
}
```

### 7.7 Code (Custom JavaScript)

```json
{
  "node": "Code",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "
// Transformar datos para posting
const caption = $input.first().json.caption;
const hashtags = ['#socialpip', '#automation'];
const fullPost = `${caption}\\n\\n${hashtags.join(' ')}`;

return {
  json: {
    ...$input.first().json,
    finalPost: fullPost,
    characterCount: fullPost.length
  }
};
"
  }
}
```

---

## 8. Estructura de un Workflow completo

### 8.1 Ejemplo: Workflow de Posting Programado

```json
{
  "name": "Facebook Daily Posting - 9am",
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
              "cronExpression": "0 9 * * *"
            }
          ]
        }
      }
    },
    {
      "id": "get_content",
      "name": "Get Content from OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [450, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-session/prompt_async",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "Genera un caption para posting en Facebook. Contexto: posting inmobiliario diario. Aplica Manual de Marca."
                }
              ]
            }
          ]
        }
      },
      "credentials": {
        "httpHeaderAuth": {
          "name": "OpenCode API",
          "id": "auth_id"
        }
      }
    },
    {
      "id": "transform",
      "name": "Transform Data",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const item = $input.first().json;\nreturn {\n  json: {\n    content: item.parts?.[0]?.content || 'Default caption',\n    scheduledTime: new Date().toISOString(),\n    platform: 'facebook'\n  }\n};"
      }
    },
    {
      "id": "store",
      "name": "Store in DB",
      "type": "n8n-nodes-base.writeFile",
      "position": [850, 300],
      "parameters": {
        "fileName": "/data/pending_posts.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "notify",
      "name": "Notify Success",
      "type": "n8n-nodes-base.telegram",
      "position": [850, 450],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "tu_chat_id",
        "text": "✅ Posting preparado para las 9am"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          { "node": "Get Content from OpenCode", "type": "main", "index": 0 }
        ]
      ]
    },
    "Get Content from OpenCode": {
      "main": [
        [
          { "node": "Transform Data", "type": "main", "index": 0 }
        ]
      ]
    },
    "Transform Data": {
      "main": [
        [
          { "node": "Store in DB", "type": "main", "index": 0 },
          { "node": "Notify Success", "type": "main", "index": 0 }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "tags": ["posting", "daily", "facebook"]
}
```

---

## 9. Manejo de Errores

### 9.1 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 204 | Sin contenido |
| 400 | Bad Request |
| 401 | No autorizado |
| 404 | No encontrado |
| 422 | Error de validación |
| 500 | Error interno |

### 9.2 Manejo de Errores en Workflows

Agregar nodo "Error Workflow" para capturar errores:

```json
{
  "node": "Error Trigger",
  "type": "n8n-nodes-base.errorTrigger"
}
```

### 9.3 Retry Logic

Configurar en opciones del nodo:

```json
{
  "options": {
    "retryOnFail": true,
    "maxTries": 3,
    "wait": 1000,
    "exponential": true
  }
}
```

---

## 10. Webhooks de n8n → OpenCode

### 10.1 Estructura del Payload

```json
{
  "workflowId": "xyz789",
  "executionId": "exec_123",
  "data": {
    "result": "contenido generado",
    "timestamp": "2026-04-08T09:00:00Z"
  }
}
```

### 10.2 Ejemplo: Notificar a OpenCode

```json
{
  "node": "Notify OpenCode",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://localhost:4096/tui/show-toast",
    "bodyParameters": {
      "parameters": [
        {
          "name": "body",
          "value": {
            "title": "Workflow Completado",
            "message": "El workflow de posting se ejecutó exitosamente",
            "variant": "success"
          }
        }
      ]
    }
  }
}
```

---

## 11. Best Practices

### 11.1 Naming Conventions

- Usar nombres descriptivos: `fb-daily-posting-9am`
- Incluir plataforma: `ig-stories-daily`
- Incluir frecuencia: `weekly-report`

### 11.2 Tags

Usar tags para organizar:

| Tag | Uso |
|-----|-----|
| `social-pip` | Workflows de Social-Pip |
| `posting` | Workflows de publicación |
| `analytics` | Workflows de métricas |
| `manual-de-marca` | Aplican reglas de marca |

### 11.3 Versioning

- Hacer backup de workflows importantes
- Usar exportar/importar JSON
- Documentar cambios

---

## 12. Referencia Rápida

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/rest/workflows` | GET | Listar todos |
| `/rest/workflows` | POST | Crear nuevo |
| `/rest/workflows/:id` | GET | Ver uno |
| `/rest/workflows/:id` | PATCH | Actualizar |
| `/rest/workflows/:id` | DELETE | Eliminar |
| `/workflows/:id/activate` | POST | Activar |
| `/workflows/:id/deactivate` | POST | Desactivar |
| `/webhook/:path` | POST | Trigger webhook |
| `/executions` | GET | Ver ejecuciones |

---

*Última actualización: Abril 2026*