# Arquitectura de Integración OpenCode + n8n para Social-Pip
> Parte de: [[README]] · Relacionados: [[ai-integration]] · [[database-schema]] · [[main-architecture]]

## Resumen Ejecutivo

Este documento establece la arquitectura completa de integración entre **OpenCode** y **n8n** para el proyecto Social-Pip. La integración permite que OpenCode cree, gestione y ejecute workflows de automatización de redes sociales a través de n8n, aprovechando las fortalezas de ambos sistemas.

**Principio rector**: OpenCode actúa como el "cerebro" que gestiona la lógica de negocio, mientras n8n actúa como el "brazo" que ejecuta las automatizaciones programadas.

---

## 1. Visión General de la Integración

### 1.1 Objetivos de la Integración

| Objetivo | Descripción | Beneficio |
|----------|-------------|-----------|
| **Gestión de workflows** | OpenCode puede crear, modificar, activar y eliminar workflows de n8n | Control total desde OpenCode |
| **Ejecución automatizada** | n8n ejecuta workflows programados sin intervención manual | Posting automático 24/7 |
| **Generación de contenido** | OpenCode genera contenido via AI, n8n lo distribuye | Automatización completa |
| **Monitoreo y analytics** | n8n coleta métricas, OpenCode las analiza | Mejora continua |
| **Notificaciones** | Sistema bidireccional de alertas | Supervision en tiempo real |

### 1.2 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOCIAL-PIP ECOSYSTEM                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         OPENCODE (Cerebro)                            │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   AI Core   │  │  Strategy   │  │   Content   │  │  Analytics  │  │  │
│  │  │  (NVIDIA    │  │   Engine    │  │  Generator  │  │   Engine    │  │  │
│  │  │   NIM/Ollama│  │             │  │             │  │             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │              Custom Tools (n8n Manager)                         │  │  │
│  │  │  • n8n_create_workflow()    • n8n_trigger_webhook()           │  │  │
│  │  │  • n8n_list_workflows()    • n8n_activate_workflow()         │  │  │
│  │  │  • n8n_get_workflow()      • n8n_deactivate_workflow()       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                        │                                │  │
│  │                         OpenCode Server │ Port 4096                    │  │
│  └─────────────────────────────────────────┼──────────────────────────────┘  │
│                                            │                                 │
│                                            │ REST API / HTTP                │
│                                            ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         n8n (Brazo)                                   │  │
│  │                                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Scheduler  │  │   HTTP      │  │   AI       │  │   Database  │  │  │
│  │  │   Trigger   │  │   Request   │  │   Nodes     │  │   (SQLite)  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    WORKFLOWS                                   │  │  │
│  │  │  • posting-workflows      • analytics-workflows               │  │  │
│  │  │  • template-workflows    • marketing-workflows                │  │  │
│  │  │  • automation-workflows  • manual-de-marca-workflows         │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                        │                                │  │
│  │                              n8n Web UI │ Port 5678                     │  │
│  └─────────────────────────────────────────┼──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            │ Native Messaging
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION (Execution Layer)                      │
│  • Service Worker (cola de tareas)                                          │
│  • Content Scripts (Facebook, Instagram, TikTok, etc.)                      │
│  • Automatización real del browser                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujos de Comunicación

### 2.1 Flujo 1: OpenCode → n8n (Control de workflows)

Este flujo permite a OpenCode controlar completamente los workflows de n8n.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   OpenCode  │ ──────▶ │   OpenCode   │ ──────▶ │     n8n      │
│   (Prompt)  │         │  (Custom     │         │   (REST API) │
│             │         │   Tools)     │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                        │
      │ "Crea un workflow     │ POST /rest/workflows   │
      │  de posting para      │ {name, nodes,         │
      │  Instagram"           │  connections}        │
      │                        │                        │
      ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Usuario    │         │   n8n REST   │         │  Workflow    │
│   ejecuta    │         │   API        │         │  creado en   │
│   prompt     │         │   Port 4096  │         │  n8n         │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Casos de uso:**
- Crear workflows desde cero
- Modificar workflows existentes
- Activar/desactivar workflows
- Eliminar workflows

### 2.2 Flujo 2: OpenCode → n8n (Ejecución via Webhook)

Este flujo permite a OpenCode ejecutar workflows específicos via webhooks.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   OpenCode  │ ──────▶ │   OpenCode   │ ──────▶ │     n8n      │
│   (AI       │         │   (Tool:     │         │  (Webhook)   │
│   Genera    │         │  trigger_    │         │              │
│   contenido)│         │  webhook)    │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                        │
      │ "Genera caption y    │ POST                   │
      │  ejecuta workflow    │ /webhook/ posting      │
      │  de posting"         │ {content, images,      │
      │                        │  platform}            │
      ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   AI (NVIDIA │         │   Webhook    │         │   Workflow   │
│   NIM/Ollama)│         │   URL        │         │   ejecuta    │
│              │         │              │         │   posting    │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Casos de uso:**
- Generación de contenido + posting inmediato
- Respuesta a triggers externos
- Ejecución bajo demanda

### 2.3 Flujo 3: n8n → OpenCode (Callback)

Este flujo permite que n8n envíe resultados o solicite procesamiento adicional a OpenCode.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     n8n      │ ──────▶ │     n8n      │ ──────▶ │   OpenCode   │
│  (Workflow   │         │   (HTTP      │         │   (Session   │
│   ejecuta)   │         │   Request)   │         │   /message)  │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                        │
      │ "Workflow completó    │ POST                   │
      │  posting, necesito   │ http://localhost:4096/ │
      │  analizar resultados"│ session/{id}/message  │
      │                        │ {prompt: "analiza..."}│
      ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Posting    │         │   HTTP       │         │   AI analiza │
│   completado │         │   Request    │         │   resultados │
│              │         │   Port 4096  │         │   y reporta  │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Casos de uso:**
- Análisis de resultados post-posting
- Procesamiento de métricas
- Decisiones condicionales basadas en AI

### 2.4 Flujo 4: Programación (Scheduler)

Este flujo permite que n8n ejecute workflows automáticamente en schedule.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   OpenCode   │ ──────▶ │     n8n      │         │     n8n      │
│  (Scheduler  │         │  (Schedule  │ ──────▶ │  (Workflow   │
│   config)    │         │   Trigger)   │         │   ejecuta)   │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                        │
      │ "Crea workflow        │ Cron: 0 9 * * *        │
      │  que ejecute a        │ (cada día 9am)         │
      │  las 9am"             │                        │
      ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Custom    │         │   Schedule   │         │   Posting   │
│   Tool:      │         │   Trigger    │         │   ejecutado │
│   create_    │         │   n8n        │         │   a la hora  │
│   workflow   │         │              │         │   programada │
└──────────────┘         └──────────────┘         └──────────────┘
```

**Casos de uso:**
- Posting programado diario
- Reportes semanales automáticos
- Monitoreo periódic

---

## 3. Modos de Integración

### 3.1 Modo 1: Gestión Completa (Recomendado)

OpenCode crea y gestiona completamente los workflows. n8n solo ejecuta.

| Aspecto | Detalle |
|---------|---------|
| **Creación** | OpenCode define estructura completa del workflow |
| **Modificación** | OpenCode actualiza via REST API |
| **Activación** | OpenCode activa/desactiva |
| **Ejecución** | n8n ejecuta según schedule o webhook |
| **Monitoreo** | OpenCode consulta estados via API |

**Ventajas:**
- Control total desde OpenCode
- workflows personalizados
- No necesita intervención manual en n8n

**Desventajas:**
- Requiere más configuración inicial
- opencode debe conocer estructura de n8n

### 3.2 Modo 2: Template Modificado

OpenCode usa templates predefinidos de n8n y los modifica según necesidades.

| Aspecto | Detalle |
|---------|---------|
| **Base** | Templates de n8n Community o propios |
| **Modificación** | OpenCode ajusta parámetros específicos |
| **Variables** | Campos dinámicos (cuentas, grupos, horarios) |
| **Personalización** | Manual de Marca aplicado a templates |

**Ventajas:**
- Más rápido de implementar
- Menos errores de estructura
- Basado en mejores prácticas

**Desventajas:**
- Limitado a estructura de templates
- Requiere encontrar buen template base

### 3.3 Modo 3: Híbrido (Combinación)

Combina gestión completa y templates según complejidad.

| Escenario | Enfoque |
|-----------|--------|
| Workflows simples (posting básico) | Template modificado |
| Workflows complejos (multi-plataforma) | Gestión completa |
| Workflows de AI (generación contenido) | Gestión completa |
| Workflows de analytics | Template modificado |

---

## 4. Componentes de la Integración

### 4.1 OpenCode Server

| Configuración | Valor |
|---------------|-------|
| **Puerto** | 4096 (default) |
| **Protocolo** | HTTP REST |
| **Autenticación** | Optional (X-N8N-API-KEY) |
| **CORS** | Enabled para localhost:5678 |

**Endpoints principales para n8n:**

```
GET  /global/health           → Verificar que OpenCode esté corriendo
POST /session/:id/message    → Enviar prompt y obtener respuesta
POST /session/:id/prompt_async → Enviar prompt sin esperar
GET  /session/:id/todo       → Obtener lista de TODOs
POST /tui/show-toast         → Mostrar notificación
```

### 4.2 n8n REST API

| Configuración | Valor |
|---------------|-------|
| **Puerto** | 5678 (default) |
| **Protocolo** | HTTP REST |
| **Autenticación** | X-N8N-API-KEY o Basic Auth |
| **Base URL** | http://localhost:5678 |

**Endpoints principales:**

```
GET    /rest/workflows           → Listar todos los workflows
POST   /rest/workflows           → Crear nuevo workflow
GET    /rest/workflows/:id       → Ver workflow específico
PATCH   /rest/workflows/:id      → Actualizar workflow
DELETE /rest/workflows/:id       → Eliminar workflow
POST   /workflows/:id/activate   → Activar workflow
POST   /workflows/:id/deactivate → Desactivar workflow
POST   /webhook/:path            → Trigger via webhook
GET    /executions               → Ver ejecuciones
```

### 4.3 Custom Tools en OpenCode

Herramientas que OpenCode provee para interacturar con n8n:

```typescript
// Herramientas disponibles en OpenCode
n8n_list_workflows()              // Listar todos los workflows
n8n_get_workflow(id)              // Ver detalles de un workflow
n8n_create_workflow(workflow)     // Crear nuevo workflow
n8n_update_workflow(id, updates)  // Actualizar workflow
n8n_activate_workflow(id)         // Activar workflow
n8n_deactivate_workflow(id)       // Desactivar workflow
n8n_delete_workflow(id)           // Eliminar workflow
n8n_trigger_webhook(url, data)    // Ejecutar webhook
n8n_get_executions(workflowId)    // Ver ejecuciones
```

---

## 5. Casos de Uso para Social-Pip

### 5.1 Caso 1: Posting Programado Multi-Plataforma

```
Escenario: Usuario quiere publicar a las 9am en Facebook e Instagram

Flujo:
1. OpenCode recibe prompt: "Crea posting para 9am en FB e IG"
2. OpenCode genera caption via AI (NVIDIA NIM)
3. OpenCode crea/modifica workflow de posting con schedule 9am
4. n8n activa workflow
5. A las 9am, n8n ejecuta posting en ambas plataformas
6. Chrome Extension ejecuta posting real en el browser
7. n8n reporta resultado a OpenCode
8. OpenCode analiza y guarda métricas
```

### 5.2 Caso 2: Generación Automática de Contenido

```
Escenario: Generar contenido diario basado en Manual de Marca

Flujo:
1. n8n trigger (Schedule: diario 8am)
2. n8n llama a OpenCode: "Genera contenido para hoy"
3. OpenCode:
   - Lee template de Manual de Marca
   - Aplica reglas de marca (tone, hashtags, formato)
   - Genera caption via AI
   - Retorna contenido a n8n
4. n8n recibe contenido y ejecuta posting
5. OpenCode analiza resultados y actualiza stats
```

### 5.3 Caso 3: Monitoreo de Grupos

```
Escenario: Monitorear grupos de Facebook por nuevas oportunidades

Flujo:
1. n8n trigger (Schedule: cada 2 horas)
2. n8n ejecuta workflow de scrapeo
3. Chrome Extension scraping grupos objetivo
4. n8n analiza contenido encontrado
5. n8n envía a OpenCode: "Analiza si hay oportunidades"
6. OpenCode clasifica y prioriza oportunidades
7. OpenCode notifica al usuario
```

### 5.4 Caso 4: Respuesta Automática a Comentarios

```
Escenario: Responder automáticamente a comentarios en posts

Flulo:
1. n8n trigger (Webhook de Instagram/Facebook)
2. n8n recibe notificación de nuevo comentario
3. n8n envía a OpenCode: "Genera respuesta para: [comentario]"
4. OpenCode genera respuesta según Manual de Marca
5. n8n ejecuta respuesta via Chrome Extension
6. OpenCode registra interacción
```

### 5.5 Caso 5: Reportes Automáticos

```
Escenario: Generar reporte semanal de métricas

Flujo:
1. n8n trigger (Schedule: domingo 8pm)
2. n8n recolecta métricas de la semana
3. n8n envía datos a OpenCode: "Genera reporte"
4. OpenCode genera reporte con analytics
5. n8n envía reporte por email/Telegram
6. OpenCode guarda en DB
```

---

## 6. Configuración de Seguridad

### 6.1 Autenticación OpenCode → n8n

```typescript
// Configuración en Custom Tools
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';

const headers = {
  'Content-Type': 'application/json',
  'X-N8N-API-KEY': N8N_API_KEY
};
```

### 6.2 Autenticación n8n → OpenCode

```typescript
// En workflow de n8n, node HTTP Request
{
  url: 'http://localhost:4096/session/{{$json.sessionId}}/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    parts: [{
      type: 'text',
      content: '{{$json.prompt}}'
    }]
  }
}
```

### 6.3 Variables de Entorno

```bash
# En .env de Social-Pip
N8N_API_KEY=tu_api_key_de_n8n
N8N_BASE_URL=http://localhost:5678
OPENCODE_SERVER_URL=http://localhost:4096
```

---

## 7. Manejo de Errores

### 7.1 Errores de Comunicación

| Error | Causa | Solución |
|-------|-------|----------|
| Connection refused | n8n no corriendo | Verificar que n8n esté ejecutándose |
| 401 Unauthorized | API key inválida | Regenerar API key en n8n |
| 404 Not Found | Workflow no existe | Verificar ID del workflow |
| 422 Unprocessable | JSON inválido | Validar estructura del workflow |

### 7.2 Reintentos

```typescript
// Implementar retry logic
async function n8nRequestWithRetry(endpoint, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

## 8. Mejores Prácticas

### 8.1 Para Workflows

| Práctica | Descripción |
|----------|-------------|
| **Nombres descriptivos** | Usar nombres claros: `fb-daily-posting-9am` |
| **Tags** | Agrupar por funcionalidad: `posting`, `analytics`, `manual-de-marca` |
| **Versioning** | Mantener backup de workflows importantes |
| **Testing** | Probar workflows con webhooks de prueba primero |

### 8.2 Para OpenCode

| Práctica | Descripción |
|----------|-------------|
| **Prompts claros** | Especificar estructura exacta del workflow |
| **Validación** | Verificar respuesta de n8n antes de continuar |
| **Logging** | Registrar todas las interacciones |
| **Fallback** | Tener plan B si n8n no responde |

### 8.3 Para Manual de Marca

| Práctica | Descripción |
|----------|-------------|
| **Templates centralizados** | Guardar en DB, no hardcoded |
| **Versiones** | Mantener historial de cambios |
| **Validación** | Verificar cumplimiento antes de posting |
| **AI integration** | Usar AI para aplicar reglas automáticamente |

---

## 9. Diagramas de Secuencia

### 9.1 Crear y Activar Workflow

```
┌─────────┐     ┌──────────┐     ┌────────┐     ┌──────┐
│ Usuario │     │ OpenCode │     │  API   │     │ n8n  │
└────┬────┘     └────┬─────┘     └───┬────┘     └──┬───┘
     │               │              │             │
     │ "Crea        │              │             │
     │  workflow    │              │             │
     │  posting"   │              │             │
     │─────────────▶│              │             │
     │              │ POST        │             │
     │              │ /rest/workflows             │
     │              │───────────▶│─────────────▶│
     │              │              │             │ Crea workflow
     │              │              │◀────────────│ (201 Created)
     │              │◀─────────────│◀────────────│
     │              │              │             │
     │ "Actívalo"  │              │             │
     │─────────────▶│              │             │
     │              │ POST        │             │
     │              │ /workflows/ │             │
     │              │ id/activate │             │
     │              │───────────▶│─────────────▶│
     │              │              │             │ Activa workflow
     │              │              │◀────────────│
     │              │◀─────────────│◀────────────│
     │              │              │             │
     │ "Listo"     │              │             │
     │◀────────────│              │             │
```

### 9.2 Ejecución de Workflow Programado

```
┌─────────┐     ┌──────────┐     ┌────────┐     ┌──────┐
│  Cron   │     │   n8n    │     │  HTTP  │     │ChrExt│
└────┬────┘     └────┬─────┘     └───┬────┘     └──┬───┘
     │               │              │             │
     │ 9:00am        │              │             │
     │──────────────▶│              │             │
     │              │              │             │
     │              │Ejecuta workflow            │
     │              │─────────────▶│             │
     │              │              │            │
     │              │              │ GET /task  │
     │              │              │───────────▶│
     │              │              │            │ Lee tarea
     │              │              │◀───────────│
     │              │              │            │
     │              │              │  POST      │
     │              │              │  content   │
     │              │              │───────────▶│
     │              │              │            │ Publica
     │              │              │◀───────────│ (success)
     │              │              │            │
     │              │◀─────────────│◀───────────│
```

---

## 10. Referencia Rápida

### URLs y Puertos

| Servicio | Puerto | URL Base |
|----------|--------|----------|
| OpenCode Server | 4096 | http://localhost:4096 |
| OpenCode Web UI | 5173 | http://localhost:5173 |
| n8n Web UI | 5678 | http://localhost:5678 |
| n8n REST API | 5678 | http://localhost:5678 |

### Variables de Entorno

```
N8N_API_KEY=...
N8N_BASE_URL=http://localhost:5678
OPENCODE_SERVER_URL=http://localhost:4096
```

### Endpoints Clave

**OpenCode:**
- `POST /session/:id/message` - Ejecutar prompt
- `POST /session/:id/prompt_async` - Ejecutar async

**n8n:**
- `POST /rest/workflows` - Crear workflow
- `POST /workflows/:id/activate` - Activar
- `POST /webhook/:path` - Trigger webhook

---

## 11. Próximos Pasos

1. **Configurar n8n** - Instalar y configurar según docs/setup/n8n-setup.md
2. **Crear Custom Tools** - Implementar según docs/tools/opencode-n8n-tools.md
3. **Crear Workflows Base** - Según docs/workflows/
4. **Integrar Manual de Marca** - Aplicar según docs/workflows/templates-workflows.md
5. **Probar integración** - Ejecutar casos de uso de prueba

---

*Última actualización: Abril 2026*