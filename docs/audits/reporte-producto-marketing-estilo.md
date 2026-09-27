# Reporte — Producto, Marketing y Estilo — SOCIAL-PIP
> Parte de: [[README]] · Relacionados: [[general-socialpip]] · [[ia-evals-auditoria-20260915]] · [[ia-propuesta-2026-09-14]]

Estado: **UNVERIFIED / DRY-RUN** — lectura de docs, nada commiteado, nada borrado.
Fecha: 12 de septiembre de 2026. Fuente: `docs/plans/master-plan.md`, `docs/plans/tech-stack.md`,
`docs/ai-content-style-guide.md`, `docs/workflows/marketing-workflows.md`, `docs/workflows/templates-workflows.md`,
`docs/audits/general-socialpip.md` y `docs/audits/product-analysis-socialpip.md`.

---

## 1. Producto

### 1.1 Qué es

Social-Pip es un sistema **100% open source y gratuito** de automatización de publicación en social media,
pensado para Argentina/LATAM. El principio rector —explicitado en `master-plan.md`— es **cero costos**:
todo gratis, open source y ejecutable en la PC del usuario, con **IP residencial** por defecto como apuesta
central anti-ban (las plataformas ven tráfico normal, no un VPS).

### 1.2 Alcance funcional

- **Multi-plataforma**: Facebook (Groups, Marketplace), Instagram (Feed, Stories, Reels, Carousel), TikTok,
  Twitter/X, LinkedIn, Threads, Telegram, WhatsApp.
- **Multi-cuenta**: un perfil de Chrome por cuenta, detección de perfil activo vía `sessionid`, warm-up tracker
  para cuentas nuevas (2–4 semanas, 5→20 posts/día escalonado).
- **Anti-ban avanzado**: motor Rust propio con delays con jitter, rate limiting horario/diario, detección de
  burst patterns, typing delays (50–150ms/caracter), scroll aleatorio y curvas de mouse Bézier.
- **Templates por sector**: inmobiliario, esoterismo, digital, comida, estética, artículos — con campos y
  plataformas prioritarias por sector.
- **Scheduler**: tokio-cron-scheduler con calendario visual, pause/resume de campañas y persistencia en SQLite.
- **Extensión de borde**: el pilar diferenciador es ejecutar acciones sobre la **sesión ya autenticada** del
  navegador real, sin APIs oficiales ni cuentas bot.

### 1.3 Arquitectura

Híbrida Desktop App (Tauri 2.0) + Chrome Extension (MV3), comunicadas por **Native Messaging API**
(stdin/stdout JSON, sin puertos ni firewall, validada por Chrome). Tauri sobre Electron es la decisión nuclear
anti-detección: 50–150MB de RAM contra 800MB+, WebView del OS en vez de Chromium embebido (menos firma
detectable por heurísticas anti-bot de Instagram/X/LinkedIn).

### 1.4 Stack

Tauri 2.0 · React 19 + TypeScript · Tailwind CSS 4 · Zustand 5 · Rust · SQLite (tauri-plugin-sql) ·
tokio-cron-scheduler · tauri-plugin-stronghold · Chrome MV3. Todas las piezas libres y sin costo; el anti-ban
engine es la única pieza custom. Python **no** es stack de shipping (el producto es TS/Rust); los 8 `.py` son
auxiliares de skills.

### 1.5 Estado de madurez

| Área | Estado |
|---|---|
| Visión/producto | Documentado |
| Arquitectura | Documentada |
| Marketing/estilo | Documentado (workflows + style guide) |
| Templates por sector | Parcial — prometidos en visión, solo `inmobiliario`/`esoterismo`/`digital` tienen JSON en docs |
| Testing | Estrategia documentada; suite python inexistente (0 tests) |

### 1.6 Gaps de producto

- **One-pager ausente**: no hay un único doc "qué es / para quién / cómo arranca" cara al usuario final.
- **`LICENSE` y `CONTRIBUTING.md` ausentes** pese a que `package.json` declara MIT — crítico en un proyecto
  "open source".
- **Guía de contenido por sector mínima**: `docs/sectors/` y `docs/automation/` vacías.
- **Docs sueltas en raíz**: `PROMPT-SDD-AUTOMATICO.md`, `PROMPT-SDD-COMPLETE.md`, `QUICKSTART.md` fuera de `docs/`.

---

## 2. Marketing

### 2.1 Workflows existentes (`docs/workflows/marketing-workflows.md`)

| Workflow | Trigger | Función |
|---|---|---|
| Lead Capture | Cron `0 */3 * * *` | Scrapea grupos, filtra leads por keywords (`busco`, `presupuesto`, `cotizar`…), scorea (urgencia +10, precio +5, zona +3), enriquece vía OpenCode y notifica "LEAD CALIENTE" por Telegram |
| Outreach Sender | Webhook `/outreach` | Envía mensajes a miembros nuevos con delay aleatorio 15–45s, personaliza con bio, log de enviados/errores |
| Hashtag Strategist | Webhook `/hashtag-strategy` | Genera 20 hashtags (5 marca / 5 nicho / 5 populares / 5 tendencia) con límite por plataforma |
| Campaign Manager | Webhook `/campaign` | Multi-plataforma desde config, programa posts, notifica por Telegram |

### 2.2 Mecánica de captura y conversión

- **Lead scoring** con keywords de urgencia/precio/ubicación; sort por score y corte en top 20 por batch.
- **Funnel completo**: captura → filtrado → enriquecimiento via IA → score → notificación de prioridad alta.
- **Anti-ban en marketing**: outreach con delays aleatorios y límite de 50 contactos por tanda.

### 2.3 Manual de Marca (brand rules)

Config JSON (`manual-de-marca/rules.json`) con: tono (formal/informal), máximo 3 emojis por post, máximo 5
hashtags, CTA obligatorio, lista de palabras prohibidas (`spam`, `estafa`, `urgente`, `última oportunidad`…),
capitalización sentence y máx chars por plataforma. Un validador (`Brand Rules Validator`) bloquea contenido que
exceda límites o contenga palabras prohibidas. Se aplica automáticamente en `Template Processor` y
`AI Caption Generator` (con loop de "fix" si falla validación).

### 2.4 Gaps de marketing

- Marketing orientado a **inbound** (captura/outreach/hashtags) pero **sin estrategia de contenido propio**:
  no hay calendar de publicaciones ni definición de audiencia/posicionamiento de la marca Social-Pip en sí.
- Sin analytics de conversión de leads (solo notificación; no hay seguimiento de cierre).
- Outreach sin A/B de mensajes ni control de calidad pre-envío (un solo template).

---

## 3. Estilo (`docs/ai-content-style-guide.md`)

Guía de estilo completa para que el contenido generado no suene a IA. Puntos clave:

### 3.1 Morfosintaxis
- **Consecutio temporum** estricta (pasado → pasado de subjuntivo).
- Prohibición del **gerundio de posterioridad** y del **gerundio adjetivo** (salvo casos RAE).
- **Voz activa** o pasiva refleja ("se hizo"), nunca pasiva analítica ("fue hecho por").
- Régimen preposicional correcto (evitar queísmo/dequeísmo).

### 3.2 Puntuación
- Nunca coma entre sujeto y predicado (la "coma criminal").
- **Raya (—)** para incisos fuertes, no guion ni coma.
- Punto y coma como "signo de madurez" para contrastar sin conectores.

### 3.3 Léxico
- Erradicar **verbos baúl** (hacer, tener, decir, poner, dar, ver, llegar) por sustitutos precisos.
- Prohibidos los comodines: cosa, algo, muy, diverso, vibrante, crucial, significativo, importante.
- Adjetivación alternada (antepuesta para énfasis, pospuesta para precisión técnica).

### 3.4 Anti-huella de IA
- Prohibida la estructura sándwich (introducción=conclusión repetida).
- Prohibidos conectores de muletilla al inicio ("En conclusión", "Además", "Finalmente").
- Prohibido falso contraste ("No es A, sino B") y vaguedad elegante (fluff sin datos).
- Prohibida la **conclusión armonizadora** y la **cortesía algorítmica** ("Espero que te sirva").
- Regla 2026: escritura orientada a **intención del usuario**, no SEO sintético.

### 3.5 Geo-lecto
- **Voseo rioplatense** consistente ("vos hacés", "Mirá", "Hacé"), argentinismos, "computadora"/"celular".
- Nunca mezclar voseo con tuteo ni con "vosotros".

### 3.6 Por plataforma
Twitter/X (aforismo elíptico y provocador), Instagram (hook de una frase, máx 3 emojis), LinkedIn (insight sin
moralina, pasiva refleja para cuestionar mitos), Reddit (peer-to-peer, rayas sarcásticas), Facebook (storytelling,
variación sintáctica, sujeto tácito).

### 3.7 Por sector (tono / longitud / emojis / hashtags)

| Sector | Tono | Long máx | Emojis | Hashtags |
|---|---|---|---|---|
| Inmobiliario | Profesional, directo | 500 | 📍🏠✅💰 | #inmobiliario #propiedad |
| Esoterismo | Misterio, no dramático | 300 | ✨🔮🌙🔥 | #esoterismo #espiritualidad |
| Digital | Técnico, asertivo | 280 | 📱💻🎯⚡ | #digital #tech #innovacion |
| Comida | Sensorial, directo | 400 | 🍽️🔥✅ | #gastronomia #foodporn |
| Estética | Testimonial, evidencia | 350 | 💅✨📸🔥 | #estetica #belleza |
| Artículos | Descriptivo, útiles | 450 | 🎁✅📦🔥 | #regalo #productos |

### 3.8 Gaps de estilo
- El style guide tiene **erratas de OCR/encoding** por corregir: "de参考", "IAabusa", "指出", "istar de",
  "Vos牠s", "内蒙古". No afectan el contenido pero degradan un doc pensado como referencia normativa.
- Falta un **template de prompt único** consolidado: hoy conviven `ai-content-style-guide.md`,
  `templates-workflows.md` (Manual de Marca) y los prompts inline de los workflows sin una fuente canónica única.
- La guía no cubre **Threads/Telegram/WhatsApp** como registro propio (solo Twitter/X, Instagram, LinkedIn,
  Reddit, Facebook).

---

## 4. Síntesis

**Bien**: la visión de producto es coherente (cero costo, anti-ban, local) y el diferenciador técnico está bien
justificado. Marketing y estilo están documentados y operacionalizados en workflows n8n con validación de marca.

**Pendiente (priorizado)**:
1. One-pager de producto + `LICENSE` + `CONTRIBUTING.md` (bloqueantes para "open source").
2. Consolidar estilo en una fuente canónica y corregir erratas del style guide.
3. Completar templates/guías de los 6 sectores prometidos (hoy solo 3 con JSON).
4. Marketing: sumar analytics de conversión y estrategia de contenido propio.