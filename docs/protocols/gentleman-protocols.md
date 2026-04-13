# Protocolos Gentleman - Social-Pip

## Visión General

Social-Pip implementa los protocolos de Gentleman Programming para mantener consistencia, calidad y escalabilidad en el código.

---

## 1. Scope Rule

**Principio Fundamental**: "Scope determina estructura"

```
Código usado por 1 feature → LOCAL dentro de esa feature
Código usado por 2+ features → SHARED/global
```

### Ejemplo Práctico

```typescript
// ❌ INCORRECTO - "porque podría reutilizarse"
// src/components/calendar/calendar.tsx

// ✅ CORRECTO - según Scope Rule
src/features/schedule/components/calendar-view.tsx
// ^ Solo usado por schedule feature → LOCAL

src/shared/components/calendar/index.tsx
// ^ Usado por schedule Y analytics → SHARED
```

### Aplicación en Social-Pip

```
apps/web/src/
├── features/
│   ├── accounts/        # Solo para accounts
│   │   └── components/
│   ├── posts/          # Solo para posts
│   │   └── components/
│   └── schedule/       # Solo para schedule
│       └── components/
│
└── shared/             # 2+ features usan
    ├── components/     # UI components
    └── hooks/          # Global hooks
```

---

## 2. Naming Conventions

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos | **kebab-case** | `user-service.ts`, `auth.helper.ts` |
| Componentes React | **PascalCase** | `UserProfile.tsx` |
| Funciones | **camelCase** | `getUserById()` |
| Constantes | **UPPER_SNAKE_CASE** | `MAX_RETRIES` |
| Clases | **PascalCase** | `UserService` |
| Interfaces | **PascalCase** (no I) | `User`, `PostWithAuthor` |
| Enums | **PascalCase** | `PostStatus.DRAFT` |
| Rutas | **kebab-case** | `account-settings.tsx` |

### Ejemplos

```typescript
// ✅ CORRECTO
const MAX_POST_LENGTH = 280;
const userProfile = getUserById(id);
class AccountService {}
interface PostWithAuthor {}

// ❌ INCORRECTO
const max_post_length = 280;
const get_user_by_id = () => {};
class account_service {}
interface IPost {}
```

---

## 3. SDD (Spec-Driven Development)

**Workflow de 5 fases**:

```
1. SPEC    → Especificar qué se hace (requirements)
2. DESIGN  → Arquitectura y diseño técnico
3. APPLY   → Implementar código
4. VERIFY  → Verificar contra spec
5. ARCHIVE → Documentar y cerrar
```

### Fases Detalladas

#### SPEC (Especificación)
- Definir requirements claros
- User stories
- Criteria de aceptación
- Scope definido

#### DESIGN (Diseño)
- Arquitectura de la solución
- Diagrama de componentes
- Decisiones técnicas
- Trade-offs identificados

#### APPLY (Implementación)
- Código siguiendo Spec
- Tests unitarios
- Código limpio y documentado

#### VERIFY (Verificación)
- Tests pasan
- Code review
- Spec cumple requirements

#### ARCHIVE
- Documentar decisiones
- Actualizar specs
- Cerrar ticket

---

## 4. Strict TDD

**Ciclo Red-Green-Refactor**:

```
RED    → Escribir test que falla
GREEN  → Implementar mínimo para pasar
REFACTOR → Limpiar código
```

### Reglas

1. **No inferir**: Seguir Spec exactamente
2. **No hallucinar**: No crear funcionalidad extra
3. **Test primero**: Siempre escribir test antes del código
4. **Un assert por test**: Un solo comportamiento por test

### Ejemplo

```typescript
// 1. RED - Escribir test que falla
describe('PostService', () => {
  it('should create a post with scheduled time', () => {
    const post = postService.create({
      content: 'Test post',
      scheduledAt: new Date('2026-04-10T10:00:00Z'),
      variance: 15
    });
    
    expect(post.status).toBe('SCHEDULED');
  });
});

// 2. GREEN - Implementar mínimo
class PostService {
  create(data: CreatePostDto): Post {
    return {
      ...data,
      status: 'SCHEDULED',
      id: generateId()
    };
  }
}

// 3. REFACTOR - Limpiar código
// Extraer lógica, eliminar duplicados, mejorar nombres
```

---

## 5. GGA (Gentleman Guardian Angel)

**Code Review Automático con IA**

### Instalación

```bash
brew install gentleman-programming/tap/gga
```

### Configuración

```bash
cd social-pip
gga init                # Crear .gga config
gga install            # Install git hook
```

### Uso

```bash
gga run                # Revisar archivos staged
gga run --pr-mode      # Revisar todo el PR
```

### Providers Soportados

| Provider | Config |
|----------|--------|
| Claude | `claude` |
| Gemini | `gemini` |
| Codex | `codex` |
| OpenCode | `opencode` |
| Ollama | `ollama` |

---

## 6. Skills para OpenCode

### Skills Relevantes

| Skill | Uso |
|-------|-----|
| **nextjs-15** | Frontend Next.js |
| **react-19** | Componentes React |
| **typescript** | Todo TypeScript |
| **tailwind-4** | Estilos |
| **zustand-5** | State management |
| **playwright** | Testing E2E |
| **ai-sdk-5** | AI integration |

### Instalación

```bash
# Copiar skills a OpenCode
cp -r Gentleman-Skills/curated/* ~/.config/opencode/skills/
```

---

## 7. Variables de Entorno

### Regla de Oro

```
.env                   # NO committed (gitignore)
.env.example          # SI committed (template)
.env.local           # Desarrollo local
.env.production       # Producción
```

### Estructura

```env
# ============================================
# NO COMMITEAR - Secrets
# ============================================
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret
API_KEYS=...

# ============================================
# SI COMMITEAR - Template público
# ============================================
# DATABASE_URL=postgresql://user:pass@host/db
# JWT_SECRET=your-secret
```

---

## 8. Judgment Day Protocol

**Revisión Adversarial**

**Trigger**: `"judgment day"`, `"judgment-day"`, `"review adversarial"`

**Cómo funciona**:
1. Dos sub-agentes "jueces" revisan código simultáneamente
2. Síntesis de hallazgos
3. Aplicar fixes
4. Re-juzga hasta que ambos pasen (máx 2 iteraciones)

---

## Resumen de Protocolos

| Protocolo | Aplicación |
|-----------|------------|
| **Scope Rule** | Estructura de archivos |
| **Naming** | kebab-case, PascalCase |
| **SDD** | Workflow de desarrollo |
| **Strict TDD** | Tests primero |
| **GGA** | Code review automático |
| **Skills** | Patterns de código |
| **.env** | Secrets management |
| **Judgment Day** | Revisión dual |

---

## Referencias

- Scope Rule: https://mintlify.com/Gentleman-Programming/gentleman-architecture-agents/concepts/scope-rule
- GGA: https://github.com/Gentleman-Programming/gentleman-guardian-angel
- Gentleman-Skills: https://github.com/Gentleman-Programming/Gentleman-Skills