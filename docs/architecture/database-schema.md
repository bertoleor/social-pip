# Esquema de Base de Datos - Social-Pip
> Parte de: [[README]] · Relacionados: [[ai-integration]] · [[main-architecture]] · [[n8n-rest-api]]

## Visión General

Social-Pip utiliza **SQLite** como base de datos local con **Prisma** como ORM. El diseño sigue principios de normalización y maneja:

- Cuentas de redes sociales (multi-account)
- Publicaciones y estados
- Scheduling con varianza
- Tokens de autenticación

---

## Schema Prisma Completo

```prisma
// schema.prisma - Social-Pip Database Schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum Platform {
  // Plataformas soportadas
  TWITTER
  FACEBOOK
  INSTAGRAM
  TIKTOK
  LINKEDIN
  THREADS
  TELEGRAM
  WHATSAPP
}

enum PostStatus {
  // Estados de una publicación
  DRAFT       // Borrador - no publicado
  SCHEDULED   // Programado - en cola de scheduling
  PUBLISHED  // Published - exitosamente publicado
  FAILED     // Fallido - error en publicación
}

enum ScheduleStatus {
  // Estados del schedule
  PENDING   // Pendiente de ejecución
  RUNNING   // Ejecutándose actualmente
  COMPLETED // Completado exitosamente
  FAILED    // Fallido
}

// ============================================
// MODELS
// ============================================

// --------------------------------------------
// ACCOUNT - Cuentas de redes sociales
// --------------------------------------------
model Account {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Plataforma (Twitter, Facebook, etc.)
  platform    Platform
  
  // Username en la plataforma
  username    String
  
  // Nombre visible para el usuario
  displayName String?
  
  // Token de acceso (cifrado)
  accessToken  String
  
  // Token de refresh (cifrado, opcional)
  refreshToken String?
  
  // Fecha de expiración del token
  expiresAt    DateTime?
  
  // Cookies de sesión (para browser automation)
  sessionCookies String?
  
  // Estado de la cuenta
  isActive    Boolean  @default(true)
  
  // Rate limit actual
  rateLimit   Int      @default(0)
  rateLimitReset DateTime?
  
  // Configuración personalizada por cuenta
  config      Json?    @default("{}")
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  posts       Post[]
  schedules   Schedule[]
  
  // Índice único por plataforma + username
  @@unique([platform, username])
}

// --------------------------------------------
// POST - Contenido a publicar
// --------------------------------------------
model Post {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Contenido del post
  content     String   @db.Text
  
  // URLs de medios (imágenes, videos)
  mediaUrls   String[] @default([])
  
  // Plataforma destino
  platform    Platform
  
  // Estado actual
  status      PostStatus @default(DRAFT)
  
  // Caption alternativa (para rotación)
  altCaptions String[] @default([])
  
  // Caption actualmente usada
  currentCaption String?
  
  // Hashtags
  hashtags    String[] @default([])
  
  // Scheduling
  scheduledAt DateTime?
  variance    Int      @default(15) // ±15 minutos
  
  // Resultado de publicación
  publishedAt DateTime?
  externalId  String?  // ID del post en la plataforma
  errorMessage String?
  
  // Cuenta usada para publicar
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  // Relacion con schedule
  schedule    Schedule?
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Índices
  @@index([platform, status])
  @@index([accountId, status])
}

// --------------------------------------------
// SCHEDULE - Programación de publicaciones
// --------------------------------------------
model Schedule {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Fecha/hora programada (con varianza)
  scheduledAt DateTime
  
  // Varianza en minutos (default ±15)
  variance    Int      @default(15)
  
  // Estado del schedule
  status      ScheduleStatus @default(PENDING)
  
  // tokio-cron-scheduler job ID
  schedulerJobId String?
  
  // Intentos de ejecución
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  
  // Resultado
  result      Json?
  
  // Post relacionado
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // Cuenta asignada
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Índices
  @@index([status, scheduledAt])
  @@index([accountId, scheduledAt])
}

// --------------------------------------------
// BRAND VOICE - Manual de Marca
// --------------------------------------------
model BrandVoice {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Nombre del brand
  name        String
  
  // Descripción del tono de voz
  toneDescription String @db.Text
  
  // Palabras a evitar
  forbiddenWords String[] @default([])
  
  // Paletas de colores (hex)
  colors      String[] @default([])
  
  // Tipografías preferidas
  fonts       String[] @default([])
  
  // Ejemplos de contenido (para training)
  examples    String[] @default([])
  
  // Prompt completo para IA
  systemPrompt String  @db.Text
  
  // Qdrant vector ID
  vectorId    String?
  
  // Estado
  isActive    Boolean  @default(true)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Posts que usan este brand voice
  posts       PostBrandVoice[]
}

// --------------------------------------------
// POST BRAND VOICE - Relación N:M
// --------------------------------------------
model PostBrandVoice {
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  brandVoiceId String
  brandVoice  BrandVoice @relation(fields: [brandVoiceId], references: [id], onDelete: Cascade)
  
  @@id([postId, brandVoiceId])
}

// --------------------------------------------
// PLATFORM CONFIG - Config por plataforma
// --------------------------------------------
model PlatformConfig {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Plataforma
  platform    Platform @unique
  
  // Rate limits (requests por ventana)
  rateLimit   Int      @default(100)
  rateWindow  Int      @default(60) // segundos
  
  // Delay entre acciones (ms)
  minDelay    Int      @default(1000)
  maxDelay    Int      @default(3000)
  
  // Límites de contenido
  maxPostLength Int    @default(280)
  maxMediaCount Int    @default(4)
  maxHashtags   Int    @default(30)
  
  // Config de API
  apiConfig    Json?    @default("{}")
  
  // Estado
  isActive    Boolean  @default(true)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// --------------------------------------------
// ANALYTICS - Métricas de publicaciones
// --------------------------------------------
model Analytics {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Fecha del analytics
  date        DateTime @db.Date
  
  // Plataforma
  platform    Platform
  
  // Métricas
  postsPublished Int   @default(0)
  postsFailed    Int   @default(0)
  totalEngagement Int  @default(0)
  totalReach     Int  @default(0)
  totalImpressions Int @default(0)
  
  // Detalle JSON
  details     Json?    @default("{}")
  
  // Timestamps
  createdAt   DateTime @default(now())
  
  // Índices
  @@unique([date, platform])
  @@index([platform, date])
}

// --------------------------------------------
// AUDIT LOG - Logs de operaciones
// --------------------------------------------
model AuditLog {
  // Identificador único
  id          String   @id @default(cuid())
  
  // Acción realizada
  action      String
  
  // Entidad afectada
  entityType  String   // Account, Post, Schedule, etc.
  entityId    String
  
  // Datos anteriores (JSON)
  before      Json?
  
  // Datos nuevos (JSON)
  after       Json?
  
  // Usuario que realizó la acción
  userId      String?
  
  // IP del request
  ipAddress   String?
  
  // Resultado
  success     Boolean  @default(true)
  errorMessage String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  
  // Índices
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([action])
}

// --------------------------------------------
// SETTINGS - Configuración global
// --------------------------------------------
model Settings {
  // Clave única
  key         String   @id
  
  // Valor
  value       String   @db.Text
  
  // Descripción
  description String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Descripción de Campos

### Account

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| platform | Enum | Plataforma (TWITTER, FACEBOOK, etc.) |
| username | String | Username en la plataforma |
| displayName | String? | Nombre visible personalizado |
| accessToken | String | Token de acceso (cifrado) |
| refreshToken | String? | Token de refresh |
| expiresAt | DateTime? | Expiración del token |
| sessionCookies | String? | Cookies para browser automation |
| isActive | Boolean | Si la cuenta está activa |
| rateLimit | Int | Contador actual de rate limit |
| rateLimitReset | DateTime | Cuando se resetea el rate limit |

### Post

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| content | String | Texto del post |
| mediaUrls | String[] | URLs de medios |
| platform | Enum | Plataforma destino |
| status | Enum | Estado del post |
| altCaptions | String[] | Captions alternativas para rotación |
| variance | Int | Variación ±15min para scheduling |
| externalId | String? | ID del post en la plataforma |
| errorMessage | String? | Mensaje de error si falló |

### Schedule

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| scheduledAt | DateTime | Hora programada |
| variance | Int | Minutos de variación (±15) |
| status | Enum | Estado del schedule |
| schedulerJobId | String? | ID del job de tokio-cron |
| attempts | Int | Intentos de ejecución |
| maxAttempts | Int | Máximo de reintentos |

### BrandVoice

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| name | String | Nombre del brand |
| toneDescription | String | Descripción del tono |
| forbiddenWords | String[] | Palabras a evitar |
| colors | String[] | Paletas de colores |
| systemPrompt | String | Prompt completo para IA |
| vectorId | String? | ID en Qdrant |

---

## Relaciones

```
Account 1───∞ Post
Post 1───1 Schedule
Post ∞──∞ BrandVoice (N:M)
Account 1───∞ Schedule
```

---

## Índices

| Tabla | Índice | Propósito |
|-------|--------|-----------|
| Account | unique(platform, username) | Evitar duplicados |
| Post | index(platform, status) | Búsquedas rápidas |
| Post | index(accountId, status) | Queries por cuenta |
| Schedule | index(status, scheduledAt) | Jobs pendientes |
| Schedule | index(accountId, scheduledAt) | Por cuenta |
| Analytics | unique(date, platform) | Un registro por día |
| AuditLog | index(entityType, entityId) | Búsqueda de cambios |
| AuditLog | index(createdAt) | Filtrar por fecha |

---

## Notas de Implementación

1. **Cifrado de tokens**: Los tokens deben cifrarse antes de guardarse en la DB. Usar AES-256 con clave del environment.

2. **Rate Limiting**: El campo `rateLimit` en Account se actualiza automáticamente en cada request.

3. **Varianza de Scheduling**: El algoritmo aplica `randomOffset = (Math.random() * 2 - 1) * 15 * 60 * 1000` ms.

4. **Qdrant Integration**: El campo `vectorId` en BrandVoice permite buscar en Qdrant para retrieval de contexto.

---

## Referencias

- Prisma: https://www.prisma.io/docs
- SQLite: https://www.sqlite.org/docs.html
- CUID: https://github.com/Parity-Community/cuid-js