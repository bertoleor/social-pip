# Propuesta IA — SOCIAL-PIP

Estado: **UNVERIFIED / PROPUESTA** — no implementa nada, solo propone.
Fecha: 14 de septiembre de 2026.
Fuentes: `docs/audits/reporte-producto-marketing-estilo.md`, `docs/plans/tech-stack.md`.

## Contexto (qué hay hoy)

SOCIAL-PIP ya tiene `AI Caption Generator` + `Brand Rules Validator` con loop de fix, y lead scoring por keywords (`busco`, `presupuesto`, `cotizar`… con pesos urgencia +10 / precio +5 / zona +3). Lo que falta del lado IA/datos: los prompts están inline en cada workflow sin fuente canónica única, el style guide no cubre Threads/Telegram/WhatsApp, el lead scoring es por keywords fijas (sin semántica), el outreach usa un solo template sin A/B, y no hay analytics de conversión ni evals de calidad de texto generado. El stack de shipping es TS/Rust (Python no shippea, solo auxiliares) y el principio rector es cero costo / open source / local.

## Propuesta 1 — Skill matching semántico para lead scoring

**Problema**
El scoring de leads por keywords fijas no pesca paráfrasis ("necesito tasación" vs "busco") y mete falsos negativos en captura.

**Evidencia**
El reporte de marketing (2026-09-12) describe scoring por keywords con pesos fijos y corte top-20 por batch, sin componente semántico [1].

**Referencias**
- sentence-transformers (Hugging Face, open source): librería de embeddings para similaridad semántica y retrieval; el modelo `all-MiniLM-L6-v2` es liviano y corre local, compatible con el principio cero-costo [2][3].
- Hugging Face Hub del modelo con tarjeta y métricas publicadas [2].
- Qué reutilizás: el pipeline de Lead Capture existente (trigger, batch top-20) se mantiene; solo se agrega un score semántico (coseno contra prototipos de intención por sector) combinado con el score actual por keywords. Empieza como rescore offline en SQLite, sin cambiar el envío.

**Naysayer**
Si los grupos objetivo usan jerga muy localizada que el modelo base no captura, la ganancia semántica no supera a las keywords y la idea cae — por eso se valida primero offline contra leads históricos etiquetados.

**Marca**
No toca superficie visible.

**Slice MVP**
Dataset de 100-200 mensajes reales ya capturados, etiquetados lead/no-lead por sector; script offline que computa score semántico y mide precision@20 contra el scoring actual; si gana por margen claro, recién ahí se integra al workflow.

## Propuesta 2 — Optimizador de prompts con fuente canónica única

**Problema**
Tres fuentes de estilo conviven sin canónica única (style guide, Manual de Marca, prompts inline) y nadie mide si un cambio de prompt mejora o empeora el copy.

**Evidencia**
El reporte de estilo (2026-09-12) lista como gap la falta de un template de prompt único consolidado y erratas de encoding en el style guide [1].

**Referencias**
- DSPy (Stanford NLP, open source): framework que trata los prompts como artefacto compilado — declarás firmas y métrica, el optimizador (MIPROv2/GEPA) busca instrucciones y few-shots automáticamente [4][5].
- dspy-prompt-optimizer: ejemplo de agente que genera pipelines DSPy desde descripción + ejemplos, con modos Predict/CoT/ReAct/RAG y jueces LLM [6].
- Qué reutilizás: el `Brand Rules Validator` existente como función de métrica (pasa/no-pasa + score) y el loop de fix ya documentado; DSPy lo sistematiza con compiler + training set en vez de prueba manual. Corre offline (Python auxiliar, no shipping), el prompt ganador se congela en un único `prompt-canonico.md` por sector que consumen los workflows.

**Naysayer**
Si el volumen de ejemplos etiquetados por sector es chico (<50), el optimizador sobreajusta y un prompt escrito a mano rinde igual — por eso el gate es medir contra baseline manual antes de adoptar.

**Marca**
No toca superficie visible (el artefacto es interno; el copy resultante sigue pasando por el validador de marca existente).

**Slice MVP**
Un sector piloto (inmobiliario, que ya tiene JSON), 50 pares (brief → caption aprobada), métrica = brand-validator + revisión humana ciega; comparar prompt actual vs compilado; si gana, extender a los otros 5 sectores y cubrir Threads/Telegram/WhatsApp como registros propios.

## Propuesta 3 — Evals y datasets mínimos antes de más IA

**Problema**
Sin evals ni datasets propios, cada mejora de IA es opinión: no se puede saber si el caption generator o el hashtag strategist mejoran o regresan.

**Evidencia**
El reporte marca testing con estrategia documentada pero suite inexistente (0 tests) y marketing sin analytics de conversión [1].

**Referencias**
- lighteval (Hugging Face, open source): toolkit todo-en-uno para evaluar LLMs sobre múltiples backends, con catálogo de métricas documentado [7][8].
- Qué reutilizás: la infraestructura de SQLite local para guardar pares (input, output, score humano, plataforma, sector) y el validador de marca como métrica automática base; lighteval aporta el harness para correr evals repetibles cuando se comparen prompts/modelos.

**Naysayer**
Si nadie etiqueta ni revisa outputs de forma sostenida, el dataset se pudre y los evals mienten — el dataset vive solo si atarlo al flujo existente (log de enviados/errores ya hay) cuesta <5 min/semana.

**Marca**
No toca superficie visible.

**Slice MVP**
Tabla `ai_evals` en SQLite (fecha, sector, plataforma, prompt_id, output, brand_check, like_humano sí/no); job semanal que reporta tasa de pasa-validador y like-rate por sector; datasets faltantes priorizados: (a) captions aprobadas por sector (50 c/u), (b) leads etiquetados (200), (c) pares de outreach A/B con respuesta sí/no.

## Orden sugerido

1. Propuesta 3 (evals + datasets) — es prerrequisito de las otras dos y es lo más barato.
2. Propuesta 2 (prompt canónico + DSPy piloto) — ataca el gap documentado más visible.
3. Propuesta 1 (matching semántico) — cuando haya leads etiquetados de (1).

## Lo que explícitamente NO se propone

- Modelos pagos ni APIs con costo (rompe el principio rector).
- Fine-tuning propio (sin datos ni cómputo hoy; reevaluar tras 6 meses de datasets).
- Cambios en superficie visible (sin auditoría de marca necesaria).

---

Sources:
[1] `E:/social-pip/docs/audits/reporte-producto-marketing-estilo.md` (2026-09-12, lectura local)
[2] https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
[3] https://github.com/huggingface/sentence-transformers
[4] https://github.com/stanfordnlp/dspy
[5] https://dspy.ai/
[6] https://github.com/KazKozDev/dspy-prompt-optimizer
[7] https://github.com/HuggingFace/lighteval
[8] https://github.com/huggingface/lighteval/blob/main/docs/source/metric-list.mdx
