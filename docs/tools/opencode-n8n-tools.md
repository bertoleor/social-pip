# Custom Tools OpenCode para n8n

## Resumen

Este documento presenta las herramientas personalizadas (Custom Tools) que OpenCode usa para interactuar con n8n. Estas herramientas permiten crear, gestionar, ejecutar y monitorear workflows de n8n directamente desde OpenCode.

---

## 1. Instalación de Custom Tools

### 1.1 Estructura de Archivos

Las custom tools se crean en el directorio del proyecto:

```
social-pip/
├── .opencode/
│   └── tools/
│       └── n8n.ts    ← Este archivo
```

### 1.2 Configuración en opencode.json

No requiere configuración adicional si está en `.opencode/tools/`.

---

## 2. Herramientas Disponibles

### 2.1 n8n_list_workflows

Lista todos los workflows disponibles en n8n.

```typescript
export const n8n_list_workflows = tool({
  description: "List all workflows in n8n. Returns basic info about each workflow including ID, name, active status, and tags.",
  args: {},
  async execute() {
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list workflows: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }
});
```

**Uso en OpenCode:**
```
Lista los workflows de n8n
```

**Output:**
```json
[
  {
    "id": "abc123",
    "name": "Facebook Daily Posting",
    "active": true,
    "tags": ["posting", "facebook"]
  },
  {
    "id": "def456", 
    "name": "Instagram Stories",
    "active": false,
    "tags": ["instagram", "stories"]
  }
]
```

### 2.2 n8n_get_workflow

Obtiene los detalles completos de un workflow específico.

```typescript
export const n8n_get_workflow = tool({
  description: "Get detailed information about a specific n8n workflow including all nodes, connections, and settings.",
  args: {
    id: tool.schema.string({ description: "The workflow ID to retrieve" })
  },
  async execute({ id }) {
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows/${id}`, {
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get workflow: ${response.statusText}`);
    }
    
    return await response.json();
  }
});
```

**Uso en OpenCode:**
```
Obten el workflow con ID abc123
```

### 2.3 n8n_create_workflow

Crea un nuevo workflow en n8n.

```typescript
export const n8n_create_workflow = tool({
  description: "Create a new workflow in n8n with the specified configuration.",
  args: {
    name: tool.schema.string({ description: "Name of the workflow" }),
    nodes: tool.schema.array(tool.schema.any(), { description: "Array of node objects" }),
    connections: tool.schema.any({ description: "Connections between nodes" }),
    settings: tool.schema.any({ description: "Workflow settings (optional)" }),
    tags: tool.schema.array(tool.schema.string(), { description: "Tags for the workflow (optional)" })
  },
  async execute({ name, nodes, connections, settings = {}, tags = [] }) {
    const workflow = {
      name,
      nodes,
      connections,
      settings: {
        executionOrder: "v1",
        timezone: "America/Argentina/Buenos_Aires",
        ...settings
      },
      tags
    };
    
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
      method: "POST",
      headers: {
        ...getN8nHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(workflow)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create workflow: ${error}`);
    }
    
    return await response.json();
  }
});
```

**Uso en OpenCode:**
```
Crea un workflow de posting para Facebook Groups llamado "FB Posting Diario" con un schedule trigger a las 9am y un HTTP request a OpenCode
```

### 2.4 n8n_update_workflow

Actualiza un workflow existente.

```typescript
export const n8n_update_workflow = tool({
  description: "Update an existing n8n workflow with new configuration.",
  args: {
    id: tool.schema.string({ description: "Workflow ID to update" }),
    name: tool.schema.string({ description: "New name (optional)" }),
    nodes: tool.schema.array(tool.schema.any(), { description: "Updated nodes (optional)" }),
    connections: tool.schema.any({ description: "Updated connections (optional)" }),
    settings: tool.schema.any({ description: "Updated settings (optional)" }),
    tags: tool.schema.array(tool.schema.string(), { description: "Updated tags (optional)" })
  },
  async execute(args) {
    const { id, ...updates } = args;
    
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows/${id}`, {
      method: "PATCH",
      headers: {
        ...getN8nHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }
    
    return await response.json();
  }
});
```

**Uso en OpenCode:**
```
Actualiza el workflow abc123 para que se ejecute a las 10am en vez de 9am
```

### 2.5 n8n_activate_workflow

Activa un workflow (comienza a ejecutarse según su trigger).

```typescript
export const n8n_activate_workflow = tool({
  description: "Activate an n8n workflow. Once activated, the workflow will run according to its trigger (schedule, webhook, etc).",
  args: {
    id: tool.schema.string({ description: "Workflow ID to activate" })
  },
  async execute({ id }) {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${id}/activate`, {
      method: "POST",
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to activate workflow: ${response.statusText}`);
    }
    
    return { success: true, active: true };
  }
});
```

**Uso en OpenCode:**
```
Activa el workflow de posting diario
```

### 2.6 n8n_deactivate_workflow

Desactiva un workflow (pausa su ejecución).

```typescript
export const n8n_deactivate_workflow = tool({
  description: "Deactivate an n8n workflow. The workflow stops running but is preserved.",
  args: {
    id: tool.schema.string({ description: "Workflow ID to deactivate" })
  },
  async execute({ id }) {
    const response = await fetch(`${N8N_BASE_URL}/workflows/${id}/deactivate`, {
      method: "POST",
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to deactivate workflow: ${response.statusText}`);
    }
    
    return { success: true, active: false };
  }
});
```

**Uso en OpenCode:**
```
Desactiva el workflow de posting mientras hago pruebas
```

### 2.7 n8n_delete_workflow

Elimina un workflow permanentemente.

```typescript
export const n8n_delete_workflow = tool({
  description: "Delete an n8n workflow. This action cannot be undone.",
  args: {
    id: tool.schema.string({ description: "Workflow ID to delete" })
  },
  async execute({ id }) {
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows/${id}`, {
      method: "DELETE",
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete workflow: ${response.statusText}`);
    }
    
    return { success: true, deleted: id };
  }
});
```

**Uso en OpenCode:**
```
Elimina el workflow de prueba con ID abc123
```

### 2.8 n8n_trigger_webhook

Dispara un workflow via webhook.

```typescript
export const n8n_trigger_webhook = tool({
  description: "Trigger an n8n workflow via its webhook URL. The workflow must have a Webhook node configured.",
  args: {
    webhookUrl: tool.schema.string({ description: "Full webhook URL (e.g., http://localhost:5678/webhook/my-workflow)" }),
    data: tool.schema.any({ description: "Data to send to the webhook" })
  },
  async execute({ webhookUrl, data }) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    const text = await response.text();
    
    try {
      return JSON.parse(text);
    } catch {
      return { response: text, status: response.status };
    }
  }
});
```

**Uso en OpenCode:**
```
Ejecuta el webhook de posting con los datos: caption "Hola mundo", platform "facebook"
```

### 2.9 n8n_get_executions

Obtiene las ejecuciones de un workflow.

```typescript
export const n8n_get_executions = tool({
  description: "Get execution history for a specific workflow or all workflows.",
  args: {
    workflowId: tool.schema.string({ description: "Filter by workflow ID (optional)" }),
    status: tool.schema.string({ description: "Filter by status: success, error, waiting (optional)" }),
    limit: tool.schema.number({ description: "Number of executions to return (default 10)" })
  },
  async execute({ workflowId, status, limit = 10 }) {
    let url = `${N8N_BASE_URL}/executions?limit=${limit}`;
    
    if (workflowId) url += `&workflowId=${workflowId}`;
    if (status) url += `&status=${status}`;
    
    const response = await fetch(url, {
      headers: getN8nHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get executions: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }
});
```

**Usage in OpenCode:**
```
Muéstrame las últimas 5 ejecuciones del workflow de posting
```

### 2.10 n8n_create_workflow_from_template

Crea un workflow desde una plantilla predefinida.

```typescript
export const n8n_create_workflow_from_template = tool({
  description: "Create a workflow in n8n from a predefined template for Social-Pip.",
  args: {
    template: tool.schema.string({ 
      description: "Template name: posting_daily, content_generation, analytics, marketing" 
    }),
    name: tool.schema.string({ description: "Custom name for the workflow" }),
    config: tool.schema.any({ description: "Configuration overrides (optional)" })
  },
  async execute({ template, name, config = {} }) {
    const templates = getTemplates();
    const templateConfig = templates[template];
    
    if (!templateConfig) {
      throw new Error(`Unknown template: ${template}. Available: ${Object.keys(templates).join(', ')}`);
    }
    
    // Merge con configuración personalizada
    const workflow = {
      ...templateConfig.workflow,
      name: name || templateConfig.defaultName,
      ...config
    };
    
    const response = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
      method: "POST",
      headers: {
        ...getN8nHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(workflow)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create workflow from template: ${response.statusText}`);
    }
    
    return await response.json();
  }
});
```

**Uso en OpenCode:**
```
Crea un workflow de posting diario llamado "Mi Posting" usando la plantilla posting_daily
```

---

## 3. Funciones Auxiliares

### 3.1 getN8nHeaders

```typescript
function getN8nHeaders() {
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) {
    throw new Error("N8N_API_KEY not configured");
  }
  return {
    "X-N8N-API-KEY": apiKey,
    "Content-Type": "application/json"
  };
}
```

### 3.2 getTemplates

```typescript
function getTemplates() {
  return {
    posting_daily: {
      defaultName: "Daily Posting",
      workflow: {
        name: "Daily Posting",
        nodes: [
          {
            id: "schedule",
            name: "Schedule Trigger",
            type: "n8n-nodes-base.scheduleTrigger",
            position: [250, 300],
            parameters: {
              rule: {
                interval: [{ field: "cronExpression", cronExpression: "0 9 * * *" }]
              }
            }
          },
          {
            id: "get_content",
            name: "Get Content",
            type: "n8n-nodes-base.httpRequest",
            typeVersion: 4,
            position: [450, 300]
          }
        ],
        connections: {
          "Schedule Trigger": {
            main: [[{ node: "Get Content", type: "main", index: 0 }]]
          }
        },
        settings: { executionOrder: "v1" },
        tags: ["social-pip", "posting"]
      }
    },
    content_generation: {
      defaultName: "Content Generation",
      workflow: {
        name: "Content Generation",
        nodes: [...],
        tags: ["social-pip", "content"]
      }
    }
  };
}
```

---

## 4. Variables de Entorno

Las herramientas requieren:

```bash
# .env
N8N_API_KEY=tu_api_key_de_n8n
N8N_BASE_URL=http://localhost:5678
```

---

## 5. Ejemplos de Uso

### 5.1 Crear Workflow de Posting

**Prompt:**
```
Crea un workflow en n8n para posting automático diario a las 9am. El workflow debe:
1. Ejecutarse a las 9am todos los días
2. Llamar a OpenCode para generar un caption
3. Guardar el resultado en un archivo
4. Notificarme cuando termine
```

**OpenCode ejecutará:**
1. `n8n_create_workflow()` con la estructura adecuada
2. `n8n_activate_workflow()` para activarlo

### 5.2 Modificar Schedule

**Prompt:**
```
Cambia el workflow de posting para ejecutarse a las 10am en vez de 9am
```

**OpenCode ejecutará:**
1. `n8n_get_workflow()` para ver estructura actual
2. `n8n_update_workflow()` para cambiar el cron

### 5.3 Verificar Estado

**Prompt:**
```
¿Qué workflows de posting están activos en n8n?
```

**OpenCode ejecutará:**
1. `n8n_list_workflows()` para listar todos
2. Filtrará los que tienen tag "posting" y "active: true"

---

## 6. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | API key incorrecta | Verificar N8N_API_KEY |
| 404 Not Found | Workflow no existe | Verificar ID |
| 422 Unprocessable | JSON inválido | Validar estructura |
| Connection Refused | n8n no corriendo | Iniciar n8n |

---

## 7. Referencia Rápida

| Herramienta | Uso |
|-------------|-----|
| `n8n_list_workflows()` | Listar todos |
| `n8n_get_workflow(id)` | Ver detalles |
| `n8n_create_workflow(...)` | Crear nuevo |
| `n8n_update_workflow(id, ...)` | Actualizar |
| `n8n_activate_workflow(id)` | Activar |
| `n8n_deactivate_workflow(id)` | Desactivar |
| `n8n_delete_workflow(id)` | Eliminar |
| `n8n_trigger_webhook(url, data)` | Ejecutar |
| `n8n_get_executions(...)` | Ver historial |
| `n8n_create_workflow_from_template(...)` | Crear desde template |

---

*Última actualización: Abril 2026*