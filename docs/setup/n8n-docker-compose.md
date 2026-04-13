# Docker Compose para n8n

## Resumen

Este documento presenta el archivo docker-compose.yml completo para ejecutar n8n local con SQLite integrado.

---

## 1. Docker Compose Completo

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: social-pip-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678
      # Configuración de Base de Datos SQLite
      - N8N_DATABASE_TYPE=sqlite
      - N8N_DATABASE_PATH=/home/node/.n8n
      # Configuración de API
      - N8N_API_KEY=${N8N_API_KEY}
      # Timezone Argentina
      - TZ=America/Argentina/Buenos_Aires
      # Configuración de Execution
      - EXECUTIONS_MODE=regular
      - EXECUTIONS_TIMEOUT=300
      - EXECUTIONS_TIMEOUT_MAX=3600
    volumes:
      - n8n_data:/home/node/.n8n
      # Montar workflows personalizados
      - ./workflows:/workflows
      # Montar datos de Social-Pip
      - ./data:/data
    networks:
      - social-pip-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/health"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Opcional: Redis para caching y mejor performance
  redis:
    image: redis:7-alpine
    container_name: social-pip-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - social-pip-network

  # Opcional: Watchtower para auto-actualizaciones
  watchtower:
    image: containrrr/watchtower
    container_name: social-pip-watchtower
    restart: unless-stopped
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=true
      - WATCHTOWER_SCHEDULE=0 2 * * 0
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - social-pip-network

networks:
  social-pip-network:
    driver: bridge

volumes:
  n8n_data:
    name: social-pip-n8n-data
  redis_data:
    name: social-pip-redis-data
```

---

## 2. Archivo .env

Crear archivo `.env` en el mismo directorio:

```bash
# n8n API Key (generar desde Settings > API en n8n)
N8N_API_KEY=tu_api_key_aqui

# Puerto de OpenCode (para integración)
OPENCODE_PORT=4096

# Zona horaria
TZ=America/Argentina/Buenos_Aires
```

---

## 3. Comandos de Uso

### 3.1 Iniciar n8n

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f n8n

# Ver status
docker-compose ps
```

### 3.2 Acceder a n8n

- **Web UI**: http://localhost:5678
- **API**: http://localhost:5678/rest

### 3.3 Detener n8n

```bash
# Detener sin eliminar datos
docker-compose stop

# Eliminar completamente
docker-compose down
```

---

## 4. Configuración de Acceso Externo

### 4.1 Acceder desde otra máquina

Modificar el docker-compose para exponer a red:

```yaml
services:
  n8n:
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_ALLOW_IFRAME=true
```

### 4.2 SSL con Nginx Proxy

```yaml
# nginx/nginx.conf
server {
    listen 443 ssl;
    server_name n8n.tudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Backup y Restore

### 5.1 Backup

```bash
# Backup del volumen
docker run --rm -v social-pip-n8n-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/n8n-backup-$(date +%Y%m%d).tar.gz /data
```

### 5.2 Restore

```bash
# Restore desde backup
docker run --rm -v social-pip-n8n-data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/n8n-backup-20260408.tar.gz -C /
```

---

## 6. Integración con Social-Pip

### 6.1 Configurar API Key

1. Abrir n8n: http://localhost:5678
2. Ir a **Settings** → **API**
3. Click **Generate API Key**
4. Copiar la key y guardarla en `.env`

### 6.2 Configurar Webhooks

Los webhooks de n8n estarán disponibles en:
- Test: `http://localhost:5678/webhook-test/{path}`
- Prod: `http://localhost:5678/webhook/{path}`

### 6.3 Conectar con OpenCode

En el archivo `.opencode/tools/n8n.ts`:
```typescript
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
```

---

## 7. Troubleshooting

### 7.1 Problemas Comunes

| Problema | Solución |
|----------|----------|
| No puedo acceder | Verificar que el puerto no esté en uso: `lsof -i :5678` |
| Base de datos corrupta | Restore desde backup o eliminar volumen |
| Webhook no funciona | Verificar que el workflow tenga el nodo Webhook activo |

### 7.2 Logs

```bash
# Ver logs de n8n
docker-compose logs n8n --tail=100

# Ver logs en tiempo real
docker-compose logs -f n8n
```

---

## 8. Actualización

```bash
# Pull nueva versión
docker-compose pull

# Recreate contenedores
docker-compose up -d

# Verificar versión
docker-compose exec n8n n8n --version
```

---

*Última actualización: Abril 2026*