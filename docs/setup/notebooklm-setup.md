# NotebookLM Integration - Social-Pip
> Parte de: [[README]] · Relacionados: [[installation]] · [[n8n-docker-compose]] · [[n8n-setup]]

## Resumen

Esta guía documenta cómo usar **NotebookLM** como base de conocimiento para Social-Pip, permitiendo investigación con cero alucinaciones durante el desarrollo.

**Herramienta usada:** `notebooklm-py` (Python API) - más estable que el MCP.

---

## Por qué NotebookLM?

| Método | Problema |
|--------|----------|
| Buscar en docs manualmente | Lento, perder contexto |
| Agregar docs al LLM | Alucinaciones, contexto limitado |
| **NotebookLM** | Cero alucinaciones, respuestas de tus docs |

---

## Instalación

### 1. Instalar notebooklm-py

```powershell
# Instalar Python (si no tenés)
winget install Python.Python.3.14

# Instalar notebooklm-py
python -m pip install notebooklm-py

# Verificar instalación
python -m notebooklm --version
```

### 2. Instalar Chromium (para browser automation)

```powershell
python -m pip install playwright
python -m playwright install chromium
```

### 3. Autenticarse

```powershell
python -m notebooklm login
```

Se abre un browser → Login con tu cuenta de Google → Presionar ENTER cuando veas NotebookLM.

Las credenciales se guardan en: `C:\Users\Pc Living\.notebooklm\storage_state.json`

---

## Uso Básico

### Listar notebooks

```powershell
python -m notebooklm list
```

### Seleccionar un notebook

```powershell
# Por ID
python -m notebooklm use <notebook_id>

# O por URL
python -m notebooklm use https://notebooklm.google.com/notebook/xxx
```

### Hacer preguntas

```powershell
python -m notebooklm ask "¿Cómo funciona el warmup de cuentas?"
```

### Generar contenido

```powershell
# Generar podcast (Audio Overview)
python -m notebooklm generate audio "resumen de las mejores prácticas"

# Generar quiz
python -m notebooklm generate quiz --difficulty hard

# Generar mind map
python -m notebooklm generate mind-map
```

### Descargar artefactos

```powershell
# Descargar audio
python -m notebooklm download audio ./podcast.mp3

# Descargar quiz en JSON
python -m notebooklm download quiz --format json ./quiz.json

# Descargar mind map
python -m notebooklm download mind-map ./mindmap.json
```

---

## Notebooks de Social-Pip

### Notebook Principal: Social-Pip Documentation

| Campo | Valor |
|-------|-------|
| **ID** | 0250e33d-128d-4aa3-a3d1-97d745f1970b |
| **Título** | Architectural Guide to N8N Automation and AI Business Systems |
| **Owner** | Shared |
| **Creado** | 2026-04-08 |

### Contenido del Notebook

El notebook contiene información sobre:

- ✅ Workflows de n8n para automatización social
- ✅ Triggers: Google Sheets, Telegram bots
- ✅ Extracción: YouTube transcripts, web scraping
- ✅ Generación de contenido: GPT-4o, agentes por plataforma
- ✅ Contenido visual: DALL-E 3, Fal.ai, Runway, ElevenLabs
- ✅ Publicación: APIs directas, Blotato
- ✅ Logging: Google Sheets

### Agregar más fuentes

```powershell
# Agregar URL
python -m notebooklm source add "https://docs.n8n.io/"

# Agregar archivo local
python -m notebooklm source add "./docs/social-pip-workflows.md"

# Agregar YouTube
python -m notebooklm source add "https://youtube.com/watch?v=xxx"
```

---

## Uso con OpenCode

### Configuración en opencode.json

**Ya configurado en:** `C:\Users\Pc Living\.config\opencode\opencode.json`

```json
"notebooklm": {
  "type": "local",
  "command": ["npx", "-y", "notebooklm-mcp@latest"],
  "environment": {
    "HEADLESS": "false"
  },
  "enabled": true
}
```

**Nota:** El MCP tiene un bug conocido (Issue #33). Se recomienda usar `notebooklm-py` directamente via CLI.

### Workflow de uso

1. **Investigación inicial:**
   ```
   "Research this in NotebookLM antes de implementar"
   ```

2. **Durante desarrollo:**
   ```
   "¿Cómo se hace X según la docs de Social-Pip?"
   ```

3. **Para comparar:**
   - Investigar en NotebookLM
   - Comparar con docs locales
   - Actualizar según necesidad

---

## Comandos Rápidos

| Acción | Comando |
|--------|---------|
| Login | `python -m notebooklm login` |
| Listar | `python -m notebooklm list` |
| Seleccionar | `python -m notebooklm use <id>` |
| Preguntar | `python -m notebooklm ask "pregunta"` |
| Audio | `python -m notebooklm generate audio "prompt"` |
| Quiz | `python -m notebooklm generate quiz` |
| Estado auth | `python -m notebooklm auth check --test --json` |

---

## Troubleshooting

### "Chromium pre-flight check failed"

```powershell
# Reinstalar chromium
python -m playwright install chromium
```

### "Storage file not found"

```powershell
# Hacer login de nuevo
python -m notebooklm login
```

### "Navigation interrupted"

El login se interrumpió. Volver a hacer login y presionar ENTER cuando vea la página de NotebookLM.

---

## Notas Importantes

- **Rate limits:** NotebookLM tiene límites diarios (50 queries/día para cuentas gratuitas)
- **Auth persistente:** Una vez logueado, las credenciales se guardan
- **Browser profile:** Se guarda en `C:\Users\Pc Living\.notebooklm\browser_profile`
- **No compartir:** Usar cuenta de Google dedicada para automation

---

## Referencias

- Repo: https://github.com/teng-lin/notebooklm-py
- Docs: https://github.com/teng-lin/notebooklm-py/blob/main/docs/
- npm (MCP - con bugs): https://github.com/PleasePrompto/notebooklm-mcp

---

*Última actualización: Abril 2026*