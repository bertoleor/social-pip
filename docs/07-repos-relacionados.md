# 07 — Repos relacionados
> Parte de: [[README]] · Relacionados: [[00-que-es]]

Relevamiento web (sep-2026) de proyectos open source afines: social auto-posters
y tooling stealth para posting vía browser. Sirve para robar ideas y para
decidir qué NO reinventar.

## A. Social auto-poster / scheduler (comparables directos)

| Repo | Stack | Qué aporta a Social-Pip |
|---|---|---|
| [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | Next.js + TS + Redis | El comparable más maduro: scheduling multi-red, AI autocomplete, editor tipo Canva, API para n8n/Make/Zapier. Referencia de UX y de API pública. |
| [inovector/mixpost](https://github.com/inovector/mixpost) | PHP (Laravel) self-hosted | Scheduling + publish multi-cuenta en tu propio server. Buen modelo de "one-click publish". |
| [trypostit/trypost](https://github.com/trypostit/trypost) | PHP + Vue, 12 redes | Scheduler open source con AI copilot y calendario unificado. Mirar su capa de adapters. |
| [postmill-ai/postmill-app](https://github.com/postmill-ai/postmill-app) | AI-native, 45+ canales | Enfoque multi-canal extremo; útil para pensar la escalabilidad de adapters. |
| [Sadhi-Team-16/Universal-AI-Studio](https://github.com/Sadhi-Team-16/Universal-AI-Studio) | AI scheduler para creators/agentes | Nicho creators + agentes IA, cercano al ángulo OpenCode de Social-Pip. |
| [cbsshekhawat18-lab/social-stats-social-media-manager](https://github.com/cbsshekhawat18-lab/social-stats-social-media-manager) | Django + React | Scheduler + calendario + analytics + inbox unificado + bot WhatsApp + asistente IA. Todo-en-uno self-hostable. |

Fuente: GitHub Topics `social-media-scheduler`, `social-media-management`,
`auto-post`, `post-scheduling`.

## B. Stealth posting / anti-detección (vía browser)

Social-Pip publica vía extensión browser donde no hay API; este tooling evita
detección de bots:

| Repo / paquete | Uso |
|---|---|
| [berstend/puppeteer-extra](https://github.com/berstend/puppeteer-extra) (`puppeteer-extra-plugin-stealth`, + `playwright-extra`) | Plugin estándar anti-detección: evasiones de fingerprint para Puppeteer y Playwright (Node). |
| [playwright-stealth (PyPI)](https://pypi.org/project/playwright-stealth/) | Port Python de las evasiones (solo lo básico; no esperar milagros). |
| [jonfriesen/playwright-go-stealth](https://github.com/jonfriesen/playwright-go-stealth) | Shim de evasiones para playwright-go. |
| [managedcode/playwright_stealth](https://github.com/managedcode/playwright_stealth) | Evasiones stealth para Playwright .NET. |

Lectura recomendada: guía Scrapfly "Playwright Stealth: Bypass Bot Detection in
Python & Node.js" (scrapfly.io) — instalación, setup y técnicas complementarias.

## C. Qué tomar prestado

1. **Postiz**: diseño de API para automatización (n8n-first) y editor con AI.
2. **Mixpost/Trypost**: modelo mental "un calendario, N redes" y adapters por plataforma.
3. **puppeteer-extra-plugin-stealth**: baseline de evasiones para el posting vía
   extensión/content-script (complementa `docs/anti-ban-patterns.md`, que cubre
   comportamiento: delays, jitter, warmup).
4. **postmill-app**: cómo escalar adapters a decenas de canales sin acoplarlos.

## Nota

Los links se verificaron por búsqueda web al redactar (sep-2026); re-validar
antes de citar en material externo. Ver también el inventario previo en
`docs/research/complete-repos-inventory.md` y `docs/research/repositories-analysis.md`.
