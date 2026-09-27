# Instalación de Social-Pip
> Parte de: [[README]] · Relacionados: [[n8n-docker-compose]] · [[n8n-setup]] · [[notebooklm-setup]]

## Resumen

Guía completa para instalar y configurar Social-Pip desde cero.

---

## 1. Requisitos del Sistema

### 1.1 Hardware Mínimo

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| RAM | 8 GB | 16 GB |
| CPU | 4 cores | 8 cores |
| Disco | 20 GB | 50 GB SSD |
| SO | Windows 10+ / macOS 12+ / Ubuntu 20.04+ | - |

### 1.2 Software Requerido

| Software | Versión | Notas |
|----------|---------|-------|
| Node.js | 20.x LTS | Requerido para build |
| pnpm | 8.x | Package manager |
| Rust | 1.70+ | Para Tauri |
| Docker | 24.x+ | Para n8n |
| Git | 2.x | Control de versiones |

---

## 2. Instalación de Dependencias

### 2.1 Node.js y pnpm

```bash
# Instalar Node.js 20 LTS (Windows)
winget install OpenJS.NodeJS.LTS

# macOS
brew install node@20

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm
```

### 2.2 Rust

```bash
# Windows
winget install Rustlang.Rust.MSVC

# macOS
brew install rust

# Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2.3 Docker Desktop

```bash
# Windows
winget install Docker.DockerDesktop

# macOS
brew install --cask docker

# Linux
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 3. Clonar el Proyecto

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/social-pip.git
cd social-pip

# Instalar dependencias del proyecto
pnpm install
```

---

## 4. Configuración Inicial

### 4.1 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Base de datos
DATABASE_URL="file:./dev.db"

# OpenCode (opcional)
OPENCODE_SERVER_URL=http://localhost:4096

# n8n
N8N_API_KEY=tu_api_key_de_n8n
N8N_BASE_URL=http://localhost:5678

# AI (NVIDIA NIM - opcional)
NVIDIA_API_KEY=tu_nvidia_api_key
```

### 4.2 Generar DB Prisma

```bash
cd packages/database
pnpm prisma generate
pnpm prisma db push
```

---

## 5. Configurar n8n

### 5.1 Iniciar n8n

```bash
cd docs/setup
docker-compose up -d
```

### 5.2 Configurar API Key

1. Abrir http://localhost:5678
2. Settings → API → Generate API Key
3. Copiar key y agregar a `.env`

---

## 6. Instalar Chrome Extension

### 6.1 Modo Desarrollo

1. Abrir Chrome
2. Ir a `chrome://extensions/`
3. Activar "Developer mode"
4. Click "Load unpacked"
5. Seleccionar `apps/extension/`

### 6.2 Build de Producción

```bash
cd apps/extension
pnpm build
# Cargar desde dist/
```

---

## 7. Ejecutar Aplicación

### 7.1 Modo Desarrollo

```bash
# Terminal 1: Desktop App
cd apps/desktop
pnpm tauri dev

# Terminal 2: OpenCode (opcional)
opencode serve
```

### 7.2 Build de Producción

```bash
cd apps/desktop
pnpm tauri build
```

---

## 8. Verificación

### 8.1 Checklist Post-Install

- [ ] pnpm install corre sin errores
- [ ] Prisma generate successful
- [ ] Docker-compose n8n está corriendo
- [ ] Chrome Extension cargada
- [ ] Desktop app inicia sin errores

### 8.2 Tests

```bash
# Run tests
pnpm test

# Run lint
pnpm lint
```

---

## 9. Solución de Problemas

### 9.1 Error de permisos en Linux

```bash
sudo usermod -aG docker $USER
# logout y login nuevamente
```

### 9.2 Rust no encuentra MSVC (Windows)

```bash
# En PowerShell como Admin
rustup default stable-msvc
```

### 9.3 Puerto 5678 ocupado

```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :5678

# Matar proceso
taskkill /PID <PID> /F
```

---

## 10. Actualizaciones

```bash
# Pull latest changes
git pull

# Update dependencies
pnpm update

# Rebuild
pnpm prisma generate
```

---

*Última actualización: Abril 2026*