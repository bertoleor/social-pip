# Configuración de Desarrollo - Social-Pip
> Parte de: [[README]] · Relacionados: [[testing-strategy]]

## Resumen

Este documento describe todas las configuraciones técnicas del proyecto Social-Pip.

---

## 1. tsconfig.json (Base)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "preserve",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "noEmit": true,
    "importHelpers": true,
    "downlevelIteration": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", ".next"]
}
```

---

## 2. biome.json (Linting + Formatting)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noFloatingDecimal": "error"
      },
      "style": {
        "useConst": "error",
        "useExportType": "error",
        "noNonNullAssertion": "error"
      },
      "complexity": {
        "noForEach": "off",
        "noStaticOnlyClass": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "quoteStyle": "single",
    "trailingCommas": "es5"
  }
}
```

---

## 3. vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 30000,
  },
})
```

---

## 4. docker-compose.yml (n8n + servicios)

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678
      - GENERIC_TIMEZONE=America/Argentina/Buenos_Aires
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

  # Redis para caché (opcional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  n8n_data:
  redis_data:
```

**Nota:** Social-Pip usa SQLite (no PostgreSQL) - la base de datos es un archivo local.

---

## 5. .env.example

```env
# ============================================
# SOCIAL-PIP - Environment Variables Template
# ============================================

# Node Environment
NODE_ENV=development

# Database (SQLite - archivo local)
DATABASE_URL="file:./data/social-pip.db"

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenCode
OPENCODE_SERVER_URL=http://localhost:4096

# n8n
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=http://localhost:5678

# NVIDIA AI (opcional - para captions)
NVIDIA_API_KEY=your-nvidia-api-key

# Ollama (opcional - para captions locales)
OLLAMA_URL=http://localhost:11434

# Platform API Keys (optional)
# TWITTER_COOKIES=
# FACEBOOK_TOKEN=
# INSTAGRAM_SESSION=
```

---

## 6. GitHub Actions CI/CD

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: TypeScript check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test -- --coverage
      
      - name: Build
        run: npm run build
```

**Nota:** No se requiere servicio de base de datos en CI - SQLite usa archivo local.

---

## 7. package.json (Root)

```json
{
  "name": "social-pip",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## Referencias

- Biome: https://biomejs.dev/
- Vitest: https://vitest.dev/
- Turbo: https://turbo.build/
- GitHub Actions: https://github.com/features/actions