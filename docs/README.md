# Documentación Social-Pip

## Índice General

Esta documentación contiene toda la información técnica, arquitectura y guías del proyecto Social-Pip.

---

## 📁 Estructura de Documentación

```
docs/
├── architecture/           # Documentación de arquitectura
│   ├── main-architecture.md        # Arquitectura principal del sistema
│   ├── database-schema.md          # Schema de Prisma + SQLite
│   ├── project-structure.md       # Estructura con Scope Rule
│   ├── security-system.md         # Sistema de seguridad completo
│   ├── opencode-n8n-architecture.md  # Integración OpenCode + n8n
│   ├── opencode-server.md         # APIs de OpenCode Server
│   └── n8n-rest-api.md            # APIs REST de n8n
│
├── platforms/               # Automatización de redes sociales
│   └── platforms-automation.md    # Adapters para cada plataforma
│
├── tools/                   # Custom Tools
│   └── opencode-n8n-tools.md      # Tools para gestionar n8n desde OpenCode
│
├── workflows/               # Workflows de n8n
│   ├── social-pip-workflows.md    # Workflows base (posting, content, etc)
│   ├── templates-workflows.md     # Templates + Manual de Marca
│   ├── automation-workflows.md    # Automatizaciones (warmup, batch, etc)
│   ├── marketing-workflows.md    # Marketing (leads, outreach, etc)
│   └── analytics-workflows.md      # Analíticas (métricas, reportes)
│
├── configs/                # Configuraciones técnicas
│   ├── dev-config.md                # tsconfig, biome, vitest, docker, CI/CD
│   └── testing-strategy.md          # Estrategia de testing
│
├── protocols/              # Protocolos de desarrollo
│   └── gentleman-protocols.md      # Scope Rule, SDD, TDD, GGA
│
├── mcp/                    # Configuración MCP
│   ├── mcp-servers.md              # MCPs para OpenCode
│   ├── opencode-config.md         # Configuración completa de OpenCode
│   └── skills.md                   # Skills disponibles
│
├── setup/                   # Guías de inicio
│   ├── setup-guide.md             # Guía paso a paso
│   ├── installation.md             # Guía de instalación completa
│   ├── troubleshooting.md          # Problemas comunes y soluciones
│   ├── n8n-setup.md              # Setup de n8n (básico)
│   ├── n8n-docker-compose.md       # Docker-compose para n8n
│   └── notebooklm-setup.md        # Setup de NotebookLM (investigación)
│
├── anti-ban/               # Estrategias anti-ban
│   └── facebook-anti-ban-strategy.md
│
├── research/               # Investigación
│   ├── complete-repos-inventory.md  # Inventario de repositorios
│   ├── media-specifications-2026.md
│   ├── marketplace-argentina.md
│   └── repositories-analysis.md
│
└── plans/                   # Planes
    ├── tech-stack.md
    ├── master-plan.md
    └── visual-fallback-system.md
```

---

## 🚀 Inicio Rápido

### Lecturas Recomendadas (en orden)

1. **[setup-guide.md](setup/setup-guide.md)** - Configurar entorno de desarrollo
2. **[main-architecture.md](architecture/main-architecture.md)** - Visión general del sistema
3. **[project-structure.md](architecture/project-structure.md)** - Cómo organizar el código
4. **[dev-config.md](configs/dev-config.md)** - Configuraciones técnicas

---

## 📋 Por Área

### Arquitectura y Código

| Documento | Descripción |
|----------|-------------|
| [main-architecture.md](architecture/main-architecture.md) | Capas del sistema (Frontend, Backend, Browser, AI, Data) |
| [database-schema.md](architecture/database-schema.md) | Schema de Prisma con todos los modelos |
| [project-structure.md](architecture/project-structure.md) | Estructura con Scope Rule |
| [security-system.md](architecture/security-system.md) | Headers, rate limiting, Zod, JWT, encryption |

### Plataformas

| Documento | Descripción |
|----------|-------------|
| [platforms-automation.md](platforms/platforms-automation.md) | Twikit, Threads, Telegram, WhatsApp, Instagram, TikTok |

### Configuración

| Documento | Descripción |
|-----------|-------------|
| [dev-config.md](configs/dev-config.md) | tsconfig, biome, vitest, docker-compose, CI/CD |
| [testing-strategy.md](configs/testing-strategy.md) | Estrategia de testing |
| [gentleman-protocols.md](protocols/gentleman-protocols.md) | Scope Rule, SDD, TDD, GGA, skills |

### Setup e Instalación

| Documento | Descripción |
|-----------|-------------|
| [installation.md](setup/installation.md) | Guía de instalación completa |
| [troubleshooting.md](setup/troubleshooting.md) | Problemas comunes y soluciones |
| [n8n-setup.md](setup/n8n-setup.md) | Setup de n8n |
| [n8n-docker-compose.md](setup/n8n-docker-compose.md) | Docker-compose para n8n |

### MCPs y Tools

| Documento | Descripción |
|-----------|-------------|
| [mcp-servers.md](mcp/mcp-servers.md) | Configuración de MCPs para OpenCode |
| [opencode-config.md](mcp/opencode-config.md) | Configuración completa de OpenCode |
| [opencode-n8n-tools.md](tools/opencode-n8n-tools.md) | Custom Tools para gestionar n8n |

### Workflows de n8n

| Documento | Descripción |
|-----------|-------------|
| [social-pip-workflows.md](workflows/social-pip-workflows.md) | Workflows base (posting, content, backup) |
| [templates-workflows.md](workflows/templates-workflows.md) | Templates + Manual de Marca |
| [automation-workflows.md](workflows/automation-workflows.md) | Automatizaciones (warmup, batch, responder) |
| [marketing-workflows.md](workflows/marketing-workflows.md) | Marketing (leads, outreach, hashtags) |
| [analytics-workflows.md](workflows/analytics-workflows.md) | Analíticas (métricas, reportes) |

### n8n Integration

| Documento | Descripción |
|-----------|-------------|
| [opencode-n8n-architecture.md](architecture/opencode-n8n-architecture.md) | Arquitectura de integración |
| [opencode-server.md](architecture/opencode-server.md) | APIs de OpenCode Server |
| [n8n-rest-api.md](architecture/n8n-rest-api.md) | APIs REST de n8n |
| [n8n-setup.md](setup/n8n-setup.md) | Setup básico de n8n |
| [n8n-docker-compose.md](setup/n8n-docker-compose.md) | Docker-compose para n8n local |

---

## 🔧 Stack Técnico (Actualizado Abril 2026)

| Componente | Tecnología | Versión | Docs |
|------------|------------|---------|------|
| Desktop Framework | Tauri | 2.0+ | https://v2.tauri.app/ |
| Frontend (Webview) | React | 19.x | https://react.dev/ |
| Backend | Rust | 1.70+ | https://doc.rust-lang.org/ |
| State | Zustand | 5.x | https://github.com/pmndrs/zustand |
| Database | SQLite (Prisma) | - | https://www.prisma.io/docs |
| Extension | Chrome MV3 | - | https://developer.chrome.com/docs/extensions/mv3 |
| Linting | Biome | 1.9.x | https://biomejs.dev/ |
| Testing | Vitest | 2.x | https://vitest.dev/ |

---

## 🔗 Recursos Externos

- [Tauri 2.0](https://v2.tauri.app/)
- [React 19](https://react.dev/)
- [Rust](https://doc.rust-lang.org/)
- [Prisma](https://www.prisma.io/docs)
- [Biome](https://biomejs.dev/)
- [Gentleman-Skills](https://github.com/Gentleman-Programming/Gentleman-Skills)
- [GGA](https://github.com/Gentleman-Programming/gentleman-guardian-angel)

---

## 🏗️ Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────┐
│                    TAURI 2.0 DESKTOP APP                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (React en WebView)                │  │
│  │         UI rica - Dashboard, Editor, Scheduler          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │ IPC                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    BACKEND (Rust)                       │  │
│  │  • Anti-Ban Engine                                      │  │
│  │  • Scheduler                                            │  │
│  │  • SQLite DB                                             │  │
│  │  • Native Messaging Host                                │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    Native Messaging
                              │
┌─────────────────────────────────────────────────────────────┐
│                  CHROME EXTENSION MV3                       │
│  • Service Worker (cola de tareas)                          │
│  • Content Scripts por plataforma                           │
│  • Automatización real del browser                          │
└─────────────────────────────────────────────────────────────┘
```

**¿Por qué esta arquitectura?**
- Tauri es más ligero que Electron (8MB vs 120MB installer)
- Chrome Extension usa el browser real del usuario (menos detectable por anti-bot)
- SQLite es suficiente para uso local (sin servidor de BD)

---

## 🌎 Argentina Localization

Social-Pip está configurado para Argentina:
- **Zona horaria**: UTC-3
- **Moneda**: ARS (Peso Argentino)
- **Idioma**: Español con voseo
- **Feriados**: Feriados argentinos integrados en scheduling

---

*Última actualización: Abril 2026*