# OpenCode Configuration - Social-Pip
> Parte de: [[README]] · Relacionados: [[mcp-servers]] · [[skills]]

## Resumen

Este documento contiene la configuración completa de OpenCode para el proyecto Social-Pip, incluyendo MCP servers, agents, rules, y configuración óptima basada en la documentación oficial.

---

## MCPs Activos (Actualizado Abril 2026)

| MCP | Estado | Descripción |
|-----|--------|-------------|
| **context7** | ✅ enabled | Documentación de libraries |
| **engram** | ✅ enabled | Memoria persistente |
| **github** | ✅ enabled | Acceso a repos GitHub |
| **sequential-thinking** | ✅ enabled | Pensamiento secuencial para problemas complejos |
| **filesystem** | ✅ enabled | Acceso a archivos del sistema |
| **playwright** | ✅ enabled | Automatización de browser |
| **prisma** | ✅ enabled | CLI de Prisma para SQLite |
| **sqlite** | ✅ enabled | SQLite database queries |
| **tavily** | ✅ enabled | Búsqueda web |
| **kindly** | ✅ enabled | Búsqueda web con contenido completo |

---

## 1. opencode.jsonc (Configuración Principal)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "filesystem": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "./"],
      "enabled": true,
      "timeout": 10000
    },
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true
    },
    "sequential-thinking": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"],
      "enabled": true,
      "description": "Sequential thinking for complex problem solving"
    },
    "vercel": {
      "type": "local",
      "command": ["npx", "-y", "@robinson_ai_systems/vercel-mcp"],
      "enabled": true,
      "description": "Vercel MCP server with 50+ tools for deployments, domains, env vars"
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp"],
      "enabled": true,
      "description": "Playwright browser automation MCP"
    },
    "supabase": {
      "type": "local",
      "command": ["npx", "-y", "@supabase/mcp-server-supabase"],
      "enabled": true,
      "description": "Supabase MCP server for database operations"
    },
    "postgres": {
      "type": "local",
      "command": ["npx", "-y", "enhanced-postgres-mcp-server"],
      "enabled": true,
      "description": "Enhanced PostgreSQL MCP server with read and write capabilities"
    },
    "prisma": {
      "type": "local",
      "command": ["npx", "prisma"],
      "enabled": true,
      "description": "Prisma ORM CLI - use for db generate, migrate, studio"
    },
    "puppeteer": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
      "enabled": true
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "tavily": {
      "type": "local",
      "command": ["npx", "-y", "tavily-mcp"],
      "enabled": true,
      "description": "Búsqueda web para investigación - especializado en contenido técnico y de alta calidad"
    },
    "kindly-web-search": {
      "type": "local",
      "command": ["uvx", "--from", "git+https://github.com/Shelpuk-AI-Technology-Consulting/kindly-web-search-mcp-server", "kindly-web-search-mcp-server", "start-mcp-server"],
      "enabled": true,
      "description": "Búsqueda web + contenido completo (StackOverflow, GitHub Issues, Wikipedia) - usa Chromium para extraer full content",
      "env": {
        "TAVILY_API_KEY": "<your-tavily-api-key>",
        "SERPER_API_KEY": "<your-serper-api-key>"
      }
    }
  },
  "tools": {
    "enabled": true
  },
  "rules": {
    "enabled": true,
    "files": ["AGENTS.md", ".agents.md"]
  },
  "agents": {
    "default": {
      "model": "claude-sonnet-4-20250514",
      "tools": {
        "context7": true,
        "tavily": true,
        "kindly-web-search": true,
        "github": true,
        "sequential-thinking": true,
        "vercel": true,
        "playwright": true,
        "supabase": true,
        "postgres": true,
        "prisma": true
      },
      "rules": {
        "useContext7": "When you need to search library/docs, use context7",
        "useTavily": "When you need simple web search, use tavily",
        "useKindly": "When you need full content (StackOverflow answers, GitHub Issues, Wikipedia), use kindly-web-search"
      }
    },
    "architect": {
      "model": "claude-sonnet-4-20250514",
      "rules": {
        "strictMode": "Follow SDD workflow: SPEC → DESIGN → APPLY → VERIFY → ARCHIVE"
      }
    },
    "builder": {
      "model": "claude-sonnet-4-20250514",
      "tools": {
        "context7": true,
        "tavily": true,
        "kindly-web-search": true,
        "github": true,
        "sequential-thinking": true,
        "vercel": true,
        "playwright": true,
        "supabase": true,
        "postgres": true,
        "prisma": true
      },
      "rules": {
        "scopeRule": "Apply Scope Rule: 1 feature = local, 2+ features = shared",
        "typescript": "Use strict TypeScript, no any, explicit types",
        "useKindly": "When you need full content (StackOverflow, GitHub Issues), use kindly-web-search"
      }
    }
  }
}
```

---

## 2. MCP Servers - Configuración Detallada

### 2.1 Filesystem (Local)

```jsonc
"filesystem": {
  "type": "local",
  "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "./"],
  "enabled": true,
  "timeout": 10000
}
```

**Uso:** Leer, escribir, editar archivos en el directorio del proyecto.

**Comando CLI:**
```
use filesystem tool to read package.json
```

### 2.2 GitHub (Local)

```jsonc
"github": {
  "type": "local",
  "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
  "enabled": true
}
```

**Uso:** Operaciones de GitHub (issues, PRs, repos).

**Requiere:** token GITHUB_TOKEN en environment.

### 2.3 SQLite (Local)

```jsonc
"sqlite": {
  "type": "local",
  "command": ["npx", "-y", "sqlite-mcp-server", "./data/social-pip.db"],
  "enabled": true
}
```

**Nota:** Social-Pip usa SQLite (no PostgreSQL) para base de datos local.

### 2.4 Puppeteer (Local)

```jsonc
"puppeteer": {
  "type": "local",
  "command": ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  "enabled": true
}
```

**Uso:** Automatización de browser para posting en redes sociales.

### 2.5 Context7 (Remote)

```jsonc
"context7": {
  "type": "remote",
  "url": "https://mcp.context7.com/mcp",
  "enabled": true
}
```

**Uso:** Búsqueda de documentación en tiempo real.

### 2.6 Tavily (Local) - Búsqueda Web

```jsonc
"tavily": {
  "type": "local",
  "command": ["npx", "-y", "@Tavily/tavily-mcp"],
  "enabled": true,
  "description": "Búsqueda web para investigación - especializado en contenido técnico y de alta calidad"
}
```

**Uso:** Búsqueda web para investigación de repositorios, frameworks, y contenido técnico.

### 2.7 Kindly Web Search (Local) - Búsqueda + Contenido Completo

```jsonc
"kindly-web-search": {
  "type": "local",
  "command": ["uvx", "--from", "git+https://github.com/Shelpuk-AI-Technology-Consulting/kindly-web-search-mcp-server", "kindly-web-search-mcp-server", "start-mcp-server"],
  "enabled": true,
  "env": {
    "TAVILY_API_KEY": "tvly-..."
  }
}
```

**Uso:** Búsqueda web avanzada con contenido completo:
- StackOverflow: retorna preguntas Y respuestas completas
- GitHub Issues: retorna issue + comments + reactions
- Wikipedia: contenido estructurado
- Cualquier webpage: extrae full content usando Chromium

**Cuándo usar Kindly vs Tavily:**
- **Tavily**: Búsquedas simples, snippets rápidos
- **Kindly**: Necesitás la respuesta completa (no solo la URL), código de StackOverflow, solutions de GitHub Issues

**Requiere:** Chromium instalado en la máquina (Chrome/Chromium/Edge/Brave)

---

## 3. Rules - AGENTS.md

```markdown
# Social-Pip - AGENTS.md

## Stack Tecnológico

- **Desktop**: Tauri 2.0 + Rust
- **Frontend**: Next.js 16.2 + React 19 + TypeScript
- **Database**: SQLite + Prisma
- **Extension**: Chrome MV3
- **Linting**: Biome
- **Testing**: Vitest

## Reglas de Código

### 1. Scope Rule

**Principio**: "Scope determina estructura"

- Código usado por **1 feature** → LOCAL
- Código usado por **2+ features** → SHARED

```
src/features/accounts/components/   # Solo accounts
src/shared/components/            # 2+ features
```

### 2. Naming Conventions

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Archivos | kebab-case | user-service.ts |
| Componentes | PascalCase | UserProfile.tsx |
| Funciones | camelCase | getUserById() |
| Constantes | UPPER_SNAKE | MAX_RETRIES |

### 3. TypeScript Estricto

- Sin `any` explícito
- Tipos explícitos siempre
- Optional chaining obligatorio
- Null checks obligatorios

### 4. Testing

- Tests primero (TDD)
- Un comportamiento por test
- describe/it semántico

### 5. Seguridad

- Validación con Zod
- Sanitización de inputs
- Rate limiting

### 6. Documentación

- JSDoc en funciones públicas
- README en cada módulo
- Diagramas en arquitectura

## Artículos HTML Permitidos

Tags: b, i, em, strong, a, p, br, ul, ol, li, blockquote
Attrs: href, target, rel, class

## URLs de Medios Permitidas

Dominios: cdn.example.com, storage.googleapis.com, amazonaws.com, supabase.co

## Revisión Requerida

1. Scope Rule - ¿ubicación correcta?
2. Naming - ¿convecciones seguidas?
3. Types - ¿tipos explícitos?
4. Tests - ¿test presente?
5. Security - ¿validación? ¿sanitización?
```

---

## 4. Agents Configuration

### Default Agent

```jsonc
"agents": {
  "default": {
    "model": "claude-sonnet-4-20250514",
    "description": "Agente general para desarrollo",
    "tools": {
      "filesystem": true,
      "github": true,
      "puppeteer": true,
      "context7": true
    },
    "rules": {
      "useContext7": "When you need to search docs, use context7",
      "checkRules": "Before writing code, check AGENTS.md rules"
    }
  }
}
```

---

## 5. Herramientas (Tools)

```jsonc
"tools": {
  "enabled": true,
  // Deshabilitar MCP específicos globalmente
  "postgres": false,  // Alto consumo de tokens
  // Patrones globales
  "github_*": true
}
```

---

## 6. Comandos Útiles

```bash
# Ver configuración de MCPs
opencode mcp list

# Autenticar con servidor MCP
opencode mcp auth sentry

# Depurar conexión MCP
opencode mcp debug context7

# Verificar permisos
opencode config show
```

---

## 7. Ejemplos de Uso

### Buscar documentación
```
use context7 to find how to set up Rust error handling
```

### Operaciones GitHub
```
use the github tool to create an issue about the bug
```

### Archivos del proyecto
```
use filesystem to read the package.json and check dependencies
```

### Automatización de browser
```
use puppeteer to login to Twitter and post a tweet
```

---

## 8. Configuración de Skills (Skills del Agente)

Los skills se cargan automáticamente desde `~/.config/opencode/skills/`

### Skills Recomendados para Social-Pip

| Skill | Cuándo usarlo |
|-------|---------------|
| nextjs-15 | Frontend Next.js |
| react-19 | Componentes React |
| typescript | Todo TypeScript |
| tailwind-4 | Estilos |
| zustand-5 | State management |
| playwright | Testing E2E |

### Instalación de Skills

```bash
# Copiar skills de Gentleman-Skills
cp -r Gentleman-Skills/curated/* ~/.config/opencode/skills/
```

---

## 9. Variables de Entorno

```env
# OpenCode MCP
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
CONTEXT7_API_KEY=sk-xxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/socialpip
```

---

## Referencias

- Documentación OpenCode: https://opencode.ai/docs/es/
- MCP Servers: https://opencode.ai/docs/es/mcp-servers/
- Rules: https://opencode.ai/docs/es/rules/
- Agents: https://opencode.ai/docs/es/agents/
- Skills: https://opencode.ai/docs/es/skills/