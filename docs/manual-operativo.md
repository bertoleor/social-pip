# Manual Operativo - Social-Pip

> Guía de operación diaria y mantenimiento del sistema
> Última actualización: Abril 2026

---

## Tabla de Contenidos

1. [Operación Diaria](#operación-diaria)
2. [Manejo de Fallos](#manejo-de-fallos)
3. [Backups y Recuperación](#backups-y-recuperación)
4. [Mantenimiento Rutinario](#mantenimiento-rutinario)
5. [Mapa de Plataformas](#mapa-de-plataformas)
6. [Protocolos de Emergencia](#protocolos-de-emergencia)
7. [Troubleshooting](#troubleshooting)

---

## Operación Diaria

### Checklist de Mañana (9:00)

```yaml
Chequeos de Inicio:
  - [ ] Revisar dashboard de estado general
  - [ ] Verificar posts programados del día
  - [ ] Chequear alertas nocturnas (Slack/Email)
  - [ ] Confirmar conexión con APIs de plataformas
  - [ ] Revisar rate limits restantes
```

#### Dashboard de Estado

```
┌─────────────────────────────────────────────────────────────────┐
│  SOCIAL-PIP - ESTADO DEL SISTEMA         09:00 - 10 Abril 2026 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SERVICIOS                                                      │
│  ┌──────────────┬─────────┬─────────────────────────────────┐  │
│  │ Scheduler    │ 🟢 OK   │ Último run: 08:55               │  │
│  │ API Server   │ 🟢 OK   │ Latencia: 45ms                  │  │
│  │ Database     │ 🟢 OK   │ Conexiones: 12/100             │  │
│  │ AI Service   │ 🟢 OK   │ Tokens hoy: 45,000/100,000     │  │
│  └──────────────┴─────────┴─────────────────────────────────┘  │
│                                                                 │
│  CUENTAS ACTIVAS                                                │
│  ┌──────────────┬─────────┬─────────────────────────────────┐  │
│  │ Facebook     │ 🟢 3    │ Posts hoy: 6/10                 │  │
│  │ Instagram    │ 🟢 2    │ Posts hoy: 3/5                  │  │
│  │ Twitter      │ 🟢 4    │ Posts hoy: 12/20                │  │
│  │ LinkedIn     │ 🟢 1    │ Posts hoy: 1/3                  │  │
│  └──────────────┴─────────┴─────────────────────────────────┘  │
│                                                                 │
│  COLA DE TRABAJO                                                │
│  Pendientes: 8    En proceso: 2    Completados hoy: 22         │
│                                                                 │
│  ALERTAS RECIENTES                                              │
│  ⚠️  08:30 - Rate limit warning (Twitter) - Atención          │
│  ✅ 07:45 - Backup completado                                   │
│  ❌ 06:22 - Auth refresh failed (cuenta_test) - Pendiente      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist de Tarde (15:00)

```yaml
Chequeos de Media Jornada:
  - [ ] Monitorear rate limits
  - [ ] Revisar posts publicados (verificar calidad)
  - [ ] Ajustar schedule si hay problemas
  - [ ] Verificar engagement en posts publicados
  - [ ] Chequear salud de las cuentas
```

### Checklist de Noche (21:00)

```yaml
Chequeos de Cierre:
  - [ ] Ejecutar backup de base de datos
  - [ ] Revisar logs de errores del día
  - [ ] Verificar cola para mañana
  - [ ] Confirmar posts programados para mañana
  - [ ] Marcar tareas completadas
```

---

## Manejo de Fallos

### Error de Rate Limit

**Síntomas:**
- API retorna 429
- Mensaje "Rate limit exceeded"
- Posts fallan con código E001

**Procedimiento:**

```yaml
Paso 1: Identificar el alcance
  - ¿Qué plataforma?
  - ¿Qué cuenta(s)?
  - ¿Cuántos posts afectados?

Paso 2: Acción inmediata
  - Pausar scheduler para la plataforma
  - Marcar posts fallidos como RETRY
  - Documentar en log

Paso 3: Esperar reset
  - Verificar tiempo hasta reset (variable por plataforma)
  - Facebook: 1 hora
  - Twitter: 15 minutos
  - LinkedIn: 24 horas

Paso 4: Reanudar
  - Reducir frecuencia temporalmente
  - Reactivar scheduler
  - Monitorear por 1 hora

Paso 5: Ajuste preventivo
  - Reducir max_daily_posts si es recurrente
  - Aumentar min_delay_ms
  - Documentar en configuración
```

### Error de Autenticación

**Síntomas:**
- API retorna 401
- Mensaje "Invalid token" o "Token expired"
- Posts fallan con código E002

**Procedimiento:**

```yaml
Paso 1: Verificar tipo de error
  - Token expirado → Renovar
  - Token inválido → Re-autenticar
  - Permiso revocado → Contactar usuario

Paso 2: Renovación de token
  Si es OAuth:
    1. Usar refresh_token
    2. Obtener nuevo access_token
    3. Actualizar en DB
    4. Verificar funciona

Paso 3: Re-autenticación
  Si refresh falla:
    1. Notificar usuario
    2. Proporcionar link de re-autenticación
    3. Esperar acción del usuario

Paso 4: Verificación
  - Test post simple
  - Verificar permisos correctos
  - Documentar en log
```

### Error de Red

**Síntomas:**
- Timeouts frecuentes
- Mensaje "Connection refused"
- Posts fallan con código E003

**Procedimiento:**

```yaml
Paso 1: Diagnóstico
  - Verificar conectividad a internet
  - Ping a servidores de la plataforma
  - Verificar DNS resolution

Paso 2: Acción automática
  - El sistema reintenta con backoff
  - Máximo 3 reintentos
  - Si todos fallan → Alertar

Paso 3: Si persiste
  - Verificar firewall rules
  - Verificar proxy/VPN si aplica
  - Contactar ISP si es problema externo

Paso 4: Recuperación
  - Al restablecer conexión
  - Los posts pendientes se reintentan automáticamente
  - Verificar cola de retry
```

### Error de Plataforma Bloqueada

**Síntomas:**
- API retorna 403
- Mensaje "Account restricted" o similar
- Posts fallan con código E005

**Procedimiento:**

```yaml
Paso 1: Detener todo
  - Pausar scheduler INMEDIATAMENTE
  - Marcar cuenta como BLOCKED
  - Notificar a usuario

Paso 2: Investigar causa
  - Revisar posts recientes (contenido sospechoso)
  - Verificar frecuencia de publicación
  - Buscar patrones en logs

Paso 3: Acción correctiva
  - Contactar soporte de plataforma
  - Solicitar revisión/apelación
  - Ajustar configuración anti-ban

Paso 4: Reactivación (cuando se desbloquee)
  - Reducir frecuencia al 50%
  - Monitorear por 48-72 horas
  - Aumentar gradualmente

Paso 5: Documentación
  - Registrar incidente completo
  - Ajustar umbrales si necesario
  - Actualizar anti-ban config
```

---

## Backups y Recuperación

### Backup Diario

**Automático a las 3:00 AM:**

```bash
# Script de backup automático
#!/bin/bash

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/$DATE"
mkdir -p $BACKUP_DIR

# Base de datos SQLite
sqlite3 /data/social-pip.db ".backup $BACKUP_DIR/database.db"

# Configuración
cp -r /config $BACKUP_DIR/

# Logs importantes
cp /var/log/social-pip/errors.log $BACKUP_DIR/ 2>/dev/null

# Encriptar
gpg --symmetric --cipher-algo AES256 $BACKUP_DIR/database.db

# Subir a almacenamiento offsite
rclone copy $BACKUP_DIR remote:social-pip-backups/$DATE/

# Limpiar backups viejos (30 días)
find /backups -type d -mtime +30 -exec rm -rf {} +

echo "Backup completed: $DATE" >> /var/log/social-pip/backup.log
```

### Backup Semanal

**Domingo a las 4:00 AM:**

```yaml
Contenido:
  - Full database dump
  - Todos los archivos de configuración
  - Logs de la semana
  - Tokens encriptados
  - Templates de prompts

Verificación:
  - Test restore en staging
  - Verificar integridad
  - Confirmar offsite copy
```

### Procedimiento de Restauración

```yaml
Escenario: Recuperar desde backup

1. Detener servicios
   systemctl stop social-pip-scheduler
   systemctl stop social-pip-api

2. Descargar backup
   rclone copy remote:social-pip-backups/$DATE /restore/

3. Desencriptar
   gpg --decrypt /restore/database.db.gpg > /restore/database.db

4. Restaurar
   cp /restore/database.db /data/social-pip.db
   cp -r /restore/config/* /config/

5. Verificar integridad
   sqlite3 /data/social-pip.db "PRAGMA integrity_check;"

6. Reiniciar servicios
   systemctl start social-pip-api
   systemctl start social-pip-scheduler

7. Verificar funcionamiento
   curl http://localhost:8080/health
   # Verificar posts pendientes en dashboard

8. Documentar
   - Fecha y hora de restauración
   - Backup utilizado
   - Datos perdidos (si hay)
```

---

## Mantenimiento Rutinario

### Semanal (Lunes)

```yaml
Tareas:
  - [ ] Revisar rate limits por plataforma
  - [ ] Actualizar tokens próximos a expirar (7 días)
  - [ ] Limpiar logs antiguos (> 7 días)
  - [ ] Verificar espacio en disco
  - [ ] Chequear actualizaciones de dependencias
```

### Mensual (Primer lunes)

```yaml
Tareas:
  - [ ] Verificar backups funcionando (test restore)
  - [ ] Actualizar dependencias con parches de seguridad
  - [ ] Revisar métricas de uso del mes
  - [ ] Limpiar datos temporales
  - [ ] Auditoría rápida de tokens activos
  - [ ] Revisar configuración anti-ban
```

### Trimestral

```yaml
Tareas:
  - [ ] Auditoría de seguridad completa
  - [ ] Review de prompts y templates
  - [ ] Optimización de performance
  - [ ] Actualización mayor de dependencias
  - [ ] Review de logs de errores
  - [ ] Documentar cambios en configuración
```

---

## Mapa de Plataformas

### APIs y Credenciales

| Plataforma | Propósito | Tipo Auth | Ubicación | Renovación |
|------------|-----------|-----------|-----------|------------|
| NVIDIA NIM | AI Captions | API Key | Settings | Manual |
| OpenAI | Backup AI | API Key | Settings | Manual |
| Facebook | Publishing | OAuth 2.0 | Account DB | 60 días |
| Instagram | Publishing | OAuth 2.0 | Account DB | 60 días |
| Twitter/X | Publishing | OAuth 1.0a | Account DB | Nunca |
| LinkedIn | Publishing | OAuth 2.0 | Account DB | 60 días |
| TikTok | Publishing | OAuth 2.0 | Account DB | 24 horas |

### Límites por Plataforma

| Plataforma | Posts/día | Delay mínimo | Ventana horaria | Cooldown bloqueo |
|------------|-----------|--------------|-----------------|------------------|
| Facebook | 10 | 30 min | 9:00-21:00 | 24-72h |
| Instagram | 5 | 45 min | 10:00-20:00 | 24-48h |
| Twitter | 20 | 15 min | 8:00-22:00 | 12-24h |
| LinkedIn | 3 | 60 min | 9:00-18:00 | 48-72h |
| TikTok | 3 | 120 min | 12:00-22:00 | 24h |

### URLs de Gestión

| Plataforma | Developer Console | Business Manager |
|------------|-------------------|------------------|
| Facebook | developers.facebook.com | business.facebook.com |
| Instagram | (via Facebook) | business.facebook.com |
| Twitter | developer.twitter.com | ads.twitter.com |
| LinkedIn | developer.linkedin.com | linkedin.com/company |
| TikTok | developers.tiktok.com | tiktok.com/business |

---

## Protocolos de Emergencia

### Contactos

```yaml
Equipo de Respuesta:
  Tech Lead:
    Nombre: [Completar]
    Teléfono: +54 XXX XXX XXXX
    Email: [nombre]@social-pip.com
    Disponibilidad: 24/7
    
  DevOps:
    Nombre: [Completar]
    Teléfono: +54 XXX XXX XXXX
    Email: [nombre]@social-pip.com
    Disponibilidad: 9:00-21:00
    
  Security:
    Email: security@social-pip.com
    Disponibilidad: 24/7

Soporte Externo:
  Hosting Provider: [Completar]
  Database Support: [Completar]
```

### Procedimientos por Severidad

#### SEVERIDAD 1 - Crítico (Responder en 15 min)

```yaml
Ejemplos:
  - Todas las cuentas bloqueadas
  - Base de datos corrupta
  - API completamente down
  - Data breach confirmado

Acción:
  1. Notificar Tech Lead INMEDIATAMENTE
  2. Detener todos los servicios
  3. Documentar situación actual
  4. Seguir protocolo específico
  5. Comunicar a stakeholders
```

#### SEVERIDAD 2 - Alto (Responder en 1 hora)

```yaml
Ejemplos:
  - Una cuenta bloqueada
  - Rate limit excedido en múltiples cuentas
  - Backup fallido
  - Latencia extrema

Acción:
  1. Notificar por Slack #alerts-critical
  2. Seguir procedimiento de manejo
  3. Documentar en log
  4. Escalar si no se resuelve en 1 hora
```

#### SEVERIDAD 3 - Medio (Responder en 4 horas)

```yaml
Ejemplos:
  - Post fallido individual
  - Token próximo a expirar
  - Warning de rate limit
  - Error de red recuperado

Acción:
  1. Registrar en log
  2. Resolver en horario laboral
  3. Documentar causa y solución
```

---

## Troubleshooting

### Problemas Comunes

#### "Scheduler no ejecuta posts"

```yaml
Diagnóstico:
  1. Verificar scheduler está corriendo:
     systemctl status social-pip-scheduler
     
  2. Verificar logs:
     journalctl -u social-pip-scheduler -f
     
  3. Verificar base de datos:
     sqlite3 /data/social-pip.db "SELECT COUNT(*) FROM posts WHERE status='pending'"
     
Causas comunes:
  - Servicio detenido → Reiniciar
  - Base de datos bloqueada → Verificar locks
  - Sin posts pendientes → Agregar posts
  - Error en configuración → Revisar config.yaml
```

#### "Posts se publican duplicados"

```yaml
Diagnóstico:
  1. Verificar estado en DB:
     SELECT * FROM posts WHERE id='[POST_ID]';
     
  2. Verificar logs de publicación:
     grep "published" /var/log/social-pip/*.log
     
Causas comunes:
  - Race condition → Aumentar delay entre checks
  - Scheduler duplicado → Verificar solo 1 instancia
  - Error de red con retry → Revisar retry logic
```

#### "AI no genera contenido"

```yaml
Diagnóstico:
  1. Verificar API key:
     curl -H "Authorization: Bearer $API_KEY" https://api.openai.com/v1/models
     
  2. Verificar rate limits:
     Revisar dashboard de usage
     
  3. Verificar logs:
     grep "ai_service" /var/log/social-pip/*.log
     
Causas comunes:
  - API key inválida → Regenerar
  - Rate limit → Esperar o usar modelo alternativo
  - Input demasiado largo → Reducir contexto
  - Modelo down → Usar backup
```

#### "App usa mucha memoria"

```yaml
Diagnóstico:
  1. Verificar uso actual:
     htop
     ps aux | grep social-pip
     
  2. Verificar leaks:
     valgrind --leak-check=full ./social-pip
     
Causas comunes:
  - Historial muy grande → Limpiar posts antiguos
  - Logs muy grandes → Rotar logs
  - Memoria cache → Reducir cache_size en config
  - Bug de memoria → Actualizar versión
```

---

## Comandos Útiles

### Gestión de Servicios

```bash
# Ver estado
systemctl status social-pip-scheduler
systemctl status social-pip-api

# Reiniciar
systemctl restart social-pip-scheduler
systemctl restart social-pip-api

# Ver logs
journalctl -u social-pip-scheduler -f
journalctl -u social-pip-api --since "1 hour ago"

# Detener todo
systemctl stop social-pip-*
```

### Base de Datos

```bash
# Backup manual
sqlite3 /data/social-pip.db ".backup /tmp/backup.db"

# Verificar integridad
sqlite3 /data/social-pip.db "PRAGMA integrity_check;"

# Posts pendientes
sqlite3 /data/social-pip.db "SELECT id, platform, status FROM posts WHERE status='pending';"

# Limpiar posts antiguos
sqlite3 /data/social-pip.db "DELETE FROM posts WHERE created_at < datetime('now', '-90 days');"

# Optimizar
sqlite3 /data/social-pip.db "VACUUM;"
```

### Logs

```bash
# Errores recientes
grep -i error /var/log/social-pip/*.log | tail -100

# Posts publicados hoy
grep "published" /var/log/social-pip/scheduler.log | grep "$(date +%Y-%m-%d)"

# Rate limits
grep "rate_limit" /var/log/social-pip/*.log

# Limpiar logs antiguos
find /var/log/social-pip -name "*.log" -mtime +7 -delete
```

---

## Métricas Operativas

### KPIs Diarios

| Métrica | Target | Alerta si |
|---------|--------|-----------|
| Posts publicados | > 20 | < 15 |
| Tasa de éxito | > 95% | < 90% |
| Latencia API | < 100ms | > 500ms |
| Errores críticos | 0 | > 0 |
| Backups exitosos | 1 | 0 |

### KPIs Semanales

| Métrica | Target | Alerta si |
|---------|--------|-----------|
| Engagement promedio | > 3% | < 2% |
| Cuentas activas | > 90% | < 80% |
| Uso de tokens AI | < 80% quota | > 95% |
| Tiempo de respuesta | < 2s | > 5s |

---

*Última actualización: Abril 2026*
*Para emergencias: tech@social-pip.com*
