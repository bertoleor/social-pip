# OpenCode Server - Referencia de APIs

## Resumen

Este documento detalla todas las APIs del servidor de OpenCode que se utilizan para la integración con n8n. OpenCode corre en `localhost:4096` por defecto y expone un servidor HTTP REST.

---

## 1. Configuración del Servidor

### 1.1 Iniciar el Servidor

```bash
# Puerto por defecto (4096)
opencode serve

# Con puerto personalizado
opencode serve --port 4096

# Con CORS habilitado para n8n
opencode serve --cors http://localhost:5678

# Con autenticación
OPENCODE_SERVER_PASSWORD=mi_password opencode serve
```

### 1.2 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `OPENCODE_SERVER_PORT` | Puerto del servidor | 4096 |
| `OPENCODE_SERVER_HOSTNAME` | Hostname | 127.0.0.1 |
| `OPENCODE_SERVER_PASSWORD` | Contraseña para auth | (none) |
| `OPENCODE_SERVER_USERNAME` | Usuario para auth | opencode |

### 1.3 Verificación de Salud

```bash
GET http://localhost:4096/global/health

# Response
{
  "healthy": true,
  "version": "1.0.0"
}
```

---

## 2. APIs de Sesiones

### 2.1 Crear Nueva Sesión

```http
POST /session
Content-Type: application/json

{
  "parentId": "optional-parent-session-id",
  "title": "Optional session title"
}
```

**Response:**
```json
{
  "id": "session-uuid",
  "title": "Session Title",
  "createdAt": "2026-04-08T12:00:00Z",
  "updatedAt": "2026-04-08T12:00:00Z"
}
```

### 2.2 Listar Sesiones

```http
GET /session
```

**Response:**
```json
[
  {
    "id": "session-uuid-1",
    "title": "Session 1",
    "createdAt": "2026-04-08T12:00:00Z",
    "updatedAt": "2026-04-08T12:00:00Z"
  },
  {
    "id": "session-uuid-2", 
    "title": "Session 2",
    "createdAt": "2026-04-08T12:00:00Z",
    "updatedAt": "2026-04-08T12:00:00Z"
  }
]
```

### 2.3 Obtener Sesión Específica

```http
GET /session/:id
```

**Response:**
```json
{
  "id": "session-uuid",
  "title": "Session Title",
  "createdAt": "2026-04-08T12:00:00Z",
  "updatedAt": "2026-04-08T12:00:00Z",
  "status": "idle" // idle | running | waiting_for_permission
}
```

### 2.4 Eliminar Sesión

```http
DELETE /session/:id
```

**Response:** `true` o `false`

---

## 3. APIs de Mensajes (Más Importantes para n8n)

### 3.1 Enviar Prompt y Esperar Respuesta

Este es el endpoint principal para ejecutar prompts de AI.

```http
POST /session/:id/message
Content-Type: application/json

{
  "parts": [
    {
      "type": "text",
      "content": "Tu prompt aquí"
    }
  ],
  "model": "opencode/gpt-5.4",
  "agent": "general"
}
```

**Response:**
```json
{
  "info": {
    "id": "message-uuid",
    "role": "assistant",
    "createdAt": "2026-04-08T12:00:00Z"
  },
  "parts": [
    {
      "type": "text",
      "content": "Respuesta del modelo"
    },
    {
      "type": "tool_use",
      "name": "read",
      "input": { "filePath": "/path/to/file.ts" }
    }
  ]
}
```

**Ejemplo desde n8n:**

```json
{
  "url": "http://localhost:4096/session/{{$json.sessionId}}/message",
  "method": "POST",
  "header": {
    "Content-Type": "application/json"
  },
  "body": {
    "parts": [
      {
        "type": "text",
        "content": "Genera un caption para un departamento en Palermo, 150k USD"
      }
    ]
  }
}
```

### 3.2 Enviar Prompt Async (Sin Esperar)

Para triggers donde no necesitas la respuesta inmediata.

```http
POST /session/:id/prompt_async
Content-Type: application/json

{
  "parts": [
    {
      "type": "text", 
      "content": "Procesa esto en background"
    }
  ]
}
```

**Response:** `204 No Content`

### 3.3 Obtener Mensajes de una Sesión

```http
GET /session/:id/message?limit=10
```

**Response:**
```json
{
  "info": { "id": "message-uuid", "role": "user" },
  "parts": [{ "type": "text", "content": "Hola" }]
}
```

### 3.4 Obtener un Mensaje Específico

```http
GET /session/:id/message/:messageId
```

---

## 4. APIs de TODOs

### 4.1 Obtener TODOs de una Sesión

```http
GET /session/:id/todo
```

**Response:**
```json
[
  {
    "id": "todo-uuid",
    "content": "Implementar posting automático",
    "status": "pending",
    "priority": "high",
    "createdAt": "2026-04-08T12:00:00Z"
  },
  {
    "id": "todo-uuid-2",
    "content": "Configurar AI",
    "status": "completed",
    "priority": "medium",
    "createdAt": "2026-04-08T12:00:00Z"
  }
]
```

---

## 5. APIs de Notificaciones (TUI)

### 5.1 Mostrar Notificación (Toast)

```http
POST /tui/show-toast
Content-Type: application/json

{
  "title": "Workflow completado",
  "message": "El posting en Facebook fue exitoso",
  "variant": "success" // success | error | warning | info
}
```

**Response:** `true`

**Ejemplo desde n8n:**

```json
{
  "url": "http://localhost:4096/tui/show-toast",
  "method": "POST",
  "body": {
    "title": "Posting completado",
    "message": "5 posts publicados exitosamente",
    "variant": "success"
  }
}
```

### 5.2 Append Prompt a la UI

```http
POST /tui/append-prompt
Content-Type: application/json

{
  "text": "Revisa los logs de posting"
}
```

---

## 6. APIs de Archivos

### 6.1 Buscar Archivos por Nombre

```http
GET /find/file?query=workflow&type=file&limit=10
```

**Response:** `["path/to/file1.json", "path/to/file2.ts"]`

### 6.2 Buscar Texto en Archivos

```http
GET /find?pattern=n8n
```

**Response:**
```json
[
  {
    "path": "/path/to/file.ts",
    "lines": "contenido de la línea",
    "line_number": 42
  }
]
```

### 6.3 Leer Contenido de Archivo

```http
GET /file/content?path=/path/to/file.json
```

**Response:**
```json
{
  "content": "contenido del archivo",
  "encoding": "utf-8"
}
```

---

## 7. APIs de Configuración

### 7.1 Obtener Configuración

```http
GET /config
```

**Response:**
```json
{
  "project": {
    "path": "/path/to/project"
  },
  "provider": {
    "default": "opencode",
    "available": ["opencode", "anthropic", "openai"]
  }
}
```

### 7.2 Listar Proveedores

```http
GET /config/providers
```

---

## 8. APIs de MCP

### 8.1 Estado de MCPs

```http
GET /mcp
```

**Response:**
```json
{
  "github": { "status": "connected", "tools": 15 },
  "playwright": { "status": "connected", "tools": 8 },
  "prisma": { "status": "connected", "tools": 12 }
}
```

---

## 9. Autenticación

### 9.1 Con Contraseña

Si tienes `OPENCODE_SERVER_PASSWORD` configurado:

```bash
# Basic Auth
curl -u opencode:password http://localhost:4096/global/health
```

### 9.2 Con API Key Personalizada

```bash
# Headers personalizados
curl -H "Authorization: Bearer tu-api-key" http://localhost:4096/global/health
```

---

## 10. Ejemplos de Integración con n8n

### 10.1 Ejemplo 1: Generar Caption

**Workflow n8n:**

1. **Schedule Trigger**: Diario 8am
2. **HTTP Request**: Envía prompt a OpenCode
3. **HTTP Request** (otro): Envía resultado a Chrome Extension

**Configuración del HTTP Request:**

```json
{
  "url": "http://localhost:4096/session/{{$json.sessionId}}/message",
  "method": "POST",
  "header": {
    "Content-Type": "application/json"
  },
  "body": {
    "parts": [
      {
        "type": "text",
        "content": "Eres un copywriter argentino. Genera un caption para un departamento de 2 ambientes en Palermo, precio 150k USD. Usa tono profesional, emojis moderados, y incluye call-to-action."
      }
    ]
  }
}
```

### 10.2 Ejemplo 2: Analizar Resultados de Posting

**Workflow n8n:**

1. **Webhook Trigger**: Receive results from Chrome Extension
2. **HTTP Request**: Envía resultados a OpenCode para análisis
3. **IF**: Si OpenCode detecta problema → Notificación

**Configuración:**

```json
{
  "url": "http://localhost:4096/session/{{$json.sessionId}}/prompt_async",
  "method": "POST",
  "body": {
    "parts": [
      {
        "type": "text",
        "content": "Analiza estos resultados de posting: {{$json.results}}. ¿Hubo errores? ¿Qué métricas son importantes?"
      }
    ]
  }
}
```

### 10.3 Ejemplo 3: Notificación de Completado

```json
{
  "url": "http://localhost:4096/tui/show-toast",
  "method": "POST",
  "body": {
    "title": "Workflow Completado",
    "message": "Se publicaron 5 posts en Facebook Groups",
    "variant": "success"
  }
}
```

---

## 11. Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Bad Request - JSON inválido |
| 401 | Unauthorized - Sin autenticación |
| 404 | No encontrado |
| 422 | Entidad no procesable |
| 500 | Error interno del servidor |

---

## 12. Límites y Best Practices

### 12.1 Límites

| Endpoint | Límite |
|----------|--------|
| `/session/:id/message` | Sin límite, depende del provider |
| `/tui/show-toast` | 10/minuto recomendado |
| `/find` | Limitado por el proyecto |

### 12.2 Best Practices

1. **Sesiones dedicadas**: Crear una sesión específica para n8n
2. **Async para triggers**: Usar `prompt_async` cuando no necesites respuesta
3. **Retry logic**: Implementar reintentos en n8n
4. **Logging**: Registrar todas las llamadas para debug

---

## 13. Referencia Rápida

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/global/health` | GET | Verificar servidor |
| `/session` | POST | Crear sesión |
| `/session/:id/message` | POST | Enviar prompt (sync) |
| `/session/:id/prompt_async` | POST | Enviar prompt (async) |
| `/session/:id/todo` | GET | Obtener TODOs |
| `/tui/show-toast` | POST | Notificación |
| `/find/file` | GET | Buscar archivos |

---

*Última actualización: Abril 2026*