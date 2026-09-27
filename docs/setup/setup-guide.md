# Setup y Guía de Inicio - Social-Pip
> Parte de: [[README]] · Relacionados: [[installation]] · [[n8n-docker-compose]] · [[n8n-setup]]

## Resumen

Esta guía cubre cómo configurar el entorno de desarrollo de Social-Pip con la arquitectura Tauri 2.0 + Chrome Extension.

---

## Prerrequisitos

| Requisito | Versión Mínima | Notas | Docs |
|-----------|----------------|-------|------|
| Node.js | 20.x | LTS requerido | https://nodejs.org/ |
| pnpm | 9.x | Package manager | https://pnpm.io/ |
| Rust | 1.70+ | Para Tauri | https://doc.rust-lang.org/ |
| Git | 2.x | Control de versiones | https://git-scm.com/ |
| Chrome/Chromium | Latest | Para extensión | https://www.google.com/chrome/ |

###安装 Rust (Windows)

```powershell
# Usando rustup (recomendado)
winget install Rustlang.Rust.MSVC

# Verificar instalación
rustc --version
cargo --version
```

### 安装 pnpm

```powershell
# Usando npm
npm install -g pnpm

# Verificar
pnpm --version
```

---

## Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/social-pip.git
cd social-pip
```

### 2. Instalar Dependencias del Workspace

```bash
# Instalar todas las dependencias del monorepo
pnpm install

# O usar turbo para mejor performance
pnpm add -g turbo
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env

# Editar con tus valores (solo desarrollo local)
# DATABASE_URL ya viene configurado para SQLite
```

### 4. Generar Prisma Client

```bash
# Desde la raíz del proyecto
cd packages/database
pnpm prisma:generate

# O desde raíz
pnpm db:generate
```

### 5. Iniciar Desarrollo

#### Desarrollo Desktop (Frontend + Backend Rust)

```bash
# Desde la raíz
pnpm dev:desktop

# O separadamente:
# Terminal 1: Backend Rust
cd apps/desktop
pnpm tauri:dev

# Terminal 2: Frontend
cd apps/desktop
pnpm dev
```

#### Desarrollo Chrome Extension

```bash
# En otra terminal
cd apps/extension
pnpm dev
```

### 6. Cargar Chrome Extension

1. Abre Chrome y navega a `chrome://extensions/`
2. Activa "Developer mode" (esquina superior derecha)
3. Click "Load unpacked"
4. Selecciona la carpeta `apps/extension/dist`

---

## Estructura de Comandos

### Comandos del Workspace

```bash
pnpm dev              # Desarrollo completo (desktop + extension)
pnpm build           # Build de producción
pnpm test            # Tests
pnpm lint            # Linting
pnpm typecheck       # TypeScript check

pnpm db:generate     # Generar Prisma client
pnpm db:migrate      # Ejecutar migraciones
pnpm db:studio       # Abrir Prisma Studio
```

### Comandos del Desktop App

```bash
cd apps/desktop

pnpm dev             # Desarrollo frontend
pnpm tauri:dev       # Desarrollo Tauri (incluye frontend)
pnpm tauri:build     # Build de producción
pnpm build           # Build frontend
pnpm lint            # Biome check
pnpm test            # Vitest
```

### Comandos de la Extension

```bash
cd apps/extension

pnpm dev             # Desarrollo
pnpm build           # Build
pnpm lint            # Linting
```

---

## Archivos de Configuración del Proyecto

```
social-pip/
├── .env                    # Variables locales (NO committing)
├── .env.example            # Template (SI committing)
├── package.json             # Workspace root
├── pnpm-workspace.yaml      # Workspace config
├── turbo.json              # Turborepo config
├── tsconfig.json           # TypeScript base
│
├── apps/
│   ├── desktop/
│   │   ├── package.json     # Dependencias + scripts
│   │   ├── vite.config.ts   # Vite config
│   │   ├── tsconfig.json    # TypeScript desktop
│   │   └── src-tauri/       # Rust backend
│   │       ├── Cargo.toml  # Dependencias Rust
│   │       ├── tauri.conf.json
│   │       └── src/
│   │           ├── main.rs
│   │           └── anti_ban.rs
│   │
│   └── extension/
│       ├── package.json
│       ├── vite.config.ts
│       ├── public/
│       │   └── manifest.json
│       └── src/
│           ├── background/
│           ├── content/
│           └── popup/
│
└── packages/
    ├── database/
    │   ├── package.json
    │   └── prisma/
    │       └── schema.prisma
    │
    └── types/
        ├── package.json
        └── src/
            └── index.ts
```

---

## Troubleshooting

### Error: "pnpm command not found"

```powershell
# Instalar pnpm globalmente
npm install -g pnpm
```

### Error: "Rust not found"

```powershell
# Reiniciar terminal después de instalar Rust
# O verificar PATH

# Windows: verificar en PowerShell
$env:Path -split ";"
```

### Error: "Tauri dev fails"

```bash
# Verificar que todas las dependencias estén instaladas
cd apps/desktop
pnpm install

# Verificar que el binary de Tauri CLI esté disponible
npx tauri --version
```

### Error: "Extension not loading"

1. Verificar que el manifest.json sea válido
2. Asegurarse de que el build de la extension esté completo
3. Revisar errores en `chrome://extensions/`

---

## Testing

### Ejecutar Tests

```bash
# Todos los paquetes
pnpm test

# Solo desktop
cd apps/desktop
pnpm test

# Coverage
pnpm test -- --coverage
```

### UI de Tests

```bash
# Abrir UI visual de Vitest
cd apps/desktop
pnpm test -- --ui
```

---

## Build para Producción

### Desktop App

```bash
# Build completo de Tauri
cd apps/desktop
pnpm tauri:build

# Output en:
# apps/desktop/src-tauri/target/release/bundle/
```

### Chrome Extension

```bash
cd apps/extension
pnpm build

# Output en:
# apps/extension/dist/
```

---

## Referencias

- **Tauri 2.0**: https://v2.tauri.app/
- **React 19**: https://react.dev/
- **Rust**: https://doc.rust-lang.org/
- **pnpm**: https://pnpm.io/
- **Chrome Extensions**: https://developer.chrome.com/docs/extensions/mv3

---

## Próximos Pasos

1. ✅ Instalar prerrequisitos
2. ✅ Configurar entorno
3. ⏳ Ejecutar en modo desarrollo
4. ⏳ Cargar Chrome Extension
5. ⏳ Agregar primera cuenta
6. ⏳ Crear primer post programado

---

*Última actualización: Abril 2026*