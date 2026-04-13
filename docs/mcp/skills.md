# Skills para OpenCode - Social-Pip

## Resumen

Este documento lista todos los skills disponibles para el stack de Social-Pip, cómo instalarlos correctamente y cuándo usar cada uno. **Versiones verificadas para Abril 2026.**

---

## ⚠️ CORRECCIÓN IMPORTANTE: Instalación de Skills

### OpenCode NO usa `npx skills add`

Los skills para OpenCode se instalan **manualmente**, no hay comando `npx skills add`.

### Instalación Correcta para OpenCode

```bash
# 1. Clonar el repositorio de skills
git clone https://github.com/Gentleman-Programming/Gentleman-Skills.git

# 2. Copiar los skills curados a la carpeta de OpenCode
cp -r Gentleman-Skills/curated/* ~/.config/opencode/skills/

# 3. Verificar instalación
ls -la ~/.config/opencode/skills/
```

**Documentación oficial**: https://opencode.ai/docs/skills/

---

## 1. Skills de Gentleman Programming (RECOMENDADOS)

**Repo**: https://github.com/Gentleman-Programming/Gentleman-Skills (422 stars)
**Docs**: https://github.com/Gentleman-Programming/Gentleman-Skills

### Skills Disponibles

| Skill | Cuándo Usarlo | Docs |
|-------|---------------|------|
| **nextjs-15** | Frontend Next.js 15+ | https://nextjs.org/docs |
| **react-19** | Componentes React 19+ | https://react.dev |
| **typescript** | TypeScript strict | https://www.typescriptlang.org/docs |
| **tailwind-4** | Estilos con Tailwind | https://tailwindcss.com/docs |
| **zustand-5** | State management | https://github.com/pmndrs/zustand |
| **playwright** | Testing E2E | https://playwright.dev |
| **ai-sdk-5** | AI integration | https://sdk.aijs.com |

### Instalación

```bash
# Clone y copia manual
git clone https://github.com/Gentleman-Programming/Gentleman-Skills.git
cp -r Gentleman-Skills/curated/* ~/.config/opencode/skills/
```

---

## 2. Skills de Prisma (OFICIALES)

**Repo**: https://github.com/prisma/skills (27 stars)
**Docs**: https://www.prisma.io/docs/ai/tools/skills

### Skills Disponibles

| Skill | Installs | Uso |
|-------|----------|-----|
| `prisma-cli` | 4.0K+ | Comandos CLI (init, generate, migrate) |
| `prisma-client-api` | 4.5K+ | CRUD, transactions, raw queries |
| `prisma-database-setup` | 5.0K+ | Setup SQLite, MySQL (no PostgreSQL en Social-Pip) |
| `prisma-sqlite` | - | Prisma SQLite workflows |

### Instalación (Manual para OpenCode)

```bash
# Los skills de Prisma no tienen instalación automática para OpenCode
# Debes copiar manualmente el contenido del repo

git clone https://github.com/prisma/skills.git prisma-skills
mkdir -p ~/.config/opencode/skills/prisma
cp -r prisma-skills/* ~/.config/opencode/skills/prisma/
```

### Documentación Oficial

- **Skills Overview**: https://www.prisma.io/docs/ai/tools/skills
- **Prisma Docs**: https://www.prisma.io/docs
- **Skills.sh Registry**: https://skills.sh/prisma/skills

---

## 3. Skills de Vercel (AI SDK)

**Repo**: https://github.com/vercel-labs/skills (13k+ stars)
**Docs**: https://github.com/vercel-labs/skills

### Skills Disponibles

| Skill | Propósito |
|-------|-----------|
| `react` | React patterns y best practices |
| `nextjs` | Next.js App Router |
| `vercel` | Vercel deployment |
| `ai-sdk` | AI SDK integration |

### Instalación (Manual)

```bash
git clone https://github.com/vercel-labs/skills.git vercel-skills
cp -r vercel-skills/* ~/.config/opencode/skills/
```

### Documentación Oficial

- **AI SDK**: https://sdk.aijs.com/docs
- **Next.js**: https://nextjs.org/blog/next-16-2
- **Vercel Docs**: https://vercel.com/docs

---

## 4. Skills de Agent Skills Registry

**Repo**: https://agentskills.me/
**Docs**: https://skills.rest/

### Skills Disponibles

| Skill | Uso |
|-------|-----|
| `frontend-testing` | Vitest + React Testing Library |
| `tauri-rust` | Tauri + Rust patterns (NO se usa NestJS) |

**Nota**: Social-Pip usa **Tauri 2.0 + Rust** en lugar de NestJS. Los skills de NestJS no aplican.

### Instalación (Manual)

```bash
# No hay instalación automática - copiar manualmente
# Buscar en https://skills.rest/
```

---

## 5. Skills de n8n (Automatización)

**Repos**:

- https://github.com/viliamvolosv/n8n-opencode-skill
- https://github.com/czlonkowski/n8n-skills

### Instalación

```bash
# Opción 1: n8n-opencode-skill
git clone https://github.com/viliamvolosv/n8n-opencode-skill.git
cp -r n8n-opencode-skill/skills/* ~/.config/opencode/skills/

# Opción 2: n8n-skills
git clone https://github.com/czlonkowski/n8n-skills.git
cp -r n8n-skills/* ~/.config/opencode/skills/
```

---

## 6. Stack Social-Pip y Skills Correspondientes

| Tecnología | Skill a Usar | Fuente | Docs |
|------------|---------------|--------|------|
| **Next.js 16.2** | `nextjs` + `nextjs-15` | Vercel + Gentleman | https://nextjs.org/blog/next-16-2 |
| **React 19** | `react` + `react-19` | Vercel + Gentleman | https://react.dev |
| **Tauri 2.0** | (manual) | - | https://v2.tauri.app/ |
| **Rust** | (manual) | - | https://doc.rust-lang.org/ |
| **Prisma** | `prisma-cli`, `prisma-client-api` | Prisma Official | https://www.prisma.io/docs |
| **TypeScript** | `typescript` | Gentleman | https://www.typescriptlang.org/ |
| **Tailwind 4** | `tailwind-4` | Gentleman | https://tailwindcss.com/ |
| **Zustand 5** | `zustand-5` | Gentleman | https://github.com/pmndrs/zustand |
| **Vitest** | `frontend-testing` | Agent Skills | https://vitest.dev/ |
| **Playwright** | `playwright` | Gentleman | https://playwright.dev/ |
| **n8n** | `n8n-opencode-skill` | GitHub | https://docs.n8n.io/ |

---

## 7. Instalación Completa para Social-Pip

### Paso 1: Crear carpeta de skills

```bash
mkdir -p ~/.config/opencode/skills
```

### Paso 2: Skills de Gentleman (Recomendados)

```bash
git clone https://github.com/Gentleman-Programming/Gentleman-Skills.git
cp -r Gentleman-Skills/curated/* ~/.config/opencode/skills/
rm -rf Gentleman-Skills
```

### Paso 3: Skills de Prisma

```bash
git clone https://github.com/prisma/skills.git
mkdir -p ~/.config/opencode/skills/prisma
cp -r prisma-skills/* ~/.config/opencode/skills/prisma/
rm -rf prisma-skills
```

### Paso 4: Skills de Vercel

```bash
git clone https://github.com/vercel-labs/skills.git
cp -r vercel-skills/* ~/.config/opencode/skills/
rm -rf vercel-skills
```

### Paso 5: Skills de n8n

```bash
git clone https://github.com/viliamvolosv/n8n-opencode-skill.git
cp -r n8n-opencode-skill/skills/* ~/.config/opencode/skills/
rm -rf n8n-opencode-skill
```

### Paso 6: Verificar instalación

```bash
ls ~/.config/opencode/skills/
# Debe mostrar carpetas como:
# - nextjs-15/
# - react-19/
# - typescript/
# - tailwind-4/
# - zustand-5/
# - playwright/
# - prisma/
# - etc.
```

---

## 8. Errores Comunes y Soluciones

### Error: "No se encontró el comando skills"

**Problema**: Estás intentando usar `npx skills add` que NO existe en OpenCode.

**Solución**: Usar instalación manual como se describió arriba.

### Error: "Skill no se carga"

**Problema**: El archivo debe llamarse `SKILL.md` (mayúsculas).

**Solución**: Verificar que el archivo existe y tiene el nombre correcto.

### Error: "Skills no aparecen en OpenCode"

**Problema**: La carpeta de instalación es incorrecta.

**Solución**: Verificar que la ruta es `~/.config/opencode/skills/` (Linux/Mac) o `%USERPROFILE%\.config\opencode\skills\` (Windows).

---

## 9. Referencias

- **OpenCode Skills Docs**: https://opencode.ai/docs/skills/
- **Gentleman-Skills Repo**: https://github.com/Gentleman-Programming/Gentleman-Skills
- **Prisma Skills**: https://www.prisma.io/docs/ai/tools/skills
- **Vercel Skills**: https://github.com/vercel-labs/skills
- **Skills Registry**: https://skills.rest/

---

## 10. Cómo Usar los Skills

Una vez instalados, los skills se cargan automáticamente cuando OpenCode detecta que estás trabajando con esa tecnología.

```
# En OpenCode, simplemente trabaja normally
# Los skills se cargan automáticamente según el contexto

User: "Crea un componente React"
→ OpenCode carga el skill react-19 automáticamente
→ Aplica los patterns del skill
```

Para cargar manualmente un skill específico:

```
# Usando el tool skill
skill name: "typescript"
```

---

*Última actualización: Abril 2026*