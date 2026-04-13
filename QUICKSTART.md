# Social-Pip Quick Start Guide

Get up and running with Social-Pip in minutes.

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Check Command | Download |
|----------|----------------|---------------|----------|
| Node.js | 20.0.0+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.0.0+ | `pnpm --version` | `npm install -g pnpm` |
| Rust | 1.70+ | `rustc --version` | [rust-lang.org](https://www.rust-lang.org/) |

### Platform-Specific Requirements

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- See [Tauri Linux prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites#linux)

---

## Quick Start

### Option 1: Automated Setup (Recommended for First Time)

Run the setup script to install all dependencies and configure the database:

```batch
setup-dev.bat
```

This will:
1. Install all npm dependencies
2. Generate Prisma client
3. Run database migrations
4. Build the Chrome extension

### Option 2: Manual Setup

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:generate
pnpm db:migrate

# Build extension (optional, for Chrome extension)
pnpm build:extension
```

---

## Running the Application

### Development Mode (Frontend Only)

```batch
start.bat
```

Or manually:
```bash
pnpm dev
```

- Opens frontend at `http://localhost:1420`
- Hot reload enabled
- Opens a new terminal window

### Development Mode (Full Tauri App)

```batch
start-tauri.bat
```

Or manually:
```bash
pnpm start:tauri
# or
cd apps/desktop && pnpm tauri dev
```

- Launches the Tauri desktop application
- Hot reload for frontend
- Rust backend with live reload

### Extension Development

```bash
pnpm dev:extension
```

Load the extension from `apps/extension/dist` in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/dist` folder

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all workspaces in dev mode |
| `pnpm start` | Start desktop frontend only |
| `pnpm start:tauri` | Start full Tauri desktop app |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:studio` | Open Prisma Studio |

---

## Troubleshooting

### "pnpm: command not found"

Install pnpm globally:
```bash
npm install -g pnpm
```

### "Rust not found"

Install Rust from [rust-lang.org](https://www.rust-lang.org/):
```bash
# Windows (download installer)
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Database Migration Errors

Reset the database:
```bash
cd packages/database
pnpm prisma migrate reset
cd ../..
```

### Port 1420 Already in Use

Kill the process using port 1420:
```batch
# Windows
netstat -ano | findstr :1420
taskkill /PID <PID> /F
```

### Tauri Build Fails

1. Ensure Rust is properly installed:
   ```bash
   rustc --version
   cargo --version
   ```

2. Update Rust:
   ```bash
   rustup update
   ```

3. Check platform-specific prerequisites in the [Tauri docs](https://tauri.app/v2/guide/prerequisites/)

### Extension Not Loading

1. Ensure extension is built:
   ```bash
   pnpm build:extension
   ```

2. Check for errors in Chrome's extension management page
3. Verify you're loading from `apps/extension/dist`

---

## Project Structure

```
social-pip/
├── apps/
│   ├── desktop/      # Tauri 2.0 app (React + Rust)
│   └── extension/    # Chrome Extension MV3
├── packages/
│   ├── database/     # Prisma schema & client
│   └── types/        # Shared TypeScript types
├── start.bat         # Quick start script
├── start-tauri.bat   # Tauri development
└── setup-dev.bat     # Full setup script
```

---

## Need Help?

- Check [AGENTS.md](./AGENTS.md) for development guidelines
- Review [README.md](./README.md) for project overview
- Open an issue on GitHub

---

*Last updated: April 2026*
