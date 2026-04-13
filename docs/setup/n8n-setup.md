# n8n Setup Guide

## Resumen

Guía para configurar n8n locally y conectarlo con Social-Pip.

---

## 1. Requisitos Previos

- Docker Desktop instalado
- Acceso a terminal
- Navegador web

---

## 2. Iniciar n8n

### 2.1 Con Docker Compose

```bash
cd social-pip/docs/setup
docker-compose up -d
```

### 2.2 Verificar que está corriendo

```bash
docker-compose ps
```

Debería mostrar:
```
NAME                STATUS
social-pip-n8n      Up
```

---

## 3. Configuración Inicial

### 3.1 Acceder a n8n

1. Abrir navegador: http://localhost:5678
2. Verás la UI de n8n

### 3.2 Generar API Key

1. Click en **Settings** (icono de engranaje)
2. Buscar **API** en el menú lateral
3. Click **Generate API Key**
4. **IMPORTANTE**: Copiar la key - solo se muestra una vez
5. Guardar en archivo `.env`:

```bash
N8N_API_KEY=tu_api_key_aqui
```

### 3.3 Habilitar REST API

La REST API está habilitada por defecto. Para verificar:
- Endpoint: http://localhost:5678/rest/workflows
- Headers requeridos: `X-N8N-API-KEY: tu_api_key`

---

## 4. Primer Workflow

### 4.1 Crear Workflow Simple

1. Click **+ New Workflow** (esquina superior izquierda)
2. Agregar nodo: Click en **+** y buscar "Schedule Trigger"
3. Configurar schedule (ej: cada hora)
4. Agregar nodo "HTTP Request" para conectar con OpenCode
5. Click **Save** (Ctrl+S)

### 4.2 Activar Workflow

1. Click en el toggle **Active** en la esquina superior derecha
2. El workflow comenzará a ejecutarse según el schedule

---

## 5. Conectar con OpenCode

### 5.1 Variables de Entorno

En el proyecto Social-Pip, crear `.env`:

```bash
N8N_API_KEY=tu_api_key_de_n8n
N8N_BASE_URL=http://localhost:5678
OPENCODE_SERVER_URL=http://localhost:4096
```

### 5.2 Verificar Conexión

Desde OpenCode:
```
Lista los workflows de n8n
```

Debería mostrar los workflows creados.

---

## 6. Webhooks

### 6.1 Obtener Webhook URL

1. Editar workflow
2. Agregar nodo **Webhook**
3. La URL aparece en el nodo:
   - Test: `http://localhost:5678/webhook-test/:id`
   - Production: `http://localhost:5678/webhook/:id`

### 6.2 Probar Webhook

```bash
curl -X POST http://localhost:5678/webhook-test/tu-webhook-id \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 7. Solución de Problemas

### 7.1 No puedo acceder a n8n

```bash
# Verificar que el contenedor esté corriendo
docker ps

# Ver logs
docker-compose logs n8n
```

### 7.2 API Key no funciona

1. Ir a Settings > API
2. Revocar key existente
3. Generar nueva key
4. Actualizar en `.env`

### 7.3 Webhook no responde

1. Verificar que el workflow esté **Active**
2. Verificar que el nodo Webhook esté configurado
3. Probar con webhook de test

---

## 8. Configuración Avanzada

### 8.1 Variables de Entorno de n8n

En docker-compose.yml:

```yaml
environment:
  - N8N_PORT=5678
  - N8N_PROTOCOL=http
  - TZ=America/Argentina/Buenos_Aires
  - N8N_API_KEY=${N8N_API_KEY}
```

### 8.2 Personalización

- **Execution Timeout**: Aumentar si workflows son lentos
- **Timezone**: Configurar para Argentina
- **Webhooks**: Habilitar allow iframe si se usa desde otra app

---

## 9. Referencias

- Documentación n8n: https://docs.n8n.io/
- API Reference: http://localhost:5678/rest
- Community: https://community.n8n.io/

---

*Última actualización: Abril 2026*