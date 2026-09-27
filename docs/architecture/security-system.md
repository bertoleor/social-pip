# Sistema de Seguridad - Social-Pip
> Parte de: [[README]] · Relacionados: [[ai-integration]] · [[database-schema]] · [[main-architecture]]

## Visión General

Social-Pip implementa múltiples capas de seguridad para proteger:
- Datos de usuarios y cuentas
- Tokens de autenticación
- Acceso a APIs
- Rate limiting y anti-abuso

---

## 1. Headers de Seguridad (Next.js)

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevenir XSS
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer policy - proteger info sensible
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy - disable features no usados
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.nvidia.ai https://*.supabase.co wss://*",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Headers Aplicados

| Header | Valor | Propósito |
|--------|-------|-----------|
| X-Frame-Options | DENY | Prevenir clickjacking |
| X-XSS-Protection | 1; mode=block | Prevenir XSS |
| X-Content-Type-Options | nosniff | Prevenir MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Proteger info de referrer |
| Permissions-Policy | camera=(), mic=(), geo=() | Disable features no usados |
| CSP | custom | Whitelist de recursos |
| HSTS | max-age=1 year | Force HTTPS |

---

## 2. Rate Limiting (Rust)

### Rate Limiter en Rust

```rust
// src-tauri/src/anti_ban/rate_limiter.rs
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone)]
pub struct RateLimitConfig {
    pub max_requests: u32,
    pub window_seconds: u64,
}

pub struct RateLimiter {
    requests: Arc<RwLock<HashMap<String, Vec<DateTime<Utc>>>>>,
    config: RateLimitConfig,
}

impl RateLimiter {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            requests: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    pub async fn check(&self, key: &str) -> Result<bool, RateLimitError> {
        let mut requests = self.requests.write().await;
        let now = Utc::now();
        let window_start = now - Duration::seconds(self.config.window_seconds as i64);

        let key_requests = requests.entry(key.to_string()).or_insert_with(Vec::new);
        
        key_requests.retain(|dt| *dt > window_start);

        if key_requests.len() >= self.config.max_requests as usize {
            return Err(RateLimitError::LimitExceeded {
                remaining: 0,
                reset_at: key_requests.first().map(|dt| *dt + Duration::seconds(self.config.window_seconds as i64)),
            });
        }

        key_requests.push(now);
        Ok(true)
    }

    pub async fn get_remaining(&self, key: &str) -> u32 {
        let requests = self.requests.read().await;
        let window_start = Utc::now() - Duration::seconds(self.config.window_seconds as i64);
        
        let count = requests.get(key)
            .map(|vec| vec.iter().filter(|dt| **dt > window_start).count())
            .unwrap_or(0);

        self.config.max_requests.saturating_sub(count as u32)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum RateLimitError {
    #[error("Rate limit exceeded")]
    LimitExceeded { 
        remaining: u32, 
        reset_at: Option<DateTime<Utc>> 
    },
}
```

### Rate Limiting por Plataforma

```rust
pub fn platform_rate_limits() -> HashMap<&'static str, RateLimitConfig> {
    let mut limits = HashMap::new();
    limits.insert("facebook", RateLimitConfig { max_requests: 100, window_seconds: 60 });
    limits.insert("instagram", RateLimitConfig { max_requests: 60, window_seconds: 60 });
    limits.insert("twitter", RateLimitConfig { max_requests: 50, window_seconds: 15 });
    limits
}
```

### Uso en Tauri Commands

```rust
#[tauri::command]
pub async fn create_post(
    state: State<'_, AppState>,
    platform: String,
    content: String,
) -> Result<Post, String> {
    let limiter = state.rate_limiters.get(&platform)
        .ok_or("Plataforma no soportada")?;
    
    limiter.check(&platform).await
        .map_err(|e| format!("Rate limit: {}", e))?;

    // ... crear post
}
```

---

## 3. Validación con Zod

### Schema de Validación

```typescript
// src/modules/accounts/dto/create-account.dto.ts
import { z } from 'zod';

export const CreateAccountSchema = z.object({
  platform: z.enum([
    'TWITTER', 
    'FACEBOOK', 
    'INSTAGRAM', 
    'TIKTOK', 
    'LINKEDIN', 
    'THREADS', 
    'TELEGRAM', 
    'WHATSAPP'
  ]),
  username: z
    .string()
    .min(1, 'Username es requerido')
    .max(100, 'Username muy largo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y underscore'),
  displayName: z
    .string()
    .max(200)
    .optional(),
  accessToken: z
    .string()
    .min(1, 'Token es requerido')
    .max(5000),
  refreshToken: z
    .string()
    .max(5000)
    .optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .or(z.date())
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
```

### Pipe de Validación

```typescript
// src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors
      });
    }

    return result.data;
  }
}
```

### Uso en Controller

```typescript
// src/modules/accounts/accounts.controller.ts
@Post()
@UsePipes(new ZodValidationPipe(CreateAccountSchema))
async create(@Body() createDto: CreateAccountDto) {
  return this.accountsService.create(createDto);
}
```

---

## 4. Sanitización de Input

### Sanitización de HTML

```typescript
// src/common/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

// HTML sanitization - prevenir XSS
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
}

// Username sanitization - solo alphanumeric + underscore
export function sanitizeUsername(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9_]/g, '')
    .substring(0, 100);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Sanitización de Media URLs

```typescript
// src/common/utils/sanitize-media.ts
const ALLOWED_MEDIA_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.mp4', '.webm', '.mov', '.avi',
  '.pdf', '.doc', '.docx'
];

const ALLOWED_MEDIA_DOMAINS = [
  'cdn.example.com',
  'storage.googleapis.com',
  'amazonaws.com',
  'supabase.co'
];

export function sanitizeMediaUrl(url: string): string {
  // Validar formato básico
  if (!isValidUrl(url)) {
    throw new Error('URL inválida');
  }
  
  const parsed = new URL(url);
  
  // Validar extensión
  const ext = parsed.pathname.toLowerCase().split('.').pop();
  if (!ext || !ALLOWED_MEDIA_EXTENSIONS.includes(`.${ext}`)) {
    throw new Error('Tipo de archivo no permitido');
  }
  
  // Validar dominio si es externo
  if (!parsed.hostname.includes('localhost')) {
    const isAllowed = ALLOWED_MEDIA_DOMAINS.some(
      domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
    if (!isAllowed) {
      throw new Error('Dominio no permitido');
    }
  }
  
  return url;
}
```

---

## 5. Autenticación (JWT + bcrypt)

### Usuario Entity

```typescript
// src/modules/auth/entities/user.entity.ts
export class User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}
```

### Hash de Password

```typescript
// src/modules/auth/services/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    const isValid = await this.validatePassword(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    return user;
  }
}
```

### JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  }
}
```

### JWT Guard

```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

---

## 6. Security Headers (Tauri + Next.js)

### Configuración de Headers en Tauri

```rust
// src-tauri/src/lib.rs - Configurar headers de seguridad
use tauri::Manager;

pub fn setup_security_headers(app: &tauri::App) {
    // Los headers se configuran en tauri.conf.json
    // No se requiere código adicional para headers básicos
}
```

### tauri.conf.json - Headers de Seguridad

```json
{
  "security": {
    "csp": "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  }
}
```

### Headers en Next.js (para desarrollo web)

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};
```
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://api.nvidia.ai"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}
bootstrap();
```

---

## 7. Cifrado de Tokens

```typescript
// src/common/utils/encryption.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

export class EncryptionService {
  private key: Buffer;

  constructor(secretKey: string) {
    // Derivar clave de 32 bytes del secret
    this.key = crypto.scryptSync(secretKey, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combinar iv + tag + encrypted
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## Resumen de Capas de Seguridad

| Capa | Implementación | Propósito |
|------|---------------|-----------|
| **Network** | CSP, X-Frame-Options, CSP | Headers de protección |
| **API** | Rate Limiting (Rust) | Prevenir abuso |
| **Input** | Zod + Sanitization | Validación de datos |
| **Auth** | JWT + bcrypt | Autenticación segura |
| **Data** | Encryption (AES-256-GCM) + Stronghold | Cifrado de tokens |
| **Tauri** | Security config + CSP | Headers automáticos |

---

## Referencias

- Tauri Security: https://v2.tauri.app/security/
- Zod: https://zod.dev/
- tauri-plugin-stronghold: https://github.com/tauri-apps/tauri-plugin-stronghold
- DOMPurify: https://github.com/cure53/DOMPurify