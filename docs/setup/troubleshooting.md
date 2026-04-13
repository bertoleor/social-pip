# Troubleshooting - Social-Pip

## Resumen

Guía de problemas comunes y sus soluciones para Social-Pip.

---

## 1. Problemas de Instalación

### 1.1 pnpm install falla

**Síntoma**: Error al instalar dependencias

**Soluciones**:
```bash
# Limpiar cache
pnpm store prune

# Eliminar node_modules y lock
rm -rf node_modules pnpm-lock.yaml

# Reintentar
pnpm install
```

### 1.2 Prisma generate falla

**Síntoma**: Cannot find module '@prisma/client'

**Soluciones**:
```bash
cd packages/database
pnpm prisma generate
pnpm prisma db push
```

---

## 2. Problemas de n8n

### 2.1 n8n no inicia

**Síntoma**: Container no levanta

**Soluciones**:
```bash
# Ver logs
docker-compose logs n8n

# Verificar puertos
netstat -ano | findstr :5678

# Reiniciar
docker-compose restart
```

### 2.2 API Key no funciona

**Síntoma**: 401 Unauthorized

**Soluciones**:
1. Ir a Settings → API en n8n
2. Revocar key antigua
3. Generar nueva key
4. Actualizar `.env`
5. Reiniciar OpenCode

### 2.3 Webhook no responde

**Síntoma**: Timeout en webhook

**Soluciones**:
- Verificar workflow está **Active**
- Verificar nodo Webhook tiene ruta correcta
- Probar con webhook de test

---

## 3. Problemas de Chrome Extension

### 3.1 Extension no carga

**Síntoma**: Error al cargar en chrome://extensions

**Soluciones**:
```bash
cd apps/extension
pnpm build

# En Chrome:
# 1. Eliminar extensión existente
# 2. Click "Load unpacked"
# 3. Seleccionar folder dist/
```

### 3.2 Native Messaging no funciona

**Síntoma**: Cannot connect to native host

**Soluciones**:
1. Verificar manifest.json tiene permisos correctos
2. Rebuild de Tauri
3. Ver logs en chrome://extensions > Service Worker

---

## 4. Problemas de OpenCode

### 4.1 MCPs no funcionan

**Síntoma**: Tools no disponibles

**Soluciones**:
```bash
# Verificar MCPs activos
opencode --doctor

# Reiniciar OpenCode
# Cerrar y abrir OpenCode nuevamente

# Verificar config
cat .config/opencode/opencode.json
```

### 4.2 sequential-thinking no responde

**Síntoma**: Tool timeout

**Soluciones**:
- Aumentar timeout en config
- Verificar instalación de paquete

---

## 5. Problemas de Database

### 5.1 SQLite lock error

**Síntoma**: Database is locked

**Soluciones**:
```bash
# Cerrar conexiones
# Usar sqlite3 directamente
sqlite3 dev.db ".tables"

# O eliminar y recrear DB
rm dev.db
pnpm prisma db push
```

---

## 6. Problemas de AI

### 6.1 NVIDIA NIM no responde

**Síntoma**: Connection timeout

**Soluciones**:
- Verificar API key válida
- Verificar conexión a internet
- Probar con Ollama local

### 6.2 Ollama no responde

**Síntoma**: Connection refused

**Soluciones**:
```bash
# Verificar Ollama corriendo
ollama list

# Si no, iniciar
ollama serve

# Ver modelo instalado
ollama list
```

---

## 7. Problemas de Posting

### 7.1 Anti-ban detecta actividad

**Síntoma**: Cuenta limitada/baneada

**Soluciones**:
- Reducir posts/día
- Aumentar delays
- Revisar estrategia en docs/anti-ban/

### 7.2 Content script no ejecuta

**Síntoma**: Script no aparece en página

**Soluciones**:
- Verificar extensión habilitada
- Refresh página
- Check console en DevTools

---

## 8. Comandos de Diagnóstico

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs n8n
docker-compose logs -f n8n

# Verificar MCPs
opencode --doctor

# Verificar DB
pnpm prisma studio

# Test de conexión
curl http://localhost:5678/health
curl http://localhost:4096/global/health
```

---

## 9. Contacto y Soporte

Si el problema persiste:
1. Revisar documentación en `docs/`
2. Buscar en issues de GitHub
3. Crear issue nuevo con logs

---

*Última actualización: Abril 2026*