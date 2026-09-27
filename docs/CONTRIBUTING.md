# Contribuyendo a Social-Pip
> Parte de: [[README]] · Relacionados: [[05-desarrollo]]

¡Gracias por tu interés en contribuir! Social-Pip es una automatización de redes
sociales 100% gratuita para Argentina/LATAM. Este documento describe cómo preparar
tu entorno, correr los controles de calidad y enviar cambios.

---

## Requisitos previos

- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0` (el `packageManager` del repo está fijado en `pnpm@9.15.0`; usar
  otra versión puede romper el lockfile)
- **Python** `3.11` (solo para los scripts auxiliares bajo `skills/*/scripts/`)
- **Rust** (cadena para Tauri 2.0) si vas a construir la app de escritorio

> En Windows puedes usar `setup-dev.bat` para un montaje guiado, o seguir los pasos
> manuales de abajo.

---

## Configurar el entorno de desarrollo

```bash
# 1. Instalar dependencias de todos los workspaces
pnpm install

# 2. Generar el cliente de Prisma y aplicar migraciones
pnpm db:generate
pnpm db:migrate

# 3. Levantar la app de escritorio
pnpm dev:desktop
```

También existe `pnpm setup`, que encadena `install` + `db:generate` + `db:migrate`.

La extensión del navegador se levanta con:

```bash
pnpm dev:extension
```

---

## Correr los tests

Los tests de TypeScript/Vitest respetan umbrales de cobertura (ver `README.md`):

| Métrica   | Umbral |
|-----------|--------|
| Lines     | 80%    |
| Branches  | 75%    |
| Functions | 85%    |
| Statements| 80%    |

```bash
pnpm test              # turbo run test (todos los paquetes)
pnpm test:coverage     # cobertura local
pnpm test:ci           # variante para CI (reporte JSON + default)
pnpm test:e2e          # e2e de la app de escritorio
```

Los scripts auxiliares de Python se testean con **pytest**:

```bash
pytest          # lee pytest.ini; scope limitado a tests/ y skills/*/scripts/
```

---

## Lint, formato y typecheck

```bash
pnpm lint          # turbo run lint
pnpm typecheck     # turbo run typecheck
```

Para los auxiliares Python, **ruff** (config en `ruff.toml`):

```bash
ruff check .       # lint
ruff format .      # formato
ruff check --fix . # autofix de problemas seguros
```

Antes de abrir un PR, asegurate de que `pnpm lint`, `pnpm typecheck`,
`pnpm test` y `ruff check .` pasen en limpio. El repo usa
[pre-commit](https://pre-commit.com/) (`.pre-commit-config.yaml`); instalalo con
`pre-commit install` para que los hooks corran automáticamente en cada commit.

---

## Estilo de código

- **TypeScript/React**: seguí el estilo vigente del repo (Zustand 5 para estado,
  componentes de función, Tailwind 4). No introduzcas patrones que no se usan ya en
  el workspace.
- **Python**: se aplican las reglas de `ruff.toml`
  (`pyflakes`, `pycodestyle`, `isort`, `pyupgrade`, `bugbear`, `bandit`, `pydocstyle`…).
  Black-style de dobles comillas y docstrings formateados. *No* commitees `__pycache__/`
  ni archivos `.pyc` (están cubiertos por `.gitignore`).
- **Naming**: nombres descriptivos, en inglés para código y en español para
  documentación/comentarios orientados al usuario final.
- **Scope**: el runtime del producto es TS/Rust. Los scripts Python son auxiliares de
  `skills/`; no conviertas esa frontera en código de producción sin una discusión previa.

---

## Enviar un PR

1. Crea una rama descriptiva desde `master` (ej. `feat/programador-contenido`,
   `fix/coverage-threshold`).
2. Hacé cambios enfocados: una PR resuelve un problema o añade una feature, no una mezcla.
3. Corré el conjunto completo de calidad (tests, lint, typecheck, ruff) y confirmá que
   pasa localmente.
4. Actualizá `CHANGELOG.md` si tu cambio es visible para usuarios.
5. Abrí la PR contra `master` y describí: qué cambia, por qué, y cómo lo probaste.
6. Vinculá issues relacionados si existen.

Un mantenedor revisará la PR. La CI corre los tests y checks de calidad en cada push;
una PR con checks en rojo no se fusiona.

---

## Reportar problemas

- Buscá primero si el issue ya existe.
- Incluí pasos de reproducción, comportamiento esperado vs. real, y cualquier log o
  traza relevante.
- No incluyas secretos ni credenciales en issues o PRs.

---

## Licencia

Al contribuir, aceptás que tu trabajo se distribuya bajo la licencia MIT (ver `LICENSE`).